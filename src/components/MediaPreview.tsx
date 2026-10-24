/**
 * Thành phần Xem Trước Phương Tiện (Media Preview)
 * Hỗ trợ: Ảnh (PNG, JPG, WEBP, GIF, SVG), Video (MP4, WEBM), Âm thanh (MP3, WAV, OGG, M4A) và Tệp tin
 */

import React, { useState } from 'react';
import { Volume2, Video, FileText, Maximize2, X } from 'lucide-react';

interface MediaPreviewProps {
  url: string;
  name: string;
  type?: string;
  size?: number;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  url,
  name,
  type = '',
  size,
  className = '',
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();

  const isImage =
    lowerType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/.test(lowerName);

  const isVideo =
    lowerType.startsWith('video/') ||
    /\.(mp4|webm|ogg|mov|m4v)$/.test(lowerName);

  const isAudio =
    lowerType.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(lowerName);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
      {/* 1. XEM TRƯỚC ẢNH */}
      {isImage && (
        <div className="relative group w-full flex justify-center">
          <div
            onClick={() => setIsZoomed(true)}
            className="relative cursor-pointer overflow-hidden rounded-xl border border-[#3F4468]/30 bg-white p-1 paper-shadow hover:shadow-md transition-all max-h-64"
          >
            <img
              src={url}
              alt={name}
              className="max-h-60 w-auto object-contain rounded-lg mx-auto"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
              <span className="px-3 py-1 bg-white/90 text-[#3F4468] text-xs font-hand font-bold rounded-lg flex items-center gap-1 sketch-border-sm">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Xem lớn</span>
              </span>
            </div>
          </div>

          {/* Modal phóng to ảnh */}
          {isZoomed && (
            <div
              onClick={() => setIsZoomed(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer animate-fadeIn"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl max-h-[90vh] p-2 bg-white rounded-2xl sketch-border shadow-2xl flex flex-col items-center"
              >
                <button
                  onClick={() => setIsZoomed(false)}
                  className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white text-slate-700 sketch-border hover:bg-slate-100 cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={url}
                  alt={name}
                  className="max-h-[80vh] w-auto object-contain rounded-xl"
                />
                <div className="mt-2 text-xs font-hand font-bold text-[#3F4468] truncate max-w-md">
                  {name} {size ? `(${formatFileSize(size)})` : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. XEM TRƯỚC VIDEO */}
      {isVideo && (
        <div className="w-full rounded-xl overflow-hidden sketch-border-sm bg-black/90 p-1 paper-shadow">
          <video
            src={url}
            controls
            playsInline
            className="w-full max-h-64 rounded-lg object-contain mx-auto"
          />
          <div className="px-2 py-1 flex items-center gap-1.5 text-slate-300 text-[11px] font-sans">
            <Video className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">{name}</span>
          </div>
        </div>
      )}

      {/* 3. XEM TRƯỚC ÂM THANH */}
      {isAudio && (
        <div className="w-full p-3 rounded-xl sketch-border-sm bg-white paper-shadow flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-hand font-bold text-[#3F4468]">
            <Volume2 className="w-4 h-4 text-[#EB5757] animate-pulse" />
            <span className="truncate">{name}</span>
            {size && <span className="text-slate-400 font-sans text-[11px]">({formatFileSize(size)})</span>}
          </div>
          <audio src={url} controls className="w-full h-10 outline-none" />
        </div>
      )}

      {/* 4. TỆP TIN KHÁC (Tài liệu / Nén / Code) */}
      {!isImage && !isVideo && !isAudio && (
        <div className="w-full p-3 rounded-xl sketch-border-sm bg-white/90 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E8F1F8] flex items-center justify-center text-[#3F4468] font-bold sketch-border-sm shrink-0">
            <FileText className="w-5 h-5 text-indigo-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-hand font-bold text-sm truncate text-[#3F4468]">{name}</div>
            <div className="text-[11px] text-slate-400 font-sans">
              {size ? formatFileSize(size) : 'Tập tin'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
