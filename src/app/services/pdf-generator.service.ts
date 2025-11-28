import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as QRCode from 'qrcode';

@Injectable({
   providedIn: 'root'
})
export class PdfGeneratorService {
   constructor() { }

   /**
    * Generate PDF with QR code for booking ticket
    * @param bookingId - Booking ID
    * @param qrCodeData - QR Code data string
    * @param eventTitle - Event title
    * @param ticketType - Ticket type
    * @param quantity - Number of tickets
    * @param totalPrice - Total price
    * @param eventDate - Event date
    * @param userName - User's name
    */
   async generateTicketPDF(
      bookingId: string,
      qrCodeData: string,
      eventTitle: string,
      ticketType: string,
      quantity: number,
      totalPrice: number,
      eventDate: string,
      userName: string
   ): Promise<void> {
      try {
         // Generate QR code image
         const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
            width: 200,
            margin: 2,
            color: {
               dark: '#000000',
               light: '#ffffff'
            }
         });

         // Create PDF
         const pdf = new jsPDF('portrait', 'mm', 'a4');
         const pageWidth = pdf.internal.pageSize.getWidth();
         const pageHeight = pdf.internal.pageSize.getHeight();

         // Colors
         const primaryColor: [number, number, number] = [254, 183, 6]; // #feb706 (yellow)
         const darkColor: [number, number, number] = [15, 15, 15]; // #0f0f0f (dark)
         const lightGray: [number, number, number] = [245, 245, 245]; // Light gray background
         const borderColor: [number, number, number] = [200, 200, 200]; // Border gray

         let yPosition = 10;

         // Header background
         pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
         pdf.rect(0, 0, pageWidth, 30, 'F');

         // Title
         pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
         pdf.setFont('Helvetica', 'bold');
         pdf.setFontSize(24);
         pdf.text('BOOKING TICKET', pageWidth / 2, 20, { align: 'center' });

         yPosition = 40;

         // Booking Info Section
         pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
         pdf.rect(10, yPosition, pageWidth - 20, 50, 'F');

         pdf.setFont('Helvetica', 'normal');
         pdf.setFontSize(11);
         pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

         const infoMargin = 15;
         const lineHeight = 10;

         pdf.text(`Booking ID: ${bookingId}`, infoMargin, yPosition + 8);
         pdf.text(`Customer: ${userName}`, infoMargin, yPosition + 18);
         pdf.text(`Event: ${eventTitle}`, infoMargin, yPosition + 28);
         pdf.text(`Date: ${eventDate}`, infoMargin, yPosition + 38);
         pdf.text(`Ticket Type: ${ticketType}`, pageWidth / 2, yPosition + 8);
         pdf.text(`Quantity: ${quantity}`, pageWidth / 2, yPosition + 18);
         pdf.text(`Total Price: IDR ${totalPrice.toLocaleString('id-ID')}`, pageWidth / 2, yPosition + 28);

         yPosition += 60;

         // QR Code Section with border
         const qrSize = 90;
         const qrMarginLeft = (pageWidth - qrSize) / 2;

         // QR Code border
         pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
         pdf.setLineWidth(1);
         pdf.rect(qrMarginLeft - 5, yPosition - 5, qrSize + 10, qrSize + 10);

         // Add QR code image
         pdf.addImage(qrCodeImage, 'PNG', qrMarginLeft, yPosition, qrSize, qrSize);

         yPosition += qrSize + 15;

         // QR Code Data Section
         pdf.setFont('Helvetica', 'normal');
         pdf.setFontSize(9);
         pdf.setTextColor(100, 100, 100);

         const qrDataX = 15;
         const qrDataMaxWidth = pageWidth - 30;
         const qrDataLines = pdf.splitTextToSize(`QR Code Data: ${qrCodeData}`, qrDataMaxWidth);

         pdf.text('QR Code Data:', qrDataX, yPosition);
         pdf.setFont('Courier', 'normal');
         pdf.setFontSize(8);
         pdf.text(qrDataLines, qrDataX, yPosition + 5);

         yPosition = pageHeight - 30;

