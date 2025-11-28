import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';

@Component({
   selector: 'app-faq',
   imports: [],
   templateUrl: './faq.html',
   styleUrl: './faq.css',
})
export class Faq {
   isDropdownOpen = false;
   constructor(private scroller: ViewportScroller) { }

   scrollToFooter(): void {
      this.scroller.scrollToAnchor('page-footer');
   }
}
