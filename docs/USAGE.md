# Mush Audit 使用文档

> 基于静态分析与大语言模型的智能合约漏洞扫描系统

## 目录

- [环境要求](#环境要求)
- [快速启动](#快速启动)
- [功能使用指南](#功能使用指南)
  - [模式一：合约地址输入](#模式一合约地址输入)
  - [模式二：单文件分析](#模式二单文件分析)
  - [模式三：多文件上传](#模式三多文件上传)
- [AI 配置说明](#ai-配置说明)
- [Slither 服务管理](#slither-服务管理)
- [测试用例合约](#测试用例合约)
- [常见问题](#常见问题)

---

## 环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18 | Next.js 运行环境 |
| Docker | >= 20.10 | 运行 Slither 服务容器 |
| Docker Compose | >= 2.0 | 编排服务 |
| 浏览器 | Chrome/Edge/Firefox 最新版 | 推荐 Chrome |

## 快速启动

### 1. 启动 Slither 服务

```bash
# 在项目根目录执行
docker-compose up -d

# 验证服务状态
curl http://localhost:8545/health
# 期望返回: {"status":"healthy","slither_version":"...","solc_version":"..."}
```

### 2. 启动 Web 应用

```bash
# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev

# 应用地址: http://localhost:3000/audit
```

### 3. 配置 AI API Key

1. 申请 Neversight API Key：访问 https://neversight.dev
2. 在应用中点击 "Analyze Contract" 按钮
3. 在弹出的 AI Configuration 对话框中输入 API Key
4. API Key 存储在浏览器本地，不会发送到我们的服务器

---

## 功能使用指南

### 模式一：合约地址输入

**适用场景**：分析已部署在 EVM 链上的已验证合约。

**支持的链**：Ethereum / BSC / Arbitrum / Base / Optimism / Polygon / Avalanche / Aurora

**操作步骤**：

1. 打开 http://localhost:3000/audit
2. 选择 **Address** 标签页
3. 输入合约地址（例如：`0xdAC17F958D2ee523a2206206994597C13D831ec7`）
4. 点击 **Check Contract**
5. 系统自动在 8 条链上检测合约是否存在
6. 在检测到合约的链上，点击 **View Source** 查看源码
7. 在源码页面点击 **Start Analysis** 开始审计

**测试用例**：

| 合约 | 地址 | 链 | 特点 |
|------|------|-----|------|
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Ethereum | 单文件 ERC20 |
| AAVE Pool V3 | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | Ethereum | 代理合约 |
| Uniswap V3 Factory | `0x1F98431c8aD98523631AE4a59f267346ea31F984` | Ethereum/Arbitrum | 多链部署 |
| AAVE Pool Proxy | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` | Ethereum | EIP-1967 代理 |

### 模式二：单文件分析

**适用场景**：分析本地 Solidity 源码文件，无需部署。

**操作步骤**：

1. 选择 **Single File** 标签页
2. 在 Monaco Editor 中编写或粘贴 Solidity 代码
3. 点击 **Analyze Contract**
4. 配置 AI 模型和 API Key
5. 点击 **Start Analysis**
6. 等待分析完成，在下方查看/下载报告

**内置示例合约**：编辑器中预置了一个包含重入攻击漏洞的 Vault 合约，可直接用于测试。

### 模式三：多文件上传

**适用场景**：分析包含多个依赖文件的合约项目。

**操作步骤**：

1. 选择 **Multi Files** 标签页
2. 拖拽 `.sol` 文件到上传区域，或点击 **Browse files** 选择
3. 确认文件列表后点击 **Analyze Contract**
4. 配置 AI 并开始分析

---

## AI 配置说明

| 选项 | 说明 |
|------|------|
| **Model** | 选择 LLM 模型（Claude 4.5 Opus / Gemini 3 Pro / GPT-5.2 等） |
| **Super Prompt** | 启用增强型 Prompt，激活更深层安全分析（推荐开启） |
| **Response Language** | 报告语言（English / 中文 / 日本語 等） |
| **Neversight API Key** | 通过 Neversight API 网关访问多个 LLM 提供商 |

**模型选择建议**：

- **答辩演示**：推荐 Gemini 3 Flash（速度快，成本低）
- **深度审计**：推荐 Claude 4.5 Opus（安全分析能力最强）
- **性价比**：推荐 GPT-5.2（平衡速度和质量）

---

## Slither 服务管理

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f slither-service

# 停止
docker-compose down

# 重建（更新后）
docker-compose up -d --build

# 健康检查
curl http://localhost:8545/health

# 查看可用检测器
curl http://localhost:8545/detectors
```

---

## 测试用例合约

### 用例 1：重入攻击（内置 Vault 示例）

编辑器中已内置的 Vault 合约包含经典重入漏洞（SWC-107）：
- `withdraw()` 函数先发送 ETH 再更新余额（违反 CEI 模式）
- `delegatecall` 使用可能导致存储碰撞

### 用例 2：已知漏洞合约地址

| 名称 | 地址 | 预期检出 |
|------|------|---------|
| Orbit Bridge Vault | `0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a` | 访问控制缺陷 |

### 用例 3：代理合约

| 名称 | 地址 | 代理类型 |
|------|------|---------|
| AAVE Pool Proxy | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` | EIP-1967 Proxy |
| Lido stETH | `0xae7ab96520de3a18e5e111b5eaab095312d7fe84` | 可升级合约 |

---

## 常见问题

### Q: Slither 分析报错 "Cannot connect to Slither service"
A: 确认 Docker 容器正在运行：`docker ps | grep mush-slither`。如未运行，执行 `docker-compose up -d`。

### Q: AI 分析超时
A: 大型合约（>1000行）可能需要较长时间。系统有 3 次自动重试机制。也可以尝试切换到更快的模型（如 Gemini 3 Flash）。

### Q: 合约源码显示 "not verified"
A: 该合约在对应链的区块浏览器上未验证源码。只有已验证源码的合约才能进行分析。

### Q: 代理合约只显示 proxy 代码
A: 系统会自动获取 implementation 合约源码。如果 implementation 地址获取失败，可能是非标准代理模式。

---

*文档版本: v1.0 | 更新日期: 2026-02-09*
