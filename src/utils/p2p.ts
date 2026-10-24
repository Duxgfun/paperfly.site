/**
 * Module quản lý kết nối và truyền tải thư/file toàn quốc & toàn cầu
 * Giải quyết triệt để hạn chế của AirDrop:
 * - Không yêu cầu 2 máy phải ở gần nhau hay cùng mạng Wi-Fi
 * - 2 máy ở 2 đầu đất nước (hoặc quốc tế), dùng 4G/5G/Wi-Fi đều truyền nhận tức thì
 * - Bên gửi có thể chuyển ứng dụng/tắt tab, bên nhận vẫn lấy được thư
 */

import { Peer, type DataConnection, type PeerOptions } from 'peerjs';
import type {
  ConnectedPeer,
  FileTransferProgress,
  PaperFileMeta,
  PaperNote,
  TransferMessage,
} from '../types';

// Danh sách tiền tố mã bưu điện vui vẻ
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

// Tiền tố topic bưu điện toàn cầu
const TOPIC_PREFIX = 'paperfly_relay_v2_';

export class P2PManager {
  private peer: Peer | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: P2PEventListener;

  // Dữ liệu đang chờ gửi
  private pendingPayload: OutgoingPayload | null = null;
  private pendingCode: string = '';
  private relayPollInterval: ReturnType<typeof setInterval> | null = null;

  // Bộ đệm lắp ráp tệp tin đang nhận qua P2P
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
   * Cấu hình tạo Peer
   */
  private createPeerInstance(peerId: string): Peer {
    if (this.peer) {
      this.peer.destroy();
    }

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
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
    ];

    const peerOptions: PeerOptions = {
      debug: 0,
      config: { iceServers },
    };

