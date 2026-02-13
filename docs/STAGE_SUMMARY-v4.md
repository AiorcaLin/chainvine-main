# ChainVine 阶段性总结文档 v4

> **生成时间**: 2026-02-13 02:30  
> **上一版**: 2026-02-11（v3，已被本文档替代）  
> **目的**: 为下一个对话窗口提供完整上下文，无需重新分析项目  
> **项目**: ChainVine — 面向区块链的漏洞扫描系统（本科毕业设计）  
> **答辩截止**: 2026-03  
> **学校**: 成都信息工程大学 · 信息安全专业  
> **仓库**: https://github.com/AiorcaLin/ChainVine

---

## 1. 项目架构概述

```
chainvine-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # 🔄 根布局（精简版：仅html/body/ThemeProvider/Toaster/ErrorBoundary）~70行
│   │   ├── globals.css                         # 全局CSS + 明暗主题CSS变量 ~310行
│   │   ├── icon.svg                            # 🆕 SVG favicon（翡翠绿ChainVine logo）
│   │   ├── (with-header)/                      # 🆕 Route Group — 带全局Header的页面
│   │   │   ├── layout.tsx                      # 🆕 Header布局（Logo + ThemeToggle + 粘性导航栏）
│   │   │   ├── page.tsx                        # 首页 /
│   │   │   └── audit/
│   │   │       ├── page.tsx                    # 主审计页面 /audit（三模式入口）~1347行
│   │   │       └── analyze/page.tsx            # 分析结果页 /audit/analyze
│   │   ├── (fullscreen)/                       # 🆕 Route Group — 无全局Header的全屏页面
│   │   │   └── audit/
│   │   │       └── source/page.tsx             # 源码查看页 /audit/source（SourcePreview自带Header）
│   │   └── api/
│   │       ├── contract-info/route.ts          # 合约信息API（含V2自动升级）
│   │       ├── source/route.ts                 # 源码获取API（含V2自动升级）
│   │       └── slither/route.ts                # Slither代理API
│   ├── services/audit/
│   │   ├── dualEngineAnalyzer.ts               # 双引擎编排器（Slither+AI并行→融合）
│   │   ├── findingFusion.ts                    # 结果融合算法（归一化+去重+交叉验证+评分）
│   │   ├── slitherAnalyzer.ts                  # Slither Docker微服务通信
│   │   ├── contractAnalyzer.ts                 # AI分析器（LLM调用+重试逻辑）
│   │   ├── reportGenerator.ts                  # 报告生成
│   │   └── prompts.ts                          # AI提示词（SECURITY_AUDIT_PROMPT + SUPPER_PROMPT）
│   ├── components/
│   │   ├── ThemeProvider.tsx                    # next-themes 客户端封装（默认暗色主题）
│   │   ├── ThemeToggle.tsx                     # 太阳/月亮主题切换按钮（hydration安全）
│   │   ├── Sidebar.tsx                         # 侧边栏
│   │   ├── Icons.tsx                           # 🔄 SVG图标集（新增 ChainVineLogo 内联SVG组件）
│   │   ├── ErrorBoundary.tsx                   # 错误边界
│   │   └── audit/
│   │       ├── SourcePreview.tsx               # 🔄 源码预览+分析覆盖层+报告渲染（核心UI）~897行
│   │       ├── AIConfigModal.tsx               # AI配置弹窗（模型/语言/Key/SuperPrompt）
│   │       ├── FileExplorer.tsx                # 🔄 文件树浏览器（语义色适配）
│   │       ├── ContractInfoCard.tsx            # 合约信息卡片
│   │       └── ProxyContractAlert.tsx          # 代理合约提示弹窗
│   ├── types/                                  # TypeScript类型定义
│   ├── utils/
│   │   ├── ai.ts                               # AI调用核心（analyzeWithAI, useAIConfig）
│   │   ├── neversight-models.ts                # 6个模型定义（Claude/Gemini/GPT）
│   │   ├── blockchain.ts                       # 链上交互工具
│   │   ├── chainServices.ts                    # 多链RPC/Explorer配置
│   │   ├── constants.ts                        # 链常量（8条EVM链）
│   │   ├── contractFilters.ts                  # 合约文件过滤+合并
│   │   ├── prompts.ts                          # Prompt工具函数
│   │   └── language.ts                         # 多语言支持
│   └── instrumentation.ts                      # 全局fetch代理配置（通过http://127.0.0.1:10808代理）
├── slither-service/
│   ├── app.py                                  # FastAPI Slither微服务
│   ├── Dockerfile                              # Docker镜像
│   └── requirements.txt
├── public/
│   ├── chainvine-logo.svg                      # 🆕 ChainVine SVG Logo（静态文件版，currentColor）
│   └── mush.png                                # 旧Logo（已不再被代码引用，保留备份）
├── docker-compose.yml                          # Slither容器编排
├── tailwind.config.ts                          # Tailwind配置（darkMode:'class' + 10个语义化颜色）~55行
├── .env.local                                  # 环境配置
├── docs/
│   ├── PRD.md                                  # 产品需求文档
│   ├── USAGE.md                                # 使用文档
│   ├── DESIGN.md                               # 设计文档
│   ├── UI的问题.md                              # UI问题跟踪（v4已全部修复）
│   ├── STAGE_SUMMARY_v1.md
│   ├── STAGE_SUMMARY - v2.md
│   ├── STAGE_SUMMARY-v3.md
│   ├── STAGE_SUMMARY-v4.md                     # 本文档
│   └── 测试记录/                                # 手动测试记录+截图+HTML快照
└── 外部文件/
    └── vine.png                                # 藤蔓Logo原始参考图
```

