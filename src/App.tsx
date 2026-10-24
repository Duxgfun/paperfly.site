/**
 * Ứng dụng Paperfly.site
 * Quy trình mới:
 * 1. Gửi: Soạn Note hoặc chọn File -> Bấm "Gấp & Phi" -> Ra Mã nhận & Con tem QR 16x16
 * 2. Nhận: Nhập mã nhận (hoặc quét QR) -> Nhận thẳng nội dung về máy
 */

import { useState, useEffect, useRef } from 'react';
import { DeskHeader } from './components/DeskHeader';
import { PaperEditor } from './components/PaperEditor';
import { ReceiveMailBox } from './components/ReceiveMailBox';
import { ReceivedMailModal } from './components/ReceivedMailModal';
import { FlightJournal } from './components/FlightJournal';
import { P2PManager, type OutgoingPayload } from './utils/p2p';
import { paperSound } from './utils/sound';
import { translations, type Language } from './utils/i18n';
import { Send, Inbox } from 'lucide-react';
import type { ConnectedPeer, FileTransferProgress, HistoryItem, PaperNote } from './types';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('paperfly_lang');
      return saved === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  // Chế độ hiện tại: 'send' (Gấp & Gửi) hoặc 'receive' (Nhận thư)
  const [activeMode, setActiveMode] = useState<'send' | 'receive'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('code')) return 'receive';
    }
    return 'send';
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);

  // Trạng thái bên gửi
  const [isDelivered, setIsDelivered] = useState<boolean>(false);

  // Trạng thái bên nhận
  const [isLoadingReceive, setIsLoadingReceive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!new URLSearchParams(window.location.search).get('code');
    }
    return false;
  });
  const [receiveError, setReceiveError] = useState<string | null>(null);

  // Nội dung nhận được
  const [incomingNote, setIncomingNote] = useState<{ note: PaperNote; sender: ConnectedPeer } | null>(null);
  const [incomingFile, setIncomingFile] = useState<{
    file: { name: string; size: number; type: string; url: string };
    sender: ConnectedPeer;
  } | null>(null);
  const [fileProgress, setFileProgress] = useState<FileTransferProgress | null>(null);

  // Nhật ký chuyến bay
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const p2pRef = useRef<P2PManager | null>(null);
  const t = translations[lang];

  useEffect(() => {
    const p2p = new P2PManager({
      onNoteReceived: (note, sender) => {
        setIsLoadingReceive(false);
        setIncomingNote({ note, sender });
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
        setIsLoadingReceive(false);
        setIncomingFile({ file, sender });
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
      onSendSuccess: () => {
        setIsDelivered(true);
        paperSound.playStampThud();
      },
    });

    p2pRef.current = p2p;

    // Kiểm tra xem URL có chứa tham số ?code= từ mã QR không
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setTimeout(() => {
        p2p.fetchMailByCode(codeParam).then((ok) => {
          setIsLoadingReceive(false);
          if (!ok) {
            setReceiveError(translations[lang].codeNotFound.replace('{code}', codeParam.toUpperCase()));
          }
        });
      }, 700);
    }

    return () => {
      p2p.destroy();
    };
  }, [lang]);

  /**
   * Bên gửi: Soạn xong bấm Gấp & Phi -> sinh mã & QR
   */
  const handlePrepareMail = (payload: OutgoingPayload) => {
    setIsDelivered(false);
    if (!p2pRef.current) return { code: 'FLY-000', shareUrl: '' };

    const result = p2pRef.current.prepareOutgoingMail(payload);

    // Ghi vào nhật ký đã gửi
    const itemName = payload.kind === 'note'
      ? `${lang === 'vi' ? 'Lời nhắn' : 'Note'} (${payload.note.text.substring(0, 18)}...)`
      : payload.file.name;

    setHistoryItems((prev) => [
      {
        id: `hist-${Date.now()}`,
        direction: 'sent',
        kind: payload.kind === 'note' ? 'text' : 'file',
        name: itemName,
        size: payload.kind === 'file' ? payload.file.size : undefined,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    return result;
  };

  /**
   * Bên nhận: Bấm Mở Thư bằng mã
   */
  const handleFetchCode = async (code: string): Promise<boolean> => {
    if (!p2pRef.current) return false;
    setReceiveError(null);
    setIsLoadingReceive(true);

    const success = await p2pRef.current.fetchMailByCode(code);
    setIsLoadingReceive(false);

    if (!success) {
      setReceiveError(t.codeNotFound.replace('{code}', code.toUpperCase()));
    }
    return success;
  };

  return (
    <div className="min-h-screen w-full bg-grid-paper text-[#3F4468] flex flex-col justify-between selection:bg-amber-200">
      {/* 1. Header trên cùng */}
      <DeskHeader
        lang={lang}
        setLang={setLang}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenJournal={() => setIsJournalOpen(true)}
        journalCount={historyItems.length}
      />

      {/* 2. Không gian làm việc chính */}
      <main className="w-full max-w-4xl mx-auto px-4 py-4 flex-1 flex flex-col gap-6">
        {/* Nút chuyển đổi chế độ GỬI vs NHẬN */}
        <div className="flex items-center justify-center gap-3 select-none">
          <button
            onClick={() => {
              setActiveMode('send');
              paperSound.playPaperRustle();
            }}
            className={`px-6 py-2.5 rounded-2xl sketch-border font-hand font-bold text-base md:text-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'send'
                ? 'bg-[#FFF3B2] text-[#3F4468] shadow-md scale-105 -rotate-1'
                : 'bg-white/80 text-slate-500 hover:bg-white'
            }`}
          >
            <Send className="w-4 h-4 text-[#EB5757]" />
            <span>{t.tabSend}</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('receive');
              paperSound.playPaperRustle();
            }}
            className={`px-6 py-2.5 rounded-2xl sketch-border font-hand font-bold text-base md:text-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'receive'
                ? 'bg-[#E8F1F8] text-[#3F4468] shadow-md scale-105 rotate-1'
                : 'bg-white/80 text-slate-500 hover:bg-white'
            }`}
          >
            <Inbox className="w-4 h-4 text-indigo-700" />
            <span>{t.tabReceive}</span>
          </button>
        </div>

        {/* NỘI DUNG CHẾ ĐỘ GỬI */}
        {activeMode === 'send' && (
          <PaperEditor
            lang={lang}
            onPrepareMail={handlePrepareMail}
            isDelivered={isDelivered}
            onReset={() => setIsDelivered(false)}
          />
        )}

        {/* NỘI DUNG CHẾ ĐỘ NHẬN */}
        {activeMode === 'receive' && (
          <ReceiveMailBox
            lang={lang}
            onFetchCode={handleFetchCode}
            isLoading={isLoadingReceive}
            errorMessage={receiveError}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="w-full py-4 text-center text-xs font-hand text-slate-400 select-none">
        <div className="flex items-center justify-center gap-2">
          <span>paperfly.site</span>
          <span>•</span>
          <span>{t.footerMetaphor}</span>
        </div>
      </footer>

      {/* Modal Khi nhận thư thành công */}
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

      {/* Sổ tay lịch sử */}
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
