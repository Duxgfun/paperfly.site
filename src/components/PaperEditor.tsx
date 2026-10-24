/**
 * Khu vực Soạn Thảo & Gửi ("Gấp & Phi")
 * 1. Soạn Note hoặc chọn File
 * 2. Bấm "Gấp & Phi Đi"
 * 3. Xuất hiện con tem chứa Mã nhận + Con dấu QR 16x16 để chia sẻ cho người nhận
 */

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText,
  Package,
  UploadCloud,
  X,
  Highlighter,
  Send,
  Copy,
  Check,
  Link as LinkIcon,
  Maximize2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { paperSound } from '../utils/sound';
import { OrigamiPaperPlane } from './OrigamiPaperPlane';
import { translations, type Language } from '../utils/i18n';
import type { OutgoingPayload } from '../utils/p2p';

interface PaperEditorProps {
  lang: Language;
  onPrepareMail: (payload: OutgoingPayload) => { code: string; shareUrl: string };
  isDelivered: boolean;
  onReset: () => void;
}

const HIGHLIGHTER_COLORS = [
  { name: 'Xanh Lá', color: '#A7F3D0', border: '#6EE7B7' },
  { name: 'Vàng Chanh', color: '#FEF08A', border: '#FDE047' },
  { name: 'Hồng Phấn', color: '#FBCFE8', border: '#F472B6' },
  { name: 'Lam Nhạt', color: '#BAE6FD', border: '#7DD3FC' },
];

