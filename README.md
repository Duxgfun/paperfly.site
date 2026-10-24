# paperfly.site - Fold. Fly. Share.

> Fold your files and notes into digital paper airplanes and fly them across the web to anyone, anywhere. Direct, private, and zero permanent cloud footprint.

![Paperfly Banner](/public/og-image.png)

🔗 **Live App:** [https://paperflysite.vercel.app/](https://paperflysite.vercel.app/)

---

## Key Highlights

- **Universal Delivery (No AirDrop Limits):** Send to anyone across the country or worldwide. Works seamlessly over 4G/5G mobile networks, different Wi-Fi networks, and even if you close the tab or switch apps.
- **Instant Code & QR Pickup:** Compose a note or drop a file, tap "Fold & Fly", and get a 4-6 character pickup code plus a 16x16 QR stamp. The recipient opens the web, enters the code or scans the QR, and the letter unfolds immediately.
- **In-Browser Media Preview:** Built-in viewer for images (PNG, JPG, WEBP, GIF, SVG), video player for MP4/WEBM, and audio player for MP3/WAV/M4A before and after downloading.
- **Procedural Paper ASMR:** Authentic paper rustling, wind swooshes, and wax seal thuds synthesized in real-time via the Web Audio API with zero external audio assets.
- **Skeuomorphic Stationery Design:** School graph paper canvas, yellow sticky notes with highlighter markers, vintage kraft parcels, and wax seal action buttons.
- **Bilingual Support (EN / VI):** Toggle between English and Vietnamese with warm, friendly, non-technical language.
- **Zero-Cloud Retention:** Data transfers directly and temporary packages automatically self-destruct after delivery.

---

## Color Palette & Design Tokens

- **Indigo Pencil (`#3F4468`):** Sketch line art, text, and original paper plane contours.
- **Ice Blue Paper (`#E8F1F8`):** Aerodynamic wing highlights and parcel tags.
- **Yellow Sticky Note (`#FFF3B2`):** Traditional sticky memo paper for text and links.
- **Kraft Paper (`#F5EBE0`):** Vintage parcel texture for files and attachments.
- **Graph Paper Grid (`#FAFAFA`):** Classroom exercise book background grid.
- **Stamp Red (`#EB5757`):** Postal wax seal accent for primary actions.

---

## Quick Start & Local Development

### 1. Run Development Server

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### 2. Build & Production Run

```bash
# Type-check and build production bundle (dist/)
npm run build

# Start the standalone Node.js production server
npm start
```

### 3. Deploy via Docker

```bash
# Build Docker image
docker build -t paperfly.site .

# Run container on port 3000
docker run -d -p 3000:3000 --name paperfly paperfly.site
```

### 4. Deploy to Vercel / Netlify

This project is pre-configured with [`vercel.json`](vercel.json) and [`public/_redirects`](public/_redirects):
1. Import repository into [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`, Output Directory: `dist`.
4. Deploy!
