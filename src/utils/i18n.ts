/**
 * Bộ từ điển đa ngôn ngữ (Tiếng Việt & English)
 * Hoàn toàn không dùng emoji ở giao diện người dùng
 */

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Header
    tagline: 'Chuyền file & lời nhắn như gấp máy bay giấy',
    privateBadge: 'Riêng tư & Trực tiếp',
    yourCodeHeader: 'Mã máy của bạn:',
    devicesNearby: 'máy quanh đây',
    soundOn: 'Âm thanh: Bật',
    soundOff: 'Âm thanh: Tắt',
    historyBtn: 'Lịch sử',

    // Trạm kết nối (RadarStation)
    stationTitle: 'MÃ CỦA BẠN ĐỂ NGƯỜI KHÁC KẾT NỐI',
    copyCode: 'Sao chép mã',
    copied: 'Đã chép!',
    scanQRHint: 'Mở camera điện thoại quét mã QR hoặc nhập mã bên cạnh',
    enterCodePlaceholder: 'Nhập mã máy bên cạnh (ví dụ: FLY-88)...',
    connectBtn: 'Kết Nối',
    connecting: 'Đang kết nối...',
    connectedSuccess: 'Đã kết nối thành công với máy {code}!',
    connectError: 'Chưa tìm thấy máy {code}. Bạn hãy mở trang này ở máy bên kia nhé!',
    nearbyTitle: 'Các máy đang mở quanh bạn:',
    nearbyEmpty: 'Chưa thấy máy nào mở gần đây. Hãy mở trang này trên điện thoại hoặc máy tính khác để gửi thử nhé!',
    clickToChoose: 'Bấm để kết nối',

    // Soạn thảo & Gửi (PaperEditor)
    tabNote: 'Viết Lời Nhắn (Chữ, Link)',
    tabFile: 'Gửi Tệp (Ảnh, Video, Tài liệu...)',
    highlighterTitle: 'Bút dạ quang đánh dấu:',
    clearHighlight: 'Bỏ tô',
    notePlaceholder: 'Nhập lời nhắn, link web hoặc nội dung bạn muốn gửi sang máy bên kia...',
    noteCharCount: '{count} ký tự',
    securityHint: 'Không lưu trên mạng • Đóng web là xóa sạch',
    dropFileTitle: 'Kéo thả tệp vào đây',
    dropFileSubtitle: 'Gửi ảnh, video, tài liệu, file nén trực tiếp',
    chooseFileBtn: 'Hoặc bấm để chọn tệp từ máy',
    fileTypeFallback: 'Tập tin',
    removeFile: 'Bỏ chọn',
    foldAndFlyBtn: 'Gấp & Phi Đi',
    foldingMessage: 'Đang gấp cánh máy bay...',
    flyingMessage: 'Máy bay đang phi sang thiết bị bên cạnh...',
    tipNoReceiver: 'Mẹo: Máy bay vẫn sẽ phóng đi và tự động giao ngay khi máy bên kia kết nối!',

    // Nhận thư (ReceivedMailModal)
    planeLanded: 'Máy bay giấy vừa hạ cánh!',
    fromStation: 'Từ bạn: {name}',
    noteContentTitle: 'Nội dung lời nhắn truyền tay:',
    copyTextBtn: 'Sao chép chữ',
    fileReceivedTitle: 'Tệp tin gửi đến:',
    downloadFileBtn: 'Tải Về Máy',
    receivingFile: 'Đang đón tệp: {name}',
    cleanNotice: 'Dữ liệu truyền thẳng giữa 2 máy, không lưu lại trên máy chủ.',

    // Lịch sử (FlightJournal)
    journalTitle: 'Nhật Ký Gửi & Nhận',
    journalEmpty: 'Chưa có chuyến bay nào. Hãy thử viết một mẩu giấy note hoặc chọn một tấm ảnh rồi bấm Gấp & Phi!',
    sentLabel: 'Đã gửi đi',
    receivedLabel: 'Đã nhận về',
    downloadAgain: 'Tải lại',
    journalNotice: 'Nhật ký chỉ lưu trong phiên này và sẽ tự biến mất khi bạn tắt trình duyệt.',
    clearHistoryBtn: 'Xóa lịch sử',

    // Footer
    footerMetaphor: 'Gửi trực tiếp giữa hai máy • Không cần tạo tài khoản • Không lưu trữ dữ liệu',
  },

  en: {
    // Header
    tagline: 'Pass files & notes like paper airplanes',
    privateBadge: 'Direct & Private',
    yourCodeHeader: 'Your code:',
    devicesNearby: 'devices nearby',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Muted',
    historyBtn: 'History',

    // Trạm kết nối (RadarStation)
    stationTitle: 'SHARE THIS CODE TO CONNECT',
    copyCode: 'Copy code',
    copied: 'Copied!',
    scanQRHint: 'Scan QR with phone camera or enter the code',
    enterCodePlaceholder: 'Enter nearby device code (e.g. FLY-88)...',
    connectBtn: 'Connect',
    connecting: 'Connecting...',
    connectedSuccess: 'Connected to device {code}!',
    connectError: 'Could not find device {code}. Make sure it is open on the other device!',
    nearbyTitle: 'Devices open near you:',
    nearbyEmpty: 'No nearby devices found yet. Open paperfly.site on your phone or another laptop to test!',
    clickToChoose: 'Click to connect',

    // Soạn thảo & Gửi (PaperEditor)
    tabNote: 'Quick Note (Text, Links)',
    tabFile: 'Send Files (Photos, Docs, Videos...)',
    highlighterTitle: 'Highlighter pen:',
    clearHighlight: 'Remove color',
    notePlaceholder: 'Type a message, paste a link, or write anything you want to pass over...',
    noteCharCount: '{count} characters',
    securityHint: 'No cloud storage • Disappears when tab closes',
    dropFileTitle: 'Drop your files here',
    dropFileSubtitle: 'Send photos, videos, documents, zip files directly',
    chooseFileBtn: 'Or click to browse from device',
    fileTypeFallback: 'File',
    removeFile: 'Remove',
    foldAndFlyBtn: 'Fold & Fly',
    foldingMessage: 'Folding paper plane...',
    flyingMessage: 'Flying straight to your nearby device...',
    tipNoReceiver: 'Tip: The plane will take off and deliver instantly once connected!',

    // Nhận thư (ReceivedMailModal)
    planeLanded: 'A paper plane just landed!',
    fromStation: 'From: {name}',
    noteContentTitle: 'Passed paper note:',
    copyTextBtn: 'Copy Text',
    fileReceivedTitle: 'Incoming parcel:',
    downloadFileBtn: 'Save to Device',
    receivingFile: 'Catching file: {name}',
    cleanNotice: 'Directly transferred between devices, zero server trace.',

    // Lịch sử (FlightJournal)
    journalTitle: 'Flight History',
    journalEmpty: 'No flights yet. Write a friendly note or drop a photo, then tap Fold & Fly!',
    sentLabel: 'Sent',
    receivedLabel: 'Received',
    downloadAgain: 'Download',
    journalNotice: 'History is temporary and will vanish once you close this tab.',
    clearHistoryBtn: 'Clear history',

    // Footer
    footerMetaphor: 'Direct peer-to-peer transfer • No sign-up required • No cloud storage',
  },
};
