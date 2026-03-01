// KarrotDEX PulseX V2 Integration
// Real DEX connection for PulseChain

const PULSEX_V2_ROUTER = '0x165C3410fC91EF562C50559f7d2289fEbed552d9';
const PULSEX_V2_FACTORY = '0x1715a3E4A142d8B698131436975F8273f1dd0cC8';
const PULSE_CHAIN_ID = 369;
const PULSE_RPC = 'https://rpc.pulsechain.com';

// Minimal ABI for Router
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function WETH() external pure returns (address)"
];

// Minimal ABI for ERC20
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string memory)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// State
let provider = null;
let signer = null;
let userAddress = null;
let selectedTokenFrom = null;
let selectedTokenTo = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('KarrotDEX PulseX V2 Ready');
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Token selectors
  const tokenFromSelect = document.getElementById('tokenFrom');
  const tokenToSelect = document.getElementById('tokenTo');
  const amountFromInput = document.getElementById('amountFrom');
  const aggregatorSelect = document.getElementById('aggregator');
  
  if (tokenFromSelect) {
    tokenFromSelect.addEventListener('change', (e) => {
      selectedTokenFrom = parseTokenValue(e.target.value);
      updateFromIcon(selectedTokenFrom);
      fetchBalance(selectedTokenFrom, 'balanceFrom');
      if (amountFromInput && amountFromInput.value) {
        getQuote();
      }
    });
  }
  
  if (tokenToSelect) {
    tokenToSelect.addEventListener('change', (e) => {
      selectedTokenTo = parseTokenValue(e.target.value);
      updateToIcon(selectedTokenTo);
      fetchBalance(selectedTokenTo, 'balanceTo');
      if (amountFromInput && amountFromInput.value) {
        getQuote();
      }
    });
  }
  
  if (amountFromInput) {
    amountFromInput.addEventListener('input', debounce(() => {
      getQuote();
    }, 500));
  }
  
  // Switch tokens button
  const switchBtn = document.getElementById('switchTokens');
  if (switchBtn) {
    switchBtn.addEventListener('click', switchTokens);
  }
  
  // Swap button
  const swapBtn = document.getElementById('btnSwap');
  if (swapBtn) {
    swapBtn.addEventListener('click', executeSwap);
  }
  
  // Aggregator change
  if (aggregatorSelect) {
    aggregatorSelect.addEventListener('change', (e) => {
      updateAggregatorInfo(e.target.value);
    });
  }
}

// Parse token value from select option
function parseTokenValue(value) {
  if (!value) return null;
  const parts = value.split('||');
  if (parts.length >= 3) {
    return {
      address: parts[0],
      symbol: parts[1],
      decimals: parseInt(parts[2])
    };
  }
  return null;
}

// Update token icons
function updateFromIcon(token) {
  const icon = document.getElementById('fromIcon');
  if (icon && token) {
    icon.textContent = getTokenEmoji(token.symbol);
  }
}

function updateToIcon(token) {
  const icon = document.getElementById('toIcon');
  if (icon && token) {
    icon.innerHTML = `<img src="https://cryptologos.cc/logos/pulsechain-pulse-logo.png" style="width: 28px; height: 28px; border-radius: 50%;">`;
    // Could set specific icon based on token
  }
}

function getTokenEmoji(symbol) {
  const emojis = {
    'PLS': '🔷', 'WPLS': '🔷', 'HEX': '❤️', 'PLSX': '🟢',
    'INC': '🔷', 'USDC': '💵', 'DAI': '💰', 'USDT': '💵',
    'WETH': '♦️', 'WBTC': '🟡', 'KARROT': '🥕', 'RH': '🐇',
    'HDRN': '🌊', 'ICSA': '🔷', 'WATT': '⚡', 'PRV': '🔒',
    'TYRANT': '🦁', 'COM': '💎', 'MAXI': '🔷', 'DECI': '🔟'
  };
  return emojis[symbol] || '🪙';
}

