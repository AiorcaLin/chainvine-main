import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute top-20 right-4 text-muted text-sm">
        The ticker is ETH
      </div>

      <main className="max-w-7xl mx-auto px-4 py-20 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Smart Contract <span className="text-accent">Security</span>
          </h1>
          <p className="text-muted text-xl">
            Dual-engine auditing with Slither + AI — securing your blockchain future
          </p>
        </div>

        <div className="flex justify-center gap-6 mb-20">
          <a
            href="/audit"
            className="group relative inline-flex items-center gap-2 px-8 py-4 
                     bg-secondary rounded-lg text-accent text-lg font-medium
                     border border-accent/20
                     transition-all duration-300 ease-out
                     hover:bg-accent/10"
          >
            <span className="relative z-10">Start Audit</span>
            <svg 
              className="w-5 h-5 transform transition-transform duration-300 
                         group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>

          <a
            href="https://github.com/AiorcaLin/ChainVine/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-secondary rounded-lg
                     text-muted text-lg font-medium
                     border border-border
                     transition-all duration-300
                     hover:bg-card-hover hover:border-muted/30"
          >
            Documentation
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Security Audit</h3>
            <p className="text-muted">
              Comprehensive vulnerability detection and security risk assessment.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Gas Optimization</h3>
            <p className="text-muted">
              Smart analysis for minimizing transaction costs and gas consumption.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">AI Reports</h3>
            <p className="text-muted">
              Comprehensive audit reports powered by multiple AI models with detailed analysis.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Dual-Engine Analysis</h3>
            <p className="text-muted">
              Slither static analysis + AI deep audit run in parallel, with cross-validated finding fusion.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Multi-Chain Support</h3>
            <p className="text-muted">
              Unified analysis across Ethereum, Base, Arbitrum and other chains.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl border border-card-hover">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              {/* Slither snake icon */}
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Slither Integration</h3>
            <p className="text-muted">
              Built-in Slither static analyzer detects reentrancy, overflows, and 80+ vulnerability patterns automatically.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-muted">
            <div>
              © 2024 ChainVine. Licensed under{" "}
              <a
                href="https://github.com/AiorcaLin/ChainVine/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                AGPL-3.0
              </a>
            </div>
            <a
              href="https://github.com/AiorcaLin/ChainVine"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted hover:text-foreground transition-colors"
              aria-label="View on GitHub"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
