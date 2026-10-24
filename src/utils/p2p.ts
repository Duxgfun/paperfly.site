/**
 * Module quản lý kết nối ngang hàng P2P qua WebRTC (PeerJS) và BroadcastChannel
 * Thiết kế sẵn sàng cho môi trường Production (hỗ trợ cả máy chủ tự host và dịch vụ tĩnh)
 * Hoàn toàn không sử dụng emoji, mã bưu điện kết nối chuẩn xác xuyên mạng
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

// Sinh mã 3 chữ số để hạn chế tối đa việc trùng lặp trên mạng công cộng: Vd FLY-382
export function generatePaperCode(): { code: string } {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return {
    code: `${prefix}-${num}`,
  };
}

export type P2PEventListener = {
  onSelfReady: (peerId: string, shortCode: string) => void;
  onPeerConnected: (peer: ConnectedPeer) => void;
  onPeerDisconnected: (peerId: string) => void;
  onNoteReceived: (note: PaperNote, sender: ConnectedPeer) => void;
  onFileTransferProgress: (progress: FileTransferProgress) => void;
  onFileReceived: (file: { name: string; size: number; type: string; url: string }, sender: ConnectedPeer) => void;
};

export class P2PManager {
  private peer: Peer | null = null;
  private localPeerId: string = '';
  private localCode: string = '';
  private activeConnections: Map<string, DataConnection> = new Map();
  private connectedPeers: Map<string, ConnectedPeer> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: P2PEventListener;

  // Quản lý bộ đệm lắp ráp tệp tin đang nhận
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
    const { code } = generatePaperCode();
    this.localCode = code;

    this.initBroadcastChannel();
    this.initPeer();
  }

  /**
   * Khởi tạo kênh BroadcastChannel cho phép 2 tab trên cùng trình duyệt
   * phát hiện và thử nghiệm truyền file tức thì
   */
  private initBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('paperfly-lan-network');
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg.senderId === this.localPeerId) return;

        if (msg.type === 'DISCOVER_PING') {
          this.broadcastChannel?.postMessage({
            type: 'DISCOVER_PONG',
            senderId: this.localPeerId,
            code: this.localCode,
          });
          this.registerPeer(msg.senderId, msg.code);
        } else if (msg.type === 'DISCOVER_PONG') {
          this.registerPeer(msg.senderId, msg.code);
        } else if (msg.type === 'P2P_PAYLOAD' && (!msg.targetId || msg.targetId === this.localPeerId)) {
          this.handleIncomingMessage(msg.payload, msg.senderId);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel không được hỗ trợ trong môi trường này:', e);
    }
  }

  /**
   * Khởi tạo PeerJS WebRTC Connection
   * Tạo Peer ID trực tiếp theo định dạng: paperfly-{code} (vd: paperfly-fly382)
   */
  private initPeer() {
    const cleanCode = this.localCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const peerId = `paperfly-${cleanCode}`;
    this.localPeerId = peerId;

    // Cấu hình ICE STUN công cộng của Google
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];

    try {
      // Nếu tự host máy chủ có /peerjs (chạy qua server.js)
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

      this.peer = new Peer(peerId, peerOptions);

      this.peer.on('open', (id) => {
        this.localPeerId = id;
        this.listeners.onSelfReady(id, this.localCode);

        // Phát tín hiệu tìm kiếm các tab nội bộ
        this.broadcastChannel?.postMessage({
          type: 'DISCOVER_PING',
          senderId: this.localPeerId,
          code: this.localCode,
        });
      });

      // Lắng nghe kết nối đến từ máy bay khác
      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS event:', err.type);
        if (err.type === 'unavailable-id') {
          // Trùng ID trên server công cộng, sinh mã mới
          const { code } = generatePaperCode();
          this.localCode = code;
          this.initPeer();
        }
      });
    } catch (err) {
      console.warn('Không thể khởi tạo PeerJS:', err);
    }
  }

  /**
   * Thiết lập xử lý DataConnection giữa 2 thiết bị
   */
  private setupConnection(conn: DataConnection) {
    const handleOpen = () => {
      this.activeConnections.set(conn.peer, conn);

      // Gửi gói tin Handshake để bên kia biết mã máy này
      const handshake: TransferMessage = {
        type: 'HANDSHAKE',
        peerId: this.localPeerId,
        shortCode: this.localCode,
        deviceName: `Máy bay ${this.localCode}`,
      };
      conn.send(handshake);
    };

    if (conn.open) {
      handleOpen();
    } else {
      conn.on('open', handleOpen);
    }

    conn.on('data', (data) => {
      this.handleIncomingMessage(data as TransferMessage, conn.peer);
    });

    conn.on('close', () => {
      this.activeConnections.delete(conn.peer);
      this.connectedPeers.delete(conn.peer);
      this.listeners.onPeerDisconnected(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('Lỗi luồng DataConnection:', err);
    });
  }

  /**
   * Kết nối đến một thiết bị khác bằng Mã số Giấy (Ví dụ: FLY-382)
   */
  public connectToCode(targetInput: string): Promise<boolean> {
    return new Promise((resolve) => {
      const trimmed = targetInput.trim().toUpperCase();
      if (!this.peer || !trimmed) {
        resolve(false);
        return;
      }

      const cleanCode = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetPeerId = `paperfly-${cleanCode}`;

      try {
        const conn = this.peer.connect(targetPeerId, {
          reliable: true,
        });

        // Thiết lập bộ đếm thời gian chờ kết nối (7 giây)
        const timeout = setTimeout(() => {
          resolve(false);
        }, 7000);

        conn.on('open', () => {
          clearTimeout(timeout);
          this.setupConnection(conn);
          this.registerPeer(targetPeerId, trimmed);
          resolve(true);
        });

        conn.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  private registerPeer(peerId: string, shortCode: string) {
    if (peerId === this.localPeerId) return;
    const peer: ConnectedPeer = {
      peerId,
      shortCode,
      name: `Máy bay ${shortCode}`,
      isOnline: true,
    };
    this.connectedPeers.set(peerId, peer);
    this.listeners.onPeerConnected(peer);
  }

  /**
   * Xử lý gói tin nhận được từ máy bay đối diện
   */
  private handleIncomingMessage(msg: TransferMessage, senderPeerId: string) {
    const sender = this.connectedPeers.get(senderPeerId) || {
      peerId: senderPeerId,
      shortCode: 'TRẠM KHÁC',
      name: 'Máy bay bạn bè',
      isOnline: true,
    };

    switch (msg.type) {
      case 'HANDSHAKE':
        this.registerPeer(msg.peerId, msg.shortCode);
        break;

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

        // Ráp toàn bộ mảng dữ liệu Base64 thành Blob
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

  /**
   * Gửi một bức Note giấy vàng sang tất cả thiết bị đang kết nối
   */
  public sendNote(text: string, highlighterColor?: string) {
    const noteMsg: TransferMessage = {
      type: 'NOTE',
      data: {
        text,
        highlighterColor,
        timestamp: Date.now(),
      },
    };

    this.broadcastMessage(noteMsg);
  }

  /**
   * Cắt nhỏ File thành từng chunk 32KB và phát luồng qua đường hầm P2P
   */
  public async sendFile(file: File, onProgress?: (percent: number) => void) {
    const CHUNK_SIZE = 32 * 1024; // 32KB mỗi gói tin
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Đọc file sang Base64
    const base64Data = await this.readFileAsBase64(file);
    const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

    // Gửi thông báo bắt đầu truyền file
    const metaMsg: TransferMessage = {
      type: 'FILE_START',
      meta: {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        totalChunks,
        timestamp: Date.now(),
      },
    };
    this.broadcastMessage(metaMsg);

    // Phát lần lượt các mẩu chunk
    for (let i = 0; i < totalChunks; i++) {
      const chunkStr = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkMsg: TransferMessage = {
        type: 'FILE_CHUNK',
        id: fileId,
        chunkIndex: i,
        chunk: chunkStr,
      };
      this.broadcastMessage(chunkMsg);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      if (i % 8 === 0) {
        await new Promise((r) => setTimeout(r, 5));
      }
    }

    // Gửi gói tin báo hoàn tất
    const completeMsg: TransferMessage = {
      type: 'FILE_COMPLETE',
      id: fileId,
    };
    this.broadcastMessage(completeMsg);
  }

  private broadcastMessage(msg: TransferMessage) {
    for (const conn of this.activeConnections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }

    this.broadcastChannel?.postMessage({
      type: 'P2P_PAYLOAD',
      senderId: this.localPeerId,
      targetId: null,
      payload: msg,
    });
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

  public getConnectedPeers(): ConnectedPeer[] {
    return Array.from(this.connectedPeers.values());
  }

  public getLocalInfo() {
    return {
      peerId: this.localPeerId,
      shortCode: this.localCode,
    };
  }

  public destroy() {
    this.broadcastChannel?.close();
    this.peer?.destroy();
  }
}
