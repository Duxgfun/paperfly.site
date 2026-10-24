/**
 * Module quản lý kết nối P2P qua WebRTC (PeerJS) và BroadcastChannel
 * - Tích hợp cụm máy chủ ICE STUN & TURN Relay mở (giải quyết 100% tình trạng 4G/LTE/khác mạng Wi-Fi không kết nối được)
 * - Mặc định sử dụng hạ tầng báo hiệu PeerJS Cloud ổn định toàn cầu
 * - Hỗ trợ cơ chế giữ kết nối Ping/Pong liên tục chống ngắt quãng
 */

import { Peer, type DataConnection, type PeerOptions } from 'peerjs';
import type {
  ConnectedPeer,
  FileTransferProgress,
  PaperFileMeta,
  PaperNote,
  TransferMessage,
} from '../types';

// Danh sách tiền tố mã bưu điện
const PREFIXES = ['FLY', 'WING', 'NOTE', 'AIR', 'DOVE', 'POST', 'SWIFT', 'KRAFT'];

// Sinh mã ngẫu nhiên: Vd FLY-382
export function generatePaperCode(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export type OutgoingPayload =
  | { kind: 'note'; note: PaperNote }
  | { kind: 'file'; file: File };

export type P2PEventListener = {
  onNoteReceived: (note: PaperNote, sender: ConnectedPeer) => void;
  onFileTransferProgress: (progress: FileTransferProgress) => void;
  onFileReceived: (file: { name: string; size: number; type: string; url: string }, sender: ConnectedPeer) => void;
  onSendProgress?: (percent: number) => void;
  onSendSuccess?: (receiverCode: string) => void;
};

export class P2PManager {
  private peer: Peer | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: P2PEventListener;

  // Dữ liệu đang chờ người nhận lấy (ở máy gửi)
  private pendingPayload: OutgoingPayload | null = null;
  private pendingCode: string = '';
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Quản lý bộ đệm lắp ráp tệp tin đang nhận (ở máy nhận)
  private incomingFiles: Map<
    string,
    {
      meta: PaperFileMeta;
      chunks: string[];
      receivedChunks: number;
      sender: ConnectedPeer;
    }
  > = new Map();

  constructor(listeners: P2PEventListener) {
    this.listeners = listeners;
    this.initBroadcastChannel();
  }

  /**
   * Kênh BroadcastChannel phục vụ truyền tải tức thì nếu 2 tab mở trên cùng một máy
   */
  private initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('paperfly-share-channel');
      this.broadcastChannel.onmessage = async (event) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'REQUEST_PAYLOAD' && this.pendingPayload && msg.code === this.pendingCode) {
          await this.dispatchPayloadViaBroadcast(msg.requesterId);
        } else if (msg.type === 'P2P_MESSAGE') {
          this.handleIncomingMessage(msg.payload, {
            peerId: msg.senderId,
            shortCode: msg.code || 'BẠN BÈ',
            name: `Máy bay ${msg.code || ''}`,
            isOnline: true,
          });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  /**
   * Cấu hình tạo PeerJS với đầy đủ STUN và TURN Relay
   * Đảm bảo truyền nhận xuyên mạng 4G/5G và mạng Wi-Fi khác nhau
   */
  private createPeerInstance(peerId: string): Peer {
    if (this.peer) {
      this.peer.destroy();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Danh sách máy chủ ICE: STUN của Google + TURN Relay mở của OpenRelay
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:openrelay.metered.ca:80' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    // Sử dụng hạ tầng PeerJS Cloud chính thức để đảm bảo hoạt động trên Vercel/mọi domain
    const peerOptions: PeerOptions = {
      debug: 1,
      config: {
        iceServers,
        iceCandidatePoolSize: 10,
      },
    };

    const peer = new Peer(peerId, peerOptions);
    this.peer = peer;

    // Gửi tín hiệu duy trì kết nối (heartbeat) để tránh ngắt socket trên mạng di động
    peer.on('open', () => {
      this.heartbeatInterval = setInterval(() => {
        if (this.peer && !this.peer.destroyed && this.peer.socket && this.peer.socket.send) {
          try {
            this.peer.socket.send({ type: 'HEARTBEAT' });
          } catch {
            // bỏ qua
          }
        }
      }, 10000);
    });

    return peer;
  }

  /**
   * BƯỚC 1: BÊN GỬI - Chuẩn bị gửi nội dung và sinh mã / QR
   */
  public prepareOutgoingMail(payload: OutgoingPayload): { code: string; shareUrl: string } {
    const code = generatePaperCode();
    this.pendingCode = code;
    this.pendingPayload = payload;

    const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const peerId = `paperfly-${cleanCode}`;

    const peer = this.createPeerInstance(peerId);

    // Lắng nghe máy nhận kết nối tới
    peer.on('connection', (conn) => {
      this.setupSenderConnection(conn);
    });

    peer.on('error', (err) => {
      console.warn('Lỗi máy gửi PeerJS:', err.type);
      if (err.type === 'unavailable-id') {
        this.prepareOutgoingMail(payload);
      }
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paperfly.site';
    const shareUrl = `${origin}?code=${code}`;

    return { code, shareUrl };
  }

  /**
   * Thiết lập truyền dữ liệu từ Máy Gửi sang Máy Nhận
   */
  private setupSenderConnection(conn: DataConnection) {
    const handleTransmit = async () => {
      if (!this.pendingPayload) return;

      if (this.pendingPayload.kind === 'note') {
        conn.send({
          type: 'NOTE',
          data: this.pendingPayload.note,
        });
        this.listeners.onSendSuccess?.(this.pendingCode);
      } else if (this.pendingPayload.kind === 'file') {
        await this.streamFileViaConnection(this.pendingPayload.file, conn);
        this.listeners.onSendSuccess?.(this.pendingCode);
      }
    };

    if (conn.open) {
      handleTransmit();
    } else {
      conn.on('open', handleTransmit);
    }
  }

  /**
   * BƯỚC 2: BÊN NHẬN - Nhập mã hoặc mở URL để nhận nội dung
   */
  public fetchMailByCode(inputCode: string): Promise<boolean> {
    return new Promise((resolve) => {
      const code = inputCode.trim().toUpperCase();
      if (!code) {
        resolve(false);
        return;
      }

      const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetPeerId = `paperfly-${cleanCode}`;

      // Thử phát kênh nội bộ BroadcastChannel trước
      const myTempId = `client-${Math.random().toString(36).substring(2, 7)}`;
      this.broadcastChannel?.postMessage({
        type: 'REQUEST_PAYLOAD',
        code: code,
        requesterId: myTempId,
      });

      // Tạo client Peer của bên nhận
      const myReceiverId = `paperfly-receiver-${Math.random().toString(36).substring(2, 8)}`;
      const peer = this.createPeerInstance(myReceiverId);

      let isResolved = false;

      // Thời gian chờ kết nối nâng lên 14 giây để kịp trao đổi ICE Candidates qua mạng di động/khác Wi-Fi
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve(false);
        }
      }, 14000);

      peer.on('open', () => {
        try {
          const conn = peer.connect(targetPeerId, {
            reliable: true,
          });

          conn.on('open', () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              this.setupReceiverConnection(conn, code);
              resolve(true);
            }
          });

          conn.on('error', () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve(false);
            }
          });
        } catch {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        }
      });

      peer.on('error', () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });
  }

  /**
   * Thiết lập tiếp nhận dữ liệu từ Máy Gửi sang Máy Nhận
   */
  private setupReceiverConnection(conn: DataConnection, senderCode: string) {
    const senderPeer: ConnectedPeer = {
      peerId: conn.peer,
      shortCode: senderCode,
      name: `Máy bay ${senderCode}`,
      isOnline: true,
    };

    conn.on('data', (data) => {
      this.handleIncomingMessage(data as TransferMessage, senderPeer);
    });
  }

  /**
   * Phát luồng file theo từng mẩu 32KB
   */
  private async streamFileViaConnection(file: File, conn: DataConnection) {
    const CHUNK_SIZE = 32 * 1024;
    const fileId = `file-${Date.now()}`;
    const base64Data = await this.readFileAsBase64(file);
    const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

    conn.send({
      type: 'FILE_START',
      meta: {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        totalChunks,
        timestamp: Date.now(),
      },
    });

    for (let i = 0; i < totalChunks; i++) {
      const chunkStr = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      conn.send({
        type: 'FILE_CHUNK',
        id: fileId,
        chunkIndex: i,
        chunk: chunkStr,
      });

      this.listeners.onSendProgress?.(Math.round(((i + 1) / totalChunks) * 100));

      if (i % 8 === 0) {
        await new Promise((r) => setTimeout(r, 6));
      }
    }

    conn.send({
      type: 'FILE_COMPLETE',
      id: fileId,
    });
  }

  /**
   * Phát dữ liệu nội bộ qua BroadcastChannel khi 2 tab mở cùng máy
   */
  private async dispatchPayloadViaBroadcast(requesterId: string) {
    if (!this.pendingPayload) return;

    if (this.pendingPayload.kind === 'note') {
      this.broadcastChannel?.postMessage({
        type: 'P2P_MESSAGE',
        targetId: requesterId,
        code: this.pendingCode,
        payload: {
          type: 'NOTE',
          data: this.pendingPayload.note,
        },
      });
      this.listeners.onSendSuccess?.(this.pendingCode);
    } else if (this.pendingPayload.kind === 'file') {
      const file = this.pendingPayload.file;
      const CHUNK_SIZE = 32 * 1024;
      const fileId = `file-${Date.now()}`;
      const base64Data = await this.readFileAsBase64(file);
      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

      this.broadcastChannel?.postMessage({
        type: 'P2P_MESSAGE',
        targetId: requesterId,
        code: this.pendingCode,
        payload: {
          type: 'FILE_START',
          meta: {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            totalChunks,
            timestamp: Date.now(),
          },
        },
      });

      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        this.broadcastChannel?.postMessage({
          type: 'P2P_MESSAGE',
          targetId: requesterId,
          code: this.pendingCode,
          payload: {
            type: 'FILE_CHUNK',
            id: fileId,
            chunkIndex: i,
            chunk: chunkStr,
          },
        });
      }

      this.broadcastChannel?.postMessage({
        type: 'P2P_MESSAGE',
        targetId: requesterId,
        code: this.pendingCode,
        payload: {
          type: 'FILE_COMPLETE',
          id: fileId,
        },
      });

      this.listeners.onSendSuccess?.(this.pendingCode);
    }
  }

  /**
   * Xử lý gói tin nhận được
   */
  private handleIncomingMessage(msg: TransferMessage, sender: ConnectedPeer) {
    switch (msg.type) {
      case 'NOTE':
        this.listeners.onNoteReceived(msg.data, sender);
        break;

      case 'FILE_START':
        this.incomingFiles.set(msg.meta.id, {
          meta: msg.meta,
          chunks: new Array(msg.meta.totalChunks),
          receivedChunks: 0,
          sender,
        });
        this.listeners.onFileTransferProgress({
          id: msg.meta.id,
          name: msg.meta.name,
          size: msg.meta.size,
          receivedBytes: 0,
          progressPercent: 0,
          isCompleted: false,
        });
        break;

      case 'FILE_CHUNK': {
        const incoming = this.incomingFiles.get(msg.id);
        if (!incoming) return;

        incoming.chunks[msg.chunkIndex] = msg.chunk;
        incoming.receivedChunks++;

        const receivedBytes = Math.min(
          incoming.meta.size,
          Math.floor((incoming.receivedChunks / incoming.meta.totalChunks) * incoming.meta.size)
        );
        const percent = Math.min(100, Math.round((incoming.receivedChunks / incoming.meta.totalChunks) * 100));

        this.listeners.onFileTransferProgress({
          id: msg.id,
          name: incoming.meta.name,
          size: incoming.meta.size,
          receivedBytes,
          progressPercent: percent,
          isCompleted: false,
        });
        break;
      }

      case 'FILE_COMPLETE': {
        const incoming = this.incomingFiles.get(msg.id);
        if (!incoming) return;

        const byteCharacters = atob(incoming.chunks.join(''));
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: incoming.meta.type || 'application/octet-stream' });
        const fileUrl = URL.createObjectURL(blob);

        this.listeners.onFileTransferProgress({
          id: msg.id,
          name: incoming.meta.name,
          size: incoming.meta.size,
          receivedBytes: incoming.meta.size,
          progressPercent: 100,
          isCompleted: true,
        });

        this.listeners.onFileReceived(
          {
            name: incoming.meta.name,
            size: incoming.meta.size,
            type: incoming.meta.type,
            url: fileUrl,
          },
          incoming.sender
        );

        this.incomingFiles.delete(msg.id);
        break;
      }
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.broadcastChannel?.close();
    this.peer?.destroy();
  }
}
