# ✈️ paperfly.site - P2P Direct Paper Plane File & Text Transfer

> **Metaphor:** Bàn làm việc học sinh bằng giấy. Mỗi file/ảnh hay đoạn ghi chú là một tờ giấy vật lý được gấp thành máy bay và phi trực tiếp sang thiết bị đối diện qua WebRTC (Không lưu đám mây / Zero-Cloud).

![Paperfly Logo](/public/logo.png)

## 🎨 Hệ Thống Design Tokens & Visual Style

- **Indigo Pencil (`#3F4468`):** Nét vẽ chì/bút dạ than, màu chữ và viền logo.
- **Ice Blue Paper (`#E8F1F8`):** Màu mảng cánh máy bay, thẻ bưu kiện thư.
- **Yellow Sticky Note (`#FFF3B2`):** Màu giấy ghi chú truyền thống cho văn bản/link.
- **Kraft Paper (`#F5EBE0`):** Giấy xi măng cổ điển bọc gói bưu phẩm/tập tin.
- **Background Grid (`#FAFAFA`):** Nền giấy kẻ ô ly học sinh.
- **Stamp Red (`#EB5757`):** Màu con dấu niêm phong sáp đỏ cho nút hành động.

## 🚀 Tính Năng Nổi Bật

- **Không dùng emoji ở giao diện:** Sử dụng toàn bộ biểu tượng vector sắc nét từ Lucide và typography vẽ tay mộc mạc.
- **Song ngữ hoàn chỉnh:** Tiếng Việt và Tiếng Anh với ngôn từ thân thiện cho người dùng phổ thông.
- **Con dấu QR 16x16:** Nằm ngay trên tem thư, quét được tức thì từ camera điện thoại.
- **Âm thanh ASMR giấy thủ công:** Tổng hợp trực tiếp qua Web Audio API (sột soạt, gió lướt, cộp con dấu).
- **Sẵn sàng Production:** Tích hợp máy chủ Node.js phục vụ file tĩnh và PeerServer WebRTC.

---

## 🛠️ Hướng Dẫn Vận Hành & Triển Khai (Deployment)

### 1. Chạy Máy Chủ Sản Phẩm (Production Server)

```bash
# Cài đặt thư viện
npm install

# Biên dịch gói sản phẩm tối ưu (dist/)
npm run build

# Khởi chạy máy chủ Production (Cổng mặc định: 3000)
npm start
```
*Máy chủ Node.js sẽ phục vụ toàn bộ tệp tĩnh và tích hợp sẵn WebRTC PeerServer tại `/peerjs`.*

---

### 2. Triển khai bằng Docker

```bash
# Đóng gói Docker Image
docker build -t paperfly.site .

# Chạy Container trên cổng 3000
docker run -d -p 3000:3000 --name paperfly paperfly.site
```

---

### 3. Triển khai lên Vercel / Netlify / Cloudflare Pages

Dự án đã được cấu hình sẵn các tệp chuyển hướng:
- [`vercel.json`](file:///c:/Users/zippo/Documents/project/paperfly.site/vercel.json) cho Vercel.
- [`public/_redirects`](file:///c:/Users/zippo/Documents/project/paperfly.site/public/_redirects) cho Netlify / Cloudflare Pages.

Chỉ cần kết nối repository vào Vercel hoặc Netlify, hệ thống sẽ tự động chạy lệnh `npm run build` và đưa trang web lên hoạt động ngay lập tức!
