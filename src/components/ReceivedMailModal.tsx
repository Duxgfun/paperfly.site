/**
 * Khu vực Nhận Thư & Hạ Cánh ("Hạ Cánh & Bóc Thư")
 * Hiển thị chiếc máy bay giấy đáp xuống màn hình, bung mở thành tờ Note hoặc Bưu kiện
 * Hỗ trợ đa ngôn ngữ EN / VI, giao diện thân thiện với người dùng
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Download, Check, X, Sparkles, FileText, Package } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { OrigamiPaperPlane } from './OrigamiPaperPlane';
import { translations, type Language } from '../utils/i18n';
import type { ConnectedPeer, FileTransferProgress, PaperNote } from '../types';

interface ReceivedMailModalProps {
  lang: Language;
  incomingNote: { note: PaperNote; sender: ConnectedPeer } | null;
  incomingFile: { file: { name: string; size: number; type: string; url: string }; sender: ConnectedPeer } | null;
  fileProgress: FileTransferProgress | null;
  onClose: () => void;
}

export const ReceivedMailModal: React.FC<ReceivedMailModalProps> = ({
  lang,
  incomingNote,
  incomingFile,
  fileProgress,
  onClose,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [isUnfolding, setIsUnfolding] = useState(true);

  // Kích hoạt âm thanh gió lượn và mở thư khi modal xuất hiện
  useEffect(() => {
    paperSound.playWhoosh();
    const timer = setTimeout(() => {
      setIsUnfolding(false);
      paperSound.playUnfoldPop();

      // Bắn pháo giấy nhẹ ăn mừng
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3F4468', '#E8F1F8', '#FFF3B2', '#EB5757'],
        });
      } catch {
        // bỏ qua nếu lỗi canvas
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const copyNoteText = () => {
    if (incomingNote) {
      navigator.clipboard.writeText(incomingNote.note.text);
      setCopied(true);
      paperSound.playStampThud();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const senderName = incomingNote?.sender.shortCode || incomingFile?.sender.shortCode || 'Bạn bè';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 md:p-8 sketch-border paper-shadow-lg relative transition-all duration-500 transform bg-white text-[#3F4468] ${
          isUnfolding ? 'scale-90 rotate-3' : 'scale-100 rotate-0'
        }`}
      >
        {/* Nút đóng góc phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Đóng thư"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Biểu tượng máy bay vừa đáp */}
        <div className="flex items-center gap-3 mb-4">
          <OrigamiPaperPlane size={48} status="idle" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#EB5757] uppercase tracking-wider font-sans">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.planeLanded}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-hand">
              {t.fromStation.replace('{name}', senderName)}
            </h2>
          </div>
        </div>

        {/* TRƯỜNG HỢP 1: NHẬN GIẤY NOTE VĂN BẢN */}
        {incomingNote && (
          <div className="p-5 rounded-2xl sketch-border relative my-3 transform rotate-[-0.5deg] bg-[#FFF3B2] text-[#3F4468]">
            <div className="washi-tape-strip absolute -top-3 left-8 w-20 h-5 rotate-1 rounded-sm"></div>

            <div className="flex items-center gap-2 mb-2 text-xs font-bold font-hand text-slate-600">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>{t.noteContentTitle}</span>
            </div>

            <div
              className="font-hand text-lg md:text-xl leading-relaxed whitespace-pre-wrap break-words max-h-60 overflow-y-auto p-2 rounded-lg"
              style={{
                backgroundColor: incomingNote.note.highlighterColor
                  ? `${incomingNote.note.highlighterColor}40`
                  : 'transparent',
              }}
            >
              {incomingNote.note.text}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-[#3F4468]/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-sans">
                {new Date(incomingNote.note.timestamp).toLocaleTimeString()}
              </span>
              <button
                onClick={copyNoteText}
                className="px-4 py-2 rounded-xl bg-[#EB5757] hover:bg-[#d44848] text-white text-xs font-bold font-hand flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.copied : t.copyTextBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 2: NHẬN TẬP TIN / FILE */}
        {incomingFile && (
          <div className="p-5 rounded-2xl sketch-border relative my-3 transform rotate-[0.5deg] bg-[#F5EBE0] text-[#3F4468]">
            <div className="airmail-border absolute top-0 left-0 right-0 h-2 rounded-t-xl opacity-80"></div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl sketch-border-sm shadow-xs">
                <Package className="w-7 h-7 text-[#EB5757]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-hand font-bold text-lg md:text-xl truncate text-[#3F4468]">
                  {incomingFile.file.name}
                </div>
                <div className="text-xs text-slate-500 font-sans">
                  {formatFileSize(incomingFile.file.size)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-[#3F4468]/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-sans">{t.cleanNotice}</span>
              <a
                href={incomingFile.file.url}
                download={incomingFile.file.name}
                onClick={() => {
                  paperSound.playPaperRustle();
                  setTimeout(onClose, 1000);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#EB5757] hover:bg-[#d44848] text-white text-xs font-bold font-hand flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadFileBtn}</span>
              </a>
            </div>
          </div>
        )}

        {/* TIẾN TRÌNH NHẬN FILE DẠNG VẠCH MỰC KẺ */}
        {fileProgress && !fileProgress.isCompleted && (
          <div className="my-3 p-4 rounded-xl bg-slate-50 sketch-border-sm">
            <div className="flex items-center justify-between text-xs font-hand font-bold mb-1.5">
              <span>{t.receivingFile.replace('{name}', fileProgress.name)}</span>
              <span className="font-mono text-[#EB5757]">{fileProgress.progressPercent}%</span>
            </div>
            {/* Vạch kẻ mực phong cách bút chì */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden p-0.5 border border-slate-300">
              <div
                className="h-full rounded-full bg-[#EB5757] transition-all duration-150"
                style={{ width: `${fileProgress.progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-slate-400 font-hand">
          {t.cleanNotice}
        </div>
      </div>
    </div>
  );
};