**技术栈**:
- **前端**: Next.js 16.1.4 (Turbopack) + TypeScript + Tailwind CSS + Monaco Editor
- **后端**: Next.js API Routes (Node.js)
- **静态分析**: Slither v0.11.5 (Python FastAPI微服务, Docker容器化, solc 0.8.0)
- **AI引擎**: 6模型支持 via Neversight API Gateway
  - `anthropic/claude-4.5-opus` / `claude-4.5-opus-max`
  - `google/gemini-3-pro` / `gemini-3-flash`（推荐测试用，最快最省钱）
  - `openai/gpt-5.2` / `gpt-5.2-high`
- **主题**: next-themes + Tailwind CSS `darkMode: 'class'` + CSS变量（RGB格式支持透明度）
- **路由架构**: Next.js App Router Route Groups（v4新增：`(with-header)` + `(fullscreen)`）
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
bun dev
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
| F-09 | UI主题改造 | ✅ 已完成 | 绿色藤蔓风格 + 明暗双主题切换（v3） |
| F-10 | UI深度优化 | ✅ 已完成 | SVG Logo + 语义色全覆盖 + Route Groups架构 + Favicon（v4新增） |

---

## 4. v4 修改清单（第四轮对话，共修改/新建 12 个文件）

### 4.1 仓库链接迁移

| 文件 | 修改 |
|------|------|
| `src/app/(with-header)/page.tsx` | 页脚 LICENSE 和 GitHub 图标链接：`NeverSight/chainvine` → `AiorcaLin/ChainVine` |
| `README.md` | git clone URL → `https://github.com/AiorcaLin/ChainVine` |

### 4.2 Logo: PNG → 内联 SVG

**问题**: 全项目使用 `<Image src="/mush.png">`（PNG位图），无法随主题色变化。  
**方案**: 创建 `ChainVineLogo` React 组件（内联 SVG），所有路径使用 `currentColor`，通过父元素 `className="text-accent"` 继承主题色。

- `src/components/Icons.tsx` — 新增 `ChainVineLogo` 组件
- `src/app/layout.tsx` — Image → ChainVineLogo
- `src/app/(with-header)/audit/page.tsx` — 2处 Image → ChainVineLogo
- `src/app/(fullscreen)/audit/source/page.tsx` — 3处 Image → ChainVineLogo
- `src/components/audit/SourcePreview.tsx` — 2处 Image → ChainVineLogo
- `public/chainvine-logo.svg` — 静态SVG文件（备用）

**SVG 结构**: 链环(左右两个) + 藤蔓连接线 + 叶片装饰 + 盾牌轮廓（安全语义），全部使用 `currentColor`。

**参考**: SVG `currentColor` 是 W3C CSS Color Module Level 3 规范中的关键字，使 fill/stroke 继承父元素的 color 属性值。这是实现主题自适应图标的标准做法 (ref: W3C CSS Color Module Level 3, Section 4.4)。

### 4.3 首页内容更新