         // Footer
         pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
         pdf.setLineWidth(0.5);
         pdf.line(10, yPosition, pageWidth - 10, yPosition);

         pdf.setFont('Helvetica', 'normal');
         pdf.setFontSize(9);
         pdf.setTextColor(100, 100, 100);
         pdf.text('Please save this ticket and show the QR code for check-in', pageWidth / 2, yPosition + 10, { align: 'center' });
         pdf.text(`Generated: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, yPosition + 20, { align: 'center' });

         // Save PDF
         pdf.save(`ticket_${bookingId}.pdf`);
      } catch (error) {
         console.error('Error generating PDF:', error);
         throw error;
      }
   }

   /**
    * Generate combined PDF for multiple bookings
    * @param bookings - Array of booking details
    */
   async generateMultipleTicketsPDF(
      bookings: Array<{
         bookingId: string;
         qrCodeData: string;
         eventTitle: string;
         ticketType: string;
         quantity: number;
         totalPrice: number;
         eventDate: string;
         userName: string;
      }>
   ): Promise<void> {
      try {
         const pdf = new jsPDF('portrait', 'mm', 'a4');
         const pageWidth = pdf.internal.pageSize.getWidth();

         // Colors
         const primaryColor: [number, number, number] = [254, 183, 6];
         const darkColor: [number, number, number] = [15, 15, 15];
         const lightGray: [number, number, number] = [245, 245, 245];
         const borderColor: [number, number, number] = [200, 200, 200];

         for (let bookingIndex = 0; bookingIndex < bookings.length; bookingIndex++) {
            if (bookingIndex > 0) {
               pdf.addPage();
            }

            const booking = bookings[bookingIndex];
            const qrCodeImage = await QRCode.toDataURL(booking.qrCodeData, {
               width: 200,
               margin: 2,
               color: { dark: '#000000', light: '#ffffff' }
            });

            let yPosition = 10;

            // Header
            pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            pdf.rect(0, 0, pageWidth, 25, 'F');
            pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            pdf.setFont('Helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.text('BOOKING TICKET', pageWidth / 2, 16, { align: 'center' });

            yPosition = 35;

            // Booking Info
            pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            pdf.rect(10, yPosition, pageWidth - 20, 40, 'F');

            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

            const infoMargin = 15;
            pdf.text(`Booking: ${booking.bookingId} | Event: ${booking.eventTitle}`, infoMargin, yPosition + 8);
            pdf.text(`Type: ${booking.ticketType} | Qty: ${booking.quantity} | Date: ${booking.eventDate}`, infoMargin, yPosition + 18);
            pdf.text(`Total: IDR ${booking.totalPrice.toLocaleString('id-ID')}`, infoMargin, yPosition + 28);

            yPosition += 50;

            // QR Code
            const qrSize = 70;
            const qrMarginLeft = (pageWidth - qrSize) / 2;
            pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            pdf.setLineWidth(1);
            pdf.rect(qrMarginLeft - 5, yPosition - 5, qrSize + 10, qrSize + 10);
            pdf.addImage(qrCodeImage, 'PNG', qrMarginLeft, yPosition, qrSize, qrSize);

            yPosition += qrSize + 10;

            // QR Data
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`QR: ${booking.qrCodeData}`, pageWidth / 2, yPosition, { align: 'center' });

            // Footer
            yPosition = pdf.internal.pageSize.getHeight() - 15;
            pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            pdf.setLineWidth(0.5);
            pdf.line(10, yPosition - 5, pageWidth - 10, yPosition - 5);
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Show QR code for check-in', pageWidth / 2, yPosition, { align: 'center' });
         }

         pdf.save(`all_bookings_${new Date().getTime()}.pdf`);
      } catch (error) {
         console.error('Error generating multiple PDFs:', error);
         throw error;
      }
   }

   /**
    * Generate simple QR code image
    */
   async generateQRCodeImage(data: string, size: number = 200): Promise<string> {
      return QRCode.toDataURL(data, {
         width: size,
         margin: 2,
         color: {
            dark: '#000000',
            light: '#ffffff'
         }
      });
   }
}
