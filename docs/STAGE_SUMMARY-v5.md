# ChainVine 阶段性总结文档 v5

> **生成时间**: 2026-02-14 15:30  
> **上一版**: 2026-02-13（v4，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: ChainVine — 面向区块链的漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03-25  
> **学校**: 成都信息工程大学 · 信息安全专业  
> **仓库**: https://github.com/AiorcaLin/ChainVine  
> **Release**: v0.1.0 tag 已推送至 GitHub（答辩基线版）

---

## 1. v5 核心变更：Agent API + Provider 抽象层 + StreamAI

### 1.1 变更概述

v5 新增了三大能力：
1. **LLM Provider 抽象层**：统一 OpenAI / DashScope（通义千问）/ Neversight 三种 Provider 的调用接口
2. **Agent 同步审计 API**：`POST /api/agent/audit`，外部 AI Agent/脚本可通过 HTTP 调用完成 Slither+LLM 双引擎融合审计
3. **StreamAI 流式输出**：Agent API 支持 `stream: true` 参数，以 SSE（Server-Sent Events）逐 chunk 推送审计结果

### 1.2 新增文件清单（6 个）

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/services/llm/types.ts` | Provider 抽象层类型定义（`LLMProvider = "openai" \| "dashscope" \| "neversight"`） | ~39 |
| `src/services/llm/client.ts` | 统一 LLM 调用客户端：`chatCompletion`（同步）+ `chatCompletionStream`（流式 SSE） | ~229 |
| `src/services/audit/contractAnalyzerServer.ts` | 服务器端合约分析器（不依赖 localStorage，通过参数接收配置） | ~170 |
| `src/services/audit/dualEngineAnalyzerServer.ts` | 服务器端双引擎编排器（Slither+LLM 并行→融合，同步+流式两种模式） | ~240 |
| `src/app/api/agent/audit/route.ts` | Agent API 入口：鉴权 + 同步 JSON / 流式 SSE | ~170 |
| `docs/openapi-agent-audit.yaml` | OpenAPI 3.0 接口文档（机器可读接口契约） | ~100 |

### 1.3 修改文件清单（2 个）

| 文件 | 改动 |
|------|------|
| `.env.example` | 追加 `AGENT_API_KEY`、`OPENAI_API_KEY`、`DASHSCOPE_API_KEY`、`NEVERSIGHT_API_KEY` 等服务器端环境变量 |
| `docs/USAGE.md` | 追加 "Agent API" 章节（同步/流式调用示例 + SSE 事件说明 + Provider 列表） |

---

## 2. 项目架构概述（v5 更新）

```
chainvine-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # 根布局（精简版）
│   │   ├── globals.css                         # 全局CSS + 明暗主题CSS变量
│   │   ├── icon.svg                            # SVG favicon
│   │   ├── (with-header)/                      # Route Group — 带全局Header的页面
│   │   │   ├── layout.tsx                      # Header布局
│   │   │   ├── page.tsx                        # 首页 /
│   │   │   └── audit/
│   │   │       ├── page.tsx                    # 主审计页面 /audit
│   │   │       └── analyze/page.tsx            # 分析结果页 /audit/analyze
│   │   ├── (fullscreen)/                       # Route Group — 全屏页面
│   │   │   └── audit/
│   │   │       └── source/page.tsx             # 源码查看页 /audit/source
│   │   └── api/
│   │       ├── agent/audit/route.ts            # 🆕 Agent审计API（同步JSON+流式SSE）
│   │       ├── contract-info/route.ts          # 合约信息API
│   │       ├── source/route.ts                 # 源码获取API
│   │       └── slither/route.ts                # Slither代理API
│   ├── services/
│   │   ├── llm/                                # 🆕 LLM Provider抽象层
│   │   │   ├── types.ts                        # 🆕 类型定义（LLMProvider/LLMChatRequest/Response）
│   │   │   └── client.ts                       # 🆕 统一调用客户端（chatCompletion + chatCompletionStream）
│   │   └── audit/
│   │       ├── dualEngineAnalyzer.ts           # 浏览器端双引擎编排器（原有）
│   │       ├── dualEngineAnalyzerServer.ts     # 🆕 服务器端双引擎编排器（供Agent API用）
│   │       ├── contractAnalyzer.ts             # 浏览器端AI分析器（原有，依赖localStorage）
│   │       ├── contractAnalyzerServer.ts       # 🆕 服务器端AI分析器（通过参数接收配置）
│   │       ├── findingFusion.ts                # 结果融合算法（共用）
│   │       ├── slitherAnalyzer.ts              # Slither微服务通信（共用）
│   │       ├── reportGenerator.ts              # 报告生成
│   │       └── prompts.ts                      # AI提示词
│   ├── components/                             # 前端组件（未修改）
│   ├── types/                                  # TypeScript类型定义
│   ├── utils/                                  # 工具函数（未修改）
│   └── instrumentation.ts                      # 全局fetch代理（http://127.0.0.1:10808）
├── slither-service/                            # Slither Docker微服务
├── docs/
│   ├── openapi-agent-audit.yaml                # 🆕 OpenAPI 3.0接口文档
│   ├── USAGE.md                                # 🔄 使用文档（追加Agent API章节）
│   ├── STAGE_SUMMARY-v5.md                     # 🆕 本文档
│   ├── PRD.md / DESIGN.md                      # 需求/设计文档
│   └── 测试记录/                                # 手动测试记录
├── .env.local                                  # 🔄 环境配置（追加LLM Provider Keys）
├── .env.example                                # 🔄 环境变量模板
└── docker-compose.yml                          # Slither容器编排
```

---

## 3. 技术架构说明

### 3.1 两条调用链路（浏览器端 vs 服务器端）

**浏览器端（原有，保留不动）**：
```
用户在 UI 操作
  → AIConfigModal (API Key 存 localStorage)
  → contractAnalyzer.ts (读 localStorage)
  → analyzeWithAI (硬编码 Neversight endpoint)
  → dualEngineAnalyzer.ts (浏览器端编排)
