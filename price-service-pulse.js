/**
 * KarrotDEX Price Service - Enhanced with PulseX Integration
 * Fetches live prices from CoinGecko, PulseX API, and DEX sources
 */

const PriceService = {
  endpoints: {
    coinGecko: 'https://api.coingecko.com/api/v3',
    pulseXGraph: 'https://graph.pulsechain.com/subgraphs/name/pulsex/exchange-v2',
    pulseXPriceAPI: 'https://api.pulsex.com/v2',
    dexScreener: 'https://api.dexscreener.com/latest/dex'
  },

  // PulseChain Token Addresses (on PulseChain network)
  pulseTokens: {
    'PLS': { address: '0xA1077f46E208B464E552Da6343fa9a68d2884589', decimals: 18, isNative: true },
    'WPLS': { address: '0xA1077f46E208B464E552Da6343fa9a68d2884589', decimals: 18 },
    'KARROT': { address: '0x6910076Eee8F4b6ea251B7cCa1052dd744Fc04DA', decimals: 18 },
    'RH': { address: '0xDB75a19203a65Ba93c1baaac777d229bf08452Da', decimals: 18, name: 'Rabbit Hole' },
    'DAI': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }, // DAI on Pulse
    'PULSEDAI': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    'HEX': { address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', decimals: 8 },
    'INC': { address: '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d', decimals: 18 },
    'PLSX': { address: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab', decimals: 18 },
    'eHEX': { address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', decimals: 8 },
    'pWBTC': { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    'pETH': { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 }
  },

  // CoinGecko IDs for cross-chain tokens
  coinGeckoIds: {
    'ETH': 'ethereum', 'WETH': 'weth', 'BTC': 'bitcoin', 'WBTC': 'wrapped-bitcoin',
    'USDC': 'usd-coin', 'USDT': 'tether', 'DAI': 'dai',
    'UNI': 'uniswap', 'LINK': 'chainlink', 'AAVE': 'aave',
    'SUSHI': 'sushi', 'CRV': 'curve-dao-token', '1INCH': '1inch',
    'MATIC': 'matic-network', 'BNB': 'binancecoin', 'CAKE': 'pancakeswap-token',
    'THOR': 'thorchain', 'RUNE': 'thorchain', 'SOL': 'solana',
    'JUP': 'jupiter-exchange-solana', 'RAY': 'raydium',
    'PLS': 'pulsechain', 'HEX': 'hex', 'PLSX': 'pulsex',
    'SNX': 'havven', 'COMP': 'compound-governance-token',
    'MKR': 'maker', 'YFI': 'yearn-finance', 'RAIL': 'railgun'
  },

  // Token logos with fallbacks
  tokenLogos: {
    'PLS': 'https://cryptologos.cc/logos/pulsechain-pulse-logo.png',
    'WPLS': 'https://cryptologos.cc/logos/pulsechain-pulse-logo.png',
    'KARROT': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    'RH': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    'HEX': 'https://cryptologos.cc/logos/hex-hex-logo.png',
    'PLSX': 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    'INC': 'https://cryptologos.cc/logos/injective-protocol-inj-logo.png',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'WETH': 'https://cryptologos.cc/logos/wrapped-ether-weth-logo.png',
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    'WBTC': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    'DAI': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    'SOL': 'https://cryptologos.cc/logos/solana-sol-logo.png',
    'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png'
  },

  // DEX Logo mapping
  dexLogos: {
    'PulseX': { logo: 'https://cryptologos.cc/logos/pulsechain-pulse-logo.svg', color: '#00ff00', chainId: 369 },
    '9mm': { logo: 'https://assets.coingecko.com/coins/images/31524/small/9mm_token.png', color: '#ff007a', chainId: 369 },
    'Piteas': { logo: 'https://assets.coingecko.com/coins/images/31525/small/piteas.png', color: '#f5deb3', chainId: 369 },
    'PulseXV3': { logo: 'https://cryptologos.cc/logos/pulsechain-pulse-logo.svg', color: '#00ff00', chainId: 369 },
    'UniswapV3': { logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg', color: '#ff007a', chainId: 1 },
    'SushiSwap': { logo: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.svg', color: '#fa52a0', chainId: 1 },
    'PancakeSwap': { logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg', color: '#1fc7d4', chainId: 56 },
    'PancakeSwapV3': { logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg', color: '#1fc7d4', chainId: 56 },
    '1inch': { logo: 'https://cryptologos.cc/logos/1inch-1inch-logo.svg', color: '#2f8af5', chainId: 1 },
    'Matcha': { logo: 'https://assets.coingecko.com/markets/images/677/small/Matcha.png', color: '#00cf6f', chainId: 1 },
    'THORChain': { logo: 'https://cryptologos.cc/logos/thorchain-rune-logo.svg', color: '#23dcc8', chainId: 0 },
    'LibertySwap': { logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', color: '#ffffff', chainId: 369 },
    'Railgun': { logo: 'https://cryptologos.cc/logos/railgun-rail-logo.svg', color: '#7a3ce8', chainId: 1 },
    'ProveX': { logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', color: '#ff6b6b', chainId: 1 },
    'Jupiter': { logo: 'https://cryptologos.cc/logos/jupiter-jup-logo.svg', color: '#00d4aa', chainId: 101 },
    'Raydium': { logo: 'https://cryptologos.cc/logos/raydium-ray-logo.svg', color: '#00d4aa', chainId: 101 }
  },

  cache: new Map(),
  cacheExpiry: 30000,

  init() {
    console.log('KarrotDEX Price Service initialized');
    this.preloadLogos();
  },

  preloadLogos() {
    Object.values(this.tokenLogos).forEach(url => {
      const img = new Image();
      img.src = url;
    });
    Object.values(this.dexLogos).forEach(dex => {
      const img = new Image();
      img.src = dex.logo;
    });
  },

  // Main price fetcher - routes to appropriate source
  async getRate(fromSymbol, toSymbol, amount = 1) {
    const fromUpper = fromSymbol.toUpperCase();
    const toUpper = toSymbol.toUpperCase();

    // Check if both are PulseChain native tokens
    if (this.isPulseChainToken(fromUpper) || this.isPulseChainToken(toUpper)) {
      return this.getPulseXRate(fromUpper, toUpper, amount);
    }

    // Otherwise use CoinGecko
    return this.getCoinGeckoRate(fromUpper, toUpper, amount);
  },

  // Check if token is native to PulseChain
  isPulseChainToken(symbol) {
    return !!this.pulseTokens[symbol.toUpperCase()];
  },

  // Get logo for any token
  getTokenLogo(symbol) {
    return this.tokenLogos[symbol.toUpperCase()] || 
           `https://ui-avatars.com/api/?name=${symbol}&background=random&color=fff`;
  },

  // Get DEX info
  getDexInfo(dexKey) {
    return this.dexLogos[dexKey] || { 
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', 
      color: '#ffffff', 
      chainId: 1 
    };
  },

  // Fetch price from CoinGecko
  async getCoinGeckoRate(fromSymbol, toSymbol, amount) {
    const fromId = this.coinGeckoIds[fromSymbol];
    const toId = this.coinGeckoIds[toSymbol];

    if (!fromId || !toId) {
      return { rate: this.getMockRate(fromSymbol, toSymbol), source: 'mock', timestamp: Date.now() };
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
        estimatedAmount: rate * amount,
        fromUsd,
        toUsd,
        source: 'CoinGecko',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('CoinGecko error:', error);
      return { rate: this.getMockRate(fromSymbol, toSymbol), source: 'error-fallback', timestamp: Date.now() };
    }
  },

  // Fetch price from PulseX Subgraph
  async getPulseXRate(fromSymbol, toSymbol, amount) {
    // Try to get PLS price first (reference)
    try {
      const plsUsdPrice = await this.getPLSPrice();
      
      // Get token prices relative to PLS
      const fromPrice = await this.getTokenPriceInPLS(fromSymbol);
      const toPrice = await this.getTokenPriceInPLS(toSymbol);

      if (fromPrice > 0 && toPrice > 0) {
        const rate = fromPrice / toPrice;
        return {
          rate: rate,
          estimatedAmount: rate * amount,
          fromUsd: fromPrice * plsUsdPrice,
          toUsd: toPrice * plsUsdPrice,
          source: 'PulseX',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.log('PulseX fetch failed, using CoinGecko:', error.message);
    }

    // Fallback to CoinGecko for PLS/HEX if PulseX fails
    return this.getCoinGeckoRate(fromSymbol, toSymbol, amount);
  },

  // Get PLS price in USD
  async getPLSPrice() {
    // Use cache
    const cached = this.cache.get('PLS_USD');
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.price;
    }

    try {
      const response = await fetch(
        `${this.endpoints.coinGecko}/simple/price?ids=pulsechain&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data.pulsechain?.usd || 0.0001;
      
      this.cache.set('PLS_USD', { price, timestamp: Date.now() });
      return price;
    } catch (e) {
      return 0.0001; // Fallback
    }
  },

  // Get token price in PLS (from PulseX)
  async getTokenPriceInPLS(symbol) {
    const token = this.pulseTokens[symbol.toUpperCase()];
    if (!token) return 0;

    // PLS is the base unit
    if (symbol.toUpperCase() === 'PLS' || symbol.toUpperCase() === 'WPLS') {
      return 1;
    }

    try {
      // Query PulseX subgraph for token price
      const query = {
        query: `
          query GetTokenPrice($id: ID!) {
            token(id: $id) {
              derivedPLS
              derivedUSD
            }
          }
        `,
        variables: { id: token.address.toLowerCase() }
      };

      const response = await fetch(this.endpoints.pulseXGraph, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const data = await response.json();
      const derivedPLS = data.data?.token?.derivedPLS;
      
      if (derivedPLS && parseFloat(derivedPLS) > 0) {
        return parseFloat(derivedPLS);
      }
    } catch (e) {
      console.log('PulseX graph error for', symbol, e.message);
    }

    // Fallback: try DexScreener
    try {
      const response = await fetch(
        `${this.endpoints.dexScreener}/tokens/${token.address}`
      );
      const data = await response.json();
      const pair = data.pairs?.[0];
      if (pair) {
        const priceUsd = parseFloat(pair.priceUsd || pair.priceNative);
        const plsPrice = await this.getPLSPrice();
        return priceUsd / plsPrice;
      }
    } catch (e) {
      console.log('DexScreener error for', symbol, e.message);
    }

    return 0;
  },

  // Mock rates for testing
  getMockRate(from, to) {
    const rates = {
      'ETH-USDC': 3450.50,
      'BTC-ETH': 18.25,
      'PLS-ETH': 0.00005,
      'PLS-USDC': 0.0001,
      'HEX-PLS': 0.0001
    };
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    
    if (rates[key]) return rates[key];
    if (rates[reverseKey]) return 1 / rates[reverseKey];
    return 1;
  },

  // Format price for display
  formatPrice(price, decimals = 6) {
    if (!price || price === 0) return '--';
    if (price < 0.0001) return price.toExponential(4);
    if (price < 1) return price.toFixed(decimals);
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: decimals 
    });
  },

  // Calculate price impact
  calculatePriceImpact(inputAmount, outputAmount, expectedRate) {
    if (!inputAmount || !expectedRate) return 0;
    const expectedOutput = inputAmount * expectedRate;
    const impact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
    return Math.max(0, Math.min(impact, 100));
  }
};

// Export
window.PriceService = PriceService;
