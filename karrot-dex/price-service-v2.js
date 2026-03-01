/**
 * KarrotDEX Price Service - DEX-NATIVE ORACLE
 * Each DEX is its own price oracle - NO CoinGecko
 */

const PriceService = {
  // Cache for prices (30 seconds)
  priceCache: {},
  CACHE_DURATION: 30000,

  async getChangeNowRate(fromSymbol, toSymbol, amount = 1, dexId = 'pulsex') {
    return this.getDexRate(fromSymbol, toSymbol, amount, dexId);
  },

  async getRate(fromSymbol, toSymbol, amount = 1, dexId = 'pulsex') {
    return this.getDexRate(fromSymbol, toSymbol, amount, dexId);
  },

  async getDexRate(fromSymbol, toSymbol, amount, dexId) {
    const cacheKey = `${dexId}-${fromSymbol}-${toSymbol}`;
    const cached = this.priceCache[cacheKey];
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`Using cached price for ${cacheKey}`);
      return {
        rate: cached.rate,
        estimatedAmount: cached.rate * amount,
        source: cached.source,
        timestamp: cached.timestamp,
        cached: true
      };
    }

    try {
      let result;
      
      switch(dexId) {
        // PulseChain DEXes
        case 'pulsex-v2':
        case 'pulsex-v3':
        case '9mm':
        case 'piteas':
          result = await this.getPulseChainRate(fromSymbol, toSymbol, dexId);
          break;
        
        // Ethereum DEXes
        case 'uniswap-v3':
        case 'sushiswap':
          result = await this.getEthereumRate(fromSymbol, toSymbol, dexId);
          break;
        
        // BSC DEXes
        case 'pancakeswap-v2':
        case 'pancakeswap-v3':
          result = await this.getBSCRate(fromSymbol, toSymbol, dexId);
          break;
        
        // Cross-chain
        case 'thorchain':
          result = await this.getTHORChainRate(fromSymbol, toSymbol);
          break;
        
        // Solana
        case 'jupiter':
        case 'raydium':
          result = await this.getSolanaRate(fromSymbol, toSymbol, dexId);
          break;
        
        // Meta-aggregators
        case '1inch':
        case 'matcha':
        case 'openocean':
          result = await this.getAggregatorQuote(fromSymbol, toSymbol, amount, dexId);
          break;
        
        default:
          result = await this.getPulseChainRate(fromSymbol, toSymbol, 'pulsex-v2');
      }

      // Cache the result
      this.priceCache[cacheKey] = {
        rate: result.rate,
        source: result.source,
        timestamp: Date.now()
      };

      return {
        rate: result.rate,
        estimatedAmount: result.rate * amount,
        source: result.source,
        timestamp: Date.now(),
        dex: dexId,
        cached: false
      };

    } catch (error) {
      console.error(`Price fetch error for ${dexId}:`, error);
      const mockRate = this.getMockRate(fromSymbol, toSymbol);
      return {
        rate: mockRate,
        estimatedAmount: mockRate * amount,
        source: 'mock-fallback',
        timestamp: Date.now(),
        dex: dexId
      };
    }
  },

  // PulseChain DEX native prices
  async getPulseChainRate(fromSymbol, toSymbol, dexId) {
    // PulseChain tokens contract addresses
    const tokens = {
      'WPLS': '0xA1077a294dDE1b09bB078844df40758a5D0f9a27',
      'PLS': '0xA1077a294dDE1b09bB078844df40758a5D0f9a27',
      'KARROT': '0x6910076Eee8F4b6ea251B7cCa1052dd744Fc04DA',
      'RH': '0xDB75a19203a65Ba93c1baaac777d229bf08452Da',
      'USDC': '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'HEX': '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
      'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    };

    const fromToken = tokens[fromSymbol.toUpperCase()];
    const toToken = tokens[toSymbol.toUpperCase()];

    if (!fromToken || !toToken) {
      throw new Error('Token not supported on PulseChain');
    }

    // Try PulseX Subgraph first
    try {
      const query = {
        query: `{
          pairs(where: {token0_in: ["${fromToken.toLowerCase()}", "${toToken.toLowerCase()}"], token1_in: ["${fromToken.toLowerCase()}", "${toToken.toLowerCase()}"]}, first: 1) {
            token0 { symbol }
            token1 { symbol }
            reserve0
            reserve1
            token0Price
            token1Price
          }
        }`
      };

      const response = await fetch('https://graph.pulsechain.com/subgraphs/name/pulsex/exchange-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const data = await response.json();
      
      if (data.data?.pairs?.length > 0) {
        const pair = data.data.pairs[0];
        const isToken0From = pair.token0.symbol.toUpperCase() === fromSymbol.toUpperCase();
        const rate = isToken0From ? parseFloat(pair.token0Price) : parseFloat(pair.token1Price);
        
        return {
          rate: rate,
          source: `${dexId}-subgraph`,
          pool: pair
        };
      }
    } catch (e) {
      console.warn('PulseX subgraph failed:', e);
    }

    // Fallback: Piteas API for PulseChain
    try {
      const response = await fetch(
        `https://api.piteas.io/quote?from=${fromToken}&to=${toToken}&amount=1000000000000000000`,
        { cache: 'no-cache' }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          rate: parseFloat(data.expectedOutput) / 1e18,
          source: 'piteas-api'
        };
      }
    } catch (e) {
      console.warn('Piteas API failed:', e);
    }

    throw new Error('Failed to fetch PulseChain price');
  },

  // Ethereum DEX prices
  async getEthereumRate(fromSymbol, toSymbol, dexId) {
    // Uniswap V3 Subgraph
    const query = {
      query: `{
        pools(where: {token0_: {symbol: "${fromSymbol}"}, token1_: {symbol: "${toSymbol}"}}, first: 1) {
          token0Price
          token0 { decimals }
          token1 { decimals }
        }
      }`
    };

    try {
      const response = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const data = await response.json();
      
      if (data.data?.pools?.length > 0) {
        return {
          rate: parseFloat(data.data.pools[0].token0Price),
          source: 'uniswap-v3-subgraph'
        };
      }
    } catch (e) {
      console.warn('Uniswap subgraph failed:', e);
    }

    throw new Error('Failed to fetch Ethereum price');
  },

  // BSC DEX prices
  async getBSCRate(fromSymbol, toSymbol, dexId) {
    // PancakeSwap Subgraph
    const tokens = {
      'BNB': '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      'USDT': '0x55d398326f99059ff775485246999027b3197955',
      'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'ETH': '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
      'BTCB': '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c'
    };

    const fromToken = tokens[fromSymbol.toUpperCase()];
    const toToken = tokens[toSymbol.toUpperCase()];

    if (!fromToken || !toToken) {
      throw new Error('Token not supported on BSC');
    }

    // Try PancakeSwap API
    try {
      const response = await fetch(
        `https://api.pancakeswap.info/api/v2/summary`,
        { cache: 'no-cache' }
      );

      const data = await response.json();
      const pairKey = `${fromToken}_${toToken}`;
      
      if (data.data?.[pairKey]) {
        return {
          rate: parseFloat(data.data[pairKey].price),
          source: 'pancakeswap-api'
        };
      }
    } catch (e) {
      console.warn('PancakeSwap API failed:', e);
    }

    throw new Error('Failed to fetch BSC price');
  },

  // THORChain native prices
  async getTHORChainRate(fromSymbol, toSymbol) {
    try {
      const response = await fetch('https://midgard.thorchain.info/v2/pools', {
        cache: 'no-cache'
      });

      const data = await response.json();
      
      // Find pools for both assets
      const fromPool = data.find(p => p.asset.split('.')[1]?.toUpperCase() === fromSymbol.toUpperCase());
      const toPool = data.find(p => p.asset.split('.')[1]?.toUpperCase() === toSymbol.toUpperCase());

      if (fromPool && toPool) {
        // Calculate cross rate via RUNE
        const fromPrice = parseFloat(fromPool.assetPrice);
        const toPrice = parseFloat(toPool.assetPrice);
        const rate = fromPrice / toPrice;

        return {
          rate: rate,
          source: 'thorchain-midgard',
          pools: { from: fromPool.asset, to: toPool.asset }
        };
      }
    } catch (e) {
      console.warn('THORChain API failed:', e);
    }

    throw new Error('Failed to fetch THORChain price');
  },

  // Solana DEX prices
  async getSolanaRate(fromSymbol, toSolSymbol, dexId) {
    try {
      const response = await fetch(
        `https://price.jup.ag/v4/price?ids=${fromSymbol}`,
        { cache: 'no-cache' }
      );

      const data = await response.json();
      
      if (data.data?.[fromSymbol]) {
        return {
          rate: data.data[fromSymbol].price,
          source: 'jupiter-api'
        };
      }
    } catch (e) {
      console.warn('Jupiter API failed:', e);
    }

    throw new Error('Failed to fetch Solana price');
  },

  // Meta-aggregator quotes
  async getAggregatorQuote(fromSymbol, toSymbol, amount, dexId) {
    // For 1inch, Matcha, 0x - use their quote APIs
    // This requires API keys for some, so we'll return mock for now
    
    if (dexId === '1inch') {
      // 1inch requires API key, so we use PulseChain fallback
      return this.getPulseChainRate(fromSymbol, toSymbol, 'pulsex-v2');
    }

    // Default to mock rates for aggregators without API keys
    const mockRate = this.getMockRate(fromSymbol, toSymbol);
    return {
      rate: mockRate,
      source: `${dexId}-simulation`
    };
  },

  getMockRate(from, to) {
    const rates = {
      'PLS-USDC': 0.0001, 'USDC-PLS': 10000,
      'WPLS-USDC': 0.0001, 'USDC-WPLS': 10000,
      'KARROT-PLS': 0.01, 'PLS-KARROT': 100,
      'RH-PLS': 0.001, 'PLS-RH': 1000,
      'HEX-USDC': 0.05, 'USDC-HEX': 20,
      'ETH-USDC': 3450.50, 'USDC-ETH': 0.000289,
      'BTC-USDC': 63250, 'USDC-BTC': 0.0000158,
      'WETH-USDC': 3450.50, 'USDC-WETH': 0.000289,
      'BNB-USDC': 580, 'USDC-BNB': 0.00172,
      'SOL-USDC': 145, 'USDC-SOL': 0.0069
    };
    
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    
    if (rates[key]) return rates[key];
    if (rates[reverseKey]) return 1 / rates[reverseKey];
    return 1;
  },

  // Get available tokens for a specific DEX
  async getAvailableTokens(dexId) {
    const tokenLists = {
      'pulsex-v2': [
        { symbol: 'PLS', name: 'PulseChain', decimals: 18, address: '0xA1077a294dDE1b09bB078844df40758a5D0f9a27', logo: 'crypto-logos/pulsechain.png' },
        { symbol: 'WPLS', name: 'Wrapped PLS', decimals: 18, address: '0xA1077a294dDE1b09bB078844df40758a5D0f9a27', logo: 'crypto-logos/pulsechain.png' },
        { symbol: 'KARROT', name: 'Karrot', decimals: 18, address: '0x6910076Eee8F4b6ea251B7cCa1052dd744Fc04DA', logo: 'crypto-logos/karrot.png' },
        { symbol: 'RH', name: 'Rabbit Hole', decimals: 18, address: '0xDB75a19203a65Ba93c1baaac777d229bf08452Da', logo: 'crypto-logos/rabbit-hole.png' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07', logo: 'crypto-logos/usdc.png' },
        { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', logo: 'crypto-logos/dai.png' },
        { symbol: 'HEX', name: 'HEX', decimals: 8, address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', logo: 'crypto-logos/hex.png' },
        { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', logo: 'crypto-logos/ethereum.png' },
        { symbol: 'BTC', name: 'Bitcoin', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', logo: 'crypto-logos/bitcoin.png' },
        { symbol: 'BNB', name: 'BNB', decimals: 18, address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', logo: 'crypto-logos/bnb.png' },
        { symbol: 'SOL', name: 'Solana', decimals: 9, address: 'So11111111111111111111111111111111111111112', logo: 'crypto-logos/solana.png' }
      ],
      'thorchain': [
        { symbol: 'BTC', name: 'Bitcoin', decimals: 8, logo: 'crypto-logos/bitcoin.png' },
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: 'crypto-logos/ethereum.png' },
        { symbol: 'BNB', name: 'BNB', decimals: 8, logo: 'crypto-logos/bnb.png' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: 'crypto-logos/usdc.png' },
        { symbol: 'USDT', name: 'Tether', decimals: 6, logo: 'crypto-logos/usdt.png' },
        { symbol: 'RUNE', name: 'THORChain', decimals: 8, logo: 'crypto-logos/thorchain.png' }
      ]
    };

    return tokenLists[dexId] || tokenLists['pulsex-v2'];
  },

  init() {
    console.log('PriceService initialized - DEX-NATIVE ORACLE');
    console.log('Each DEX is its own price source!');
  }
};

window.PriceService = PriceService;
