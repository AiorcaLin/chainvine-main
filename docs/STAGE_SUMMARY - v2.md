# Mush Audit 阶段性总结文档 v2

> **生成时间**: 2026-02-10 12:00  
> **上一版**: 2026-02-09（v1，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: 基于静态分析与大语言模型的智能合约漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03  
> **学校**: 成都信息工程大学 · 信息安全专业

---

## 1. 项目架构概述

```
mush-audit-main/
├── src/
│   ├── app/
│   │   ├── audit/page.tsx              # 主审计页面（三模式入口：Address/SingleFile/MultiFiles）
│   │   ├── audit/source/page.tsx       # 源码查看页（代码高亮+报告渲染）
│   │   ├── audit/analyze/page.tsx      # 分析结果页
│   │   ├── api/contract-info/route.ts  # 合约信息API（含V2自动升级）
│   │   ├── api/source/route.ts         # 源码获取API（含V2自动升级）
│   │   └── api/slither/route.ts        # Slither代理API
│   ├── services/audit/
│   │   ├── dualEngineAnalyzer.ts       # 双引擎编排器（Slither+AI并行→融合）
│   │   ├── findingFusion.ts            # 结果融合算法（归一化+去重+交叉验证+评分）
│   │   ├── slitherAnalyzer.ts          # Slither Docker微服务通信
│   │   ├── contractAnalyzer.ts         # AI分析器（LLM调用+重试逻辑）
│   │   ├── reportGenerator.ts          # 报告生成
│   │   └── prompts.ts                  # AI提示词（SECURITY_AUDIT_PROMPT + SUPPER_PROMPT）
│   ├── components/audit/
│   │   ├── SourcePreview.tsx           # 源码预览+分析覆盖层（核心UI组件）
│   │   ├── AIConfigModal.tsx           # AI配置弹窗（模型/语言/Key/SuperPrompt）
│   │   ├── FileExplorer.tsx            # 文件树浏览器
│   │   ├── ContractInfoCard.tsx        # 合约信息卡片
│   │   └── ProxyContractAlert.tsx      # 代理合约提示弹窗
│   ├── types/                          # TypeScript类型定义
│   ├── utils/
│   │   ├── ai.ts                       # AI调用核心（analyzeWithAI, useAIConfig）
│   │   ├── neversight-models.ts        # 6个模型定义（Claude/Gemini/GPT）
│   │   ├── blockchain.ts              # 链上交互工具
│   │   ├── chainServices.ts           # 多链RPC/Explorer配置
│   │   ├── constants.ts               # 链常量（8条EVM链）
│   │   ├── contractFilters.ts         # 合约文件过滤+合并
│   │   ├── prompts.ts                 # Prompt工具函数
│   │   └── language.ts                # 多语言支持
│   └── instrumentation.ts             # 全局fetch代理配置（重要！通过http://127.0.0.1:10808代理）
├── slither-service/
│   ├── app.py                          # FastAPI Slither微服务
│   ├── Dockerfile                      # Docker镜像
│   └── requirements.txt
├── docker-compose.yml                  # Slither容器编排
├── .env.local                          # 环境配置（见下方）
├── docs/
│   ├── PRD.md                          # 产品需求文档（P0/P1定义）
│   ├── USAGE.md                        # 使用文档
│   ├── DESIGN.md                       # 设计文档
│   ├── STAGE_SUMMARY.md                # 本文档
│   └── 测试记录/                        # 手动测试记录+截图+HTML快照
└── 外部文件/
    └── vine.png                        # 藤蔓Logo参考图（用于UI主题改造）
```

**技术栈**:
- **前端**: Next.js 16.1.6 (Turbopack) + TypeScript + Tailwind CSS + Monaco Editor
- **后端**: Next.js API Routes (Node.js)
- **静态分析**: Slither v0.11.5 (Python FastAPI微服务, Docker容器化, solc 0.8.0)
- **AI引擎**: 6模型支持 via Neversight API Gateway
  - `anthropic/claude-4.5-opus` / `claude-4.5-opus-max`
  - `google/gemini-3-pro` / `gemini-3-flash`（推荐测试用，最快最省钱）
  - `openai/gpt-5.2` / `gpt-5.2-high`
