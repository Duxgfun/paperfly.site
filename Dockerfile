# ==========================================
# Giai đoạn 1: Biên dịch mã nguồn (Build Stage)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm ci

# Sao chép mã nguồn và biên dịch Vite sang thư mục dist
COPY . .
RUN npm run build

# ==========================================
# Giai đoạn 2: Máy chủ Production (Runner Stage)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Chỉ cài dependencies phục vụ production
COPY package*.json ./
RUN npm ci --omit=dev

# Lấy các file đã build và server.js
COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
