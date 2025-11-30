import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TicketBuy } from '../../ticket-page/ticket-buy/ticket-buy';
import { Router } from '@angular/router';

interface Seat {
   id: string;
   status: 'available' | 'booked' | 'selected';
}

interface SeatingBlock {
   name: string; // Contoh: 'LF-A', 'VIP', 'B-B'
   rows: number;
   seatsPerRow: number;
   seatsData: Seat[][]; // Data kursi yang sebenarnya
}

@Component({
   selector: 'app-seat-selection',
   imports: [CommonModule],
   templateUrl: './seat-selection.html',
   styleUrl: './seat-selection.css',
})

export class SeatSelection implements OnInit {
   // Definisikan semua blok kursi dengan dimensi baru
   seatingBlocks: SeatingBlock[] = [
      // LOWER FOYER
      { name: 'LF-A', rows: 12, seatsPerRow: 15, seatsData: [] },
      { name: 'VIP', rows: 4, seatsPerRow: 15, seatsData: [] },
      { name: 'LF-B', rows: 8, seatsPerRow: 15, seatsData: [] },
      { name: 'LF-C', rows: 12, seatsPerRow: 15, seatsData: [] },
      // BALCONY
      { name: 'B-A', rows: 5, seatsPerRow: 11, seatsData: [] },
      { name: 'B-B', rows: 5, seatsPerRow: 23, seatsData: [] },
      { name: 'B-C', rows: 5, seatsPerRow: 11, seatsData: [] },
   ];

   constructor(private ticketBuy: TicketBuy, private router: Router) { }

   ngOnInit(): void {
      // Inisialisasi data kursi untuk setiap blok
      this.seatingBlocks.forEach(block => {
         block.seatsData = this.initializeSeats(block.rows, block.seatsPerRow, block.name);
      });

      // Simulasikan beberapa kursi yang sudah di-booked (contoh)
      this.seatingBlocks[0].seatsData[0][0].status = 'booked'; // LF-A, R1, S1
      this.seatingBlocks[1].seatsData[1][7].status = 'booked'; // VIP, R2, S8
   }

   // Fungsi untuk membuat struktur kursi awal
   initializeSeats(numRows: number, seatsPerRow: number, blockName: string): Seat[][] {
      const seats: Seat[][] = [];
      for (let i = 0; i < numRows; i++) {
         const row: Seat[] = [];
         const rowLabel = this.getRowLabel(i); // Ambil label A, B, C...
         for (let j = 0; j < seatsPerRow; j++) {
            row.push({
               id: `${blockName}-${rowLabel}${j + 1}`, // Contoh: LF-A-A1
               status: 'available'
            });
         }
         seats.push(row);
      }
      return seats;
   }

   // Fungsi Toggle yang direvisi untuk bekerja dengan struktur blok
   toggleSeat(blockName: string, rowIndex: number, seatIndex: number): void {
      const block = this.seatingBlocks.find(b => b.name === blockName);
      if (!block) return;

      const seat = block.seatsData[rowIndex][seatIndex];

      if (seat.status === 'booked') {
         return;
      }

      // Toggle status: selected <-> available
      seat.status = (seat.status === 'selected') ? 'available' : 'selected';

      console.log(`Kursi ${seat.id} diubah menjadi ${seat.status}`);
   }

   // Getter: Mendapatkan array semua kursi yang dipilih
   getSelectedSeats(): Seat[] {
      return this.seatingBlocks.flatMap(block =>
         block.seatsData.flat().filter(seat => seat.status === 'selected')
      );
   }

   // Getter: Mengecek apakah ada kursi yang dipilih
   get isAnySeatSelected(): boolean {
      return this.getSelectedSeats().length > 0;
   }

   // Fungsi untuk mendapatkan label baris (A, B, C...)
   getRowLabel(index: number): string {
      return String.fromCharCode(65 + index);
   }

   bookSelectedSeats(): void {
      const selectedSeats = this.getSelectedSeats().map(seat => seat.id);

      // 1. Panggil fungsi checkout di service (mengatur showPaymentModal = true)
      this.ticketBuy.checkoutWithSeats(selectedSeats);

      // 2. NAVIGASI KEMBALI ke halaman TicketBuy
      // ASUMSI: eventId disimpan di service TicketBuy saat di-load
   }
}

