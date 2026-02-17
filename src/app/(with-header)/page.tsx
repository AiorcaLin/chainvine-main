import Link from "next/link";
import { ChainVineLogo } from "@/components/Icons";

// ---------------------------------------------------------------------------
// 数据
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: "Dual-Engine Analysis",
    desc: "Slither 静态分析 + LLM 深度审计并行执行，交叉验证提升发现置信度",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    accent: true,
  },
  {
    title: "80+ Vulnerability Detectors",
    desc: "基于 Slither 的 80+ 检测器覆盖重入攻击、整数溢出、权限控制等 SWC 标准漏洞",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Multi-Model AI Audit",
    desc: "支持 GPT / Claude / Gemini / Qwen 等多模型，深度语义分析发现业务逻辑漏洞",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "8 EVM Chains",
    desc: "Ethereum、BSC、Arbitrum、Base、Optimism、Polygon、Avalanche、Aurora 全覆盖",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    title: "Proxy Contract Detection",
    desc: "自动识别 EIP-1967 / UUPS / Beacon 代理模式，分离 Proxy 与 Implementation",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    ),
  },
  {
    title: "StreamAI & Agent API",
    desc: "流式实时输出审计结果，同时提供 RESTful Agent API 供外部 AI Agent 集成调用",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "2", label: "Analysis Engines" },
  { value: "80+", label: "Vulnerability Detectors" },
  { value: "8", label: "EVM Chains" },
  { value: "3", label: "LLM Providers" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
          {/* Logo + 标题 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <ChainVineLogo size={48} className="text-accent" />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Chain<span className="text-accent">Vine</span>
            </h1>
          </div>

          {/* 主标语 */}
          <p className="text-xl md:text-2xl text-foreground/80 font-medium mb-3 max-w-3xl mx-auto">
            Dual-Engine Smart Contract Vulnerability Scanner
          </p>
          <p className="text-base text-muted max-w-2xl mx-auto mb-10">
            基于 Slither 静态分析与大语言模型的智能合约安全审计系统
            <br />
            <span className="text-muted/70 text-sm">
              — 成都信息工程大学 · 信息安全 · 本科毕业设计
            </span>
          </p>

          {/* CTA 按钮 */}
          <div className="flex justify-center gap-4 mb-16">
            <Link
              href="/audit"
              className="group relative inline-flex items-center gap-2 px-8 py-4 
                       bg-accent text-white rounded-xl text-lg font-semibold
                       shadow-lg shadow-accent/20
                       transition-all duration-300 ease-out
                       hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02]
                       active:scale-[0.98]"
            >
              Start Audit
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <a
              href="https://github.com/AiorcaLin/chainvine-main"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-medium
                       text-foreground/70 bg-secondary border border-border
                       transition-all duration-300
                       hover:bg-card-hover hover:border-muted/40 hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>

          {/* ── 架构示意图 ── */}
          <div className="max-w-3xl mx-auto bg-card/60 backdrop-blur border border-border rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Slither 引擎 */}
              <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground">Slither</p>
                <p className="text-xs text-muted mt-1">Static Analysis</p>
              </div>

              {/* 融合箭头 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-accent/30" />
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="h-px flex-1 bg-accent/30" />
                </div>
                <p className="text-sm font-semibold text-accent">Fusion</p>
                <p className="text-xs text-muted mt-1">Cross-Validate</p>
              </div>

              {/* AI 引擎 */}
              <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground">AI (LLM)</p>
                <p className="text-xs text-muted mt-1">Deep Audit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-bold text-accent">{s.value}</p>
                <p className="text-sm text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-3">
          Core Capabilities
        </h2>
        <p className="text-muted text-center mb-12 max-w-xl mx-auto">
          传统静态分析工具与大语言模型深度融合，实现互补性漏洞检测
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                f.accent
                  ? "bg-accent/5 border-accent/20 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
                  : "bg-card border-border hover:border-muted/40 hover:shadow-lg hover:shadow-black/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                f.accent ? "bg-accent/15 text-accent" : "bg-accent/10 text-accent"
              }`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-muted">
            <span>
              © 2026 ChainVine · Licensed under{" "}
              <a
                href="https://github.com/AiorcaLin/chainvine-main/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                AGPL-3.0
              </a>
            </span>
            <a
              href="https://github.com/AiorcaLin/chainvine-main"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
