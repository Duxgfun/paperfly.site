/**
 * Module quản lý P2P theo quy trình:
 * 1. Bên Gửi: Viết/chọn file -> Bấm Gửi -> Sinh mã & QR (vd: FLY-382)
 * 2. Bên Nhận: Nhập mã FLY-382 hoặc quét QR -> Kết nối trực tiếp -> Nhận dữ liệu
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
   * Kênh BroadcastChannel phục vụ thử nghiệm giữa các tab trên cùng máy
   */
  private initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('paperfly-share-channel');
      this.broadcastChannel.onmessage = async (event) => {
        const msg = event.data;
        if (!msg) return;

        // Nếu máy nhận yêu cầu lấy dữ liệu theo mã
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
   * Cấu hình tạo Peer
   */
  private createPeerInstance(peerId: string): Peer {
    if (this.peer) {
      this.peer.destroy();
    }

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];

    const isCustomServer = typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('vercel.app') &&
      !window.location.hostname.includes('netlify.app');

    let peerOptions: PeerOptions = {
      debug: 0,
      config: { iceServers },
    };

    if (isCustomServer) {
      const isSecure = window.location.protocol === 'https:';
      peerOptions = {
        host: window.location.hostname,
        port: window.location.port ? Number(window.location.port) : (isSecure ? 443 : 80),
        path: '/peerjs',
        secure: isSecure,
        config: { iceServers },
      };
    }

    const peer = new Peer(peerId, peerOptions);
    this.peer = peer;
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
      console.warn('Peer error at sender:', err.type);
      if (err.type === 'unavailable-id') {
        // Trùng mã thì tự động sinh lại
        this.prepareOutgoingMail(payload);
      }
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paperfly.site';
    const shareUrl = `${origin}?code=${code}`;

    return { code, shareUrl };
  }

  /**
   * Thiết lập truyền dữ liệu từ Máy Gửi sang Máy Nhận khi kết nối thành công
   */
  private setupSenderConnection(conn: DataConnection) {
    conn.on('open', async () => {
      if (!this.pendingPayload) return;

      // Bên nhận đã kết nối, bắt đầu truyền dữ liệu
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
    });
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

      // Thử phát tín hiệu qua BroadcastChannel trước (trong trường hợp mở 2 tab cùng trình duyệt)
      const myTempId = `client-${Math.random().toString(36).substring(2, 7)}`;
      this.broadcastChannel?.postMessage({
        type: 'REQUEST_PAYLOAD',
        code: code,
        requesterId: myTempId,
      });

      // Tạo client Peer để kết nối tới bên gửi qua WebRTC
      const myReceiverId = `paperfly-receiver-${Math.random().toString(36).substring(2, 8)}`;
      const peer = this.createPeerInstance(myReceiverId);

      peer.on('open', () => {
        try {
          const conn = peer.connect(targetPeerId, { reliable: true });

          const timer = setTimeout(() => {
            resolve(false);
          }, 8000);

          conn.on('open', () => {
            clearTimeout(timer);
            this.setupReceiverConnection(conn, code);
            resolve(true);
          });

          conn.on('error', () => {
            clearTimeout(timer);
            resolve(false);
          });
        } catch {
          resolve(false);
        }
      });

      peer.on('error', () => {
        resolve(false);
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
        await new Promise((r) => setTimeout(r, 5));
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
    this.broadcastChannel?.close();
    this.peer?.destroy();
  }
}
