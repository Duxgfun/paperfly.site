/**
 * Cuốn Sổ Tay Lịch Sử Chuyến Bay (Flight Journal)
 * Thiết kế gáy lò xo xoắn ốc (Spiral Notebook) ghi lại lịch sử truyền nhận trong phiên
 * Hỗ trợ song ngữ EN / VI, giao diện thân thiện
 */

import React from 'react';
import { X, Send, Download, Trash2, BookOpen } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { translations, type Language } from '../utils/i18n';
import type { HistoryItem } from '../types';

interface FlightJournalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onClear: () => void;
}

export const FlightJournal: React.FC<FlightJournalProps> = ({
  lang,
  isOpen,
  onClose,
  items,
  onClear,
}) => {
  const t = translations[lang];
  if (!isOpen) return null;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none animate-fadeIn">
      {/* Khung cuốn sổ tay gáy xoắn ốc */}
      <div className="w-full max-w-lg rounded-3xl p-6 md:p-8 sketch-border paper-shadow-lg relative max-h-[85vh] flex flex-col bg-[#FFFDF9] text-[#3F4468]">
        {/* Lỗ gáy lò xo xoắn ốc trên đầu cuốn sổ */}
        <div className="absolute -top-3 left-6 right-6 flex justify-around pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-6 rounded-full bg-slate-700/80 border border-slate-900 shadow-inner"
            ></div>
          ))}
        </div>

        {/* Header cuốn sổ */}
        <div className="flex items-center justify-between pb-4 mt-2 border-b-2 border-dashed border-[#3F4468]/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#EB5757]" />
            <h2 className="text-xl md:text-2xl font-bold font-hand tracking-wide">
              {t.journalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách các chuyến bay */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-hand text-lg">
              {t.journalEmpty}
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl sketch-border-sm flex items-center justify-between gap-3 transition-colors bg-white hover:bg-amber-50/50 paper-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold sketch-border-sm ${
                      item.direction === 'sent'
                        ? 'bg-[#FFF3B2] text-amber-900'
                        : 'bg-[#E8F1F8] text-indigo-900'
                    }`}
                  >
                    {item.direction === 'sent' ? (
                      <Send className="w-4 h-4 text-[#EB5757]" />
                    ) : (
                      <Download className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-hand font-bold text-base truncate text-[#3F4468]">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans flex items-center gap-2">
                      <span>{item.direction === 'sent' ? t.sentLabel : t.receivedLabel}</span>
                      {item.size ? <span>• {formatFileSize(item.size)}</span> : null}
                      <span>• {new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    download={item.name}
                    onClick={() => paperSound.playPaperRustle()}
                    className="px-3 py-1.5 rounded-lg bg-[#E8F1F8] hover:bg-[#d8e8f5] text-[#3F4468] text-xs font-bold font-hand sketch-border-sm shrink-0"
                  >
                    {t.downloadAgain}
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer cuốn sổ */}
        <div className="pt-3 border-t border-dashed border-[#3F4468]/20 flex items-center justify-between text-xs font-sans text-slate-400">
          <span>{t.journalNotice}</span>
          {items.length > 0 && (
            <button
              onClick={() => {
                onClear();
                paperSound.playPaperRustle();
              }}
              className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 font-hand cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearHistoryBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