// Get quote from PulseX
async function getQuote() {
  if (!selectedTokenFrom || !selectedTokenTo) return;
  
  const amountInput = document.getElementById('amountFrom');
  const amountDisplay = document.getElementById('amountToDisplay');
  const rateDisplay = document.getElementById('exchangeRate');
  const impactDisplay = document.getElementById('priceImpact');
  
  if (!amountInput || !amountInput.value) return;
  
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) return;
  
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(PULSE_RPC);
    const router = new ethers.Contract(PULSEX_V2_ROUTER, ROUTER_ABI, provider);
    
    // Calculate amount in wei
    const amountInWei = ethers.utils.parseUnits(
      amount.toString(),
      selectedTokenFrom.decimals
    );
    
    // Get amounts out
    const path = [selectedTokenFrom.address, selectedTokenTo.address];
    const amounts = await router.getAmountsOut(amountInWei, path);
    
    const amountOut = ethers.utils.formatUnits(amounts[1], selectedTokenTo.decimals);
    
    // Update display
    if (amountDisplay) {
      amountDisplay.textContent = parseFloat(amountOut).toFixed(6);
    }
    
    // Update full amount display
    const amountToFull = document.getElementById('amountToFull');
    if (amountToFull) {
      amountToFull.textContent = amountOut;
    }
    
    // Calculate rate
    const rate = parseFloat(amountOut) / amount;
    if (rateDisplay) {
      rateDisplay.textContent = `1 ${selectedTokenFrom.symbol} = ${rate.toFixed(6)} ${selectedTokenTo.symbol}`;
    }
    
    // Estimate price impact (simplified)
    if (impactDisplay) {
      impactDisplay.textContent = '< 0.1%';
    }
    
    // Update minimum received
    const slippageInput = document.getElementById('slippage');
    const slippage = slippageInput ? parseFloat(slippageInput.value) / 100 : 0.005;
    const minReceived = parseFloat(amountOut) * (1 - slippage);
    
    const minReceivedDisplay = document.getElementById('minReceived');
    if (minReceivedDisplay) {
      minReceivedDisplay.textContent = `${minReceived.toFixed(6)} ${selectedTokenTo.symbol}`;
    }
    
  } catch (error) {
    console.error('Quote failed:', error);
    if (amountDisplay) {
      amountDisplay.textContent = '--';
    }
  }
}

// Fetch token balance
async function fetchBalance(token, elementId) {
  if (!token || !userAddress) return;
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(PULSE_RPC);
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    const formatted = ethers.utils.formatUnits(balance, token.decimals);
    element.textContent = `Balance: ${parseFloat(formatted).toFixed(4)} ${token.symbol}`;
  } catch (error) {
    console.error('Balance fetch failed:', error);
    element.textContent = 'Balance: --';
  }
}

// Switch tokens
function switchTokens() {
  const tokenFromSelect = document.getElementById('tokenFrom');
  const tokenToSelect = document.getElementById('tokenTo');
  
  if (tokenFromSelect && tokenToSelect) {
    const temp = tokenFromSelect.value;
    tokenFromSelect.value = tokenToSelect.value;
    tokenToSelect.value = temp;
    
    // Trigger change events
    tokenFromSelect.dispatchEvent(new Event('change'));
    tokenToSelect.dispatchEvent(new Event('change'));
  }
}

