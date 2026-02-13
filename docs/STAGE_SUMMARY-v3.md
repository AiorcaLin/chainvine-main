# ChainVine 阶段性总结文档 v3

> **生成时间**: 2026-02-11 18:00  
> **上一版**: 2026-02-10（v2，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: ChainVine — 面向区块链的漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03  
> **学校**: 成都信息工程大学 · 信息安全专业

---

## 1. 项目架构概述

```
mush-audit-main/
├── src/
│   ├── app/
│   │   ├── audit/page.tsx              # 主审计页面（三模式入口：Address/SingleFile/MultiFiles）~1357行
│   │   ├── audit/source/page.tsx       # 源码查看页（代码高亮+报告渲染）
│   │   ├── audit/analyze/page.tsx      # 分析结果页
│   │   ├── api/contract-info/route.ts  # 合约信息API（含V2自动升级）
│   │   ├── api/source/route.ts         # 源码获取API（含V2自动升级）
│   │   ├── api/slither/route.ts        # Slither代理API
│   │   ├── layout.tsx                  # 根布局（ThemeProvider + ThemeToggle + 粘性Header）~107行
│   │   └── globals.css                 # 全局CSS + 明暗主题CSS变量 ~309行
│   ├── services/audit/
│   │   ├── dualEngineAnalyzer.ts       # 双引擎编排器（Slither+AI并行→融合）
│   │   ├── findingFusion.ts            # 结果融合算法（归一化+去重+交叉验证+评分）
│   │   ├── slitherAnalyzer.ts          # Slither Docker微服务通信
│   │   ├── contractAnalyzer.ts         # AI分析器（LLM调用+重试逻辑）
│   │   ├── reportGenerator.ts          # 报告生成
│   │   └── prompts.ts                  # AI提示词（SECURITY_AUDIT_PROMPT + SUPPER_PROMPT）
│   ├── components/
│   │   ├── ThemeProvider.tsx            # 🆕 next-themes 客户端封装（默认暗色主题）
│   │   ├── ThemeToggle.tsx             # 🆕 太阳/月亮主题切换按钮（hydration安全）
│   │   ├── Sidebar.tsx                 # 侧边栏
│   │   ├── Icons.tsx                   # SVG图标集
│   │   ├── ErrorBoundary.tsx           # 错误边界
│   │   └── audit/
│   │       ├── SourcePreview.tsx        # 源码预览+分析覆盖层+报告渲染（核心UI）~893行
│   │       ├── AIConfigModal.tsx        # AI配置弹窗（模型/语言/Key/SuperPrompt）
│   │       ├── FileExplorer.tsx         # 文件树浏览器
│   │       ├── ContractInfoCard.tsx     # 合约信息卡片
│   │       └── ProxyContractAlert.tsx   # 代理合约提示弹窗
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
├── tailwind.config.ts                  # Tailwind配置（darkMode:'class' + 10个语义化颜色）~55行
├── .env.local                          # 环境配置（见下方）
├── docs/
│   ├── PRD.md                          # 产品需求文档（P0/P1定义）
│   ├── USAGE.md                        # 使用文档
│   ├── DESIGN.md                       # 设计文档
│   ├── STAGE_SUMMARY.md                # 本文档
│   └── 测试记录/                        # 手动测试记录+截图+HTML快照
└── 外部文件/
    └── vine.png                        # 藤蔓Logo原始参考图
```

**技术栈**:
- **前端**: Next.js 16.1.6 (Turbopack) + TypeScript + Tailwind CSS + Monaco Editor
- **后端**: Next.js API Routes (Node.js)
- **静态分析**: Slither v0.11.5 (Python FastAPI微服务, Docker容器化, solc 0.8.0)
- **AI引擎**: 6模型支持 via Neversight API Gateway
  - `anthropic/claude-4.5-opus` / `claude-4.5-opus-max`
  - `google/gemini-3-pro` / `gemini-3-flash`（推荐测试用，最快最省钱）
  - `openai/gpt-5.2` / `gpt-5.2-high`
- **主题**: next-themes + Tailwind CSS `darkMode: 'class'` + CSS变量（RGB格式支持透明度）
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
| F-09 | UI主题改造 | ✅ 已完成 | 绿色藤蔓风格 + 明暗双主题切换（v3新增） |

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

### 4.3 场景 A 的已知问题（已在v2修复）
详见 `docs/测试记录/场景 A -地址模式-USDT合约端到端测试-UI交互部分.md`

