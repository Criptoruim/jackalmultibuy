interface CoinGeckoResponse {
  'jackal-protocol': {
    usd: number;
  };
}

class PriceService {
  private static instance: PriceService;
  private lastPrice: number = 0.083; // Default fallback price
  private lastUpdate: number = 0;
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly UPDATE_INTERVAL = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  private validatePrice(newPrice: number): boolean {
    if (this.lastPrice === 0) return true;
    
    // Allow 50% price movement in either direction
    const maxChange = 0.5;
    const priceChange = Math.abs(newPrice - this.lastPrice) / this.lastPrice;
    
    if (priceChange > maxChange) {
      return false;
    }
    return true;
  }

  async getPrice(): Promise<number> {
    const now = Date.now();
    // Only fetch new price if enough time has passed
    if (!this.lastUpdate || now - this.lastUpdate > this.UPDATE_INTERVAL) {
      try {
        // Query CoinGecko API
        const response = await fetch(
          `${this.COINGECKO_API}/simple/price?ids=jackal-protocol&vs_currencies=usd`
        );
        const data: CoinGeckoResponse = await response.json();
        
        const newPrice = data['jackal-protocol'].usd;
        if (isNaN(newPrice) || newPrice <= 0) {
          throw new Error(`Invalid price from CoinGecko: ${newPrice}`);
        }

        if (this.validatePrice(newPrice)) {
          this.lastPrice = newPrice;
        } else {
          console.warn('Received suspicious price:', newPrice);
        }

        this.lastUpdate = now;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to fetch JKL price:', errorMessage);
        // Fallback to last known price
      }
    }

    return this.lastPrice;
  }

  async forceUpdate(): Promise<number> {
    this.lastUpdate = 0; // Reset last update to force a new fetch
    return this.getPrice();
  }
}

export const priceService = PriceService.getInstance();
