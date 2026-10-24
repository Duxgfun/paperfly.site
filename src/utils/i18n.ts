/**
 * Bộ từ điển đa ngôn ngữ (Tiếng Việt & English)
 * Quy trình mới: Viết/chọn file -> Bấm Gửi -> Ra Mã & QR -> Người kia nhập mã/quét QR -> Nhận nội dung
 */

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Header
    tagline: 'Fold. Fly. Share.',
    soundOn: 'Âm thanh: Bật',
    soundOff: 'Âm thanh: Tắt',
    historyBtn: 'Lịch sử',

    // Chế độ Gửi vs Nhận
    tabSend: 'Gấp & Gửi Thư',
    tabReceive: 'Nhận Thư Bằng Mã',

    // Soạn thảo & Gửi
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
    flyingMessage: 'Máy bay đã sẵn sàng cất cánh!',

    // Thẻ Mã & QR sau khi gửi
    stampReadyTitle: 'MÃ NHẬN THƯ CỦA BẠN',
    stampSubtitle: 'Đưa mã này hoặc cho máy kia quét QR để nhận nội dung ngay',
    copyCode: 'Sao chép mã',
    copyLink: 'Sao chép link',
    copied: 'Đã sao chép!',
    scanQRHint: 'Bấm vào để phóng to mã QR',
    waitingReceiver: 'Đang đợi máy bên kia nhập mã hoặc quét QR...',
    delivering: 'Đang bay sang máy bên kia...',
    sentSuccess: 'Đã giao thư thành công!',
    sendAnotherBtn: 'Gửi bức thư khác',

    // Khu vực Nhận thư
    receiveTitle: 'NHẬN THƯ MÁY BAY GIẤY',
    receiveSubtitle: 'Nhập mã gồm chữ và số được người gửi chia sẻ',
    enterCodePlaceholder: 'Nhập mã nhận thư (ví dụ: FLY-382)...',
    openMailBtn: 'Mở Thư Ngay',
    receivingStatus: 'Đang tìm máy bay và tải nội dung...',
    codeNotFound: 'Chưa tìm thấy bức thư với mã {code}. Hãy chắc chắn máy gửi vẫn đang mở trang web nhé!',

    // Nhận thư thành công (Modal)
    planeLanded: 'Máy bay giấy vừa hạ cánh!',
    fromStation: 'Nội dung nhận được:',
    noteContentTitle: 'Lời nhắn gửi đến:',
    copyTextBtn: 'Sao chép chữ',
    fileReceivedTitle: 'Tệp tin gửi đến:',
    downloadFileBtn: 'Tải Về Máy',
    receivingFile: 'Đang đón tệp: {name}',
    cleanNotice: 'Dữ liệu truyền thẳng giữa 2 máy, không lưu lại trên máy chủ.',

    // Lịch sử
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
    tagline: 'Fold. Fly. Share.',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Muted',
    historyBtn: 'History',

    // Chế độ Gửi vs Nhận
    tabSend: 'Fold & Send',
    tabReceive: 'Receive with Code',

    // Soạn thảo & Gửi
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
    flyingMessage: 'Plane is ready for take-off!',

    // Thẻ Mã & QR sau khi gửi
    stampReadyTitle: 'YOUR PICKUP CODE',
    stampSubtitle: 'Share this code or let the other device scan the QR code to receive',
    copyCode: 'Copy code',
    copyLink: 'Copy link',
    copied: 'Copied!',
    scanQRHint: 'Click to enlarge QR code',
    waitingReceiver: 'Waiting for the other device to enter code or scan QR...',
    delivering: 'Flying over to the other device...',
    sentSuccess: 'Delivered successfully!',
    sendAnotherBtn: 'Send another note',

    // Khu vực Nhận thư
    receiveTitle: 'CATCH A PAPER PLANE',
    receiveSubtitle: 'Enter the code shared by the sender',
    enterCodePlaceholder: 'Enter code (e.g. FLY-382)...',
    openMailBtn: 'Open Letter',
    receivingStatus: 'Locating paper plane and loading content...',
    codeNotFound: 'No letter found with code {code}. Make sure the sender still has the tab open!',

    // Nhận thư thành công (Modal)
    planeLanded: 'A paper plane just landed!',
    fromStation: 'Received content:',
    noteContentTitle: 'Passed paper note:',
    copyTextBtn: 'Copy Text',
    fileReceivedTitle: 'Incoming parcel:',
    downloadFileBtn: 'Save to Device',
    receivingFile: 'Catching file: {name}',
    cleanNotice: 'Directly transferred between devices, zero server trace.',

    // Lịch sử
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