export const PaperEditor: React.FC<PaperEditorProps> = ({
  lang,
  onPrepareMail,
  isDelivered,
  onReset,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'note' | 'file'>('note');
  const [noteText, setNoteText] = useState('');
  const [selectedHighlighter, setSelectedHighlighter] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Kết quả sau khi bấm Gấp & Phi
  const [stampResult, setStampResult] = useState<{ code: string; shareUrl: string } | null>(null);
  const [isFolding, setIsFolding] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isZoomedQR, setIsZoomedQR] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      paperSound.playPaperRustle();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      paperSound.playPaperRustle();
    }
  };

  /**
   * Kích hoạt quy trình: Gấp giấy -> Tạo mã & QR
   */
  const handleFoldAndFly = async () => {
    if (activeTab === 'note' && !noteText.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;

    paperSound.playPaperRustle();
    setIsFolding(true);

    let result: { code: string; shareUrl: string };
    if (activeTab === 'note') {
      result = onPrepareMail({
        kind: 'note',
        note: {
          text: noteText,
          highlighterColor: selectedHighlighter,
          timestamp: Date.now(),
        },
      });
    } else {
      result = onPrepareMail({
        kind: 'file',
        file: selectedFile!,
      });
    }

    await new Promise((r) => setTimeout(r, 600));
    paperSound.playWhoosh();
    setStampResult(result);
    setIsFolding(false);
  };

  const copyCode = () => {
    if (!stampResult) return;
    navigator.clipboard.writeText(stampResult.code);
    setCopiedCode(true);
    paperSound.playStampThud();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    if (!stampResult) return;
    navigator.clipboard.writeText(stampResult.shareUrl);
    setCopiedLink(true);
    paperSound.playStampThud();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetAll = () => {
    setStampResult(null);
    setNoteText('');
    setSelectedFile(null);
    onReset();
    paperSound.playPaperRustle();
  };

  // NẾU ĐÃ GẤP & PHI: HIỂN THỊ CON TEM CHỨA MÃ VÀ QR ĐỂ CHIA SẺ
  if (stampResult) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 animate-fadeIn">
        <div className="w-full p-6 md:p-8 rounded-3xl sketch-border paper-shadow-lg bg-white text-[#3F4468] relative">
          <div className="washi-tape-strip absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 rotate-[-1deg] rounded-sm pointer-events-none"></div>

          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <OrigamiPaperPlane size={64} status={isDelivered ? 'idle' : 'flying'} showTrail={!isDelivered} />
            <h2 className="text-xl md:text-2xl font-black font-hand text-[#EB5757] tracking-wider uppercase">
              {t.stampReadyTitle}
            </h2>
            <p className="text-xs font-sans text-slate-500 max-w-sm">
              {t.stampSubtitle}
            </p>
          </div>

          {/* Tem thư trung tâm chứa Mã số và QR 16x16 */}
          <div className="p-4 md:p-5 rounded-2xl sketch-border bg-[#FFF9DE] border-[#EB5757] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mã QR 16x16 (Tailwind w-16 h-16 = 64px) */}
            <div
              onClick={() => {
                setIsZoomedQR(true);
                paperSound.playPaperRustle();
              }}
              className="w-16 h-16 shrink-0 p-1 bg-white rounded-xl border border-dashed border-[#3F4468] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform relative group shadow-xs"
              title={t.scanQRHint}
            >
              <QRCodeSVG value={stampResult.shareUrl} size={56} level="M" />
              <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-[#3F4468]" />
              </div>
            </div>

            {/* Mã nhận thư to rõ ràng */}
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#EB5757]">
                AIR MAIL POST
              </span>
              <div className="text-3xl md:text-4xl font-black font-hand tracking-wider text-[#3F4468]">
                {stampResult.code}
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                {activeTab === 'note' ? 'Lời nhắn giấy' : selectedFile?.name}
              </span>
            </div>

            {/* Nút sao chép mã và link */}
            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
              <button
                onClick={copyCode}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#3F4468] text-xs font-bold font-hand sketch-border-sm flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? t.copied : t.copyCode}</span>
              </button>
              <button
                onClick={copyLink}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#3F4468] text-xs font-bold font-hand sketch-border-sm flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t.copied : t.copyLink}</span>
              </button>
            </div>
          </div>

          {/* Trạng thái giao thư */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center gap-2 text-xs font-hand text-center">
            {isDelivered ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t.sentSuccess}</span>
              </span>
            ) : (
              <span className="text-slate-600 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EB5757]" />
                <span>{t.waitingReceiver}</span>
              </span>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={resetAll}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#3F4468] text-xs font-bold font-hand sketch-border-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.sendAnotherBtn}</span>
            </button>
          </div>
        </div>

        {/* Modal phóng to QR */}
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
                Quét Mã Để Nhận Thư
              </div>
              <div className="p-3 border-2 border-dashed border-[#3F4468] rounded-2xl bg-[#FFF9DE]">
                <QRCodeSVG value={stampResult.shareUrl} size={200} level="M" />
              </div>
              <div className="text-2xl font-black font-hand text-[#3F4468]">{stampResult.code}</div>
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
  }

  // GIAO DIỆN SOẠN THẢO BAN ĐẦU
  return (
    <div className="w-full flex flex-col items-center gap-6 relative">
      {/* Thanh Tab chọn chất liệu giấy: Giấy Note Vàng vs Túi Giấy Kraft */}
      <div className="flex items-center gap-3 select-none">
        <button
          onClick={() => {
            setActiveTab('note');
            paperSound.playPaperRustle();
          }}
          className={`px-5 py-2.5 rounded-xl sketch-border text-sm font-bold font-hand flex items-center gap-2 transition-all duration-200 transform cursor-pointer ${
            activeTab === 'note'
              ? 'bg-[#FFF3B2] text-[#3F4468] -rotate-1 shadow-md scale-105'
              : 'bg-white/80 text-slate-500 hover:bg-white'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>{t.tabNote}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('file');
            paperSound.playPaperRustle();
          }}
          className={`px-5 py-2.5 rounded-xl sketch-border text-sm font-bold font-hand flex items-center gap-2 transition-all duration-200 transform cursor-pointer ${
            activeTab === 'file'
              ? 'bg-[#F5EBE0] text-[#3F4468] rotate-1 shadow-md scale-105'
              : 'bg-white/80 text-slate-500 hover:bg-white'
          }`}
        >
          <Package className="w-4 h-4 text-amber-800" />
          <span>{t.tabFile}</span>
        </button>
      </div>

      {/* Vùng làm việc chính: Tờ Giấy Note hoặc Túi Giấy Kraft */}
      <div className="w-full max-w-2xl relative perspective-origami min-h-[340px]">
        {/* Máy bay đang gấp khi người dùng bấm Gấp & Phi */}
        {isFolding && (
          <div className="absolute inset-0 z-30 flex items-center justify-center transition-all duration-700 pointer-events-none scale-110 rotate-6">
            <div className="p-6 rounded-3xl bg-white/70 backdrop-blur-xs flex flex-col items-center gap-2 shadow-xl border border-indigo-100">
              <OrigamiPaperPlane size={140} status="folding" />
              <span className="font-hand font-black text-lg text-[#3F4468] tracking-wider animate-pulse">
                {t.foldingMessage}
              </span>
            </div>
          </div>
        )}

        {/* TAB 1: GIẤY NOTE VÀNG */}
        {activeTab === 'note' && (
          <div
            className={`w-full p-6 md:p-8 rounded-2xl sketch-border paper-shadow-lg transition-all duration-500 relative transform bg-[#FFF3B2] text-[#3F4468] ${
              isFolding ? 'opacity-30 scale-95 blur-xs' : 'rotate-[-0.8deg] hover:rotate-0'
            }`}
          >
            <div className="washi-tape-strip absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-7 -rotate-2 rounded-sm pointer-events-none"></div>

            {/* Bút dạ quang */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-[#3F4468]/20">
              <div className="flex items-center gap-2 text-xs font-bold font-hand text-slate-600">
                <Highlighter className="w-4 h-4 text-emerald-600" />
                <span>{t.highlighterTitle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {HIGHLIGHTER_COLORS.map((hl) => (
                  <button
                    key={hl.color}
                    onClick={() => {
                      setSelectedHighlighter(selectedHighlighter === hl.color ? undefined : hl.color);
                      paperSound.playPaperRustle();
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform duration-150 cursor-pointer ${
                      selectedHighlighter === hl.color ? 'scale-125 shadow-sm' : 'hover:scale-110 opacity-80'
                    }`}
                    style={{ backgroundColor: hl.color, borderColor: hl.border }}
                    title={hl.name}
                  />
                ))}
                {selectedHighlighter && (
                  <button
                    onClick={() => setSelectedHighlighter(undefined)}
                    className="text-xs px-2 py-0.5 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {t.clearHighlight}
                  </button>
                )}
              </div>
            </div>

            {/* Khung nhập văn bản */}
            <textarea
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                if (Math.random() > 0.85) paperSound.playPaperRustle();
              }}
              placeholder={t.notePlaceholder}
              rows={6}
              className="w-full bg-transparent resize-none outline-none font-hand text-lg md:text-xl leading-relaxed placeholder:text-slate-400 placeholder:italic transition-colors"
              style={{
                backgroundColor: selectedHighlighter ? `${selectedHighlighter}40` : 'transparent',
                borderRadius: '8px',
                padding: '8px',
              }}
            />

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-sans">
              <span>{t.noteCharCount.replace('{count}', String(noteText.length))}</span>
              <span>{t.securityHint}</span>
            </div>
          </div>
        )}

        {/* TAB 2: TÚI GIẤY KRAFT / FILE */}
        {activeTab === 'file' && (
          <div
            className={`w-full p-6 md:p-8 rounded-2xl sketch-border paper-shadow-lg transition-all duration-500 relative transform bg-[#F5EBE0] text-[#3F4468] ${
              isFolding ? 'opacity-30 scale-95 blur-xs' : 'rotate-[0.8deg] hover:rotate-0'
            }`}
          >
            <div className="airmail-border absolute top-0 left-0 right-0 h-2.5 rounded-t-xl opacity-80"></div>
            <div className="airmail-border absolute bottom-0 left-0 right-0 h-2.5 rounded-b-xl opacity-80"></div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`py-12 px-6 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                  isDragging
                    ? 'border-[#EB5757] bg-amber-100/60 scale-[1.02]'
                    : 'border-[#3F4468]/30 hover:border-[#3F4468]/70 hover:bg-black/5'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/90 sketch-border flex items-center justify-center text-[#3F4468] mb-3 shadow-xs">
                  <UploadCloud className="w-8 h-8 text-[#EB5757]" />
                </div>
                <h3 className="font-hand font-bold text-xl md:text-2xl text-[#3F4468]">
                  {t.dropFileTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 font-sans">
                  {t.dropFileSubtitle}
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded-lg text-xs font-bold font-hand bg-white text-[#3F4468] sketch-border-sm hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  {t.chooseFileBtn}
                </button>
              </div>
            ) : (
              <div className="py-6 px-4 bg-white/90 rounded-xl sketch-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F1F8] flex items-center justify-center text-indigo-900 font-bold font-hand text-lg sketch-border-sm">
                    <Package className="w-6 h-6 text-indigo-900" />
                  </div>
                  <div>
                    <div className="font-hand font-bold text-base md:text-lg text-[#3F4468] break-all max-w-md">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-bold">{formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      <span className="uppercase">{selectedFile.type || t.fileTypeFallback}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFile(null);
                    paperSound.playPaperRustle();
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title={t.removeFile}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NÚT HÀNH ĐỘNG: GẤP & PHI */}
      <div className="flex flex-col items-center gap-2 select-none">
        <button
          onClick={handleFoldAndFly}
          disabled={
            isFolding ||
            (activeTab === 'note' && !noteText.trim()) ||
            (activeTab === 'file' && !selectedFile)
          }
          className="group relative px-8 py-3.5 rounded-2xl bg-[#EB5757] hover:bg-[#d44848] active:scale-95 text-white font-hand font-black text-xl md:text-2xl tracking-wide flex items-center gap-3 shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/70 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{t.foldAndFlyBtn}</span>
        </button>
      </div>
    </div>
  );
};
