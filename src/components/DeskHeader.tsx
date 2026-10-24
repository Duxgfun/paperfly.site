/**
 * Thanh tiêu đề Mặt bàn (Desk Header)
 * Tối giản, không có badge rườm rà, hỗ trợ chuyển đổi ngôn ngữ EN / VI và Sổ Lịch sử
 */

import React from 'react';
import { Volume2, VolumeX, BookOpen, Languages } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { translations, type Language } from '../utils/i18n';

interface DeskHeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  onOpenJournal: () => void;
  journalCount: number;
}

export const DeskHeader: React.FC<DeskHeaderProps> = ({
  lang,
  setLang,
  isMuted,
  setIsMuted,
  onOpenJournal,
  journalCount,
}) => {
  const t = translations[lang];

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    paperSound.setMuted(next);
    if (!next) {
      paperSound.playStampThud();
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    paperSound.playPaperRustle();
    try {
      localStorage.setItem('paperfly_lang', nextLang);
    } catch {
      // Bỏ qua nếu lỗi localStorage
    }
  };

  return (
    <header className="w-full max-w-4xl mx-auto pt-5 pb-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      {/* Khối Logo & Tên dự án */}
      <div className="flex items-center gap-3">
        <div className="cursor-pointer" onClick={() => paperSound.playWhoosh()}>
          <img
            src="/logo.png"
            alt="Paperfly Logo"
            className="w-12 h-12 object-contain select-none"
          />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-hand tracking-wide text-[#3F4468]">
            paperfly.site
          </h1>
          <p className="text-xs font-hand font-bold tracking-wider text-slate-500">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Các công cụ điều khiển bên phải */}
      <div className="flex items-center gap-2">
        {/* Nút chuyển đổi ngôn ngữ EN / VI */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-bold sketch-border-sm bg-white text-[#3F4468] hover:bg-amber-50 paper-shadow cursor-pointer"
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Languages className="w-3.5 h-3.5 text-[#EB5757]" />
          <span className="font-hand font-black text-sm tracking-wide">{lang === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Nút bật/tắt ASMR Âm thanh giấy */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl transition-all duration-200 flex items-center gap-1 text-xs font-bold sketch-border-sm bg-white text-[#3F4468] hover:bg-slate-50 paper-shadow cursor-pointer"
          title={isMuted ? t.soundOn : t.soundOff}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
          )}
          <span className="hidden sm:inline">ASMR</span>
        </button>

        {/* Nút mở Sổ tay Lịch sử */}
        <button
          onClick={onOpenJournal}
          className="px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-bold sketch-border-sm bg-[#F5EBE0] text-[#3F4468] hover:bg-[#ebdccf] paper-shadow relative cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-[#EB5757]" />
          <span>{t.historyBtn}</span>
          {journalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#EB5757] text-white font-black shadow-xs">
              {journalCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
