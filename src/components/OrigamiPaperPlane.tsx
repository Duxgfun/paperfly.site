/**
 * Thành phần Máy bay Giấy (Paper Plane) mô phỏng chính xác từ Logo Hand-drawn
 * Hỗ trợ các trạng thái: Đứng yên, Gấp cánh, Bay vút và Hạ cánh
 */

import React from 'react';

interface OrigamiPaperPlaneProps {
  className?: string;
  size?: number;
  status?: 'idle' | 'folding' | 'flying' | 'landing';
  showTrail?: boolean;
}

export const OrigamiPaperPlane: React.FC<OrigamiPaperPlaneProps> = ({
  className = '',
  size = 120,
  status = 'idle',
  showTrail = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-700 ${className} ${
        status === 'flying' ? 'animate-bounce' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Vệt gió / Nét bút chì bay vút khi đang bay */}
      {showTrail && (
        <div className="absolute -left-12 bottom-2 pointer-events-none opacity-60">
          <svg width="80" height="30" viewBox="0 0 80 30" fill="none">
            <path
              d="M0 15 C 20 18, 40 8, 75 14"
              stroke="#3F4468"
              strokeWidth="2"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
            <path
              d="M10 24 C 30 26, 50 20, 70 23"
              stroke="#3F4468"
              strokeWidth="1.5"
              strokeDasharray="3 5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Vector máy bay vẽ tay tái hiện nguyên bản từ Logo của paperfly.site */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md select-none transform transition-transform duration-500 hover:rotate-3"
      >
        {/* Thân gấp bên dưới (Màu xanh băng Ice Blue bóng mờ) */}
        <path
          d="M205 380 L315 400 L305 285 Z"
          fill="#C8DCED"
          stroke="#3F4468"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Cánh phải mở rộng */}
        <path
          d="M50 100 L445 235 L305 285 L185 340 Z"
          fill="#FFFFFF"
          stroke="#3F4468"
          strokeWidth="12"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Mảng màu xanh băng trang trí trên cánh (như logo) */}
        <path
          d="M110 205 C 130 300, 150 320, 185 340 L 305 285 C 270 240, 200 200, 110 205 Z"
          fill="#E8F1F8"
          opacity="0.95"
        />

        {/* Cánh gập trái (Mảng màu xanh băng tạo chiều sâu 3D) */}
        <path
          d="M50 100 L305 285 L350 400 Z"
          fill="#D6E7F4"
          stroke="#3F4468"
          strokeWidth="11"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Sống lưng giữa thân máy bay */}
        <path
          d="M50 100 L305 285"
          stroke="#3F4468"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Dòng chữ viết tay "paperfly.site" trên cánh máy bay */}
        <g transform="translate(145, 120) rotate(22)">
          <text
            x="0"
            y="0"
            fill="#3F4468"
            fontFamily="'Patrick Hand', 'Gaegu', cursive"
            fontSize="26"
            fontWeight="bold"
            letterSpacing="1px"
          >
            paperfly.site
          </text>
        </g>
      </svg>
    </div>
  );
};
