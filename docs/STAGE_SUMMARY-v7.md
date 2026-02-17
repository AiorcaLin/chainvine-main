# ChainVine 阶段性总结文档 v7

> **生成时间**: 2026-02-16 14:00  
> **上一版**: 2026-02-16 00:30（v6，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: ChainVine — 面向区块链的漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03-25  
> **学校**: 成都信息工程大学 · 信息安全专业  
> **仓库**: https://github.com/AiorcaLin/chainvine-main  
> **Release**: v0.1.0 tag 已推送至 GitHub（答辩基线版）

---

## 1. v7 核心变更：审计页 UI 统一 + 仓库链接迁移 + README 全面重写

### 1.1 变更概述

v7 完成了三大改进：
1. **审计页 `/audit` Hero Section UI 改造**：将旧版通用标语（"Smart Contract Security / Powered by AI, securing your blockchain future..."）替换为与首页一致的品牌视觉风格——渐变绿色圆圈背景装饰、ChainVineLogo + "ChainVine Audit" 标题、中英双语描述，形成首页→审计页的统一视觉体验
2. **仓库链接全局迁移**：所有活跃代码文件和文档中的 `AiorcaLin/ChainVine` 统一替换为新仓库地址 `AiorcaLin/chainvine-main`，确保 GitHub 按钮、LICENSE 链接、git clone URL 等全部指向正确仓库
3. **README.md 全面重写**：从旧版 "Mush Audit" 时代的简单说明升级为 173 行完整项目文档，包含双引擎架构图、功能特性、快速开始指南、技术栈、项目结构、Agent API 示例和学术参考文献

### 1.2 新增文件清单（1 个）

| 文件 | 用途 | 行数 |
|------|------|------|
| `docs/STAGE_SUMMARY-v7.md` | 本文档 | — |

### 1.3 修改文件清单（4 个）

| 文件 | 改动 |
|------|------|
| `src/app/(with-header)/audit/page.tsx` | **UI 改造**: Hero Section 替换为与首页一致的品牌风格（渐变圆圈装饰 + ChainVineLogo + 中英双语描述）；Tab 选择器提示文案改为中英双语 |
| `src/app/(with-header)/page.tsx` | **链接迁移**: 3 处 `AiorcaLin/ChainVine` → `AiorcaLin/chainvine-main`（GitHub 按钮、LICENSE 链接、Footer 图标） |
| `README.md` | **全面重写**: 从 88 行旧版升级为 173 行完整文档（架构图 + 功能 + 快速开始 + 技术栈 + 项目结构 + Agent API + 参考文献） |
| `docs/STAGE_SUMMARY-v6.md` | **链接迁移**: 仓库元数据 URL 更新 |

---

## 2. 项目架构概述（v7 更新）