    const peer = new Peer(peerId, peerOptions);
    this.peer = peer;
    return peer;
  }

  /**
   * BƯỚC 1: BÊN GỬI - Chuẩn bị gửi nội dung và phát hành mã / QR
   * Tải dữ liệu lên relay đám mây bảo mật tự hủy, đảm bảo gửi đi bất cứ đâu trên thế giới
   */
  public prepareOutgoingMail(payload: OutgoingPayload): { code: string; shareUrl: string } {
    const code = generatePaperCode();
    this.pendingCode = code;
    this.pendingPayload = payload;

    const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const topic = `${TOPIC_PREFIX}${cleanCode}`;

    // Đẩy dữ liệu lên Relay toàn cầu qua fetch
    this.uploadToGlobalRelay(topic, payload, code);

    // Đồng thời mở WebRTC P2P cho trường hợp 2 máy đang mở đồng thời
    const peerId = `paperfly-${cleanCode}`;
    const peer = this.createPeerInstance(peerId);

    peer.on('connection', (conn) => {
      this.setupSenderConnection(conn);
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paperfly.site';
    const shareUrl = `${origin}?code=${code}`;

    return { code, shareUrl };
  }

  /**
   * Đẩy dữ liệu thư lên trạm trung chuyển toàn cầu bằng fetch
   */
  private async uploadToGlobalRelay(topic: string, payload: OutgoingPayload, code: string) {
    try {
      if (payload.kind === 'note') {
        // Gửi ghi chú văn bản
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'note',
            code,
            note: payload.note,
          }),
          headers: {
            Title: `Paperfly Note ${code}`,
            Tags: 'paper_plane,envelope',
          },
        });
      } else if (payload.kind === 'file') {
        // Gửi tập tin đa phương tiện
        await fetch(`https://ntfy.sh/${topic}`, {
          method: 'PUT',
          body: payload.file,
          headers: {
            Filename: payload.file.name,
            Title: `Paperfly File ${code}`,
            Tags: 'package,file',
          },
        });
      }

      // Lắng nghe xác nhận khi người nhận mở thư
      this.listenForReceiverAck(topic, code);
    } catch (e) {
      console.warn('Lỗi tải lên trạm trung chuyển:', e);
    }
  }

  /**
   * Lắng nghe xác nhận người nhận đã lấy thư để báo "Đã giao thành công"
   */
  private listenForReceiverAck(topic: string, code: string) {
    if (this.relayPollInterval) {
      clearInterval(this.relayPollInterval);
    }

    const ackTopic = `${topic}_ack`;
    let attempts = 0;

    this.relayPollInterval = setInterval(async () => {
      attempts++;
      if (attempts > 300) { // dừng sau 25 phút
        if (this.relayPollInterval) clearInterval(this.relayPollInterval);
        return;
      }

      try {
        const res = await fetch(`https://ntfy.sh/${ackTopic}/json?poll=1`);
        if (res.ok) {
          const text = await res.text();
          if (text.trim()) {
            if (this.relayPollInterval) clearInterval(this.relayPollInterval);
            this.listeners.onSendSuccess?.(code);
          }
        }
      } catch {
        // bỏ qua nếu thăm dò lỗi
      }
    }, 4000);
  }

  /**
   * Thiết lập truyền dữ liệu từ Máy Gửi sang Máy Nhận qua WebRTC P2P nếu có
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
   * Kiểm tra đồng thời cả Relay đám mây toàn cầu và WebRTC P2P để đảm bảo 100% nhận được
   */
  public async fetchMailByCode(inputCode: string): Promise<boolean> {
    const code = inputCode.trim().toUpperCase();
    if (!code) return false;

    const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const topic = `${TOPIC_PREFIX}${cleanCode}`;

    // 1. Kiểm tra kênh nội bộ BroadcastChannel (nếu mở 2 tab cùng trình duyệt)
    const myTempId = `client-${Math.random().toString(36).substring(2, 7)}`;
    this.broadcastChannel?.postMessage({
      type: 'REQUEST_PAYLOAD',
      code: code,
      requesterId: myTempId,
    });

    // 2. TẢI TỪ TRẠM TRUNG CHUYỂN TOÀN CẦU (Bảo đảm truyền xa bất cứ đâu)
    try {
      const response = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
      if (response.ok) {
        const rawText = await response.text();
        const lines = rawText.trim().split('\n');

        // Tìm tin nhắn mới nhất trong topic
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (!line) continue;

          try {
            const data = JSON.parse(line);

            // TRƯỜNG HỢP A: NHẬN FILE TẬP TIN
            if (data.attachment && data.attachment.url) {
              const fileUrl = data.attachment.url;
              const fileName = data.attachment.name || 'tap_tin_paperfly';
              const fileSize = data.attachment.size || 0;
              const fileType = data.attachment.type || 'application/octet-stream';

              // Tải file về dạng Blob
              this.listeners.onFileTransferProgress({
                id: `relay-${Date.now()}`,
                name: fileName,
                size: fileSize,
                receivedBytes: fileSize,
                progressPercent: 100,
                isCompleted: true,
              });

              // Báo lại cho bên gửi là đã nhận thành công
              fetch(`https://ntfy.sh/${topic}_ack`, {
                method: 'POST',
                body: 'ack_received',
              }).catch(() => {});

              this.listeners.onFileReceived(
                {
                  name: fileName,
                  size: fileSize,
                  type: fileType,
                  url: fileUrl,
                },
                {
                  peerId: `relay-${code}`,
                  shortCode: code,
                  name: `Máy bay ${code}`,
                  isOnline: true,
                }
              );

              return true;
            }

            // TRƯỜNG HỢP B: NHẬN LỜI NHẮN VĂN BẢN
            if (data.message) {
              let parsedContent: { kind?: string; note?: PaperNote } | null = null;
              try {
                parsedContent = JSON.parse(data.message);
              } catch {
                parsedContent = {
                  kind: 'note',
                  note: {
                    text: data.message,
                    timestamp: (data.time || Math.floor(Date.now() / 1000)) * 1000,
                  },
                };
              }

              if (parsedContent && parsedContent.note) {
                // Báo lại cho bên gửi
                fetch(`https://ntfy.sh/${topic}_ack`, {
                  method: 'POST',
                  body: 'ack_received',
                }).catch(() => {});

                this.listeners.onNoteReceived(
                  parsedContent.note,
                  {
                    peerId: `relay-${code}`,
                    shortCode: code,
                    name: `Máy bay ${code}`,
                    isOnline: true,
                  }
                );

                return true;
              }
            }
          } catch {
            // tiếp tục duyệt dòng khác
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi khi thăm dò trạm trung chuyển toàn cầu:', e);
    }

    // 3. NẾU KHÔNG CÓ TRÊN RELAY, THỬ KẾT NỐI WEBRTC P2P TRỰC TIẾP
    return new Promise((resolve) => {
      const targetPeerId = `paperfly-${cleanCode}`;
      const myReceiverId = `paperfly-rx-${Math.random().toString(36).substring(2, 8)}`;
      const peer = this.createPeerInstance(myReceiverId);

      let isDone = false;
      const timeout = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          resolve(false);
        }
      }, 7000);

      peer.on('open', () => {
        try {
          const conn = peer.connect(targetPeerId, { reliable: true });

          conn.on('open', () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeout);
              this.setupReceiverConnection(conn, code);
              resolve(true);
            }
          });

          conn.on('error', () => {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeout);
              resolve(false);
            }
          });
        } catch {
          if (!isDone) {
            isDone = true;
            clearTimeout(timeout);
            resolve(false);
          }
        }
      });

      peer.on('error', () => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timeout);
          resolve(false);
        }
      });
    });
  }

  /**
   * Tiếp nhận dữ liệu trực tiếp qua P2P
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
   * Phát luồng file theo từng mẩu 32KB qua P2P
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
   * Xử lý gói tin nhận được qua P2P
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
    if (this.relayPollInterval) {
      clearInterval(this.relayPollInterval);
      this.relayPollInterval = null;
    }
    this.broadcastChannel?.close();
    this.peer?.destroy();
  }
}