```

**服务器端（v5 新增，供 Agent API 用）**：
```
外部 Agent/脚本
  → POST /api/agent/audit (x-agent-api-key 鉴权)
  → 内部调用 /api/source 拿合约源码
  → dualEngineAnalyzerServer.ts (服务器端编排)
    → 并行: Slither Docker + contractAnalyzerServer.ts
      → contractAnalyzerServer.ts 使用 LLM Provider 抽象层 (client.ts)
        → 根据 provider 参数路由到 OpenAI / DashScope / Neversight
    → findingFusion.ts 融合
  → 返回结构化 JSON 或 SSE 流
```

### 3.2 为什么有两套分析器

现有的 `contractAnalyzer.ts` 和 `dualEngineAnalyzer.ts` 依赖浏览器 `localStorage` 读取 AI 配置（API Key、模型等）。Agent API 运行在 Next.js 服务器端，没有 `localStorage`。因此创建了对应的 Server 版本：
- `contractAnalyzerServer.ts`：通过函数参数 `AgentAIConfig` 接收配置
- `dualEngineAnalyzerServer.ts`：调用 Server 版分析器，无 UI 回调

两套共用：`findingFusion.ts`、`slitherAnalyzer.ts`、`prompts.ts`、`language.ts`。

### 3.3 LLM Provider 抽象层

```
src/services/llm/
├── types.ts    → LLMProvider = "openai" | "dashscope" | "neversight"
│                 LLMChatRequest / LLMChatResponse
└── client.ts   → chatCompletion(req, signal)        → 同步调用
                  chatCompletionStream(req, signal)   → 返回 ReadableStream<string>
```

三个 Provider 均走 **OpenAI-compatible `/chat/completions`** 格式：
- **OpenAI**：`OPENAI_API_KEY` + `OPENAI_BASE_URL`（默认 `https://api.openai.com/v1`）
- **DashScope**：`DASHSCOPE_API_KEY` + `DASHSCOPE_BASE_URL`（默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`）
- **Neversight**：`NEVERSIGHT_API_KEY` + `NEVERSIGHT_BASE_URL`（默认 `https://api.neversight.dev/v1`）

所有 Key 从服务器环境变量读取，不从请求传入，不暴露给前端。

### 3.4 Agent API 详细说明

**端点**: `POST /api/agent/audit`

**鉴权**: Header `x-agent-api-key` 须匹配 `.env.local` 中的 `AGENT_API_KEY`

**请求体**:
```json
{
  "address": "0x...",           // 必填：合约地址
  "chain": "ethereum",          // 必填：链名
  "provider": "openai",         // 必填：openai | dashscope | neversight
  "model": "gpt-4o-mini",       // 必填：Provider原生模型id
  "language": "chinese-simplified", // 可选，默认 chinese-simplified
  "superPrompt": true,          // 可选，默认 true
  "stream": false               // 可选，默认 false；设 true 启用 SSE 流式
}
```

**同步模式返回**（`stream: false`）：
```json
{
  "ok": true,
  "input": { "address": "...", "chain": "...", "contractName": "..." },
  "ai": { "provider": "...", "model": "...", "language": "...", "superPrompt": true },
  "engines": ["Slither", "AI (LLM)"],
  "timings": { "slitherDurationMs": 948, "aiDurationMs": 30355, "totalDurationMs": 30652 },
  "fusion": { "findings": [...], "summary": {...}, "metadata": {...} },
  "report": {
    "mergedMarkdown": "# Smart Contract Security Audit Report ...",
    "aiMarkdown": "# Generated by ChainVine ...",
    "slither": { "success": true, "findings": [...], "summary": {...} }
  }
}
```