```
chainvine-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # 根布局
│   │   ├── globals.css                         # 全局CSS + 明暗主题CSS变量
│   │   ├── icon.svg                            # SVG favicon
│   │   ├── (with-header)/                      # Route Group — 带全局Header的页面
│   │   │   ├── layout.tsx                      # Header布局
│   │   │   ├── page.tsx                        # 🔄 首页（v7 链接迁移）
│   │   │   └── audit/
│   │   │       ├── page.tsx                    # 🔄 主审计页面（v7 Hero Section 改造）
│   │   │       └── analyze/page.tsx            # 分析结果页
│   │   ├── (fullscreen)/                       # Route Group — 全屏页面
│   │   │   └── audit/
│   │   │       └── source/page.tsx             # 源码查看页
│   │   └── api/
│   │       ├── agent/audit/route.ts            # Agent审计API（同步+流式）
│   │       ├── ai-analyze/route.ts             # 前端AI分析代理（同步+流式SSE）
│   │       ├── contract-info/route.ts          # 合约信息API
│   │       ├── source/route.ts                 # 源码获取API
│   │       └── slither/route.ts                # Slither代理API
│   ├── services/
│   │   ├── llm/                                # LLM Provider抽象层
│   │   │   ├── types.ts                        # 类型定义
│   │   │   └── client.ts                       # 统一调用客户端
│   │   └── audit/
│   │       ├── dualEngineAnalyzer.ts           # 浏览器端双引擎编排器
│   │       ├── dualEngineAnalyzerServer.ts     # 服务器端双引擎编排器
│   │       ├── contractAnalyzer.ts             # 浏览器端AI分析器
│   │       ├── contractAnalyzerServer.ts       # 服务器端AI分析器
│   │       ├── findingFusion.ts                # 融合算法（共用）
│   │       ├── slitherAnalyzer.ts              # Slither通信（共用）
│   │       ├── reportGenerator.ts              # 报告生成
│   │       └── prompts.ts                      # AI提示词
│   ├── components/
│   │   ├── audit/
│   │   │   ├── AIConfigModal.tsx               # AI配置弹窗（3 Provider选择器）
│   │   │   ├── SourcePreview.tsx               # 源码预览+分析（StreamAI overlay）
│   │   │   └── ...                             # 其他组件
│   │   └── ...
│   ├── types/
│   │   ├── ai.ts                               # AI类型（AIProvider + provider字段）
│   │   └── ...
│   ├── utils/
│   │   ├── ai.ts                               # AI工具（Provider路由+SSE解析+流式）
│   │   ├── dashscope-models.ts                 # DashScope模型定义
│   │   ├── neversight-models.ts                # Neversight模型定义
│   │   ├── openai-models.ts                    # OpenAI模型定义
│   │   └── ...
│   └── instrumentation.ts                      # 全局fetch代理
├── slither-service/                            # Slither Docker微服务
├── docs/
│   ├── STAGE_SUMMARY-v7.md                     # 🆕 本文档
│   ├── STAGE_SUMMARY-v6.md                     # 🔄 v6文档（链接迁移）
│   ├── STAGE_SUMMARY-v5.md                     # v5文档（保留）
│   ├── openapi-agent-audit.yaml                # OpenAPI 3.0接口文档
│   ├── USAGE.md                                # 使用文档
│   ├── PRD.md / DESIGN.md                      # 需求/设计文档
│   └── 测试记录/                                # 手动测试记录
├── README.md                                   # 🔄 项目说明（全面重写）
├── .env.local                                  # 环境配置
├── .env.example                                # 环境变量模板
└── docker-compose.yml                          # Slither容器编排
```

---

## 3. 技术架构说明（继承 v6，无变更）

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

## 4. 环境配置（继承 v6，无变更）

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

### 启动步骤（与 v5/v6 相同）
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

## 5. 测试状态（v7 更新）

### 5.1 已通过的测试

继承 v6 所有测试，新增：

| 测试项 | 结果 |
|--------|------|
| **v7 审计页 Hero Section 编译** | ✅ `✓ Compiled`，GET /audit 200 |
| **v7 首页链接迁移编译** | ✅ `✓ Compiled`，GET / 200 |
| **v7 Lint 检查** | ✅ 零 lint 错误（audit/page.tsx + page.tsx） |

### 5.2 未测试（继承 v6）

| 测试项 | 说明 |
|--------|------|
| 前端 UI 多 Provider 切换（浏览器端） | 代码已实现，需在浏览器中实际操作验证 |
| 前端 StreamAI 流式展示效果 | 代码已实现，需在浏览器中触发分析查看效果 |
| OpenAI 直连 | 用户 OpenAI 无余额，跳过 |
| 大型合约（>2000 行） | 仅测了 USDT（~500 行） |
| Neversight 流式模式（浏览器直连 SSE） | 代码已实现，需浏览器验证 |

---

## 6. 已知问题与风险（v7 更新）