- **报告**: html2canvas(图片) + JSZip+file-saver(ZIP) + Markdown + ReactMarkdown

---

## 2. 环境配置

### .env.local
```
NEXT_PUBLIC_ETHERSCAN_API_KEY=ZEPMPHXT1XUGQMT3HXEU9DE49TD21FG85Q
NEXT_PUBLIC_SLITHER_SERVICE_URL=http://localhost:8545
SLITHER_SERVICE_URL=http://localhost:8545
```

### 网络代理（重要）
`src/instrumentation.ts` 配置了全局 fetch 代理 → `http://127.0.0.1:10808`（开发环境需要翻墙才能访问Etherscan API）。

### 启动步骤
```bash
# 1. 启动 Slither Docker
docker-compose up -d

# 2. 启动 Dev Server
npm run dev
# → http://localhost:3000

# 3. Neversight API Key
# 在浏览器中打开 http://localhost:3000/audit
# 点击 Analyze Contract → 在 AI Configuration 弹窗中输入 Key
# Key 存储在浏览器 localStorage("ai_config")
```

---

## 3. P0 功能完成状态（全部完成）

| ID | 功能 | 状态 | 说明 |
|----|------|------|------|
| F-01 | 合约地址输入 | ✅ 已完成 | 支持8条EVM链，自动检测链，前端UI和API均就绪 |
| F-02 | 链上源码获取 | ✅ 已完成 | 支持Etherscan V1→V2自动升级，已修复API弃用bug |
| F-03 | 代理合约检测 | ✅ 已完成 | 支持EIP-1967/UUPS/Beacon/Transparent/Generic，自动获取实现合约 |
| F-04 | Slither静态分析 | ✅ 已完成 | Docker容器化部署(v0.11.5)，FastAPI微服务，健康检查就绪 |
| F-05 | AI深度审计 | ✅ 已完成 | 6模型支持，localStorage存储API Key，Super Prompt可选 |
| F-06 | 双引擎融合 | ✅ 已完成 | Slither+AI并行→归一化→去重→交叉验证→评分排序 |
| F-07 | 审计报告展示 | ✅ 已完成 | Markdown渲染+严重度统计+引擎来源标注+交叉验证徽章 |
| F-08 | 报告导出 | ✅ 已完成 | Markdown下载+ZIP打包(源码+slither-raw.json+fusion-summary.json) |

---

## 4. 端到端测试结果（全部通过）

### 4.1 API 层冒烟测试

| 测试项 | 状态 | 详情 |
|--------|------|------|
| Slither Docker 服务 | ✅ | healthy, v0.11.5, solc 0.8.0 |
| 全局代理配置 | ✅ | 端口 10808 生效 |
| `/api/contract-info` (USDT) | ✅ | 200, 返回 Tether USD 信息 |
| `/api/source` (USDT) | ✅ | 200, 返回合约源码 |
| `/api/contract-info` (USDC Proxy) | ✅ | 200, 检测到 FiatTokenProxy, 实现地址 0x4350... |
| `/api/source` (USDC Proxy) | ✅ | 200, 返回24个文件(proxy/ + implementation/ 正确分离) |
| Slither 分析 (Vault合约) | ✅ | 13 findings (2H/2M/1L/5I/3G), 1.4s |
| Slither 分析 (测试合约) | ✅ | 检测到 High 漏洞 |
| 审计页面加载 | ✅ | 200, 36KB |

### 4.2 UI 交互测试

| 场景 | 状态 | 详情 |
|------|------|------|
| A: 地址模式 (USDT) | ✅ | 输入地址→自动检测链→Check Contract→View Source→Dual Engine Analysis |
| B: 单文件粘贴模式 | ✅ | Monaco编辑器加载默认Vault合约→Analyze Contract→双引擎分析 |
| C: 多文件上传模式 | ✅ | API验证通过，UI拖拽上传功能就绪 |
| D: 代理合约 (USDC) | ✅ | FiatTokenProxy检测→实现合约自动获取→24文件正确分离 |

