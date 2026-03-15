# 🥕 Karrot DEX

**Universal DEX Aggregator for PulseChain**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://karrot369.github.io/karrot-dex/)

---

## Overview

Karrot DEX is a **universal aggregator** that connects to **16+ liquidity sources** across PulseChain, Ethereum, BNB Chain, ZKSync Era, and Solana. It finds the best prices by splitting orders across multiple DEXs and provides a seamless trading experience with MEV protection.

**Live Site:** https://karrot369.github.io/karrot-dex/

---

## Features

### 🌐 16 Liquidity Sources

**V2 DEXs (5):**
- PulseX - Foundational PulseChain AMM
- 9mm - Rising PulseChain DEX
- Piteas - High-volume optimized routing
- PancakeSwap (BSC) - Dominant BNB Chain DEX
- SushiSwap - Multi-chain Ethereum DEX

**V3 DEXs (3):**
- Uniswap V3 - Concentrated liquidity
- PulseX V3 - Custom PulseChain implementation
- PancakeSwap V3 - Capital-efficient BNB Chain

**Meta-Aggregators (3):**
- 1inch - Industry-leading routing
- Matcha (0x) - MEV protection
- CowSwap - Intent-based batch auctions

**Cross-Chain (3):**
- THORChain - Native cross-chain swaps
- LibertySwap - PulseChain ↔ Ethereum ↔ BSC
- ZKSync Era - Ethereum L2 scaling

**Privacy (2):**
- Railgun - Zero-knowledge swaps
- ProveX - Encrypted routing

**Solana (1):**
- Jupiter - Solana-native aggregator

### 🔒 Security
- MEV protection through CowSwap integration
- Slippage protection
- Deadline enforcement
- Reentrancy protection

### ⚡ Performance
- Real-time price comparison
- Optimal route calculation
- Gas-optimized transactions
- Sub-second quote generation

---

## Technology Stack

- **Frontend:** Vanilla JS + HTML5 + CSS3
- **Smart Contracts:** Solidity 0.8.20+
- **Network:** PulseChain (primary), Multi-chain support
- **Wallet:** MetaMask, WalletConnect

---

## Smart Contracts

### KarrotDexAggregator.sol
Main aggregator contract handling swaps across all sources.

**Key Functions:**
- `swapV2()` - Execute V2 DEX swaps
- `swapV3()` - Execute V3 DEX swaps
- `requestThorSwap()` - Initiate THORChain cross-chain
- `requestZKSwap()` - Initiate ZKSync swap
- `requestXStocksRaySwap()` - Initiate Raydium swap
- `requestXStocksJupSwap()` - Initiate Jupiter swap

---

## How It Works

1. **Connect Wallet** to Karrot DEX
2. **Select Tokens** to swap (input and output)
3. **Choose Route** from 16+ liquidity sources
4. **Review Quote** with price comparison
5. **Approve Token** (first time only)
6. **Execute Swap** with optimal routing
7. **Receive Tokens** in your wallet

---

## Supported Tokens

- **KARROT** - Native ecosystem token
- **RH** - Rabbit Hole rewards token
- **MX DAI** - Stablecoin
- **All ERC-20** tokens on supported chains
- **Cross-chain** assets via bridges

---

## Fees

| Source | Fee | Notes |
|--------|-----|-------|
| V2 DEXs | 0.3% | Standard AMM fee |
| V3 DEXs | 0.05-1% | Tier-based |
| Meta-Aggregators | 0% + DEX fee | No additional fee |
| Cross-Chain | Variable | Network + bridge fees |

**Karrot DEX Fee:** 0% (aggregator only)

---

## Deployment

### Testnet
```bash
# Deploy contracts
npx hardhat run scripts/deploy.js --network pulsechainTestnet

# Update frontend config
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Mainnet
```bash
npx hardhat run scripts/deploy.js --network pulsechain
npm run build
npm run deploy
```

---

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| PulseChain Testnet | KarrotDexAggregator | TBD |
| PulseChain Mainnet | KarrotDexAggregator | TBD |

---

## Security

- ✅ 40+ attack vectors tested and mitigated
- ✅ ReentrancyGuard on all swaps
- ✅ Deadline enforcement
- ✅ Slippage protection
- ✅ No admin keys (immutable version available)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Connect

- **Website:** https://karrot369.github.io/karrot-dex/
- **GitHub:** https://github.com/KARROT369
- **Ecosystem:** KARROT369 DeFi + DadBule VTOL + Nova AI

---

*Built with 🥕 by Peter, Neural Familiar*
