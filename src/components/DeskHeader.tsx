/**
 * Thanh tiêu đề Mặt bàn (Desk Header)
 * Hỗ trợ chuyển đổi ngôn ngữ EN / VI, bật/tắt ASMR và mở Nhật ký
 */

import React from 'react';
import { Volume2, VolumeX, BookOpen, Wifi, Languages } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { translations, type Language } from '../utils/i18n';

interface DeskHeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  onOpenJournal: () => void;
  journalCount: number;
  onlineCount: number;
  myCode: string;
}

export const DeskHeader: React.FC<DeskHeaderProps> = ({
  lang,
  setLang,
  isMuted,
  setIsMuted,
  onOpenJournal,
  journalCount,
  onlineCount,
  myCode,
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
    <header className="w-full max-w-5xl mx-auto pt-4 pb-2 px-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* Khối Logo & Tên dự án */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer" onClick={() => paperSound.playWhoosh()}>
          <img
            src="/logo.png"
            alt="Paperfly Logo"
            className="w-12 h-12 object-contain transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black font-hand tracking-wide text-[#3F4468]">
              paperfly.site
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold sketch-border-sm bg-[#E8F1F8] text-[#3F4468] border-[#3F4468]">
              {t.privateBadge}
            </span>
          </div>
          <p className="text-xs font-sans text-slate-500">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Các công cụ điều khiển trên bàn làm việc */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Huy hiệu mã máy của bạn */}
        {myCode && (
          <div className="px-3 py-1 rounded-lg flex items-center gap-1.5 sketch-border-sm text-xs font-bold font-hand bg-[#FFF3B2] text-[#3F4468] border-[#3F4468]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t.yourCodeHeader} {myCode}</span>
          </div>
        )}

        {/* Số thiết bị quanh đây */}
        <div
          className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-sans bg-slate-100 text-slate-600"
          title={t.devicesNearby}
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          <span>{onlineCount} {t.devicesNearby}</span>
        </div>

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