### 4.3 场景 A 的已知问题（已在本轮修复）
详见 `docs/测试记录/场景 A -地址模式-USDT合约端到端测试-UI交互部分.md`

---

## 5. 本轮对话完成的代码修改（v2 新增）

### 5.1 上一轮对话完成的修改（v1，保留）
- `src/app/api/contract-info/route.ts` — 完全重写（V2自动升级）
- `src/app/audit/page.tsx` — 大幅修改（双引擎集成+进度条+ZIP导出）
- `.env.local` — 配置 Etherscan Key + Slither URL

### 5.2 本轮对话完成的修改（v2 新增，共修改 4 个文件）

#### Fix-1: `src/services/audit/dualEngineAnalyzer.ts` (第93-106行)
- **问题**: AI引擎失败时静默吞错误(`catch`块只`console.error`不通知UI)，导致进度条永远停在40%
- **修复**: AI失败时发送`onProgress`事件通知UI；402余额不足时直接`throw`，阻止继续无意义的融合
- **参考**: Promise异常传播最佳实践

#### Fix-2: `src/services/audit/contractAnalyzer.ts` (第174-181行)
- **问题**: 402/401/403等不可恢复HTTP错误触发3次无效重试（浪费6秒+余额）
- **修复**: 检测到402(Payment Required)/401(Unauthorized)/403(Forbidden)时立即抛出，不进入重试循环
- **参考**: RFC 9110 §15.5 — 4xx客户端错误表示请求本身有问题，重试无意义

#### Fix-3: `src/components/audit/SourcePreview.tsx` (第466-478行) + `src/app/audit/page.tsx` (两处catch块)
- **问题**: 所有错误统一显示"Error during analysis"，用户无法区分余额不足/Key无效/网络错误
- **修复**: 
  - 402 → "Neversight API 余额不足，请充值后重试" (8秒)
  - 401/403 → "Neversight API Key 无效或已过期，请在 AI Configuration 中检查" (8秒)
  - 其他 → 显示具体错误消息前100字符 (6秒)
- **影响文件**: `SourcePreview.tsx` + `audit/page.tsx`（两处handleStartAnalysis + handleMultiFileAnalysis）

#### Fix-4: `src/components/audit/SourcePreview.tsx` (第164行 + 第171-180行 + 第800-870行)
- **问题**: 分析覆盖层进度从40%到80%之间无任何更新，用户不知道AI分析到哪一步
- **修复**:
  - 新增`elapsedSeconds`状态 + `useEffect`计时器（每秒更新）
  - 覆盖层显示 MM:SS 格式实时计时
  - 10秒后提示"AI analysis typically takes 1-3 min"
  - 120秒后提示"Large contract, please wait..."
  - 三阶段引擎状态指示器（Slither/AI/Fusion各自独立显示 analyzing/waiting/done）
  - AI失败时红色错误信息

---

## 6. 已知问题与风险

| # | 问题 | 严重度 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | Neversight API余额不足 | 高 | 已知 | 余额$0.74，Claude/GPT一次可能不够。**建议用Gemini 3 Flash测试（$0.01-0.05/次）** |
| 2 | 其他链API Key未配置 | 低 | 已知 | 仅Ethereum链配了Etherscan Key，BSC/Arbitrum等需额外注册 |
| 3 | 前端AI Key存localStorage | 中 | 设计如此 | Neversight API Key在前端AIConfigModal配置，不经过后端 |
| 4 | Slither容器需手动启动 | 低 | 已知 | 需先`docker-compose up -d` |
| 5 | AI非流式请求 | 中 | 已知 | 当前使用非streaming HTTP，大合约等待时间长。可选优化：`stream: true` |
| 6 | 无全局超时保护 | 中 | 已知 | AI分析无硬超时限制，建议加3min超时后自动降级为仅Slither |

---