| 修改 | 详情 |
|------|------|
| 副标题 | "Powered by AI…" → "Dual-engine auditing with Slither + AI — securing your blockchain future" |
| 特性卡片4 | "Multi-Model Analysis" → **"Dual-Engine Analysis"**（Slither + AI 并行 + 交叉验证融合） |
| 特性卡片6 | "Super Prompt" → **"Slither Integration"**（内置 Slither 静态分析，自动检测 80+ 漏洞模式） |
| 清理 | 移除未使用的 `Image`, `Sidebar`, Icon imports |

### 4.4 UI 遮挡问题修复（3处）

#### Fix-1: "The ticker is ETH" 被 header 遮挡
- **根因**: `absolute top-4 right-4`（16px）位于 layout 的 `sticky top-0 z-40` header（~64px高）之下
- **修复**: `top-4` → `top-20`（80px），同时 `text-gray-400` → `text-muted`
- **文件**: `(with-header)/page.tsx`, `(with-header)/audit/page.tsx`

#### Fix-2: "Enter Contract Address" 亮主题不可见
- **根因**: 硬编码 `text-white`，在亮主题白底上对比度为 1:1
- **修复**: `text-white` → `text-foreground`
- **文件**: `(with-header)/audit/page.tsx`
- **参考**: WCAG 2.1 SC 1.4.3 要求文本对比度至少 4.5:1

#### Fix-3: /audit/source 工具栏被 layout header 覆盖
- **根因**: SourcePreview 使用 `fixed inset-0` 但无 z-index（默认 auto ≈ 0），被 layout header 的 z-40 覆盖
- **v4 最终方案**: 通过 Route Groups 架构彻底消除冲突（见 4.6），不再需要 z-index hack

### 4.5 全局 `text-gray-*` → 语义色清理

**涉及文件**: 5 个 | **总替换数**: ~50+

| 旧值（硬编码） | 新值（语义化） | 语义 |
|---|---|---|
| `text-gray-300` | `text-foreground/80` | 次要文本（80%前景色不透明度） |
| `text-gray-400` | `text-muted` | 静默文本 |
| `text-gray-500` | `text-muted/70` | 占位符/提示（70%不透明度） |
| `bg-gray-500` / `bg-gray-600` | `bg-muted/50` / `bg-muted/30` | 状态指示器背景 |
| `placeholder-gray-500` | `placeholder-muted/70` | 输入框占位符 |
| `border-[#505050]` | `border-muted/40` | 输入框 focus 边框 |
| `border-[#404040]` | `border-border` | 按钮边框 |
| `hover:text-gray-300` | `hover:text-foreground/80` | 悬停态 |
| `group-hover:text-gray-300/400` | `group-hover:text-foreground/80` / `group-hover:text-muted` | 组悬停 |
| `text-white`（FileExplorer） | `text-foreground` | 文件树文本 |

**清理后验证**: 全 `src/` 下 `text-gray-[2345]00` 匹配数 = **0**，`text-white` 匹配数 = **0**，lint 错误 = **0**

**参考**: Tailwind CSS 对自定义颜色使用 `<alpha-value>` 透明度修饰符。只要颜色定义为 `rgb(var(--muted) / <alpha-value>)` 格式，就可使用 `text-muted/70` 语法生成 `rgb(107 114 128 / 0.7)` (ref: Tailwind CSS Docs — Using CSS variables)。

### 4.6 Route Groups 架构重构（核心改动）

**之前（v3）**:
```
src/app/
├── layout.tsx          ← 根布局（包含 header + ThemeToggle）
├── page.tsx            ← 首页
└── audit/
    ├── page.tsx        ← 审计页
    ├── source/page.tsx ← 源码页（SourcePreview 用 z-[45] 强制覆盖 header）
    └── analyze/page.tsx
```

**之后（v4）**:
```
src/app/
├── layout.tsx                    ← 根布局（精简：仅 html/body/ThemeProvider/Toaster/ErrorBoundary）
├── icon.svg                      ← 新 favicon
├── (with-header)/
│   ├── layout.tsx                ← Header 布局（Logo + ThemeToggle + 粘性导航）
│   ├── page.tsx                  ← 首页 /
│   └── audit/
│       ├── page.tsx              ← /audit
│       └── analyze/page.tsx      ← /audit/analyze
└── (fullscreen)/
    └── audit/
        └── source/page.tsx       ← /audit/source（无全局 header）
```

**关键点**:
- 圆括号 `()` 是 Next.js Route Group 语法，不影响 URL 路径
- `/audit/source` 不再渲染全局 header → SourcePreview 自带的 header 直接显示
- 移除了 `z-[45]` hack，层叠上下文完全干净
- 根 layout 变为纯 shell（约 70 行），只负责 html/body/全局 Provider