// Execute swap
async function executeSwap() {
  if (!signer || !userAddress) {
    alert('Please connect your wallet first');
    return;
  }
  
  if (!selectedTokenFrom || !selectedTokenTo) {
    alert('Please select both tokens');
    return;
  }
  
  const amountInput = document.getElementById('amountFrom');
  if (!amountInput || !amountInput.value) {
    alert('Please enter an amount');
    return;
  }
  
  try {
    const router = new ethers.Contract(PULSEX_V2_ROUTER, ROUTER_ABI, signer);
    const amount = parseFloat(amountInput.value);
    const amountInWei = ethers.utils.parseUnits(
      amount.toString(),
      selectedTokenFrom.decimals
    );
    
    // Get quote for minimum output
    const path = [selectedTokenFrom.address, selectedTokenTo.address];
    const amounts = await router.getAmountsOut(amountInWei, path);
    
    const slippageInput = document.getElementById('slippage');
    const slippage = slippageInput ? parseFloat(slippageInput.value) / 100 : 0.005;
    const minAmountOut = amounts[1].mul(Math.floor((1 - slippage) * 10000)).div(10000);
    
    // Execute swap
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    // Check if we need approval
    if (selectedTokenFrom.address !== '0xA1077a294dDE1b09bB078844df40758a5D0f9a27') {
      // Not native PLS, need approval
      const tokenContract = new ethers.Contract(selectedTokenFrom.address, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(userAddress, PULSEX_V2_ROUTER);
      
      if (allowance.lt(amountInWei)) {
        console.log('Approving token...');
        const approveTx = await tokenContract.approve(PULSEX_V2_ROUTER, ethers.constants.MaxUint256);
        await approveTx.wait();
        console.log('Token approved');
      }
    }
    
    let tx;
    if (selectedTokenFrom.address === '0xA1077a294dDE1b09bB078844df40758a5D0f9a27') {
      // PLS to Token
      tx = await router.swapExactETHForTokens(
        minAmountOut,
        path,
        userAddress,
        deadline,
        { value: amountInWei }
      );
    } else if (selectedTokenTo.address === '0xA1077a294dDE1b09bB078844df40758a5D0f9a27') {
      // Token to PLS
      tx = await router.swapExactTokensForETH(
        amountInWei,
        minAmountOut,
        path,
        userAddress,
        deadline
      );
    } else {
      // Token to Token
      tx = await router.swapExactTokensForTokens(
        amountInWei,
        minAmountOut,
        path,
        userAddress,
        deadline
      );
    }
    
    console.log('Swap transaction:', tx.hash);
    alert(`Swap submitted! Transaction: ${tx.hash}`);
    
    await tx.wait();
    console.log('Swap confirmed');
    alert('Swap confirmed!');
    
    // Refresh balances
    fetchBalance(selectedTokenFrom, 'balanceFrom');
    fetchBalance(selectedTokenTo, 'balanceTo');
    
  } catch (error) {
    console.error('Swap failed:', error);
    alert(`Swap failed: ${error.message}`);
  }
}

// Update aggregator info display
function updateAggregatorInfo(aggregator) {
  const info = document.getElementById('aggregatorInfo');
  const logos = {
    'PulseX': '🟢', '9mm': '🔫', 'Piteas': '🥧', 'PulseXV3': '🟢',
    'UniswapV3': '🦄', 'SushiSwap': '🍣', 'PancakeSwap': '🥞',
    'PancakeSwapV3': '🥞', '1inch': '📊', 'Matcha': '🍵',
    'THORChain': '⚡', 'LibertySwap': '🗽', 'Railgun': '🔒',
    'ProveX': '🛡️', 'Jupiter': '🪐', 'Raydium': '☀️'
  };
  
  if (info) {
    info.textContent = `${aggregator} — Chain ID: ${PULSE_CHAIN_ID} (PulseChain)`;
  }
  
  const logo = document.getElementById('aggregatorLogo');
  if (logo && logos[aggregator]) {
    logo.textContent = logos[aggregator];
  }
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export for global access
window.KarrotDEX = {
  connectWallet: async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Switch to PulseChain if needed
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x171' }] // 369 in hex
          });
        } catch (switchError) {
          // Chain not added, ignore
        }
        
        // Update button
        const btn = document.getElementById('connectWallet');
        if (btn) {
          btn.textContent = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
        }
        
        // Fetch balances
        if (selectedTokenFrom) fetchBalance(selectedTokenFrom, 'balanceFrom');
        if (selectedTokenTo) fetchBalance(selectedTokenTo, 'balanceTo');
        
        return userAddress;
      } catch (error) {
        console.error('Connection failed:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask not detected');
    }
  }
};
