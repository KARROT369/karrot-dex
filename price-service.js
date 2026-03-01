/**
 * KarrotDEX Price Service
 * Fetches live prices and logos from ChangeNow API, CoinGecko, and DEX-specific sources
 * Version: 1.0.0
 */

const PriceService = {
  endpoints: {
    changeNow: 'https://api.changenow.io/v2',
    coinGecko: 'https://api.coingecko.com/api/v3',
    pulseX: 'https://graph.pulsechain.com/subgraphs/name/pulsex/exchange-v2'
  },

  apiKeys: {
    changeNow: localStorage.getItem('changenow_api_key') || null
  },

  dexLogos: {
    'PulseX': {
      logo: 'https://cryptologos.cc/logos/pulsechain-pulse-logo.svg',
      color: '#00ff00',
      chainId: 369,
      website: 'https://pulsex.com'
    },
    '9mm': {
      logo: 'https://assets.coingecko.com/coins/images/31524/small/9mm_token.png',
      color: '#ff007a',
      chainId: 369,
      website: 'https://9mm.exchange'
    },
    'Piteas': {
      logo: 'https://assets.coingecko.com/coins/images/31525/small/piteas.png',
      color: '#f5deb3',
      chainId: 369,
      website: 'https://piteas.io'
    },
    'PulseXV3': {
      logo: 'https://cryptologos.cc/logos/pulsechain-pulse-logo.svg',
      color: '#00ff00',
      chainId: 369,
      website: 'https://pulsex.com'
    },
    'UniswapV3': {
      logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
      color: '#ff007a',
      chainId: 1,
      website: 'https://uniswap.org'
    },
    'SushiSwap': {
      logo: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.svg',
      color: '#fa52a0',
      chainId: 1,
      website: 'https://sushi.com'
    },
    'PancakeSwap': {
      logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg',
      color: '#1fc7d4',
      chainId: 56,
      website: 'https://pancakeswap.finance'
    },
    'PancakeSwapV3': {
      logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg',
      color: '#1fc7d4',
      chainId: 56,
      website: 'https://pancakeswap.finance'
    },
    '1inch': {
      logo: 'https://cryptologos.cc/logos/1inch-1inch-logo.svg',
      color: '#2f8af5',
      chainId: 1,
      website: 'https://1inch.io'
    },
    'Matcha': {
      logo: 'https://assets.coingecko.com/markets/images/677/small/Matcha.png',
      color: '#00cf6f',
      chainId: 1,
      website: 'https://matcha.xyz'
    },
    'THORChain': {
      logo: 'https://cryptologos.cc/logos/thorchain-rune-logo.svg',
      color: '#23dcc8',
      chainId: 0,
      website: 'https://thorchain.org'
    },
    'LibertySwap': {
      logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      color: '#ffffff',
      chainId: 369,
      website: 'https://libertyswap.io'
    },
    'Railgun': {
      logo: 'https://cryptologos.cc/logos/railgun-rail-logo.svg',
      color: '#7a3ce8',
      chainId: 1,
      website: 'https://railgun.org'
    },
    'ProveX': {
      logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      color: '#ff6b6b',
      chainId: 1,
      website: 'https://provex.io'
    },
    'Jupiter': {
      logo: 'https://cryptologos.cc/logos/jupiter-jup-logo.svg',
      color: '#00d4aa',
      chainId: 101,
      website: 'https://jup.ag'
    },
    'Raydium': {
      logo: 'https://cryptologos.cc/logos/raydium-ray-logo.svg',
      color: '#00d4aa',
      chainId: 101,
      website: 'https://raydium.io'
    }
  },

  tokenLogos: new Map(),
  priceCache: new Map(),
  priceCacheExpiry: 30000,

  init() {
    console.log('KarrotDEX Price Service initialized');
    this.preloadLogos();
    this.startPriceUpdates();
  },

  preloadLogos() {
    Object.values(this.dexLogos).forEach(dex => {
      if (dex.logo) {
        const img = new Image();
        img.src = dex.logo;
      }
    });
  },

  getDexInfo(dexKey) {
    return this.dexLogos[dexKey] || {
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
      color: '#ffffff',
      chainId: 1,
      website: '#'
    };
  },

  getTokenLogo(symbol, address) {
    const cacheKey = `${symbol}-${address}`;
    if (this.tokenLogos.has(cacheKey)) {
      return this.tokenLogos.get(cacheKey);
    }

    const coinGeckoIds = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'PLS': 'pulsechain',
      'DAI': 'dai', 'USDC': 'usd-coin', 'USDT': 'tether',
      'UNI': 'uniswap', 'LINK': 'chainlink', 'AAVE': 'aave',
      'SUSHI': 'sushi', 'CRV': 'curve-dao-token', '1INCH': '1inch',
      'MATIC': 'matic-network', 'BNB': 'binancecoin',
      'CAKE': 'pancakeswap-token', 'THOR': 'thorchain',
      'RUNE': 'thorchain', 'SOL': 'solana', 'JUP': 'jupiter-exchange-solana',
      'RAY': 'raydium', 'SNX': 'havven', 'COMP': 'compound',
      'MKR': 'maker', 'YFI': 'yearn-finance', 'RAIL': 'railgun'
    };

    let logoUrl;
    const id = coinGeckoIds[symbol.toUpperCase()];
    
    if (id) {
      logoUrl = `https://cryptologos.cc/logos/${id}-${symbol.toLowerCase()}-logo.png`;
    }

    if (!logoUrl && address) {
      const lowerAddr = address.toLowerCase();
      logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${lowerAddr}/logo.png`;
    }

    if (!logoUrl) {
      logoUrl = `https://ui-avatars.com/api/?name=${symbol}&background=random&color=fff&size=128`;
    }

    this.tokenLogos.set(cacheKey, logoUrl);
    return logoUrl;
  },

  async getChangeNowRate(fromSymbol, toSymbol, amount = 1) {
    try {
      const url = `${this.endpoints.changeNow}/exchange/estimated-amount?fromCurrency=${fromSymbol.toLowerCase()}&toCurrency=${toSymbol.toLowerCase()}&fromAmount=${amount}`;
      
      const headers = {};
      if (this.apiKeys.changeNow) {
        headers['x-changenow-api-key'] = this.apiKeys.changeNow;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`ChangeNow API error: ${response.status}`);
      
      const data = await response.json();
      return {
        estimatedAmount: data.estimatedAmount,
        rate: data.estimatedAmount / amount,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        source: 'changenow',
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('ChangeNow API failed, using fallback:', error.message);
      return this.getFallbackRate(fromSymbol, toSymbol);
    }
  },

  async getFallbackRate(fromSymbol, toSymbol) {
    const coinIds = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'PLS': 'pulsechain',
      'DAI': 'dai', 'USDC': 'usd-coin', 'USDT': 'tether',
      'UNI': 'uniswap', 'LINK': 'chainlink', 'AAVE': 'aave',
      'SUSHI': 'sushi', 'CRV': 'curve-dao-token', '1INCH': '1inch',
      'MATIC': 'matic-network', 'BNB': 'binancecoin', 'CAKE': 'pancakeswap-token',
      'THOR': 'thorchain', 'RUNE': 'thorchain', 'SOL': 'solana',
      'JUP': 'jupiter-exchange-solana', 'RAY': 'raydium'
    };

    const fromId = coinIds[fromSymbol.toUpperCase()];
    const toId = coinIds[toSymbol.toUpperCase()];

    if (!fromId || !toId) {
      return { rate: 1, estimatedAmount: 1, source: 'mock', timestamp: Date.now() };
    }

    try {
      const response = await fetch(
        `${this.endpoints.coinGecko}/simple/price?ids=${fromId},${toId}&vs_currencies=usd`,
        { cache: 'no-cache' }
      );
      
      if (!response.ok) throw new Error('CoinGecko API error');
      
      const data = await response.json();
      const fromUsd = data[fromId]?.usd || 1;
      const toUsd = data[toId]?.usd || 1;
      const rate = fromUsd / toUsd;

      return {
        rate: rate,
        estimatedAmount: rate,
        source: 'coingecko',
        timestamp: Date.now()
      };
    } catch (error) {
      return { rate: 1, estimatedAmount: 1, source: 'error', timestamp: Date.now() };
    }
  },

  async getPrice(pair, fetchFn) {
    const cached = this.priceCache.get(pair);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.priceCacheExpiry) {
      return cached.price;
    }

    try {
      const price = await fetchFn();
      this.priceCache.set(pair, { price, timestamp: now });
      return price;
    } catch (error) {
      console.error(`Failed to get price for ${pair}:`, error);
      return cached?.price || 0;
    }
  },

  formatPrice(price, decimals = 6) {
    if (price === 0) return '--';
    if (price < 0.0001) return price.toExponential(4);
    if (price < 1) return price.toFixed(decimals);
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: decimals 
    });
  },

  calculatePriceImpact(inputAmount, outputAmount, expectedRate) {
    if (!inputAmount || !expectedRate) return 0;
    const expectedOutput = inputAmount * expectedRate;
    const impact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
    return Math.max(0, Math.min(impact, 100));
  },

  startPriceUpdates() {
    setInterval(() => {
      this.priceCache.clear();
    }, this.priceCacheExpiry);
  }
};

window.PriceService = PriceService;