**参考**: Next.js App Router Route Groups 允许在不影响 URL 结构的前提下组织路由并共享 layout。`(folderName)` 不出现在 URL 路径中 (ref: Next.js Docs — Route Groups, https://nextjs.org/docs/app/building-your-application/routing/route-groups)。

### 4.7 Favicon 替换

| 项目 | 旧 | 新 |
|------|----|----|
| 文件 | `src/app/favicon.ico`（240KB 位图） | `src/app/icon.svg`（<1KB SVG） |
| 外观 | 默认 Next.js 图标 | ChainVine logo（翡翠绿 #10B981） |
| 颜色 | 固定 | 固定 #10B981（favicon 无 CSS 上下文，不可用 currentColor） |

**参考**: Next.js App Router 的 `icon.svg` 约定——放置在 `app/` 目录下的 `icon.svg` 会自动生成 `<link rel="icon">` 标签 (ref: Next.js Docs — Metadata Files: icon)。

### 4.8 额外清理

| 文件 | 操作 |
|------|------|
| `(with-header)/audit/analyze/page.tsx` | 移除未使用的 `Image` 和 `Link` import |
| `(with-header)/audit/page.tsx` | 移除未使用的 `Image` import，合并 `ChainVineLogo` import |
| `(fullscreen)/audit/source/page.tsx` | 移除 `Image` import，替换为 `ChainVineLogo` |
| `SourcePreview.tsx` | 移除 `Image` import |

---

## 5. 已知问题与风险

| # | 问题 | 严重度 | 状态 | 说明 |
|---|------|--------|------|------|
| 1 | Neversight API余额不足 | 高 | 已知 | 余额$0.74，Claude/GPT一次可能不够。**建议用Gemini 3 Flash测试** |
| 2 | 其他链API Key未配置 | 低 | 已知 | 仅Ethereum链配了Etherscan Key |
| 3 | 前端AI Key存localStorage | 中 | 设计如此 | Neversight API Key在前端配置，不经过后端 |
| 4 | Slither容器需手动启动 | 低 | 已知 | 需先 `docker-compose up -d` |
| 5 | AI非流式请求 | 中 | 已知 | 大合约等待时间长，可选优化：`stream: true` |
| 6 | 无全局超时保护 | 中 | 已知 | AI分析无硬超时限制 |
| 7 | Monaco Editor主题未联动 | 低 | 🆕 v4发现 | `theme="vs-dark"` 硬编码，亮主题下编辑器仍为黑色。可通过 `useTheme()` 动态切换 |
| 8 | 报告弹窗硬编码暗色CSS | 低 | 已知 | `handleViewReport` 的 `window.open()` HTML模板中 CSS 不响应主题切换 |
| 9 | 浏览器 favicon 缓存 | 低 | 🆕 v4 | 更换 favicon 后需 Ctrl+Shift+R 硬刷新 |

---

## 6. 关键文件速查

| 文件 | 用途 | 行数 |
|------|------|------|
| `src/app/(with-header)/audit/page.tsx` | 前端主页面，三模式入口（Address/SingleFile/MultiFiles） | ~1347 |
| `src/components/audit/SourcePreview.tsx` | 源码预览+分析覆盖层+报告渲染（核心UI） | ~897 |
| `src/app/layout.tsx` | 根布局（精简版：ThemeProvider + Toaster + ErrorBoundary） | ~70 |
| `src/app/(with-header)/layout.tsx` | Header布局（Logo + ThemeToggle + 粘性导航栏） | ~29 |
| `src/app/globals.css` | 全局CSS + Light/Dark双主题CSS变量 | ~310 |
| `tailwind.config.ts` | Tailwind配置（darkMode + 语义化颜色） | ~55 |
| `src/components/Icons.tsx` | SVG图标集（含 ChainVineLogo 内联组件） | ~145 |
| `src/components/ThemeProvider.tsx` | next-themes客户端封装 | ~11 |
| `src/components/ThemeToggle.tsx` | 太阳/月亮主题切换按钮 | ~48 |
| `src/services/audit/dualEngineAnalyzer.ts` | 双引擎并行编排+融合调用 | ~133 |
| `src/services/audit/findingFusion.ts` | 融合算法：归一化+去重+交叉验证+评分 | ~391 |
| `src/services/audit/slitherAnalyzer.ts` | Slither微服务通信（Docker容器） | ~271 |
| `src/services/audit/contractAnalyzer.ts` | AI分析器（LLM调用+重试逻辑） | ~211 |
| `src/services/audit/prompts.ts` | AI提示词 | ~207 |
| `src/utils/ai.ts` | AI调用核心（analyzeWithAI, useAIConfig, getAIConfig） | ~143 |
| `src/utils/neversight-models.ts` | 6个模型定义 | ~46 |
| `src/app/api/source/route.ts` | 链上源码获取API（含V2自动升级） | ~200 |
| `src/app/api/contract-info/route.ts` | 合约元信息API（含V2自动升级+代理检测） | ~200 |
| `src/instrumentation.ts` | 全局fetch代理（http://127.0.0.1:10808） | ~27 |

---

## 7. 主题系统技术说明

### 7.1 工作原理
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

### 7.2 v4 新增：透明度语义色用法

v4 引入了大量 `text-muted/70`、`bg-muted/30`、`border-muted/40` 等透明度修饰用法。这依赖 tailwind.config.ts 中颜色定义的 `<alpha-value>` 占位符：

```typescript
// tailwind.config.ts
muted: 'rgb(var(--muted) / <alpha-value>)',
```

Tailwind 编译时会将 `text-muted/70` 转换为：
```css
color: rgb(var(--muted) / 0.7);  /* 即 rgb(107 114 128 / 0.7) 或 rgb(153 153 153 / 0.7) */
```

### 7.3 颜色映射速查（写新组件时参考）

| Tailwind 类名 | 含义 | Light值 | Dark值 |
|---------------|------|---------|--------|
| `bg-background` | 页面底色 | 白 | #1A1A1A |
| `bg-card` | 卡片/面板 | 白 | #1E1E1E |
| `bg-card-hover` | 卡片hover | #F9FAFB | #2A2A2A |
| `bg-secondary` | 次要区域 | #F3F4F6 | #252526 |
| `bg-secondary-hover` | 次要hover | #E5E7EB | #333333 |
| `border-border` | 通用边框 | #D1D5DB | #333333 |
| `text-foreground` | 主文本 | #111827 | #E5E5E5 |
| `text-foreground/80` | 次要文本 | 80%不透明度 | 80%不透明度 |
| `text-muted` | 弱化文本 | #6B7280 | #999999 |
| `text-muted/70` | 占位符级 | 70%不透明度 | 70%不透明度 |
| `text-accent` | 强调色文本 | #059669 | #10B981 |
| `bg-accent/10` | 强调色淡底 | 10%透明度 | 10%透明度 |
| `border-muted/40` | Focus边框 | 40%不透明度 | 40%不透明度 |
| `placeholder-muted/70` | 输入占位符 | 70%不透明度 | 70%不透明度 |

---

## 8. Route Groups 架构说明（v4 新增，重要！）

### 8.1 路由映射

| URL 路径 | 文件位置 | Layout 链 | 有无 Header |
|----------|----------|-----------|-------------|
| `/` | `(with-header)/page.tsx` | root → with-header | ✅ 有 |
| `/audit` | `(with-header)/audit/page.tsx` | root → with-header | ✅ 有 |
| `/audit/analyze` | `(with-header)/audit/analyze/page.tsx` | root → with-header | ✅ 有 |
| `/audit/source` | `(fullscreen)/audit/source/page.tsx` | root（仅根） | ❌ 无（SourcePreview自带） |

### 8.2 为什么这样设计

SourcePreview 组件使用 `fixed inset-0` 全屏布局并自带完整的 header（包含 Blockscan 链接、Download Source、Slither 状态、分析按钮等）。如果全局 layout 也渲染 header，会产生两个 header 的层叠冲突。

**v3 方案**: 给 SourcePreview 加 `z-[45]` 强制覆盖 layout header 的 `z-40`。  
**v4 方案**: 通过 Route Groups 让 `/audit/source` 路由根本不渲染全局 header，从架构层面消除冲突。

### 8.3 如何添加新页面

- **需要 header 的页面**: 放在 `(with-header)/` 路由组下
- **全屏页面**: 放在 `(fullscreen)/` 路由组下
- 两种路由组共享根 layout（ThemeProvider、Toaster、字体等全局资源）

---

## 9. AI分析耗时参考

| 模型 | USDT级合约(~500行) | 大型合约(>2000行) | 每次成本 |
|------|---------------------|-------------------|----------|
| Gemini 3 Flash | **15-45s** | 30-90s | $0.01-0.05 |
| GPT-5.2 | 30-90s | 60-180s | $0.10-0.50 |
| Claude 4.5 Opus | 60-180s | 120-300s | $0.50-2.00 |
| Claude 4.5 Opus Max | 90-300s | 180-600s | $1.00-5.00 |

---

## 10. 测试用合约地址

| 合约 | 地址 | 链 | 特点 |
|------|------|----|------|
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Ethereum | 经典ERC20，单文件 |
| USDC (Proxy) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Ethereum | EIP-1967代理合约，24文件 |
| Uniswap V2 Router | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | Ethereum | 多接口调用 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Ethereum | 简单Wrapper |

---

## 11. 下一步行动计划

### 11.1 立即执行：v4 视觉回归测试
Route Groups 重构改变了文件位置，需验证路由是否正常：
1. `bun dev` → 打开 `http://localhost:3000`（首页应有 header）
2. `/audit`（应有 header + 三模式入口）
3. `/audit/source?address=0xdAC...&chain=ethereum`（应**无**全局 header，SourcePreview 自带 header 直接显示）
4. 明暗切换测试：所有文本在两种主题下均可读
5. 检查浏览器标签栏是否显示翡翠绿 ChainVine logo（可能需要硬刷新）

### 11.2 可选优化（如有时间）
- **Monaco Editor 主题联动**：`theme="vs-dark"` → 根据 `useTheme()` 动态切换 `"vs"` / `"vs-dark"`
- **报告弹窗主题化**：`handleViewReport` 中 `window.open()` HTML 模板改为页面内 modal 渲染
- Streaming AI 输出（`stream: true`）
- 3分钟AI超时保护 + 自动降级
- P1功能：历史记录、批量审计
- Light模式下 Prism.js 代码高亮主题适配
- `AIConfigModal.tsx`、`ContractInfoCard.tsx` 中可能残留的硬编码颜色检查

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
| v1 | 2026-02-09 | 初始文档，P0功能完成，API/源码获取/双引擎 |
| v2 | 2026-02-10 | Fix 1-4（进度UI/错误处理/重试逻辑），Address模式计时器+三阶段指示器 |
| v3 | 2026-02-11 | 进度UI一致性修复 + 绿色藤蔓主题改造（next-themes + CSS变量 + 12文件200+处颜色替换 + 新Logo） |
| v4 | 2026-02-13 | **仓库迁移**(AiorcaLin/ChainVine) + **SVG Logo**(内联currentColor) + **全局语义色清理**(~50+处text-gray→text-muted/foreground) + **Route Groups架构**(消除header层叠冲突) + **Favicon SVG** + **首页Slither元素** + **UI遮挡修复**(3处) |

---

## 14. 历轮对话修改汇总

### v1（第一轮）
- 重写 `/api/contract-info/route.ts`（V2自动升级）
- 大幅修改 `audit/page.tsx`（双引擎集成+进度条+ZIP导出）
- 配置 `.env.local`

### v2（第二轮，4个文件）
- `dualEngineAnalyzer.ts` — AI失败时发送progress事件
- `contractAnalyzer.ts` — 4xx错误立即抛出不重试
- `SourcePreview.tsx` + `audit/page.tsx` — 分级错误提示 + 计时器 + 三阶段指示器

### v3（第三轮，16个文件）
- 进度UI一致性修复（SingleFile/MultiFile同步Address模式）
- 主题基础设施（ThemeProvider + ThemeToggle + CSS变量 + Tailwind配置）
- 12个文件200+处颜色替换（橙→绿 + 语义化类名）
- 新Logo替换

### v4（第四轮，12个文件）
- 仓库链接迁移 → AiorcaLin/ChainVine（`page.tsx`, `README.md`）
- Logo PNG → 内联 SVG（`Icons.tsx` 新增 ChainVineLogo + 6个文件替换 Image 引用）
- 全局 text-gray-* 清理（5个文件 ~50+处 → 语义色）
- Route Groups 架构重构（根 layout 精简 + `(with-header)` + `(fullscreen)` 两个路由组 + 4个页面文件迁移）
- Favicon（删除 240KB `.ico` → 创建 `icon.svg`）
- 首页内容更新（Slither/双引擎特性卡片）
- UI遮挡修复 3 处（ticker 位置、白色文字、header z-index）
- FileExplorer text-white → text-foreground（4处）
- 未使用 import 清理（Image, Link）
