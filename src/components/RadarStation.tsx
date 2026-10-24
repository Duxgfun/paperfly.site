/**
 * Khu vực Kết nối & Radar (Trạm Máy Bay)
 * Hiển thị con dấu QR kích thước 16x16 (w-16 h-16 = 64px) và mã bưu điện 4 ký tự
 * Hoàn toàn không sử dụng emoji, thân thiện cho người dùng phổ thông
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Send, Copy, Check, Users, Maximize2, Radio } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { translations, type Language } from '../utils/i18n';
import type { ConnectedPeer } from '../types';

interface RadarStationProps {
  lang: Language;
  myCode: string;
  myPeerId: string;
  nearbyPeers: ConnectedPeer[];
  onConnectCode: (code: string) => Promise<boolean>;
}

export const RadarStation: React.FC<RadarStationProps> = ({
  lang,
  myCode,
  myPeerId: _myPeerId,
  nearbyPeers,
  onConnectCode,
}) => {
  const t = translations[lang];
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isZoomedQR, setIsZoomedQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Link chia sẻ nhanh chứa mã để người quét QR mở web tự kết nối luôn
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?connect=${myCode}`
    : `https://paperfly.site?connect=${myCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    paperSound.playStampThud();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsConnecting(true);
    setConnectMessage({ text: t.connecting });
    paperSound.playPaperRustle();

    const success = await onConnectCode(inputCode.trim());
    setIsConnecting(false);

    if (success) {
      setConnectMessage({
        text: t.connectedSuccess.replace('{code}', inputCode.toUpperCase()),
      });
      paperSound.playStampThud();
      setInputCode('');
    } else {
      setConnectMessage({
        text: t.connectError.replace('{code}', inputCode.toUpperCase()),
        isError: true,
      });
    }

    setTimeout(() => setConnectMessage(null), 4000);
  };

  return (
    <div className="w-full rounded-2xl p-4 md:p-6 transition-all duration-300 sketch-border paper-shadow relative bg-white text-[#3F4468]">
      {/* Miếng băng dính Washi Tape cố định ở góc trên */}
      <div className="washi-tape-strip absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 rotate-1 rounded-sm pointer-events-none z-10"></div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Cột 1: Con dấu Tem Thư chứa QR 16x16 & Mã của bạn */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#EB5757] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
              {t.stationTitle}
            </span>
          </div>

          {/* Tem thư bưu điện tích hợp mã QR 16x16 */}
          <div className="p-3.5 rounded-2xl flex items-center gap-3 sketch-border bg-[#FFF9DE] border-[#EB5757] shadow-sm relative group">
            {/* Mã QR kích thước 16x16 (w-16 h-16 = 64px trong Tailwind) */}
            <div
              onClick={() => {
                setIsZoomedQR(!isZoomedQR);
                paperSound.playPaperRustle();
              }}
              className="w-16 h-16 shrink-0 p-1 bg-white rounded-xl border border-dashed border-[#3F4468] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform relative group/qr shadow-xs"
              title="Bấm để phóng to mã QR"
            >
              <QRCodeSVG value={shareUrl} size={56} level="M" />
              <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-[#3F4468]" />
              </div>
            </div>

            {/* Mã chữ số 4 ký tự & Nút sao chép */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#EB5757]">
                AIR MAIL POST
              </span>
              <div className="text-3xl font-black font-hand tracking-wider text-[#3F4468] leading-none">
                {myCode || 'FLY-..'}
              </div>
              <button
                onClick={copyCode}
                className="mt-1 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-white/90 hover:bg-white text-[#3F4468] sketch-border-sm flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyCode}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-sans max-w-xs">
            {t.scanQRHint}
          </p>
        </div>

        {/* Cột 2: Nhập mã nối đường bay & Các máy đang mở quanh đây */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Form nhập mã kết nối thủ công */}
          <form onSubmit={handleConnectSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t.enterCodePlaceholder}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl sketch-border-sm text-sm font-hand font-bold tracking-wider uppercase transition-all duration-200 outline-none bg-[#FAFAFA] text-[#3F4468] placeholder:text-slate-400 focus:border-[#EB5757]"
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting || !inputCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#EB5757] hover:bg-[#d44848] active:scale-95 text-white font-bold text-sm font-hand flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isConnecting ? t.connecting : t.connectBtn}</span>
            </button>
          </form>

          {/* Thông báo trạng thái kết nối */}
          {connectMessage && (
            <p
              className={`text-xs font-hand font-bold animate-pulse ${
                connectMessage.isError ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {connectMessage.text}
            </p>
          )}

          {/* Khu vực thiết bị đang mở quanh đây */}
          <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
            <div className="flex items-center justify-between text-xs font-bold font-sans text-slate-500 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.nearbyTitle}</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                {nearbyPeers.length} {t.devicesNearby}
              </span>
            </div>

            {nearbyPeers.length === 0 ? (
              <div className="py-2 text-center text-xs text-slate-400 font-hand">
                {t.nearbyEmpty}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nearbyPeers.map((peer) => (
                  <div
                    key={peer.peerId}
                    onClick={() => {
                      setInputCode(peer.shortCode);
                      paperSound.playPaperRustle();
                    }}
                    className="px-3 py-1.5 rounded-lg sketch-border-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 bg-white hover:bg-amber-50 text-[#3F4468] paper-shadow"
                    title={t.clickToChoose}
                  >
                    <Send className="w-3.5 h-3.5 text-[#3F4468]" />
                    <span className="text-xs font-bold font-hand">{peer.shortCode}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal phóng to QR khi người dùng bấm vào con tem QR 16x16 */}
      {isZoomedQR && (
        <div
          onClick={() => setIsZoomedQR(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs cursor-pointer animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-6 bg-white rounded-3xl sketch-border paper-shadow-lg flex flex-col items-center gap-3 cursor-default"
          >
            <div className="text-sm font-bold font-hand uppercase text-[#EB5757] tracking-wider">
              {t.scanQRHint}
            </div>
            <div className="p-3 border-2 border-dashed border-[#3F4468] rounded-2xl bg-[#FFF9DE]">
              <QRCodeSVG value={shareUrl} size={200} level="M" />
            </div>
            <div className="text-2xl font-black font-hand text-[#3F4468]">{myCode}</div>
            <button
              onClick={() => setIsZoomedQR(false)}
              className="text-xs font-sans text-slate-500 hover:text-slate-800 underline mt-1"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
