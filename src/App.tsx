/**
 * Ứng dụng Paperfly.site - Trực tiếp truyền tệp & giấy note P2P trên nền bàn giấy
 * Giao diện thân thiện cho người dùng phổ thông, hỗ trợ song ngữ EN / VI
 */

import { useState, useEffect, useRef } from 'react';
import { DeskHeader } from './components/DeskHeader';
import { RadarStation } from './components/RadarStation';
import { PaperEditor } from './components/PaperEditor';
import { ReceivedMailModal } from './components/ReceivedMailModal';
import { FlightJournal } from './components/FlightJournal';
import { P2PManager } from './utils/p2p';
import { paperSound } from './utils/sound';
import { translations, type Language } from './utils/i18n';
import type { ConnectedPeer, FileTransferProgress, HistoryItem, PaperNote } from './types';

export function App() {
  // Ngôn ngữ mặc định là Tiếng Việt hoặc lấy từ cấu hình đã lưu
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('paperfly_lang');
      return saved === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);

  // Thông tin trạm cục bộ
  const [myCode, setMyCode] = useState<string>('');
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [nearbyPeers, setNearbyPeers] = useState<ConnectedPeer[]>([]);

  // Trạng thái nhận thư / tệp
  const [incomingNote, setIncomingNote] = useState<{ note: PaperNote; sender: ConnectedPeer } | null>(null);
  const [incomingFile, setIncomingFile] = useState<{
    file: { name: string; size: number; type: string; url: string };
    sender: ConnectedPeer;
  } | null>(null);
  const [fileProgress, setFileProgress] = useState<FileTransferProgress | null>(null);

  // Nhật ký chuyến bay trong phiên
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const p2pRef = useRef<P2PManager | null>(null);
  const t = translations[lang];

  useEffect(() => {
    // Khởi tạo hệ thống P2P với các hàm xử lý sự kiện
    const p2p = new P2PManager({
      onSelfReady: (peerId, shortCode) => {
        setMyPeerId(peerId);
        setMyCode(shortCode);

        // Kiểm tra xem URL có chứa tham số ?connect=CODE từ mã QR không
        const urlParams = new URLSearchParams(window.location.search);
        const connectParam = urlParams.get('connect');
        if (connectParam && connectParam.toUpperCase() !== shortCode.toUpperCase()) {
          setTimeout(() => {
            p2p.connectToCode(connectParam);
          }, 800);
        }
      },
      onPeerConnected: (peer) => {
        setNearbyPeers((prev) => {
          const filtered = prev.filter((p) => p.peerId !== peer.peerId);
          return [...filtered, peer];
        });
        paperSound.playStampThud();
      },
      onPeerDisconnected: (peerId) => {
        setNearbyPeers((prev) => prev.filter((p) => p.peerId !== peerId));
      },
      onNoteReceived: (note, sender) => {
        setIncomingNote({ note, sender });
        // Ghi vào nhật ký
        setHistoryItems((prev) => [
          {
            id: `hist-${Date.now()}`,
            direction: 'received',
            kind: 'text',
            name: `${lang === 'vi' ? 'Lời nhắn từ' : 'Note from'} ${sender.shortCode}`,
            content: note.text,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      },
      onFileTransferProgress: (progress) => {
        setFileProgress(progress);
      },
      onFileReceived: (file, sender) => {
        setIncomingFile({ file, sender });
        // Ghi vào nhật ký
        setHistoryItems((prev) => [
          {
            id: `hist-${Date.now()}`,
            direction: 'received',
            kind: 'file',
            name: file.name,
            size: file.size,
            downloadUrl: file.url,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      },
    });

    p2pRef.current = p2p;

    return () => {
      p2p.destroy();
    };
  }, [lang]);

  /**
   * Xử lý gửi văn bản / Note
   */
  const handleSendNote = (text: string, highlighterColor?: string) => {
    if (!p2pRef.current) return;
    p2pRef.current.sendNote(text, highlighterColor);

    // Lưu vào nhật ký gửi
    setHistoryItems((prev) => [
      {
        id: `hist-${Date.now()}`,
        direction: 'sent',
        kind: 'text',
        name: `${lang === 'vi' ? 'Lời nhắn' : 'Note'} (${text.substring(0, 18)}...)`,
        content: text,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  /**
   * Xử lý gửi tệp tin
   */
  const handleSendFile = async (file: File) => {
    if (!p2pRef.current) return;
    await p2pRef.current.sendFile(file);

    // Lưu vào nhật ký gửi
    setHistoryItems((prev) => [
      {
        id: `hist-${Date.now()}`,
        direction: 'sent',
        kind: 'file',
        name: file.name,
        size: file.size,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleConnectCode = async (code: string) => {
    if (!p2pRef.current) return false;
    return await p2pRef.current.connectToCode(code);
  };

  return (
    <div className="min-h-screen w-full bg-grid-paper text-[#3F4468] flex flex-col justify-between selection:bg-amber-200">
      {/* 1. Header trên cùng của mặt bàn */}
      <DeskHeader
        lang={lang}
        setLang={setLang}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenJournal={() => setIsJournalOpen(true)}
        journalCount={historyItems.length}
        onlineCount={nearbyPeers.length}
        myCode={myCode}
      />

      {/* 2. Không gian làm việc chính (Bàn giấy học sinh) */}
      <main className="w-full max-w-5xl mx-auto px-4 py-4 flex-1 flex flex-col gap-6">
        {/* Khu vực Trạm Máy Bay & Radar Ghép Đôi */}
        <RadarStation
          lang={lang}
          myCode={myCode}
          myPeerId={myPeerId}
          nearbyPeers={nearbyPeers}
          onConnectCode={handleConnectCode}
        />

        {/* Khu vực Soạn Thảo & Gửi (Giấy Note Vàng & Túi Giấy Kraft) */}
        <PaperEditor
          lang={lang}
          onSendNote={handleSendNote}
          onSendFile={handleSendFile}
          hasReceiver={nearbyPeers.length > 0}
        />
      </main>

      {/* 3. Footer Bàn Học */}
      <footer className="w-full py-4 text-center text-xs font-hand text-slate-400 select-none">
        <div className="flex items-center justify-center gap-2">
          <span>paperfly.site</span>
          <span>•</span>
          <span>{t.footerMetaphor}</span>
        </div>
      </footer>

      {/* Modal Nhận Thư / Tệp khi có máy bay hạ cánh */}
      {(incomingNote || incomingFile || (fileProgress && !fileProgress.isCompleted)) && (
        <ReceivedMailModal
          lang={lang}
          incomingNote={incomingNote}
          incomingFile={incomingFile}
          fileProgress={fileProgress}
          onClose={() => {
            setIncomingNote(null);
            setIncomingFile(null);
            setFileProgress(null);
          }}
        />
      )}

      {/* Sổ tay lịch sử (Flight Journal) */}
      <FlightJournal
        lang={lang}
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        items={historyItems}
        onClear={() => setHistoryItems([])}
      />
    </div>
  );
}

export default App;