### 4.4 v3 UI改造后需要重新验证
> **重要**：v3 进行了大规模 UI 颜色替换（12个文件200+处），虽然0 lint错误，但建议启动后对以下场景做快速视觉检查：
> 1. 首页 (`/`) — 卡片、按钮、链接颜色是否为绿色
> 2. 审计页 (`/audit`) — 三个Tab切换、Monaco编辑器、分析覆盖层
> 3. 源码页 — FileExplorer文件树、代码高亮、报告渲染
> 4. 明暗切换 — 点击右上角太阳/月亮按钮，两种模式下所有元素是否正常

---

## 5. 历轮对话完成的代码修改

### 5.1 第一轮对话（v1）
- `src/app/api/contract-info/route.ts` — 完全重写（V2自动升级）
- `src/app/audit/page.tsx` — 大幅修改（双引擎集成+进度条+ZIP导出）
- `.env.local` — 配置 Etherscan Key + Slither URL

### 5.2 第二轮对话（v2，共修改 4 个文件）

#### Fix-1: `src/services/audit/dualEngineAnalyzer.ts`
- **问题**: AI引擎失败时静默吞错误，进度条永远停在40%
- **修复**: AI失败时发送`onProgress`事件通知UI；402余额不足时直接`throw`

#### Fix-2: `src/services/audit/contractAnalyzer.ts`
- **问题**: 402/401/403不可恢复错误触发3次无效重试
- **修复**: 4xx客户端错误立即抛出，不进入重试循环

#### Fix-3: `src/components/audit/SourcePreview.tsx` + `src/app/audit/page.tsx`
- **问题**: 所有错误统一显示"Error during analysis"
- **修复**: 402→余额不足提示, 401/403→Key无效提示, 其他→具体错误消息

#### Fix-4: `src/components/audit/SourcePreview.tsx`（仅Address模式）
- **问题**: 分析覆盖层40%~80%之间无更新
- **修复**: 实时计时器MM:SS + 三阶段引擎指示器(Slither/AI/Fusion) + 错误红色提示

### 5.3 第三轮对话（v3，本轮，共修改/新建 16 个文件）

#### v3-Fix-1: 进度UI一致性修复 — `src/app/audit/page.tsx`
- **问题**: v2的Fix-4仅修复了Address模式（SourcePreview.tsx），SingleFile和MultiFile模式仍使用旧版两段式进度UI
- **修复**: 
  - 添加 `useEffect` import + `elapsedSeconds` 状态 + 计时器 `useEffect`
  - 替换 SingleFile 分析覆盖层（原第919-973行）→ 完整版（计时器+三阶段指示器+错误提示）
  - 替换 MultiFile 分析覆盖层（原第1164-1218行）→ 同上
- **结果**: 三种模式的分析进度UI现在完全一致

#### v3-Theme-1: 主题基础设施（4个文件）

| 文件 | 操作 | 说明 |
|------|------|------|
| `tailwind.config.ts` | 重写 | 添加`darkMode:'class'`，定义10个CSS变量驱动的语义化颜色（accent, background, card, card-hover, secondary, secondary-hover, border, muted, foreground, accent-hover） |
| `src/app/globals.css` | 重写 | 定义 `:root`（Light）和 `.dark`（Dark）双主题CSS变量，RGB格式支持Tailwind透明度修饰符（如`bg-accent/20`） |
| `src/components/ThemeProvider.tsx` | **新建** | next-themes客户端封装，`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` |
| `src/components/ThemeToggle.tsx` | **新建** | 太阳/月亮切换按钮，`useTheme()` + `mounted`状态避免hydration mismatch |

#### v3-Theme-2: 颜色体系（双主题色板）

**Light Theme（`:root`）**:
| 变量 | RGB值 | 十六进制 | 用途 |
|------|-------|---------|------|
| `--background` | 255 255 255 | #FFFFFF | 页面背景 |
| `--foreground` | 17 24 39 | #111827 | 主文本色 |
| `--card` | 255 255 255 | #FFFFFF | 卡片背景 |
| `--card-hover` | 249 250 251 | #F9FAFB | 卡片hover |
| `--secondary` | 243 244 246 | #F3F4F6 | 次要背景 |
| `--secondary-hover` | 229 231 235 | #E5E7EB | 次要hover |
| `--border` | 209 213 219 | #D1D5DB | 边框 |
| `--muted` | 107 114 128 | #6B7280 | 弱化文本 |
| `--accent` | 5 150 105 | #059669 | 主题绿（emerald-600） |
| `--accent-hover` | 4 120 87 | #047857 | 主题绿hover |