| # | 问题 | 严重度 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | DashScope 弗吉尼亚模型列表与北京不同 | 中 | 已解决 | 使用弗吉尼亚区域可用模型 |
| 2 | OpenAI 无余额 | 低 | 已知 | 代码已实现，等用户充值 |
| 3 | Neversight API 余额低 | 中 | 已知 | $5.4 余额，建议用 gemini-3-flash 测试 |
| 4 | Monaco Editor 主题未联动 | 低 | 遗留 v4 | 亮主题下编辑器仍为黑色 |
| 5 | 无全局超时保护 | 中 | 遗留 v4 | AI 分析无硬超时限制 |
| 6 | ~~首页 UI 待重设计~~ | ~~中~~ | **v6 已完成** | 首页已在 v6 期间完成（Hero+架构图+Stats+Features+Footer） |
| 7 | 前端 StreamAI 未在浏览器中验证 | 低 | 待验证 | 代码已写完，编译通过，但需实际操作确认 |
| 8 | **审计子页面视觉未统一** | 低 | 已知 | `/audit/analyze` 和 `/audit/source` 尚未匹配新的品牌视觉 |
| 9 | **README 截图为旧版** | 低 | 已知 | README 中引用的截图仍为旧版 Mush Audit 界面，需重新截取 |

---

## 7. 用户决策记录（v7 更新）

继承 v6 所有决策，新增：

| 决策 | 内容 |
|------|------|
| 仓库地址 | 正式迁移到 `AiorcaLin/chainvine-main`，旧 `AiorcaLin/ChainVine` 不再引用 |
| 审计页视觉统一 | 与首页一致的品牌风格：渐变圆圈装饰 + ChainVineLogo + 中英双语 |
| README 定位 | 作为 GitHub 仓库首页展示的完整项目文档，包含学术参考文献（面向答辩+开源） |
| 历史文档保留 | v4/v5 阶段文档中的旧仓库链接不修改，保留历史状态记录 |

---

## 8. 下一步行动计划（按优先级）

### 8.1 验证：前端 StreamAI + 多 Provider（继承 v6 §8.2）
1. 在浏览器中打开 `http://localhost:3000/audit`
2. 确认新的 Hero Section 视觉效果（渐变圆圈 + ChainVine Audit 标题）
3. 输入 USDT 合约地址 `0xdAC17F958D2ee523a2206206994597C13D831ec7` + Ethereum
4. 打开 AI Configuration，选择 DashScope Provider + qwen-flash 模型
5. 点击 Start Analysis，观察：
   - StreamAI 流式文本是否实时出现在浮层中
   - Slither/AI/Fusion 三阶段进度是否正确更新
6. 验证 Neversight Provider 是否仍正常工作

### 8.2 UI 优化：审计子页面统一
- `/audit/analyze`（分析结果页）和 `/audit/source`（源码查看页）的视觉与布局优化
- 与首页/审计页保持一致的品牌视觉（渐变装饰 + 配色）
- **建议在所有功能稳定后一次性做，避免反复**

### 8.3 README 截图更新
- 在 UI 完全稳定后重新截取首页和审计页截图
- 替换 README 中的 GitHub user-attachments 图片 URL

### 8.4 可选功能
1. **提示词微调** — 控制在可解释的改动范围内
2. **SKILL.md** — 给 Cursor AI 的项目说明

### 8.5 必做：毕设文档
- 用户使用手册（基于 `docs/USAGE.md` 扩展）
- 毕设报告 + 查重
- 8 个阶段性周报（可基于 `STAGE_SUMMARY_v1~v7` 整理）

### 8.6 锁版
- 建议最晚 **3 月上旬**（3/8–3/10）完成功能+UI，之后只改文档和极小 bugfix
- 打 Release（如 v1.0.0），作为毕设提交的版本锚点

---

## 9. v7 UI 变更详情

### 9.1 审计页 `/audit` Hero Section 改造

**之前**（v6 及更早）：
```html
<h1>Smart Contract <span>Security</span></h1>
<p>Powered by AI, securing your blockchain future with real-time analysis</p>
<p>Choose your preferred method to analyze smart contracts</p>
```