**流式模式**（`stream: true`）：返回 `text/event-stream`（SSE），事件类型：
- `chunk`：AI 文本增量
- `slither`：Slither 分析完成通知
- `fusion`：融合结果
- `done`：最终元数据
- `error`：错误

---

## 4. 环境配置（v5 更新）

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
DASHSCOPE_API_KEY=<你的DashScope Key>
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
NEVERSIGHT_API_KEY=<你的Neversight Key>
```

**重要**：修改 `.env.local` 后必须**重启 dev server**（且建议先 `rmdir /s /q .next` 清缓存），否则新环境变量不生效。

### 启动步骤
```bash
# 1. 启动 Slither Docker
docker-compose up -d

# 2. 启动 Dev Server
bun dev
# → http://localhost:3000

# 3. 浏览器端：在 AI Configuration 弹窗中输入 Neversight Key（存 localStorage）
# 4. Agent API：通过 curl/脚本调用 POST /api/agent/audit（Key 从 env 读取）
```

---

## 5. 测试状态

### 5.1 已通过的测试

| 测试项 | Provider | 结果 |
|--------|----------|------|
| 鉴权（无 Key） | - | ✅ 401 Unauthorized |
| 同步双引擎审计 | Neversight (gemini-3-flash) | ✅ Slither + AI，56 findings，2 cross-validated，30s |
| 同步双引擎审计（详细） | Neversight (gemini-3-flash) | ✅ 56 findings, slither 948ms, AI 30355ms, report 39558 chars |

### 5.2 未通过 / 待解决

| 测试项 | 问题 | 原因 | 解决方案 |
|--------|------|------|---------|
| DashScope 直连 | `Missing API key for provider "dashscope"` | 在 dev server 运行中添加的 Key 未被 Next.js 读取 | 删 `.next` 缓存 + 重启 dev server |

### 5.3 未测试

| 测试项 | 说明 |
|--------|------|
| OpenAI 直连 | 用户 OpenAI 无余额，跳过 |
| 流式模式 (`stream: true`) | 尚未执行 |
| 大型合约（>2000行） | 仅测了 USDT（~500行） |

---

## 6. 已知问题与风险（v5 更新）

| # | 问题 | 严重度 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | DashScope env 变量加载 | 中 | 待验证 | 删 `.next` + 重启后应正常，代码逻辑无误 |
| 2 | OpenAI 无余额 | 低 | 已知 | 代码已实现，等用户充值后可测 |
| 3 | 前端仍只支持 Neversight | 中 | 设计如此 | 前端 `AIConfigModal` 未改，仍只列 Neversight 模型；多 Provider 选择仅 Agent API 可用 |
| 4 | Neversight API 余额低 | 中 | 已知 | $5.4 余额，建议用 gemini-3-flash 测试 |
| 5 | 通义千问免费额度 | 低 | 已知 | TOP3 模型额度即将用尽；qwen-flash-character/deepseek-v3.2/kimi-k2.5 各有 1M 免费 |
| 6 | Monaco Editor 主题未联动 | 低 | 遗留 v4 | 亮主题下编辑器仍为黑色 |
| 7 | AI 非流式前端 | 中 | 已知 | 前端 UI 暂无流式展示；StreamAI 仅 Agent API 可用 |
| 8 | 无全局超时保护 | 中 | 遗留 v4 | AI 分析无硬超时限制 |

---

## 7. 用户决策记录

以下是用户在 v5 对话中明确做出的决策（新会话应遵守）：

| 决策 | 内容 |
|------|------|
| Agent API | **必须完成**。Slither+LLM 融合报告，同步，结构化 JSON，本机 env 保存 Key |
| Provider 抽象层 | 做一个 Provider 抽象层，优先 OpenAI + 通义千问，保留 Neversight |
| StreamAI | 已实现（Agent API 支持 `stream: true`） |
| 多链扩展 | **放弃**，写进论文"未来展望" |
| Mythril | **不加入**，可写进论文"未来工作" |
| UI 优化 | **必做**（首页 + 审计相关页视觉与布局），在功能完成后一次性做 |
| 部署环境 | 本地笔记本（联想 Y9000P），不上云，不需要异步 API |
| 量化策略 | 完成毕业论文后再做，不与毕设并行 |
| 毕业文档 | 需完成：用户使用手册 + 毕设报告及查重 + 8 个阶段性周报 |
| Release | v0.1.0 tag 已推送，GitHub Release 已创建 |
| SKILL.md | 给 AI（Cursor）看的，不是答辩交付物，建议写但不紧急 |

---

## 8. 下一步行动计划（按优先级）

### 8.1 立即执行：完成测试
1. 删 `.next` 缓存 + 重启 dev server
2. 验证 DashScope（通义千问）直连
3. 验证流式模式 (`stream: true`)

### 8.2 可选功能（按用户意愿优先级）
1. **前端多 Provider 支持**：改造 `AIConfigModal` + `ai.ts`，让用户在 UI 上也能选择 Provider
2. **前端 StreamAI**：审计页面实时展示 AI 输出（而非等待完整结果）
3. **提示词微调**：控制在可解释的改动范围内
4. **SKILL.md**：给 Cursor AI 的项目说明

### 8.3 必做：UI 优化
- 首页（`(with-header)/page.tsx`）重新设计
- 审计相关页（`/audit`、`/audit/analyze`、`/audit/source`）视觉与布局优化
- **在所有功能稳定后，一次性做，避免反复**

### 8.4 必做：毕设文档
- 用户使用手册（基于 `docs/USAGE.md` 扩展）
- 毕设报告 + 查重
- 8 个阶段性周报（可基于 `STAGE_SUMMARY_v1~v5` 整理）

### 8.5 锁版
- 建议最晚 **3 月上旬**（3/8–3/10）完成功能+UI，之后只改文档和极小 bugfix
- 打 Release（如 v1.0.0），作为毕设提交的版本锚点

---

## 9. 关键文件速查（v5 更新）

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/services/llm/types.ts` | 🆕 LLM Provider 类型定义 | ~39 |
| `src/services/llm/client.ts` | 🆕 统一 LLM 调用（同步+流式） | ~229 |
| `src/services/audit/contractAnalyzerServer.ts` | 🆕 服务器端 AI 分析器 | ~170 |
| `src/services/audit/dualEngineAnalyzerServer.ts` | 🆕 服务器端双引擎编排器 | ~240 |
| `src/app/api/agent/audit/route.ts` | 🆕 Agent API 路由 | ~170 |
| `docs/openapi-agent-audit.yaml` | 🆕 OpenAPI 3.0 文档 | ~100 |
| `src/app/(with-header)/audit/page.tsx` | 前端主页面 | ~1347 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析+报告 | ~897 |
| `src/services/audit/dualEngineAnalyzer.ts` | 浏览器端双引擎编排 | ~133 |
| `src/services/audit/findingFusion.ts` | 融合算法（两套共用） | ~391 |
| `src/services/audit/slitherAnalyzer.ts` | Slither 通信（两套共用） | ~271 |
| `src/services/audit/contractAnalyzer.ts` | 浏览器端 AI 分析器 | ~211 |
| `src/services/audit/prompts.ts` | AI 提示词 | ~207 |
| `src/utils/ai.ts` | 浏览器端 AI 调用核心 | ~143 |
| `src/utils/neversight-models.ts` | 6 个模型定义 | ~46 |
| `src/instrumentation.ts` | 全局 fetch 代理 | ~27 |

