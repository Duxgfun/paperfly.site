/**
 * Định nghĩa các kiểu dữ liệu và khung truyền tin P2P cho paperfly.site
 * Không sử dụng emoji
 */

export interface PaperNote {
  text: string;
  highlighterColor?: string;
  timestamp: number;
}

export interface PaperFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  timestamp: number;
}

export interface FileTransferProgress {
  id: string;
  name: string;
  size: number;
  receivedBytes: number;
  progressPercent: number;
  isCompleted: boolean;
}

export type TransferMessage =
  | { type: 'HANDSHAKE'; peerId: string; shortCode: string; deviceName: string }
  | { type: 'NOTE'; data: PaperNote }
  | { type: 'FILE_START'; meta: PaperFileMeta }
  | { type: 'FILE_CHUNK'; id: string; chunkIndex: number; chunk: string }
  | { type: 'FILE_COMPLETE'; id: string }
  | { type: 'HEARTBEAT'; timestamp: number };

export interface ConnectedPeer {
  peerId: string;
  shortCode: string;
  name: string;
  isOnline: boolean;
}

export interface HistoryItem {
  id: string;
  direction: 'sent' | 'received';
  kind: 'text' | 'file';
  name: string;
  content?: string;
  size?: number;
  timestamp: number;
  downloadUrl?: string;
}
