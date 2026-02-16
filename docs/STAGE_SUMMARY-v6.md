# ChainVine 阶段性总结文档 v6

> **生成时间**: 2026-02-16 00:30  
> **上一版**: 2026-02-14（v5，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: ChainVine — 面向区块链的漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03-25  
> **学校**: 成都信息工程大学 · 信息安全专业  
> **仓库**: https://github.com/AiorcaLin/ChainVine  
> **Release**: v0.1.0 tag 已推送至 GitHub（答辩基线版）

---

## 1. v6 核心变更：Bug 修复 + DashScope 修复 + 前端多 Provider + StreamAI

### 1.1 变更概述

v6 完成了四大改进：
1. **流式模式 Bug 修复**：`dualEngineAnalyzerServer.ts` 中 `TextEncoder` 未使用的 Bug，所有 SSE 输出现已正确编码为 `Uint8Array`（符合 WHATWG Fetch Standard）
2. **DashScope 连接修复**：因美国代理导致北京端点 (`dashscope.aliyuncs.com`) 被地理限制拦截，切换到弗吉尼亚端点 (`dashscope-us.aliyuncs.com`) + 弗吉尼亚 API Key
3. **前端多 Provider 支持**：用户可在 UI 中选择 Neversight / DashScope (通义千问) / OpenAI 三种 Provider；DashScope/OpenAI 通过 `/api/ai-analyze` 服务器端代理调用，API Key 不暴露给前端
4. **前端 StreamAI（流式输出）**：审计过程中实时展示 AI 文本输出（逐 chunk 渲染），5 层流式管道从 LLM Provider → 服务器 → 浏览器 → 分析器 → UI，150ms 节流更新