**Dark Theme（`.dark`）**:
| 变量 | RGB值 | 十六进制 | 用途 |
|------|-------|---------|------|
| `--background` | 26 26 26 | #1A1A1A | 页面背景 |
| `--foreground` | 229 229 229 | #E5E5E5 | 主文本色 |
| `--card` | 30 30 30 | #1E1E1E | 卡片背景 |
| `--card-hover` | 42 42 42 | #2A2A2A | 卡片hover |
| `--secondary` | 37 37 38 | #252526 | 次要背景 |
| `--secondary-hover` | 51 51 51 | #333333 | 次要hover |
| `--border` | 51 51 51 | #333333 | 边框 |
| `--muted` | 153 153 153 | #999999 | 弱化文本 |
| `--accent` | 16 185 129 | #10B981 | 主题绿（emerald-500，暗底更亮） |
| `--accent-hover` | 5 150 105 | #059669 | 主题绿hover |

#### v3-Theme-3: 全局颜色替换（12个文件，200+处替换）

| 文件 | 替换数 | 主要变更 |
|------|--------|---------|
| `src/app/audit/page.tsx` | ~97 | #FF8B3E→accent, #1E1E1E→card, #252526→secondary, #333→border, mush-orange→accent, 内联CSS橙色→#059669, 渐变色→from-card via-secondary |
| `src/components/audit/SourcePreview.tsx` | ~51 | 同上模式，border-[#1E1E1E]→border-border |
| `src/app/page.tsx` | 全文重写 | 所有bg/text/border改为语义化类名 |
| `src/components/audit/AIConfigModal.tsx` | 全文重写 | bg-card, text-foreground, border-border 等 |
| `src/components/audit/ContractInfoCard.tsx` | 全文重写 | mush-orange→accent, mush-green→accent |
| `src/components/audit/ProxyContractAlert.tsx` | 全文重写 | bg-secondary, text-accent, border-accent/20 |
| `src/components/audit/FileExplorer.tsx` | ~11 | #FF8B3E→accent, #252526→secondary, hover色 |
| `src/components/Icons.tsx` | 3 | text-[#FF8B3E]→text-accent |
| `src/components/Sidebar.tsx` | 全文重写 | bg-secondary, text-accent, border-border |
| `src/app/audit/analyze/page.tsx` | 全文重写 | bg-card, text-foreground, border-accent |
| `src/app/audit/source/page.tsx` | ~7 | bg-[#1E1E1E]→bg-card, mush-orange→accent |
| `src/app/layout.tsx` | 全文重写 | ThemeProvider封装, ThemeToggle, 粘性header+毛玻璃, Toaster用CSS变量 |

**替换完毕验证**: 全 `src/` 目录下 `#FF8B3E` 匹配数 = **0**，`mush-orange` 匹配数 = **0**，lint 错误 = **0**

#### v3-Logo: 新Logo替换
- **旧Logo**: `public/mush.png` — 橙色可爱蘑菇脸
- **新Logo**: 纯藤蔓设计 — 深翡翠绿(#047857~#059669)粗壮藤蔓交织成盾形，白色五瓣小花点缀，叶片装饰，无蘑菇/无月牙
- **参考图**: `外部文件/vine.png`
- **文件已替换**: `public/mush.png`

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
| 7 | v3 UI改造后未做完整回归测试 | 中 | 待验证 | 12个文件200+处颜色替换，0 lint错误但需视觉检查（见4.4节） |
| 8 | 内联HTML模板中的颜色硬编码 | 低 | 已知 | `audit/page.tsx` 的 `handleViewReport` 弹窗HTML模板中仍有硬编码CSS（已从橙色改为绿色#059669，但不响应主题切换） |

---

## 7. 关键文件速查

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/app/audit/page.tsx` | 前端主页面，三模式入口（Address/SingleFile/MultiFiles） | ~1357 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析覆盖层+报告渲染（核心UI） | ~893 |
| `src/app/layout.tsx` | 根布局（ThemeProvider + ThemeToggle + 粘性Header） | ~107 |
| `src/app/globals.css` | 全局CSS + Light/Dark双主题CSS变量 | ~309 |
| `tailwind.config.ts` | Tailwind配置（darkMode + 语义化颜色） | ~55 |
| `src/components/ThemeProvider.tsx` | next-themes客户端封装 | ~11 |
| `src/components/ThemeToggle.tsx` | 太阳/月亮主题切换按钮 | ~48 |
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

## 8. 主题系统技术说明（v3 新增，重要！）

### 8.1 工作原理
```
next-themes (管理 <html class="dark">)
    ↓
Tailwind CSS darkMode: 'class' (根据 html.dark 类匹配)
    ↓
globals.css 中 :root / .dark 定义不同 CSS 变量值
    ↓
tailwind.config.ts 中 colors 引用 CSS 变量: 'rgb(var(--accent) / <alpha-value>)'
    ↓
组件中使用语义化类名: bg-accent, text-foreground, border-border 等
    ↓
Tailwind 编译时自动支持透明度修饰符: bg-accent/20, text-muted/50 等
```

### 8.2 如何添加新颜色
1. 在 `globals.css` 的 `:root` 和 `.dark` 中各添加一个 CSS 变量（RGB格式，空格分隔）
2. 在 `tailwind.config.ts` 的 `theme.extend.colors` 中添加映射
3. 在组件中使用 Tailwind 类名引用

### 8.3 已有颜色映射速查（用于写新组件时参考）
| Tailwind 类名 | 含义 | Light值 | Dark值 |
|---------------|------|---------|--------|
| `bg-background` | 页面底色 | 白 | #1A1A1A |
| `bg-card` | 卡片/面板 | 白 | #1E1E1E |
| `bg-card-hover` | 卡片hover | #F9FAFB | #2A2A2A |
| `bg-secondary` | 次要区域 | #F3F4F6 | #252526 |
| `bg-secondary-hover` | 次要hover | #E5E7EB | #333333 |
| `border-border` | 通用边框 | #D1D5DB | #333333 |
| `text-foreground` | 主文本 | #111827 | #E5E5E5 |
| `text-muted` | 弱化文本 | #6B7280 | #999999 |
| `text-accent` | 强调色文本 | #059669 | #10B981 |
| `bg-accent` | 强调色背景 | #059669 | #10B981 |
| `bg-accent/10` | 强调色淡底 | 10%透明度 | 10%透明度 |

---

## 9. AI分析耗时参考

| 模型 | USDT级合约(~500行) | 大型合约(>2000行) | 每次成本 |
|------|---------------------|-------------------|----------|
| Gemini 3 Flash | **15-45s** | 30-90s | $0.01-0.05 |
| GPT-5.2 | 30-90s | 60-180s | $0.10-0.50 |
| Claude 4.5 Opus | 60-180s | 120-300s | $0.50-2.00 |
| Claude 4.5 Opus Max | 90-300s | 180-600s | $1.00-5.00 |

**经验**: Gemini 3 Flash 已验证可以完成完整分析，速度最快成本最低，推荐作为默认测试模型。

---

## 10. 测试用合约地址

| 合约 | 地址 | 链 | 特点 |
|------|------|----|------|
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Ethereum | 经典ERC20，单文件，已测试通过 |
| USDC (Proxy) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Ethereum | EIP-1967代理合约，24文件，已测试通过 |
| Uniswap V2 Router | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Ethereum | 多接口调用 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Ethereum | 简单Wrapper |

---

## 11. 下一步行动计划

### 11.1 立即执行：视觉回归测试
v3 进行了大规模颜色替换（200+处），需要启动项目做视觉检查：
1. `npm run dev` → 打开 `http://localhost:3000`
2. 检查首页卡片、按钮是否为绿色
3. 检查 `/audit` 三个模式的分析覆盖层（计时器、三阶段指示器）
4. 点击右上角太阳/月亮按钮测试明暗切换
5. 如发现视觉问题，定位到具体文件和类名修复

### 11.2 可选优化（如有时间）
- Streaming AI输出（`stream: true`）— 提升大合约分析的用户体验
- 3分钟AI超时保护 + 自动降级为仅Slither
- P1功能：历史记录、批量审计
- 报告PDF导出
- Light模式下的 Prism.js 代码高亮主题适配（当前暗色主题在亮色背景下可能不理想）

---

## 12. 对话角色设定

- **AI角色**: 区块链、金融、AI领域全球顶级专家
- **用户角色**: 同上，本科毕业设计学生
- **回答要求**: 必须提出科学参考资料，引用处解释；中文回答
- **项目性质**: 成都信息工程大学 · 信息安全专业 · 本科毕业设计

---

## 13. 文件下载机制说明

**Download Source 和 Download ZIP 均为纯前端内存操作，无服务器端存储**：
1. 合约源码从 `/api/source`（Etherscan API）获取 → 保存在 React state（浏览器内存）
2. 点击下载 → JSZip 在浏览器内存中打包为 ZIP Blob
3. file-saver 的 saveAs() 触发浏览器下载到用户本地 Downloads 文件夹
4. 参考：JSZip API - generateAsync (https://stuk.github.io/jszip/)

---

## 14. 版本变更日志

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1 | 2026-02-09 | 初始文档，P0功能完成，API/源码获取/双引擎 |
| v2 | 2026-02-10 | Fix 1-4（进度UI/错误处理/重试逻辑），Address模式计时器+三阶段指示器 |
| v3 | 2026-02-11 | **进度UI一致性修复**（SingleFile/MultiFile同步）+ **绿色藤蔓主题改造**（next-themes + CSS变量 + 12文件200+处颜色替换 + 新Logo） |
