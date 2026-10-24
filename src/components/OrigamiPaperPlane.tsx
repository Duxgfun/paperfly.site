/**
 * Thành phần hiển thị Máy bay Giấy (Paper Plane)
 * Sử dụng trực tiếp ảnh logo gốc (logo.png) tự nhiên, không bo tròn, không vẽ thêm nét thừa
 */

import React from 'react';

interface OrigamiPaperPlaneProps {
  className?: string;
  size?: number;
  status?: 'idle' | 'folding' | 'flying' | 'landing';
}

export const OrigamiPaperPlane: React.FC<OrigamiPaperPlaneProps> = ({
  className = '',
  size = 120,
  status = 'idle',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-500 ${className} ${
        status === 'flying' ? 'animate-bounce' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt="Paperfly"
        style={{ width: size, height: size }}
        className="object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300 hover:rotate-3"
      />
    </div>
  );
};