### 1.2 新增文件清单（3 个）

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/utils/dashscope-models.ts` | DashScope 弗吉尼亚区域可用模型定义（5 个模型） | ~45 |
| `src/app/api/ai-analyze/route.ts` | 前端 AI 分析代理路由（同步 JSON + 流式 SSE 两种模式） | ~100 |
| `docs/STAGE_SUMMARY-v6.md` | 本文档 | — |

### 1.3 修改文件清单（10 个）

| 文件 | 改动 |
|------|------|
| `src/services/audit/dualEngineAnalyzerServer.ts` | **Bug 修复**: `ReadableStream<string>` → `ReadableStream<Uint8Array>`；所有 `controller.enqueue()` 改为 `encoder.encode()` 包装 |
| `.env.local` | DashScope 切换弗吉尼亚 Key + 弗吉尼亚端点 `dashscope-us.aliyuncs.com` |
| `.env.example` | 完善文档：增加 PROXY_URL、SLITHER_SERVICE_URL、DashScope 三区域端点说明、POLYGONSCAN |
| `src/types/ai.ts` | 新增 `AIProvider` 类型（`"neversight" \| "dashscope" \| "openai"`）；`AIConfig` 增加 `provider` 字段 |
| `src/utils/ai.ts` | **重写**: Provider 路由逻辑（Neversight 浏览器直连 / DashScope·OpenAI 服务器代理）；新增 `onChunk` 流式回调参数；新增 `parseSSEStream()` 统一 SSE 解析器；新增 `getDefaultModelForProvider()` |
| `src/components/audit/AIConfigModal.tsx` | **重写**: 3 Provider 选择器（卡片式 UI）；根据 Provider 动态切换模型列表；服务器端 Provider 不显示 API Key 输入框，显示 "configured on server" 提示 |
| `src/services/audit/contractAnalyzer.ts` | 新增 `onChunk` 参数透传给 `analyzeWithAI` |
| `src/services/audit/dualEngineAnalyzer.ts` | `DualEngineProgress` 新增 `"ai-chunk"` stage + `aiChunk` 字段；将 `onChunk` 回调从 `contractAnalyzer` 透传到 `onProgress` |
| `src/components/audit/SourcePreview.tsx` | StreamAI UI：`streamingRef`(累积) + `streamingText`(节流 150ms 同步) + 自动滚动；加载浮层新增流式文本展示区域（720px 宽、max-h-45vh 可滚动） |
| `src/app/(with-header)/audit/page.tsx` | 同 SourcePreview：单文件 tab + 多文件 tab 两处 overlay 都增加了 StreamAI 支持 |

---

## 2. 项目架构概述（v6 更新）

```
chainvine-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # 根布局
│   │   ├── globals.css                         # 全局CSS + 明暗主题CSS变量
│   │   ├── icon.svg                            # SVG favicon
│   │   ├── (with-header)/                      # Route Group — 带全局Header的页面
│   │   │   ├── layout.tsx                      # Header布局
│   │   │   ├── page.tsx                        # 首页 / （待 v6 UI 重设计，未完成）
│   │   │   └── audit/
│   │   │       ├── page.tsx                    # 🔄 主审计页面（StreamAI overlay）
│   │   │       └── analyze/page.tsx            # 分析结果页
│   │   ├── (fullscreen)/                       # Route Group — 全屏页面
│   │   │   └── audit/
│   │   │       └── source/page.tsx             # 源码查看页
│   │   └── api/
│   │       ├── agent/audit/route.ts            # Agent审计API（同步+流式）
│   │       ├── ai-analyze/route.ts             # 🆕 前端AI分析代理（同步+流式SSE）
│   │       ├── contract-info/route.ts          # 合约信息API
│   │       ├── source/route.ts                 # 源码获取API
│   │       └── slither/route.ts                # Slither代理API
│   ├── services/
│   │   ├── llm/                                # LLM Provider抽象层
│   │   │   ├── types.ts                        # 类型定义
│   │   │   └── client.ts                       # 统一调用客户端
│   │   └── audit/
│   │       ├── dualEngineAnalyzer.ts           # 🔄 浏览器端双引擎编排器（+StreamAI onChunk）
│   │       ├── dualEngineAnalyzerServer.ts     # 🔄 服务器端双引擎编排器（TextEncoder修复）
│   │       ├── contractAnalyzer.ts             # 🔄 浏览器端AI分析器（+onChunk透传）
│   │       ├── contractAnalyzerServer.ts       # 服务器端AI分析器
│   │       ├── findingFusion.ts                # 融合算法（共用）
│   │       ├── slitherAnalyzer.ts              # Slither通信（共用）
│   │       ├── reportGenerator.ts              # 报告生成
│   │       └── prompts.ts                      # AI提示词
│   ├── components/
│   │   ├── audit/
│   │   │   ├── AIConfigModal.tsx               # 🔄 AI配置弹窗（3 Provider选择器）
│   │   │   ├── SourcePreview.tsx               # 🔄 源码预览+分析（StreamAI overlay）
│   │   │   └── ...                             # 其他组件未修改
│   │   └── ...
│   ├── types/
│   │   ├── ai.ts                               # 🔄 AI类型（+AIProvider +provider字段）
│   │   └── ...
│   ├── utils/
│   │   ├── ai.ts                               # 🔄 AI工具（Provider路由+SSE解析+流式）
│   │   ├── dashscope-models.ts                 # 🆕 DashScope模型定义
│   │   ├── neversight-models.ts                # Neversight模型定义（未修改）
│   │   ├── openai-models.ts                    # OpenAI模型定义（未修改）
│   │   └── ...
│   └── instrumentation.ts                      # 全局fetch代理
├── slither-service/                            # Slither Docker微服务
├── docs/
│   ├── STAGE_SUMMARY-v6.md                     # 🆕 本文档
│   ├── STAGE_SUMMARY-v5.md                     # v5文档（保留）
│   ├── openapi-agent-audit.yaml                # OpenAPI 3.0接口文档
│   ├── USAGE.md                                # 使用文档
│   ├── PRD.md / DESIGN.md                      # 需求/设计文档
│   └── 测试记录/                                # 手动测试记录
├── .env.local                                  # 🔄 环境配置
├── .env.example                                # 🔄 环境变量模板
└── docker-compose.yml                          # Slither容器编排
```

---

## 3. 技术架构说明（v6 更新）

### 3.1 三条调用链路

**浏览器端 — Neversight（原有，保留）**：
```
用户在 UI 操作
  → AIConfigModal (provider=neversight, API Key 存 localStorage)
  → contractAnalyzer.ts → analyzeWithAI (utils/ai.ts)
  → 浏览器直连 Neversight API (https://api.neversight.dev/v1)
  → dualEngineAnalyzer.ts (浏览器端编排)
```

**浏览器端 — DashScope/OpenAI（v6 新增）**：
```
用户在 UI 操作
  → AIConfigModal (provider=dashscope/openai, 无需输入 Key)
  → contractAnalyzer.ts → analyzeWithAI (utils/ai.ts)
  → fetch /api/ai-analyze (同步 or SSE 流式)
    → 服务器读取 .env.local 中的 API Key
    → chatCompletion / chatCompletionStream (services/llm/client.ts)
    → 路由到 DashScope / OpenAI 端点
  → dualEngineAnalyzer.ts (浏览器端编排)
```

**服务器端 — Agent API（v5，保留）**：
```
外部 Agent/脚本
  → POST /api/agent/audit (x-agent-api-key 鉴权)
  → dualEngineAnalyzerServer.ts (服务器端编排)
  → 返回结构化 JSON 或 SSE 流
```

### 3.2 StreamAI 5 层流式管道

```
┌─────────────────────────────────────────────────────────────┐
│  LLM Provider (DashScope/OpenAI/Neversight)                 │
│  → SSE: data: {choices:[{delta:{content:"chunk"}}]}         │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────┴───────────────────────────────────────────┐
│  /api/ai-analyze (服务器) 或 浏览器直连                       │
│  → SSE: data: "chunk"                                       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────┴───────────────────────────────────────────┐
│  utils/ai.ts → parseSSEStream()                             │
│  → onChunk("chunk") 回调                                    │
│  → 返回完整文本 Promise<string>                              │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────┴───────────────────────────────────────────┐
│  contractAnalyzer.ts → dualEngineAnalyzer.ts                │
│  → onProgress({ stage: "ai-chunk", aiChunk: "chunk" })      │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────┴───────────────────────────────────────────┐
│  SourcePreview.tsx / audit/page.tsx                          │
│  → streamingRef.current += chunk  (零开销累积)               │
│  → setInterval 150ms → setStreamingText()  (节流渲染)        │
│  → 加载浮层中展示实时 AI 输出 + 自动滚动                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 前端多 Provider 设计

- `types/ai.ts`: `AIProvider = "neversight" | "dashscope" | "openai"`
- `AIConfig.provider`: 保存在 localStorage，兼容旧配置（无 provider 字段默认 `"neversight"`）
- `AIConfigModal.tsx`: 3 个 Provider 卡片选择器，切换 Provider 自动切换默认模型
- `utils/ai.ts`: `analyzeWithAI()` 根据 provider 路由：
  - `neversight` → 浏览器直连 Neversight API（用户自带 Key）
  - `dashscope` / `openai` → `fetch /api/ai-analyze`（服务器代理，Key 在 .env.local）
- `/api/ai-analyze/route.ts`: 仅允许 `dashscope` 和 `openai`，同步 + 流式两种模式

### 3.4 DashScope 区域端点

| 区域 | 端点 | 适用场景 |
|------|------|---------|
| 北京 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 国内直连，无代理 |
| 弗吉尼亚 | `https://dashscope-us.aliyuncs.com/compatible-mode/v1` | **当前使用**，美国代理 |
| 新加坡 | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | 国际通用 |

**重要**: 不同区域的 API Key 不通用，模型列表也不同。弗吉尼亚区域经 `/models` API 查询确认有 54 个模型可用，但不包含北京区域的免费模型（`qwen-turbo`、`deepseek-v3.2`、`kimi-k2.5`）。

弗吉尼亚区域适合合约审计的模型：
- `qwen3-coder-plus` — 代码专精，推荐
- `qwen3-max` — 旗舰
- `qwen-plus` — 通用平衡（已测试通过）
- `qwen-flash` — 快速高效（已测试通过，50s/USDT 合约）
- `qwen3-coder-flash` — 代码+快速

---

## 4. 环境配置（v6 更新）

### .env.local（完整版）
```
# Block Explorer API Keys
NEXT_PUBLIC_ETHERSCAN_API_KEY=ZEPMPHXT1XUGQMT3HXEU9DE49TD21FG85Q
NEXT_PUBLIC_ARBISCAN_API_KEY=
NEXT_PUBLIC_BSCSCAN_API_KEY=
NEXT_PUBLIC_BASESCAN_API_KEY=
NEXT_PUBLIC_OPTIMISM_API_KEY=
NEXT_PUBLIC_POLYGONSCAN_API_KEY=

# 本地代理
PROXY_URL=http://127.0.0.1:10808

# Slither Docker
NEXT_PUBLIC_SLITHER_SERVICE_URL=http://localhost:8545
SLITHER_SERVICE_URL=http://localhost:8545

# Agent API 鉴权
AGENT_API_KEY=chainvine-agent-test-key

# LLM Providers（服务器端）
OPENAI_API_KEY=<你的OpenAI Key>
OPENAI_BASE_URL=https://api.openai.com/v1

# 通义千问 DashScope — 弗吉尼亚端点（美国代理适用）
# 北京 Key (国内直连时使用): sk-de1c2f92...
DASHSCOPE_API_KEY=<弗吉尼亚Key>
DASHSCOPE_BASE_URL=https://dashscope-us.aliyuncs.com/compatible-mode/v1

# Neversight 网关
NEVERSIGHT_API_KEY=<你的Neversight Key>
```

### 启动步骤（与 v5 相同）
```bash
# 1. 启动 Slither Docker
docker-compose up -d

# 2. 启动 Dev Server（修改 .env.local 后须删 .next 缓存）
rmdir /s /q .next
bun dev   # 或 npx next dev
# → http://localhost:3000

# 3. 浏览器端：进入 /audit，在 AI Configuration 中选择 Provider + Model
# 4. Agent API：通过 curl/脚本调用 POST /api/agent/audit
```

---

## 5. 测试状态（v6 更新）

### 5.1 已通过的测试

| 测试项 | Provider / Model | 结果 |
|--------|-----------------|------|
| Agent API 鉴权（无 Key） | - | ✅ 401 Unauthorized |
| Agent API 同步双引擎 | Neversight / gemini-3-flash | ✅ 56 findings, 2 cross-validated, 30s |
| **Agent API 同步双引擎** | **DashScope Virginia / qwen-plus** | ✅ 62 findings, 5 cross-validated, 228s |
| **Agent API 流式双引擎** | **DashScope Virginia / qwen-flash** | ✅ 1381 SSE events, 50s, TextEncoder 修复验证 |
| **`/api/ai-analyze` 同步** | **DashScope Virginia / qwen-flash** | ✅ HTTP 200, "Hello" 测试通过 |
| **DashScope `/models` 查询** | Virginia endpoint | ✅ 54 个模型可用 |
| **Dev Server 编译** | - | ✅ 零错误（所有新增/修改文件） |

### 5.2 未测试

| 测试项 | 说明 |
|--------|------|
| 前端 UI 多 Provider 切换（浏览器端） | 代码已实现，需在浏览器中实际操作验证 |
| 前端 StreamAI 流式展示效果 | 代码已实现，需在浏览器中触发分析查看效果 |
| OpenAI 直连 | 用户 OpenAI 无余额，跳过 |
| 大型合约（>2000 行） | 仅测了 USDT（~500 行） |
| Neversight 流式模式（浏览器直连 SSE） | 代码已实现，需浏览器验证 |

---

## 6. 已知问题与风险（v6 更新）

| # | 问题 | 严重度 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | DashScope 弗吉尼亚模型列表与北京不同 | 中 | 已解决 | 使用弗吉尼亚区域可用模型：qwen-plus/qwen-flash/qwen3-coder-plus 等 |
| 2 | OpenAI 无余额 | 低 | 已知 | 代码已实现，等用户充值 |
| 3 | Neversight API 余额低 | 中 | 已知 | $5.4 余额，建议用 gemini-3-flash 测试 |
| 4 | Monaco Editor 主题未联动 | 低 | 遗留 v4 | 亮主题下编辑器仍为黑色 |
| 5 | 无全局超时保护 | 中 | 遗留 v4 | AI 分析无硬超时限制 |
| 6 | **首页 UI 待重设计** | 中 | **进行中** | v6 未完成的 Task 6，见下方 §8.1 |
| 7 | 前端 StreamAI 未在浏览器中验证 | 低 | 待验证 | 代码已写完，编译通过，但需实际操作确认 |

---

## 7. 用户决策记录（v6 更新）

继承 v5 所有决策，新增：

| 决策 | 内容 |
|------|------|
| DashScope 区域 | 使用**弗吉尼亚端点**（`dashscope-us.aliyuncs.com`），因本地代理在美国 |
| 北京 Key 保留 | `.env.local` 中注释保留北京 Key，以便无代理时切换回去 |
| 前端多 Provider | 三种：Neversight（浏览器直连）/ DashScope（服务器代理）/ OpenAI（服务器代理） |
| StreamAI 节流 | 150ms 节流更新 UI（`setInterval` + `useRef`），避免高频 re-render |
| 首页重设计 | 保持 emerald 绿色藤蔓主题，增加视觉层次，突出双引擎核心卖点 |

---

## 8. 下一步行动计划（按优先级）

### 8.1 立即执行：首页 UI 重设计（v6 未完成）

**文件**: `src/app/(with-header)/page.tsx`

**设计方向**（已确定，代码未完成）：
- Hero 区域：ChainVineLogo + 大标题 + 中英双语副标题 + "Start Audit" CTA 按钮
- 架构示意图：Slither → Fusion ← AI(LLM) 三栏布局
- Stats Bar：2 Engines / 80+ Detectors / 8 Chains / 3 Providers
- Feature Grid：6 张卡片（Dual-Engine / 80+ Detectors / Multi-Model / 8 Chains / Proxy Detection / StreamAI）
- 保持 emerald accent 配色，增加 `bg-accent/5` 渐变背景装饰
- 响应式：`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Footer：© 2026 + AGPL-3.0 + GitHub 链接

### 8.2 验证：前端 StreamAI + 多 Provider
1. 在浏览器中打开 `http://localhost:3000/audit`
2. 输入 USDT 合约地址 `0xdAC17F958D2ee523a2206206994597C13D831ec7` + Ethereum
3. 打开 AI Configuration，选择 DashScope Provider + qwen-flash 模型
4. 点击 Start Analysis，观察：
   - 加载浮层是否正确展示 Provider/Model 信息
   - StreamAI 流式文本是否实时出现在浮层中
   - Slither/AI/Fusion 三阶段进度是否正确更新
5. 验证 Neversight Provider 是否仍正常工作

### 8.3 可选功能（按优先级）
1. **提示词微调** — 控制在可解释的改动范围内
2. **SKILL.md** — 给 Cursor AI 的项目说明

### 8.4 必做：UI 优化
- 审计相关页（`/audit`、`/audit/analyze`、`/audit/source`）视觉与布局优化
- **在所有功能稳定后，一次性做，避免反复**

### 8.5 必做：毕设文档
- 用户使用手册（基于 `docs/USAGE.md` 扩展）
- 毕设报告 + 查重
- 8 个阶段性周报（可基于 `STAGE_SUMMARY_v1~v6` 整理）

### 8.6 锁版
- 建议最晚 **3 月上旬**（3/8–3/10）完成功能+UI，之后只改文档和极小 bugfix
- 打 Release（如 v1.0.0），作为毕设提交的版本锚点

---

## 9. 关键文件速查（v6 更新）

| 文件 | 用途 | 行数 | v6 状态 |
|------|------|------|---------|
| `src/types/ai.ts` | AI 类型定义（+AIProvider） | ~15 | 🔄 修改 |
| `src/utils/ai.ts` | AI 工具（Provider 路由+SSE 解析+流式） | ~220 | 🔄 重写 |
| `src/utils/dashscope-models.ts` | 🆕 DashScope 弗吉尼亚模型定义 | ~45 | 🆕 新增 |
| `src/app/api/ai-analyze/route.ts` | 🆕 前端 AI 分析代理路由 | ~100 | 🆕 新增 |
| `src/components/audit/AIConfigModal.tsx` | AI 配置弹窗（3 Provider） | ~250 | 🔄 重写 |
| `src/services/audit/contractAnalyzer.ts` | 浏览器端 AI 分析器 | ~211 | 🔄 修改 |
| `src/services/audit/dualEngineAnalyzer.ts` | 浏览器端双引擎编排 | ~140 | 🔄 修改 |
| `src/services/audit/dualEngineAnalyzerServer.ts` | 服务器端双引擎编排 | ~287 | 🔄 修复 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析+StreamAI | ~941 | 🔄 修改 |
| `src/app/(with-header)/audit/page.tsx` | 主审计页面+StreamAI | ~1380 | 🔄 修改 |
| `src/app/(with-header)/page.tsx` | 首页 | ~185 | ⏳ 待重设计 |
| `src/services/llm/types.ts` | LLM Provider 类型定义 | ~39 | 未修改 |
| `src/services/llm/client.ts` | 统一 LLM 调用（同步+流式） | ~229 | 未修改 |
| `src/services/audit/contractAnalyzerServer.ts` | 服务器端 AI 分析器 | ~191 | 未修改 |
| `src/app/api/agent/audit/route.ts` | Agent API 路由 | ~187 | 未修改 |
| `docs/openapi-agent-audit.yaml` | OpenAPI 3.0 文档 | ~105 | 未修改 |
| `src/services/audit/findingFusion.ts` | 融合算法 | ~391 | 未修改 |
| `src/services/audit/slitherAnalyzer.ts` | Slither 通信 | ~271 | 未修改 |
| `src/services/audit/prompts.ts` | AI 提示词 | ~207 | 未修改 |
| `src/utils/neversight-models.ts` | Neversight 模型定义 | ~46 | 未修改 |
| `src/utils/openai-models.ts` | OpenAI 模型定义 | ~89 | 未修改 |

---

## 10. Agent API 调用示例（v6 更新）

### 同步模式（PowerShell）— DashScope 弗吉尼亚
```powershell
$headers = @{
  "Content-Type" = "application/json"
  "x-agent-api-key" = "chainvine-agent-test-key"
}
$body = '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"dashscope","model":"qwen-plus","language":"chinese-simplified","superPrompt":false}'
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/agent/audit" -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 300
$r.Content | ConvertFrom-Json
```

### 流式模式（PowerShell）— DashScope 弗吉尼亚
```powershell
$body = '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"dashscope","model":"qwen-flash","stream":true}'
$headers = @{ "Content-Type" = "application/json"; "x-agent-api-key" = "chainvine-agent-test-key" }
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/agent/audit" -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 300
# SSE events: slither(1) + chunk(1000+) + fusion(1) + done(1)
```

### 前端 AI 代理（/api/ai-analyze）— 前端内部调用
```powershell
# 同步
$body = '{"prompt":"Say hello","provider":"dashscope","model":"qwen-flash"}'
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/ai-analyze" -Body $body -ContentType "application/json"

# 流式
$body = '{"prompt":"Say hello","provider":"dashscope","model":"qwen-flash","stream":true}'
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/ai-analyze" -Body $body -ContentType "application/json"
```

---

## 11. DashScope 弗吉尼亚可用模型参考

通过 `/models` API 查询（2026-02-16），适合合约审计的文本模型：

| 模型 ID | 推荐度 | 说明 |
|---------|--------|------|
| `qwen3-coder-plus` | ⭐⭐⭐ | 代码专精，最适合 Solidity 审计 |
| `qwen3-max` | ⭐⭐⭐ | 旗舰模型 |
| `qwen-plus` | ⭐⭐ | 通用平衡（已测试通过：228s/USDT） |
| `qwen-flash` | ⭐⭐ | 快速高效（已测试通过：50s/USDT） |
| `qwen3-coder-flash` | ⭐⭐ | 代码+快速 |
| `qwen3-32b` | ⭐ | 开源 32B 参数 |

注意：北京区域的免费模型（`qwen-turbo`、`deepseek-v3.2`、`kimi-k2.5`）在弗吉尼亚不可用。

---

## 12. 对话角色设定

- **AI角色**: 区块链、金融、AI领域全球顶级专家
- **用户角色**: 同上，本科毕业设计学生
- **回答要求**: 必须提出科学参考资料，引用处解释；中文回答
- **项目性质**: 成都信息工程大学 · 信息安全专业 · 本科毕业设计

---

## 13. 版本变更日志

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1 | 2026-02-09 | 初始文档，P0功能完成 |
| v2 | 2026-02-10 | Fix 1-4 + Address模式计时器 |
| v3 | 2026-02-11 | 绿色藤蔓主题改造 + 语义色 |
| v4 | 2026-02-13 | 仓库迁移 + SVG Logo + Route Groups + 全局语义色清理 + UI修复 |
| v5 | 2026-02-14 | Agent API + LLM Provider 抽象层 + StreamAI(Agent) + OpenAPI + 服务器端分析器 |
| v6 | 2026-02-16 | **流式 Bug 修复**(TextEncoder) + **DashScope 弗吉尼亚修复** + **前端多 Provider**(AIConfigModal 3 Provider) + **前端 StreamAI**(5 层流式管道+UI) + **/api/ai-analyze** 代理路由 + **DashScope 模型定义** |

---

## 14. 参考文献（v6 引用）

| 编号 | 引用 | 用途 |
|------|------|------|
| [1] | Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000 | 双引擎融合算法的理论基础 |
| [2] | WHATWG Fetch Standard, "Response Body" | SSE 流式输出的标准实现：`Response` 构造函数接受 `ReadableStream<Uint8Array>`，非 `string` |
| [3] | Alibaba Cloud Model Studio, "DashScope API Reference", 2026-01-30 updated | DashScope 多区域端点（北京/弗吉尼亚/新加坡）和 OpenAI-compatible 模式 |
| [4] | Feist et al., "Slither: A Static Analysis Framework for Smart Contracts", WETSEB 2019 | Slither 核心论文 |
| [5] | Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023 | Agent API 设计理论基础 |
| [6] | Alibaba Cloud, "Qwen3-Coder Technical Report", 2025 | 代码专精大模型在 HumanEval/MBPP 上的表现 |
| [7] | Nielsen, J., "Response Time Limits", Nielsen Norman Group | 流式输出降低感知等待时间的 UX 理论：10s 规则 |

---

*文档结束。v6 核心：修复 + DashScope + 前端多 Provider + 前端 StreamAI。下一步：首页 UI 重设计 + 浏览器验证 StreamAI。*
