import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

interface ExchangeRates {
  MYR_TO_IDR: number;
  IDR_TO_MYR: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  // Default exchange rate (fallback if API fails)
  // 1 MYR ≈ 3,500 IDR (approximate rate)
  private readonly DEFAULT_MYR_TO_IDR = 3500;

  // Cache duration: 1 hour
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000;

  // Current exchange rates
  private rates$ = new BehaviorSubject<ExchangeRates>({
    MYR_TO_IDR: this.DEFAULT_MYR_TO_IDR,
    IDR_TO_MYR: 1 / this.DEFAULT_MYR_TO_IDR,
    lastUpdated: new Date(),
  });

  // Currency symbols
  readonly CURRENCY = {
    MYR: 'RM',
    IDR: 'Rp',
  };

  constructor(private http: HttpClient) {
    // Try to load cached rates from localStorage
    this.loadCachedRates();
  }

  /**
   * Format price in Malaysian Ringgit (RM)
   */
  formatRM(amount: number): string {
    if (amount === 0) return 'RM 0';
    return `RM ${amount.toLocaleString('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Format price in Indonesian Rupiah (IDR)
   */
  formatIDR(amount: number): string {
    if (amount === 0) return 'Rp 0';
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  }

  /**
   * Convert MYR to IDR
   * Used when sending payment to Midtrans (which only accepts IDR)
   */
  convertMYRToIDR(amountMYR: number): number {
    const rates = this.rates$.value;
    return Math.round(amountMYR * rates.MYR_TO_IDR);
  }

  /**
   * Convert IDR to MYR
   * Used when receiving payment confirmation from Midtrans
   */
  convertIDRToMYR(amountIDR: number): number {
    const rates = this.rates$.value;
    return amountIDR * rates.IDR_TO_MYR;
  }

  /**
   * Get current exchange rate (MYR to IDR)
   */
  getExchangeRate(): number {
    return this.rates$.value.MYR_TO_IDR;
  }

  /**
   * Refresh exchange rates from API
   * Uses free API: exchangerate-api.com or falls back to default
   */
  refreshRates(): Observable<ExchangeRates> {
    // Check if cache is still valid
    const cachedRates = this.rates$.value;
    const cacheAge = Date.now() - cachedRates.lastUpdated.getTime();

    if (cacheAge < this.CACHE_DURATION_MS) {
      return of(cachedRates);
    }

    // Try to fetch new rates
    // Using a free API that doesn't require auth for basic usage
    return this.http.get<any>('https://api.exchangerate-api.com/v4/latest/MYR').pipe(
      map((response) => {
        const idrRate = response.rates?.IDR || this.DEFAULT_MYR_TO_IDR;
        const newRates: ExchangeRates = {
          MYR_TO_IDR: idrRate,
          IDR_TO_MYR: 1 / idrRate,
          lastUpdated: new Date(),
        };
        return newRates;
      }),
      tap((rates) => {
        this.rates$.next(rates);
        this.saveCachedRates(rates);
      }),
      catchError((error) => {
        console.warn('Failed to fetch exchange rates, using cached/default:', error);
        return of(cachedRates);
      })
    );
  }

  /**
   * Load cached rates from localStorage
   */
  private loadCachedRates(): void {
    try {
      const cached = localStorage.getItem('exchange_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();

        // Only use cache if less than 24 hours old
        if (cacheAge < 24 * 60 * 60 * 1000) {
          this.rates$.next({
            MYR_TO_IDR: parsed.MYR_TO_IDR,
            IDR_TO_MYR: parsed.IDR_TO_MYR,
            lastUpdated: new Date(parsed.lastUpdated),
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load cached exchange rates');
    }
  }

  /**
   * Save rates to localStorage for caching
   */
  private saveCachedRates(rates: ExchangeRates): void {
    try {
      localStorage.setItem(
        'exchange_rates',
        JSON.stringify({
          MYR_TO_IDR: rates.MYR_TO_IDR,
          IDR_TO_MYR: rates.IDR_TO_MYR,
          lastUpdated: rates.lastUpdated.toISOString(),
        })
      );
    } catch (e) {
      console.warn('Failed to cache exchange rates');
    }
  }

  /**
   * Get rates observable for components that need to react to changes
   */
  getRates$(): Observable<ExchangeRates> {
    return this.rates$.asObservable();
  }
}
