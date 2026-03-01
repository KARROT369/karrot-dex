# DEX-Native Price Oracle Architecture

## Core Principle
**Each DEX is its own price oracle.**

When user selects "THORChain" → Price comes from THORChain
When user selects "PulseX" → Price comes from PulseX pools
When user selects "Uniswap V3" → Price comes from Uniswap V3 pools

## Why This Is Superior

| Feature | CoinGecko | DEX-as-Oracle |
|---------|-----------|---------------|
| Token Coverage | Top 20 only | **ALL tokens on each DEX** |
| Price Accuracy | Stale/averaged | **Live pool price** |
| Execution Match | Price ≠ Execution | **What you see = what you get** |
| Decentralization | External API | **On-chain/self-contained** |
| Oracle Count | 1 (centralized) | **16 independent oracles** |

## Implementation Plan

### 1. Remove CoinGecko Dependency
- Delete `coinGeckoIds` mapping
- Remove `fetchCoinGeckoPrice()` function
- Remove CoinGecko API calls

### 2. Add DEX-Native Price Fetchers

#### PulseX / PulseChain DEXs
```
Source: PulseX Subgraph
Query: Pool reserves (token0, token1, sqrtPriceX96)
Calculation: (reserve1 / reserve0) * 10^(decimals0 - decimals1)
```

#### Uniswap V3
```
Source: Uniswap V3 Subgraph
Query: Slot0 (sqrtPriceX96)
Calculation: (sqrtPriceX96^2 / 2^192) * 10^(decimals)
```

#### THORChain
```
Source: Midgard API
Query: /v2/pools
Calculation: assetPrice / runePrice
```

#### Jupiter (Solana)
```
Source: Jupiter Price API
Query: /v4/price?ids=tokenAddress
Calculation: Direct price in SOL/USDC
```

#### 1inch / Matcha / 0x
```
Source: Quote API
Query: /quote or /swap
Calculation: toAmount / fromAmount
```

### 3. Token Discovery
- Fetch all supported tokens from each DEX
- Build unified token list with DEX-specific addresses
- Display available tokens based on selected DEX

### 4. Price Update Strategy
- Poll active DEX every 10 seconds when selected
- Cache prices for 30 seconds
- Show "Last updated" timestamp
- Display loading state during fetch

### 5. Execution Flow
```
User selects DEX →
  Fetch available tokens from that DEX →
    User selects token pair →
      Fetch live price from selected DEX →
        Show quote →
          Execute swap on selected DEX
```

## Benefits

1. **Price Transparency**: User sees exact price they'll pay
2. **No Slippage Surprises**: Quote matches execution
3. **Full Token Coverage**: Every token on every DEX
4. **Real Decentralization**: No centralized price source
5. **Arbitrage Clarity**: Different DEXes = different prices (expected!)

## Testing Checklist

- [ ] PulseX native prices
- [ ] Uniswap V3 native prices
- [ ] THORChain native prices
- [ ] Jupiter native prices
- [ ] 1inch quote prices
- [ ] Token discovery per DEX
- [ ] Quote matches execution
- [ ] Real-time updates working

---
*Correct architecture for true DEX aggregation*
