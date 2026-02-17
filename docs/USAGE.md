# ChainVine 用户使用手册

> **ChainVine** — 基于 Slither 静态分析与 AI 大模型的双引擎智能合约漏洞扫描系统  
> **版本**: v2.0 | **更新日期**: 2026-02-17  
> **项目仓库**: https://github.com/AiorcaLin/chainvine-main

---

## 目录

- [一、环境要求](#一环境要求)
- [二、快速启动](#二快速启动)
- [三、功能使用指南](#三功能使用指南)
  - [模式一：合约地址输入](#模式一合约地址输入)
  - [模式二：单文件分析](#模式二单文件分析)
  - [模式三：多文件上传](#模式三多文件上传)
- [四、AI 配置说明](#四ai-配置说明)
  - [Provider 选择](#provider-选择)
  - [模型推荐](#模型推荐)
  - [Super Prompt 模式](#super-prompt-模式)
- [五、双引擎架构说明](#五双引擎架构说明)
- [六、Slither 服务管理](#六slither-服务管理)
- [七、Agent API（程序化调用）](#七agent-api程序化调用)
- [八、测试用例合约](#八测试用例合约)
- [九、报告导出](#九报告导出)
- [十、常见问题](#十常见问题)

---

## 一、环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18 | Next.js 运行环境（推荐使用 [Bun](https://bun.sh/) 以获得更快速度） |
| Docker | >= 20.10 | 运行 Slither 静态分析容器 |
| Docker Compose | >= 2.0 | 容器编排 |
| 浏览器 | Chrome / Edge / Firefox 最新版 | 推荐 Chrome（DevTools 调试体验最佳） |

**可选**：
- 代理软件（如 Clash）：DashScope 弗吉尼亚端点需要美国代理

---

## 二、快速启动

### 步骤 1：克隆仓库并安装依赖

```bash
git clone https://github.com/AiorcaLin/chainvine-main.git
cd chainvine-main
npm install    # 或 bun install
```

### 步骤 2：配置环境变量

复制 `.env.example` 为 `.env.local`，填入必要的 API Key：

```bash
cp .env.example .env.local
```

关键变量说明：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_ETHERSCAN_API_KEY` | 是 | Etherscan API Key，用于获取链上合约源码 |
| `DASHSCOPE_API_KEY` | 推荐 | 通义千问 DashScope Key（服务器端 AI 引擎） |
| `DASHSCOPE_BASE_URL` | 推荐 | DashScope 端点（推荐弗吉尼亚：`https://dashscope-us.aliyuncs.com/compatible-mode/v1`） |
| `OPENAI_API_KEY` | 可选 | OpenAI 直连 Key |
| `NEVERSIGHT_API_KEY` | 可选 | Neversight 网关 Key（浏览器端直连时使用） |
| `AGENT_API_KEY` | 可选 | Agent API 鉴权密钥 |
| `PROXY_URL` | 可选 | 本地 HTTP 代理地址（如 `http://127.0.0.1:10808`） |

### 步骤 3：启动 Slither Docker 服务

```bash
docker-compose up -d

# 验证健康状态
curl http://localhost:8545/health
# 期望返回: {"status":"healthy","slither_version":"...","solc_version":"..."}
```

### 步骤 4：启动 Web 应用

```bash
# 如修改过 .env.local，建议先清理缓存
# Windows: rmdir /s /q .next
# macOS/Linux: rm -rf .next

bun dev    # 或 npm run dev / npx next dev
```

### 步骤 5：访问应用

打开浏览器访问 **http://localhost:3000**

- **首页** (`/`)：项目介绍、架构图、功能特性
- **审计页** (`/audit`)：合约安全分析入口

---

## 三、功能使用指南

### 模式一：合约地址输入

**适用场景**：分析已部署在 EVM 链上的**已验证**合约。

**支持的链**（8 条）：

| 链 | 区块浏览器 | 说明 |
|----|-----------|------|
| Ethereum | etherscan.io | 主网 |
| BSC | bscscan.com | 币安智能链 |
| Arbitrum | arbiscan.io | L2 Rollup |
| Base | basescan.org | Coinbase L2 |
| Optimism | optimistic.etherscan.io | L2 Optimistic Rollup |
| Polygon | polygonscan.com | 侧链 |
| Avalanche | snowtrace.io | C-Chain |
| Aurora | aurorascan.dev | NEAR EVM 兼容层 |

**操作步骤**：

1. 进入 `/audit` 页面，选择 **Address** 标签
2. 输入合约地址（如 `0xdAC17F958D2ee523a2206206994597C13D831ec7`）
3. 点击 **Check Contract** — 系统自动在 8 条链上检测合约
4. 在检测到的链上点击 **View Source** 进入源码浏览页面
5. 在源码页面点击 **Dual Engine Analysis** 或 **Start Analysis** 开始审计
6. 配置 AI Provider 和模型后，点击 **Start Analysis**
7. 实时查看 StreamAI 流式输出，等待双引擎融合结果

**代理合约自动检测**：系统自动识别 EIP-1967 / UUPS / Beacon 代理模式，分离 Proxy 和 Implementation 源码。

### 模式二：单文件分析

**适用场景**：分析本地 Solidity 源码，无需部署。

**操作步骤**：

1. 选择 **Single File** 标签
2. 在 Monaco Editor 中编写或粘贴 Solidity 代码
   - 编辑器预置了一个包含经典重入漏洞的 Vault 示例合约
   - 编辑器主题随系统明暗主题自动切换
3. 点击 **Analyze Contract** → 配置 AI → **Start Analysis**
4. 分析完成后在下方查看、下载报告

### 模式三：多文件上传

**适用场景**：分析包含多个依赖文件的合约项目。

**操作步骤**：

1. 选择 **Multi Files** 标签
2. 拖拽 `.sol` 文件到上传区域，或点击 **Browse files** 选择
3. 系统自动识别主合约文件
4. 配置 AI 并开始分析

---

## 四、AI 配置说明

### Provider 选择

ChainVine 支持 3 种 AI Provider，在 **AI Configuration** 弹窗中切换：

| Provider | 连接方式 | API Key 来源 | 说明 |
|----------|---------|-------------|------|
| **DashScope** | 服务器代理 (`/api/ai-analyze`) | `.env.local` 服务器端 | 通义千问，推荐用于答辩演示 |
| **OpenAI** | 服务器代理 (`/api/ai-analyze`) | `.env.local` 服务器端 | GPT 系列，需有效余额 |
| **Neversight** | 浏览器直连 | 用户在 UI 输入 | 多模型网关（Claude/GPT/Gemini 等），API Key 不经过服务器 |

> **安全说明**：DashScope 和 OpenAI 的 API Key 存储在服务器 `.env.local` 中，不会暴露给浏览器。Neversight 的 Key 存储在浏览器 localStorage 中。

### 模型推荐

**DashScope 弗吉尼亚区域（推荐）**：

| 模型 | 推荐场景 | 说明 |
|------|---------|------|
| `qwen3-coder-plus` | 深度审计 | 代码专精，Solidity 理解最佳 |
| `qwen3-max` | 深度审计 | 旗舰模型，综合能力最强 |
| `qwen-plus` | 通用审计 | 平衡速度和质量 |
| `qwen-flash` | 快速演示 | 高速低成本（~50s/USDT 合约） |
| `qwen3-coder-flash` | 快速审计 | 代码+快速 |

**Neversight 网关**：

| 模型 | 推荐场景 |
|------|---------|
| `anthropic/claude-4.5-opus` | 最强安全分析能力 |
| `google/gemini-3-flash` | 快速演示，成本最低 |
| `openai/gpt-5.2` | 通用平衡 |

### Super Prompt 模式

开启后追加增强型提示词，激活以下深层分析能力：
- **历史漏洞锚定**：每个发现与历史知名攻击事件（The DAO、Poly Network、Euler Finance 等）交叉对比
- **多视角分析**：从攻击者、MEV 搜索者、协议防御者三个角度分析
- **边界条件探索**：零值输入、最大值、自引用调用等极端场景
- **经济攻击建模**：闪电贷放大、捐赠攻击、治理攻击等 DeFi 特有向量

> **提示**：Super Prompt 会增加约 20-30% 的分析时间，但输出深度显著提升。推荐在答辩演示时开启。

---

## 五、双引擎架构说明

ChainVine 的核心创新是 **Slither + AI 双引擎融合架构**：

```
┌───────────────────────────────────────────────┐
│              合约源码输入                        │
└───────────────┬───────────────────────────────┘
                │
    ┌───────────┼───────────┐
    ↓                       ↓
┌──────────┐          ┌──────────┐
│ Slither  │          │ AI (LLM) │
│ 静态分析 │          │ 深度审计  │
│ 引擎     │          │ 引擎     │
│          │          │          │
│ 80+ 检测器│         │ 语义推理  │
│ AST/CFG   │         │ 逻辑分析  │
│ 数据流    │         │ 上下文理解│
└────┬─────┘          └─────┬────┘
     │                      │
     └──────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │     融合引擎           │
    │                       │
    │ • 漏洞去重             │
    │ • 交叉验证（→高置信度）  │
    │ • 严重度归一化          │
    │ • SWC 编号映射         │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │     统一审计报告        │
    │                       │
    │ Cross-Validated 区     │
    │ All Findings 区        │
    │ AI Appendix           │
    │ Slither Raw Appendix  │
    └───────────────────────┘
```

**互补性说明**（参考 Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000）：

| 维度 | Slither（静态分析） | AI（大语言模型） |
|------|-------------------|----------------|
| **擅长** | 已知模式漏洞（重入、未检查返回值等） | 业务逻辑缺陷、跨函数语义漏洞 |
| **弱点** | 无法理解业务语义 | 可能产生幻觉（误报） |
| **速度** | 极快（<10s） | 较慢（30s–3min） |
| **置信度** | 高（规则确定性） | 中等（需人工确认） |
| **融合效果** | 双引擎同时发现 → 置信度标记为 **高**（交叉验证） |

---

## 六、Slither 服务管理

```bash
# 启动
docker-compose up -d

# 查看状态
docker ps | grep slither

# 查看日志
docker-compose logs -f slither-service

# 停止
docker-compose down

# 重建（镜像更新后）
docker-compose up -d --build

# 健康检查
curl http://localhost:8545/health

# 查看可用检测器列表
curl http://localhost:8545/detectors
```

**注意**：如果 Slither 服务不可用，ChainVine 会自动降级为 **仅 AI 分析模式**，不影响基本功能。

---

## 七、Agent API（程序化调用）

> 适用场景：外部 AI Agent 或自动化脚本不操作 UI，直接通过 HTTP 调用完成双引擎审计。  
> 设计依据：Yao et al., *"ReAct: Synergizing Reasoning and Acting in Language Models"*, ICLR 2023

### 前置条件

在 `.env.local` 中配置 `AGENT_API_KEY`，调用方在 Header `x-agent-api-key` 中携带此值。

### 同步调用

```bash
curl -X POST "http://localhost:3000/api/agent/audit" \
  -H "Content-Type: application/json" \
  -H "x-agent-api-key: YOUR_AGENT_API_KEY" \
  -d '{
    "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "chain": "ethereum",
    "provider": "dashscope",
    "model": "qwen-flash",
    "language": "chinese-simplified",
    "superPrompt": true
  }'
```

**返回 JSON 字段说明**：

| 字段 | 说明 |
|------|------|
| `fusion` | 结构化 findings（severity / source / confidence / location） |
| `report.mergedMarkdown` | 融合后的 Markdown 审计报告 |
| `report.slither` | Slither 原始输出 |
| `timings` | 各引擎耗时 |

### 流式调用（StreamAI）

在请求体中加 `"stream": true`，返回 `text/event-stream`（SSE）：

```bash
curl -N -X POST "http://localhost:3000/api/agent/audit" \
  -H "Content-Type: application/json" \
  -H "x-agent-api-key: YOUR_AGENT_API_KEY" \
  -d '{
    "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "chain": "ethereum",
    "provider": "dashscope",
    "model": "qwen-flash",
    "stream": true
  }'
```

| SSE 事件 | data | 说明 |
|----------|------|------|
| `chunk` | 文本片段 | AI 报告增量输出 |
| `slither` | JSON | Slither 完成通知 |
| `fusion` | JSON | 双引擎融合结果 |
| `done` | JSON | 最终元数据 |
| `error` | 错误信息 | 异常 |

### 支持的 Provider

| provider | 示例 model | 说明 |
|----------|-----------|------|
| `dashscope` | `qwen-flash`, `qwen-plus`, `qwen3-coder-plus` | 通义千问 DashScope |
| `openai` | `gpt-4o-mini`, `gpt-4o` | OpenAI 直连 |
| `neversight` | `openai/gpt-5.2`, `anthropic/claude-4.5-opus` | Neversight 网关 |

### OpenAPI 文档

接口的机器可读描述见 `docs/openapi-agent-audit.yaml`。

---

## 八、测试用例合约

### 用例 1：重入攻击（内置 Vault 示例）

Single File 编辑器中预置的 Vault 合约包含经典重入漏洞（SWC-107）：
- `withdraw()` 函数先发送 ETH 再更新余额（违反 CEI 模式）
- `delegatecall` 使用可能导致存储碰撞

### 用例 2：已部署合约

| 名称 | 地址 | 链 | 特点 |
|------|------|-----|------|
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Ethereum | 单文件 ERC-20，~500 行 |
| AAVE Pool V3 | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | Ethereum | 代理合约 |
| Uniswap V3 Factory | `0x1F98431c8aD98523631AE4a59f267346ea31F984` | Ethereum / Arbitrum | 多链部署 |
| AAVE Pool Proxy | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` | Ethereum | EIP-1967 代理 |
| Orbit Bridge Vault | `0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a` | Ethereum | 访问控制缺陷 |

### 用例 3：代理合约

| 名称 | 地址 | 代理类型 |
|------|------|---------|
| AAVE Pool Proxy | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` | EIP-1967 Proxy |
| Lido stETH | `0xae7ab96520de3a18e5e111b5eaab095312d7fe84` | 可升级合约 |

---

## 九、报告导出

ChainVine 支持多种格式的报告导出：

| 格式 | 说明 | 操作 |
|------|------|------|
| **Markdown (.md)** | 单个报告文件 | 在报告列表中点击 **MD** 按钮 |
| **ZIP 打包** | 包含报告 + Slither 原始 JSON + 融合摘要 JSON | 点击 **Download ZIP** |
| **在线查看** | 在新窗口中渲染 Markdown | 点击 **View** 按钮 |
| **图片 (.png)** | 将报告渲染为长图 | 在查看窗口中点击 **Save as Image** |

**ZIP 包内容**：
- `report-dual-*.md` — 融合审计报告
- `slither-raw.json` — Slither 原始输出
- `fusion-summary.json` — 融合统计摘要（包含引擎元数据）

---

## 十、常见问题

### Q: Slither 分析报错 "Cannot connect to Slither service"
**A**: 确认 Docker 容器正在运行：`docker ps | grep slither`。如未运行，执行 `docker-compose up -d`。Slither 不可用时系统自动降级为仅 AI 分析。

### Q: AI 分析超时或无响应
**A**: 可能原因：
1. 大型合约（>1000 行）需要较长时间，请耐心等待
2. DashScope 弗吉尼亚端点需要美国代理，检查 `PROXY_URL` 配置
3. 尝试切换到更快的模型（如 `qwen-flash`）
4. 检查 `.env.local` 中的 API Key 是否有效

### Q: 合约源码显示 "not verified"
**A**: 该合约在对应链的区块浏览器上未验证源码。ChainVine 只支持已验证源码的合约分析。

### Q: 代理合约只显示 Proxy 代码
**A**: 系统会自动获取 Implementation 合约源码。如果 Implementation 地址获取失败，可能是非标准代理模式。在源码页面的弹窗中选择 **View Implementation** 可切换查看。

### Q: 如何切换明暗主题？
**A**: 点击页面右上角的太阳/月亮图标。编辑器（Monaco Editor）会自动跟随主题切换。

### Q: DashScope Provider 报错
**A**: DashScope 不同区域的 API Key 不通用。弗吉尼亚区域（`dashscope-us`）和北京区域（`dashscope`）的 Key 和可用模型列表不同。请确认 `.env.local` 中的 `DASHSCOPE_BASE_URL` 与 `DASHSCOPE_API_KEY` 匹配。

### Q: 报告中 "Cross-Validated" 是什么意思？
**A**: 表示该漏洞被 Slither 和 AI 双引擎同时检出，置信度标记为 **高**。这是双引擎融合架构的核心价值——通过交叉验证减少误报。理论基础参见 Dietterich (2000) 的集成学习方法。

---

## 参考文献

| 编号 | 引用 | 用途 |
|------|------|------|
| [1] | Feist et al., "Slither: A Static Analysis Framework for Smart Contracts", WETSEB 2019 | Slither 核心论文 |
| [2] | Dietterich, T.G., "Ensemble Methods in Machine Learning", MCS 2000 | 双引擎融合算法理论基础 |
| [3] | Yao et al., "ReAct: Synergizing Reasoning and Acting in LLMs", ICLR 2023 | Agent API 设计理论 |
| [4] | Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in LLMs", NeurIPS 2022 | AI 提示词优化 |
| [5] | David et al., "Do you still need a manual smart contract audit?", arXiv 2023 | LLM 合约审计可行性 |
| [6] | Chen et al., "Large Language Models for Blockchain Security: A Systematic Literature Review", arXiv 2024 | LLM + 区块链安全综述 |
| [7] | Nielsen, J., "10 Usability Heuristics for User Interface Design", NN/g 1994 | UI 设计原则 |

---

*ChainVine — Dual-Engine Smart Contract Vulnerability Scanner*  
*© 2026 成都信息工程大学 · 信息安全专业 · 本科毕业设计*
