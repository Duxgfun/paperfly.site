/**
 * Khu vực Soạn Thảo & Gửi ("Gấp & Phi")
 * Chế độ A: Giấy Note Vàng (Viết lời nhắn / Link)
 * Chế độ B: Túi Giấy Kraft (Thả ảnh / video / tài liệu)
 * Hỗ trợ đa ngôn ngữ EN / VI, giao diện thân thiện cho người dùng phổ thông
 */

import React, { useState, useRef } from 'react';
import { FileText, Package, UploadCloud, X, Highlighter, Send } from 'lucide-react';
import { paperSound } from '../utils/sound';
import { OrigamiPaperPlane } from './OrigamiPaperPlane';
import { translations, type Language } from '../utils/i18n';

interface PaperEditorProps {
  lang: Language;
  onSendNote: (text: string, highlighterColor?: string) => Promise<void> | void;
  onSendFile: (file: File) => Promise<void> | void;
  hasReceiver: boolean;
}

const HIGHLIGHTER_COLORS = [
  { name: 'Xanh Lá', color: '#A7F3D0', border: '#6EE7B7' },
  { name: 'Vàng Chanh', color: '#FEF08A', border: '#FDE047' },
  { name: 'Hồng Phấn', color: '#FBCFE8', border: '#F472B6' },
  { name: 'Lam Nhạt', color: '#BAE6FD', border: '#7DD3FC' },
];

export const PaperEditor: React.FC<PaperEditorProps> = ({
  lang,
  onSendNote,
  onSendFile,
  hasReceiver,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'note' | 'file'>('note');
  const [noteText, setNoteText] = useState('');
  const [selectedHighlighter, setSelectedHighlighter] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Trạng thái hoạt ảnh gấp máy bay và phóng đi
  const [isFolding, setIsFolding] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

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
   * Kích hoạt quy trình: Gấp giấy -> Bay vút -> Phát P2P
   */
  const handleFoldAndFly = async () => {
    if (activeTab === 'note' && !noteText.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;

    // Bước 1: Âm thanh sột soạt & Gấp giấy
    paperSound.playPaperRustle();
    setIsFolding(true);

    await new Promise((r) => setTimeout(r, 650));

    // Bước 2: Âm thanh Whoosh & Máy bay lao vút ra khỏi màn hình
    paperSound.playWhoosh();
    setIsFlying(true);

    // Bước 3: Phát dữ liệu qua P2P song song với hoạt ảnh
    if (activeTab === 'note') {
      await onSendNote(noteText, selectedHighlighter);
    } else if (selectedFile) {
      await onSendFile(selectedFile);
    }

    // Đợi máy bay bay khuất màn hình rồi khôi phục trạng thái
    await new Promise((r) => setTimeout(r, 900));
    setIsFlying(false);
    setIsFolding(false);

    if (activeTab === 'note') {
      setNoteText('');
    } else {
      setSelectedFile(null);
    }
  };

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
        {/* Máy bay đang gấp và bay lượn trên màn hình khi người dùng bấm Gấp & Phi */}
        {isFolding && (
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center transition-all duration-700 pointer-events-none ${
              isFlying
                ? 'translate-x-[600px] -translate-y-[450px] rotate-45 scale-75 opacity-0'
                : 'scale-110 rotate-6'
            }`}
          >
            <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xs flex flex-col items-center gap-2 shadow-xl border border-indigo-100">
              <OrigamiPaperPlane size={180} status={isFlying ? 'flying' : 'folding'} showTrail={isFlying} />
              <span className="font-hand font-black text-lg text-[#3F4468] tracking-wider animate-pulse">
                {isFlying ? t.flyingMessage : t.foldingMessage}
              </span>
            </div>
          </div>
        )}

        {/* ===================== TAB 1: GIẤY NOTE VÀNG ===================== */}
        {activeTab === 'note' && (
          <div
            className={`w-full p-6 md:p-8 rounded-2xl sketch-border paper-shadow-lg transition-all duration-500 relative transform bg-[#FFF3B2] text-[#3F4468] ${
              isFolding ? 'opacity-30 scale-95 blur-xs' : 'rotate-[-0.8deg] hover:rotate-0'
            }`}
          >
            {/* Miếng băng dính Washi Tape đè ở đầu tờ note */}
            <div className="washi-tape-strip absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-7 -rotate-2 rounded-sm pointer-events-none"></div>

            {/* Thanh công cụ Bút dạ quang */}
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

            {/* Khung nhập văn bản / Link */}
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

        {/* ===================== TAB 2: TÚI GIẤY KRAFT / FILE ===================== */}
        {activeTab === 'file' && (
          <div
            className={`w-full p-6 md:p-8 rounded-2xl sketch-border paper-shadow-lg transition-all duration-500 relative transform bg-[#F5EBE0] text-[#3F4468] ${
              isFolding ? 'opacity-30 scale-95 blur-xs' : 'rotate-[0.8deg] hover:rotate-0'
            }`}
          >
            {/* Viền tem thư Airmail sọc đỏ / xanh chạy dọc */}
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
              /* Nhãn bưu kiện khi đã chọn file */
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

      {/* ===================== NÚT HÀNH ĐỘNG: GẤP & PHI (FOLD & FLY) ===================== */}
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
          {/* Vòng tròn viền con dấu sáp đỏ */}
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/70 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{t.foldAndFlyBtn}</span>
        </button>

        {!hasReceiver && (
          <span className="text-xs text-slate-500 font-hand flex items-center gap-1">
            <span>{t.tipNoReceiver}</span>
          </span>
        )}
      </div>
    </div>
  );
};
