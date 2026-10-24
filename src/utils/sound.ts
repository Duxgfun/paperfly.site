/**
 * Module Âm thanh Giấy Thủ công (Paper ASMR via Web Audio API)
 * Tổng hợp âm thanh trực tiếp trong trình duyệt, không cần tải file MP3
 */

class PaperSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Không khởi tạo AudioContext ngay để tuân thủ chính sách Autoplay của trình duyệt
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Tạo tiếng sột soạt của giấy khi kéo thả file hoặc gõ chữ
   */
  public playPaperRustle() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 0.15; // 150ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Tạo tiếng ồn trắng (White noise)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bộ lọc dải thông (Bandpass filter) để giả lập tần số sột soạt của giấy
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Không thể phát âm thanh sột soạt:', e);
    }
  }

  /**
   * Tạo tiếng gió lướt vút (Whoosh) khi máy bay giấy phóng đi hoặc hạ cánh
   */
  public playWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const duration = 0.55;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Tiếng ồn màu hồng mượt mà
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.1425880;
        b2 = 0.57000 * b2 + white * 0.5559020;
        data[i] = (b0 + b1 + b2 + white * 0.1) * 0.25;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Quét tần số bộ lọc từ trầm lên bổng rồi hạ xuống (mô phỏng Doppler lướt qua)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Không thể phát âm thanh gió:', e);
    }
  }

  /**
   * Tạo tiếng đóng dấu sáp / cộp con dấu bưu điện khi kết nối
   */
  public playStampThud() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Trượt tần số nhanh giả lập độ nẩy của con dấu gỗ đập lên mặt bàn
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      console.warn('Không thể phát âm thanh con dấu:', e);
    }
  }

  /**
   * Tạo tiếng bóc phong bì / bung giấy note khi nhận thành công
   */
  public playUnfoldPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch (e) {
      console.warn('Không thể phát âm thanh mở thư:', e);
    }
  }
}

export const paperSound = new PaperSoundManager();