---

## 10. Agent API 调用示例（新会话可直接使用）

### 同步模式（PowerShell）
```powershell
$headers = @{
  "Content-Type" = "application/json"
  "x-agent-api-key" = "chainvine-agent-test-key"
}
$body = '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"neversight","model":"google/gemini-3-flash","language":"chinese-simplified","superPrompt":false}'
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/agent/audit" -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 300
$r.Content | ConvertFrom-Json
```

### 流式模式（待验证）
```powershell
$body = '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum","provider":"neversight","model":"google/gemini-3-flash","stream":true}'
# 流式输出需使用支持 SSE 的客户端（如 curl --no-buffer 或浏览器 EventSource）
```

---

## 11. DashScope 免费模型参考

用户 DashScope 账户的免费额度模型（可用于 `provider: "dashscope"` 测试）：

| 模型 | 剩余额度 |
|------|---------|
| `qwen-flash-character` | 1,000,000 |
| `deepseek-v3.2` | 1,000,000 |
| `kimi-k2.5` | 1,000,000 |

注意：`qwen-max` 等 TOP3 模型的免费额度即将用尽。

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
| v5 | 2026-02-14 | **Agent API**(`POST /api/agent/audit`) + **LLM Provider抽象层**(OpenAI/DashScope/Neversight) + **StreamAI**(SSE流式输出) + **OpenAPI文档** + **服务器端分析器**(不依赖localStorage) + GitHub Release v0.1.0 |

---

## 14. 参考文献（v5 引用）

| 引用 | 用途 |
|------|------|
| Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023 | Agent 通过工具调用接口获取能力扩展的理论基础 |
| Schick et al., "Toolformer: Language Models Can Teach Themselves to Use Tools", NeurIPS 2023 | 模型学习调用外部工具 API 的范式 |
| OpenAPI Specification 3.0 | 机器可读接口契约标准 |
| RFC 9110 §15.5 | 4xx 客户端错误不应重试的依据 |
| OpenAI Streaming API 文档 | SSE 流式输出的实现参考 |
