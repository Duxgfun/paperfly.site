/**
 * Máy chủ Production cho paperfly.site
 * - Phục vụ tĩnh thư mục dist (HTML/CSS/JS)
 * - Tích hợp sẵn WebRTC PeerServer tại đường dẫn /peerjs
 * - Hỗ trợ SPA Routing fallback
 */

import express from 'express';
import { ExpressPeerServer } from 'peer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ các tệp tĩnh đã build từ thư mục dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Endpoint kiểm tra trạng thái sức khỏe máy chủ
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'paperfly.site',
    timestamp: new Date().toISOString(),
  });
});

// Khởi động HTTP Server
const server = app.listen(PORT, () => {
  console.log(`[Paperfly Production Server] Đang chạy tại cổng http://localhost:${PORT}`);
});

// Khởi tạo WebRTC PeerServer trên cùng cổng HTTP tại đường dẫn /peerjs
const peerServer = ExpressPeerServer(server, {
  debug: false,
  path: '/',
  allow_discovery: true,
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`[PeerServer] Thiết bị kết nối: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[PeerServer] Thiết bị ngắt kết nối: ${client.getId()}`);
});

// SPA Routing: Điều hướng tất cả các route khác về index.html
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
