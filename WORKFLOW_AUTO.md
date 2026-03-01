# WORKFLOW_AUTO.md - Automated Workflows

*Scheduled tasks and automated procedures for the Karrot ecosystem.*

---

## File Organization Cron

**Schedule:** Daily at 8:00 PM AST
**Source:** `C:\Users\chels\Documents`
**Destination:** `C:\Users\chels\PROJECTS`

### Organization Rules

| Category | File Types | Destination |
|----------|-----------|-------------|
| Smart Contracts | .sol | `01-KarrotDex/contracts/` or `03-BradfordDeFi/contracts/` |
| Scripts | .js, .ts | Project `/scripts/` folders |
| Web/Games | .html | `04-Games/` or `05-Social/` |
| CAD Files | .scad | `02-DadBule/OpenSCAD/` |
| CAD Exports | .png, .jpg, .svg | `06-Assets/CAD-Exports/` |
| Documentation | .txt, .md | Project `/docs/` folders |
| Archive (90+ days) | All types | `99-Archive/` |

### Procedure
1. Scan Documents folder for files
2. Categorize by extension and content
3. Move to appropriate PROJECTS subfolder
4. Log results to memory file
5. Report: "Total Files Organized: X"

---

## Security Testing Heartbeat

**Schedule:** Every hour
**Target:** All KARROT369 contracts
**Goal:** Maintain 100% BLOCKED status

### Testing Protocol
1. Run 20-50 attack vectors per hour
2. Rotate categories: Reentrancy, Flash Loans, Arithmetic, Oracle, Cross-Chain
3. Report findings immediately
4. Log to `memory/security-reports/YYYY-MM-DD_HHMM.md`

### Status Format
```
🛡️ SECURITY TEST RESULTS — [Category]
Tests Run: XX new attacks this hour
Pass Rate: 100% (XX/XX BLOCKED)
Status: ✅ ALL BLOCKED
```

---

## Price Feed Updates

**Schedule:** Every 15 seconds (DEX API polling)
**Sources:** PulseX, PancakeSwap, Uniswap, SushiSwap, Jupiter, Raydium, THORChain
**Target:** `https://karrot369.github.io/karrot-dex/`

### Endpoints
- PulseX Subgraph: `graph.pulsechain.com`
- PancakeSwap: `api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2-bsc`
- Uniswap V3: `api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`
- SushiSwap: `api.thegraph.com/subgraphs/name/sushiswap/exchange`
- Jupiter: `price.jup.ag/v4/price`
- Raydium: `api.raydium.io/v2/main/pairs`
- THORChain: `midgard.thorchain.info/v2/pools`

---

## Git Sync Checks

**Schedule:** After every significant change
**Repos:** karrot-dex, karrot_shrine, ncelbi2, etc.

### Procedure
1. `git add -A`
2. `git commit -m "[descriptive message]"`
3. `git push origin main`
4. Verify deployment on GitHub Pages

---

## Memory Management

**Schedule:** End of each session
**Files:**
- `memory/YYYY-MM-DD.md` — Daily activity log
- `MEMORY.md` — Curated long-term memory

### Procedure
1. Document completed tasks
2. Update file lists
3. Note security test results
4. Record URLs and deployments

---

## Health Checks

**Schedule:** On heartbeat prompt
**Checklist:**
- [ ] Read HEARTBEAT.md
- [ ] Read WORKFLOW_AUTO.md
- [ ] Read memory/YYYY-MM-DD.md
- [ ] Check GitHub Pages deployments
- [ ] Verify price feeds active
- [ ] Security tests passing

If all clear: Reply `HEARTBEAT_OK`
If issues: Report immediately

---

*Last Updated: February 22, 2026*