**之后**（v7）：
```html
<!-- 背景渐变圆圈装饰（与首页一致） -->
<div class="bg-accent/5 rounded-full blur-3xl" />   <!-- 600px 主圆 -->
<div class="bg-accent/3 rounded-full blur-3xl" />   <!-- 300px 副圆 -->

<!-- Logo + 品牌标题 -->
<ChainVineLogo /> Chain<span>Vine</span> Audit

<!-- 中英双语描述 -->
<p>Dual-Engine Smart Contract Vulnerability Scanner</p>
<p>Slither 静态分析 + AI 大模型深度审计，双引擎交叉验证，精准定位智能合约安全漏洞</p>

<!-- Tab 选择器提示 -->
<p>选择合约分析方式 / Choose your analysis method</p>
```

**设计理由**：
- 视觉一致性（Visual Consistency）：用户从首页进入审计页时，保持品牌认知的连贯性，减少认知负荷（参考 Nielsen, J., "10 Usability Heuristics for User Interface Design" [8] 中的第四条 Consistency and Standards）
- 渐变圆圈装饰使页面不再"空白"，同时不干扰功能区域的操作
- 中英双语满足毕设答辩（中文）+ 开源社区（英文）双重需求

### 9.2 仓库链接迁移

| 文件 | 位置 | 旧链接 | 新链接 |
|------|------|--------|--------|
| `page.tsx` | GitHub 按钮 href | `AiorcaLin/ChainVine` | `AiorcaLin/chainvine-main` |
| `page.tsx` | LICENSE 链接 href | `AiorcaLin/ChainVine/blob/main/LICENSE` | `AiorcaLin/chainvine-main/blob/main/LICENSE` |
| `page.tsx` | Footer GitHub 图标 | `AiorcaLin/ChainVine` | `AiorcaLin/chainvine-main` |
| `README.md` | git clone URL | `AiorcaLin/ChainVine` | `AiorcaLin/chainvine-main` |
| `STAGE_SUMMARY-v6.md` | 仓库元数据 | `AiorcaLin/ChainVine` | `AiorcaLin/chainvine-main` |

### 9.3 README.md 重写结构

| 章节 | 内容 |
|------|------|
| 标题 + Badge | 项目名 + 中英双语简介 + 5 个 shield.io 徽章（License/Next.js/TypeScript/Slither/Chains） |
| 项目简介 | 双引擎架构 + 学校信息 + ASCII 架构图 |
| 功能特性 | 6 大模块：双引擎 / 多模型 / 8 链 / StreamAI / 代理检测 / Agent API / 报告导出 |
| 快速开始 | 环境要求 + 5 步安装启动 + 5 步使用流程 |
| 技术栈 | 7 层技术表 |
| 项目结构 | 简化目录树（核心文件） |
| Agent API | curl 示例（同步+流式） |
| 参考文献 | 6 篇学术引用 |
| License | AGPL-3.0 + © 2026 |

---

## 10. 关键文件速查（v7 更新）

| 文件 | 用途 | 行数 | v7 状态 |
|------|------|------|---------|
| `src/app/(with-header)/audit/page.tsx` | 主审计页面 | ~1313 | 🔄 Hero Section 改造 |
| `src/app/(with-header)/page.tsx` | 首页 | ~265 | 🔄 链接迁移 |
| `README.md` | 项目说明 | ~173 | 🔄 全面重写 |
| `docs/STAGE_SUMMARY-v6.md` | v6 阶段文档 | ~476 | 🔄 链接迁移 |
| `docs/STAGE_SUMMARY-v7.md` | v7 阶段文档（本文档） | — | 🆕 新增 |
| `src/types/ai.ts` | AI 类型定义 | ~15 | 未修改 |
| `src/utils/ai.ts` | AI 工具（Provider 路由+SSE 解析+流式） | ~220 | 未修改 |
| `src/utils/dashscope-models.ts` | DashScope 弗吉尼亚模型定义 | ~45 | 未修改 |
| `src/app/api/ai-analyze/route.ts` | 前端 AI 分析代理路由 | ~100 | 未修改 |
| `src/components/audit/AIConfigModal.tsx` | AI 配置弹窗（3 Provider） | ~250 | 未修改 |
| `src/services/audit/contractAnalyzer.ts` | 浏览器端 AI 分析器 | ~211 | 未修改 |
| `src/services/audit/dualEngineAnalyzer.ts` | 浏览器端双引擎编排 | ~140 | 未修改 |
| `src/services/audit/dualEngineAnalyzerServer.ts` | 服务器端双引擎编排 | ~287 | 未修改 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析+StreamAI | ~941 | 未修改 |
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

