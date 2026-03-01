// KarrotDEX PulseX V2 Integration - Real-time quotes
// Uses lowercase addresses to avoid checksum issues

const PULSEX_V2_ROUTER = '0x165c3410fc91ef562c50559f7d2289efbed552d9';
const WPLS = '0xa1077a294dde1b09bb078844df40758a5d0f9a27';

const RPCS = [
  'https://rpc.pulsechain.com',
  'https://pulsechain-rpc.publicnode.com'
];

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

let provider, router;

init();

async function init() {
  for (const rpc of RPCS) {
    try {
      provider = new ethers.providers.JsonRpcProvider(rpc);
      await provider.getBlockNumber();
      router = new ethers.Contract(PULSEX_V2_ROUTER, ROUTER_ABI, provider);
      console.log('✅ PulseX V2 connected');
      showStatus('⚡ Connected to PulseChain', 'success');
      break;
    } catch (e) {
      console.log('RPC failed:', e.message);
    }
  }
  
  if (!router) {
    showStatus('❌ No RPC connection', 'error');
    return;
  }
  
  // Setup listeners
  document.getElementById('tokenFrom')?.addEventListener('change', () => {
    updateIcon('fromIcon', document.getElementById('tokenFrom').value);
    quote();
  });
  
  document.getElementById('tokenTo')?.addEventListener('change', () => {
    updateIcon('toIcon', document.getElementById('tokenTo').value);
    quote();
  });
  
  document.getElementById('amountFrom')?.addEventListener('input', debounce(quote, 300));
}

function parseToken(val) {
  if (!val) return null;
  const parts = val.split('||');
  return parts.length >= 3 ? {
    address: parts[0].toLowerCase(),
    symbol: parts[1],
    decimals: parseInt(parts[2])
  } : null;
}

function getRouteAddress(token) {
  // PLS native uses WPLS for routing
  if (token.symbol === 'PLS') return WPLS;
  return token.address;
}

async function quote() {
  if (!router) return;
  
  const fromSelect = document.getElementById('tokenFrom');
  const toSelect = document.getElementById('tokenTo');
  const fromAmount = document.getElementById('amountFrom');
  const toAmount = document.getElementById('amountTo');
  
  const fromToken = parseToken(fromSelect?.value);
  const toToken = parseToken(toSelect?.value);
  const amount = fromAmount?.value;
  
  if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
    if (toAmount) toAmount.value = '';
    return;
  }
  
  console.log(`Getting quote: ${amount} ${fromToken.symbol} → ${toToken.symbol}`);
  
  try {
    const amountIn = ethers.utils.parseUnits(amount, fromToken.decimals);
    const fromAddr = getRouteAddress(fromToken);
    const toAddr = getRouteAddress(toToken);
    
    // Try direct path
    let path = [fromAddr, toAddr];
    console.log('Trying:', path);
    
    try {
      const amounts = await router.getAmountsOut(amountIn, path);
      const out = ethers.utils.formatUnits(amounts[1], toToken.decimals);
      console.log('✅ Success:', out);
      updateUI(out, fromToken, toToken, amount);
      return;
    } catch (e) {
      console.log('Direct failed:', e.message);
    }
    
    // Try via WPLS
    if (fromAddr !== WPLS && toAddr !== WPLS) {
      path = [fromAddr, WPLS, toAddr];
      console.log('Trying via WPLS:', path);
      
      const amounts = await router.getAmountsOut(amountIn, path);
      const out = ethers.utils.formatUnits(amounts[2], toToken.decimals);
      console.log('✅ Via WPLS:', out);
      updateUI(out, fromToken, toToken, amount);
    }
    
  } catch (err) {
    console.error('Quote failed:', err.message);
    if (toAmount) toAmount.value = '';
    showStatus('No liquidity', 'error');
  }
}

function updateUI(amountOut, fromTok, toTok, amountIn) {
  const toInput = document.getElementById('amountTo');
  const rateEl = document.getElementById('exchangeRate');
  const minEl = document.getElementById('minReceived');
  
  if (toInput) toInput.value = formatNum(amountOut);
  
  const rate = parseFloat(amountOut) / parseFloat(amountIn);
  if (rateEl) rateEl.textContent = `1 ${fromTok.symbol} = ${rate.toFixed(6)} ${toTok.symbol}`;
  
  const slipEl = document.getElementById('slippage');
  const slip = slipEl ? parseFloat(slipEl.value) / 100 : 0.005;
  const min = parseFloat(amountOut) * (1 - slip);
  if (minEl) minEl.textContent = `${min.toFixed(6)} ${toTok.symbol}`;
  
  showStatus('✅ Live from PulseX V2', 'success');
}

function formatNum(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  if (n === 0) return '0';
  if (n < 0.000001) return n.toPrecision(8);
  if (n >= 1000000) return n.toLocaleString('en-US', {maxFractionDigits: 6});
  return n.toLocaleString('en-US', {minFractionDigits: 2, maxFractionDigits: 8});
}

function updateIcon(elId, val) {
  const el = document.getElementById(elId);
  const tok = parseToken(val);
  if (!el || !tok) return;
  
  const emojis = {
    'PLS': '🔷', 'WPLS': '🔷', 'HEX': '❤️', 'PLSX': '🟢',
    'INC': '🔷', 'USDC': '💵', 'USDT': '💵', 'DAI': '💰',
    'WETH': '♦️', 'WBTC': '🟡', 'KARROT': '🥕', 'RH': '🐇',
    'HDRN': '🌊', 'ICSA': '🔷', 'WATT': '⚡', 'PRV': '🔒',
    'TYRANT': '🦁', 'COM': '💎', 'MAXI': '🔷', 'DECI': '🔟'
  };
  
  el.textContent = emojis[tok.symbol] || '🪙';
}

function showStatus(msg, type) {
  let el = document.getElementById('status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'status';
    el.style.cssText = 'padding:8px 12px;margin:8px 0;border-radius:6px;text-align:center;font-size:0.8rem';
    document.querySelector('.card')?.insertBefore(el, document.querySelector('.card').firstChild);
  }
  el.textContent = msg;
  el.style.background = type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)';
  el.style.color = type === 'success' ? '#0f0' : '#f00';
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

window.KarrotDEX = {
  connectWallet: async () => {
    if (!window.ethereum) {
      alert('Install MetaMask');
      return;
    }
    const p = new ethers.providers.Web3Provider(window.ethereum);
    await p.send('eth_requestAccounts', []);
    const addr = await p.getSigner().getAddress();
    document.getElementById('connectWallet').textContent = addr.slice(0,6) + '...' + addr.slice(-4);
  }
};

console.log('🥕 KarrotDEX loaded');
