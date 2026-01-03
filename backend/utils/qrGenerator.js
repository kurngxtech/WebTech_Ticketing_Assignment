// QR Code Generator Utility

const QRCode = require('qrcode');

// Generate QR code data string for booking
const generateQRData = (booking, event) => {
  const data = {
    bookingId: booking._id.toString(),
    eventId: event._id.toString(),
    ticketCategoryId: booking.ticketCategoryId,
    quantity: booking.quantity,
    date: event.date,
    timestamp: Date.now(),
  };

  return `EMS|${data.bookingId}|${data.eventId}|${data.ticketCategoryId}|${data.quantity}|${data.date}`;
};

// Generate QR code as data URL (base64 image)
const generateQRCodeDataURL = async (data) => {
  try {
    const options = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    };

    return await QRCode.toDataURL(data, options);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Validate and parse QR code data
const parseQRData = (qrData) => {
  try {
    const parts = qrData.split('|');

    if (parts.length < 5 || parts[0] !== 'EMS') {
      return null;
    }

    return {
      bookingId: parts[1],
      eventId: parts[2],
      ticketCategoryId: parts[3],
      quantity: parseInt(parts[4]),
      date: parts[5] || null,
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateQRData,
  generateQRCodeDataURL,
  parseQRData,
};