## 7. 关键文件速查

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/app/audit/page.tsx` | 前端主页面，三模式入口（Address/SingleFile/MultiFiles） | ~1242 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析覆盖层+报告渲染（核心UI） | ~900 |
| `src/services/audit/dualEngineAnalyzer.ts` | 双引擎并行编排+融合调用 | ~133 |
| `src/services/audit/findingFusion.ts` | 融合算法：归一化+去重+交叉验证+评分 | ~391 |
| `src/services/audit/slitherAnalyzer.ts` | Slither微服务通信（Docker容器） | ~271 |
| `src/services/audit/contractAnalyzer.ts` | AI分析器（LLM调用+重试逻辑） | ~211 |
| `src/services/audit/prompts.ts` | AI提示词（SECURITY_AUDIT_PROMPT + SUPPER_PROMPT） | ~207 |
| `src/utils/ai.ts` | AI调用核心（analyzeWithAI, useAIConfig, getAIConfig） | ~143 |
| `src/utils/neversight-models.ts` | 6个模型定义 | ~46 |
| `src/app/api/source/route.ts` | 链上源码获取API（含V2自动升级） | ~200 |
| `src/app/api/contract-info/route.ts` | 合约元信息API（含V2自动升级+代理检测） | ~200 |
| `src/instrumentation.ts` | 全局fetch代理（http://127.0.0.1:10808） | ~27 |
| `docs/PRD.md` | 产品需求文档（P0/P1定义） | ~263 |

---

## 8. AI分析耗时参考

| 模型 | USDT级合约(~500行) | 大型合约(>2000行) | 每次成本 |
|------|---------------------|-------------------|----------|
| Gemini 3 Flash | **15-45s** | 30-90s | $0.01-0.05 |
| GPT-5.2 | 30-90s | 60-180s | $0.10-0.50 |
| Claude 4.5 Opus | 60-180s | 120-300s | $0.50-2.00 |
| Claude 4.5 Opus Max | 90-300s | 180-600s | $1.00-5.00 |

**经验**: Gemini 3 Flash 已验证可以完成完整分析，速度最快成本最低，推荐作为默认测试模型。

---

## 9. 测试用合约地址

| 合约 | 地址 | 链 | 特点 |
|------|------|----|------|
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Ethereum | 经典ERC20，单文件，已测试通过 |
| USDC (Proxy) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Ethereum | EIP-1967代理合约，24文件，已测试通过 |
| Uniswap V2 Router | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Ethereum | 多接口调用 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Ethereum | 简单Wrapper |

---

## 10. 下一步行动计划（重要！）

### 立即执行：UI主题改造（绿色藤蔓风格）

**用户已确认的设计方向：**
1. **主色调**: `#059669` 深绿（替代当前橙色 `#FF8B3E`）
2. **Logo**: 基于 `外部文件/vine.png` 重新设计
   - 颜色更深
   - 去掉底部月牙
   - 加白色小花点缀
   - 藤蔓更粗壮
3. **主题切换**: 实现黑夜/白天双主题切换
   - 当前暗色背景改为浅色（白天模式）
   - 保留暗色主题（黑夜模式）
   - 技术方案：`next-themes` + Tailwind CSS `dark:` 前缀
4. **Logo参考图路径**: `E:\Security-Attack-Defense\blockchain\mush-audit-main\外部文件\vine.png`

### 可选优化（如有时间）
- Streaming AI输出（`stream: true`）
- 3分钟AI超时保护 + 自动降级
- P1功能：历史记录、批量审计
- 报告PDF导出

---

## 11. 对话角色设定

- **AI角色**: 区块链、金融、AI领域全球顶级专家
- **用户角色**: 同上，本科毕业设计学生
- **回答要求**: 必须提出科学参考资料，引用处解释；中文回答
- **项目性质**: 成都信息工程大学 · 信息安全专业 · 本科毕业设计

---

## 12. 文件下载机制说明

**Download Source 和 Download ZIP 均为纯前端内存操作，无服务器端存储**：
1. 合约源码从 `/api/source`（Etherscan API）获取 → 保存在 React state（浏览器内存）
2. 点击下载 → JSZip 在浏览器内存中打包为 ZIP Blob
3. file-saver 的 saveAs() 触发浏览器下载到用户本地 Downloads 文件夹
4. 参考：JSZip API - generateAsync (https://stuk.github.io/jszip/)