## 11. Agent API 调用示例（继承 v6，无变更）

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

## 12. DashScope 弗吉尼亚可用模型参考

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

## 13. 对话角色设定

- **AI角色**: 区块链、金融、AI领域全球顶级专家
- **用户角色**: 同上，本科毕业设计学生
- **回答要求**: 必须提出科学参考资料，引用处解释；中文回答
- **项目性质**: 成都信息工程大学 · 信息安全专业 · 本科毕业设计

---

## 14. 版本变更日志

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1 | 2026-02-09 | 初始文档，P0功能完成 |
| v2 | 2026-02-10 | Fix 1-4 + Address模式计时器 |
| v3 | 2026-02-11 | 绿色藤蔓主题改造 + 语义色 |
| v4 | 2026-02-13 | 仓库迁移 + SVG Logo + Route Groups + 全局语义色清理 + UI修复 |
| v5 | 2026-02-14 | Agent API + LLM Provider 抽象层 + StreamAI(Agent) + OpenAPI + 服务器端分析器 |
| v6 | 2026-02-16 | 流式 Bug 修复(TextEncoder) + DashScope 弗吉尼亚修复 + 前端多 Provider + 前端 StreamAI + /api/ai-analyze 代理路由 |
| v7 | 2026-02-16 | **审计页 UI 统一**(Hero Section 品牌化) + **仓库链接迁移**(→ chainvine-main) + **README 全面重写**(173 行完整文档) |

---

## 15. 参考文献（v7 引用）

继承 v6 所有参考文献 [1]–[7]，新增：

| 编号 | 引用 | 用途 |
|------|------|------|
| [1] | Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000 | 双引擎融合算法的理论基础 |
| [2] | WHATWG Fetch Standard, "Response Body" | SSE 流式输出的标准实现 |
| [3] | Alibaba Cloud Model Studio, "DashScope API Reference", 2026-01-30 updated | DashScope 多区域端点 |
| [4] | Feist et al., "Slither: A Static Analysis Framework for Smart Contracts", WETSEB 2019 | Slither 核心论文 |
| [5] | Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models", ICLR 2023 | Agent API 设计理论 |
| [6] | Alibaba Cloud, "Qwen3-Coder Technical Report", 2025 | 代码专精大模型表现 |
| [7] | Nielsen, J., "Response Time Limits", Nielsen Norman Group | 流式输出 UX 理论：10s 规则 |
| **[8]** | **Nielsen, J., "10 Usability Heuristics for User Interface Design", Nielsen Norman Group, 1994 (updated 2024)** | **v7 审计页 UI 改造的设计依据：Consistency and Standards 原则** |
| **[9]** | **David et al., "Do you still need a manual smart contract audit?", arXiv 2023** | **README 参考文献，LLM 合约审计可行性研究** |
| **[10]** | **Chen et al., "Large Language Models for Blockchain Security: A Systematic Literature Review", arXiv 2024** | **README 参考文献，LLM+区块链安全综述** |

---

*文档结束。v7 核心：审计页 UI 品牌统一 + 仓库链接迁移 + README 全面重写。下一步：浏览器验证 StreamAI + 审计子页面视觉统一 + 毕设文档。*
