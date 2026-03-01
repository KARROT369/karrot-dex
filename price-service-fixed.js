/**
 * KarrotDEX Price Service - FIXED VERSION
 * Exports proper function names that match HTML expectations
 */

const PriceService = {
  endpoints: {
    coinGecko: 'https://api.coingecko.com/api/v3',
    pulseXGraph: 'https://graph.pulsechain.com/subgraphs/name/pulsex/exchange-v2'
  },

  coinGeckoIds: {
    'ETH': 'ethereum', 'WETH': 'weth', 'USDC': 'usd-coin', 'USDT': 'tether',
    'DAI': 'dai', 'BTC': 'bitcoin', 'WBTC': 'wrapped-bitcoin',
    'PLS': 'pulsechain', 'WPLS': 'pulsechain', 'KARROT': 'pulsechain',
    'HEX': 'hex', 'BNB': 'binancecoin', 'SOL': 'solana',
    'MATIC': 'matic-network', 'UNI': 'uniswap', 'LINK': 'chainlink',
    'AAVE': 'aave', 'SNX': 'havven', 'COMP': 'compound-governance-token',
    'MKR': 'maker', 'CAKE': 'pancakeswap-token', 'RUNE': 'thorchain'
  },

  // This is the function the HTML calls
  async getChangeNowRate(fromSymbol, toSymbol, amount = 1) {
    // Fallback to CoinGecko since ChangeNow requires API key
    return this.getCoinGeckoRate(fromSymbol, toSymbol, amount);
  },

  // Main price fetcher
  async getRate(fromSymbol, toSymbol, amount = 1) {
    return this.getCoinGeckoRate(fromSymbol, toSymbol, amount);
  },

  async getCoinGeckoRate(fromSymbol, toSymbol, amount) {
    const fromId = this.coinGeckoIds[fromSymbol.toUpperCase()];
    const toId = this.coinGeckoIds[toSymbol.toUpperCase()];

    if (!fromId || !toId) {
      return { 
        rate: this.getMockRate(fromSymbol, toSymbol), 
        estimatedAmount: this.getMockRate(fromSymbol, toSymbol) * amount,
        source: 'mock', 
        timestamp: Date.now() 
      };
    }

    try {
      const response = await fetch(
        `${this.endpoints.coinGecko}/simple/price?ids=${fromId},${toId}&vs_currencies=usd`,
        { cache: 'no-cache' }
      );

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const fromUsd = data[fromId]?.usd || 1;
      const toUsd = data[toId]?.usd || 1;
      const rate = fromUsd / toUsd;

      return {
        rate: rate,
        estimatedAmount: rate * amount,
        fromUsd,
        toUsd,
        source: 'CoinGecko',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Price fetch error:', error);
      const mockRate = this.getMockRate(fromSymbol, toSymbol);
      return { 
        rate: mockRate, 
        estimatedAmount: mockRate * amount,
        source: 'error-fallback', 
        timestamp: Date.now() 
      };
    }
  },

  getMockRate(from, to) {
    const rates = {
      'ETH-USDC': 3450.50, 'ETH-USDT': 3450.50, 'ETH-DAI': 3450.50,
      'BTC-ETH': 18.25, 'BTC-USDC': 63250, 'PLS-ETH': 0.00005,
      'PLS-USDC': 0.0001, 'HEX-PLS': 0.0001, 'HEX-USDC': 0.05,
      'KARROT-PLS': 0.01, 'RH-PLS': 0.001, 'BNB-USDC': 580,
      'SOL-USDC': 145, 'MATIC-USDC': 0.45, 'UNI-USDC': 8.50,
      'LINK-USDC': 15.20, 'AAVE-USDC': 95.50
    };
    
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    
    if (rates[key]) return rates[key];
    if (rates[reverseKey]) return 1 / rates[reverseKey];
    return 1;
  },

  init() {
    console.log('PriceService initialized');
  }
};

window.PriceService = PriceService;
