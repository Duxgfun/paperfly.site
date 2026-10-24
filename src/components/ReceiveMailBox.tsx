/**
 * Hộp Nhận Thư (Receive Mail Box)
 * Người dùng chỉ cần nhập mã được chia sẻ (ví dụ: FLY-382) để mở xem nội dung
 */

import React, { useState } from 'react';
import { Send, Inbox, Loader2 } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { translations, type Language } from '../utils/i18n';

interface ReceiveMailBoxProps {
  lang: Language;
  onFetchCode: (code: string) => Promise<boolean>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const ReceiveMailBox: React.FC<ReceiveMailBoxProps> = ({
  lang,
  onFetchCode,
  isLoading,
  errorMessage,
}) => {
  const t = translations[lang];
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;

    paperSound.playPaperRustle();
    await onFetchCode(code.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto p-5 md:p-6 rounded-2xl sketch-border paper-shadow bg-white text-[#3F4468] relative">
      {/* Miếng băng dính Washi Tape ở góc */}
      <div className="washi-tape-strip absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 rotate-1 rounded-sm pointer-events-none"></div>

      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[#EB5757]" />
          <h2 className="text-xl md:text-2xl font-black font-hand tracking-wide">
            {t.receiveTitle}
          </h2>
        </div>
        <p className="text-xs font-sans text-slate-500">
          {t.receiveSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          placeholder={t.enterCodePlaceholder}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 px-4 py-3 rounded-xl sketch-border-sm text-base font-hand font-bold tracking-wider uppercase outline-none bg-[#FAFAFA] text-[#3F4468] placeholder:text-slate-400 focus:border-[#EB5757] transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="px-6 py-3 rounded-xl bg-[#EB5757] hover:bg-[#d44848] active:scale-95 text-white font-hand font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.receivingStatus}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t.openMailBtn}</span>
            </>
          )}
        </button>
      </form>

      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-hand text-center">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
