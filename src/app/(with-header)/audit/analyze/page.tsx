"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyzeContract } from '@/services/audit/contractAnalyzer';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Analysis, AnalysisResult } from "@/types/blockchain";
import { ChainVineLogo } from "@/components/Icons";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const address = searchParams.get('address');
  const chain = searchParams.get('chain');

  useEffect(() => {
    const startAnalysis = async () => {
      if (!address || !chain) {
        toast.error('Missing required parameters');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/source?address=${address}&chain=${chain}`);
        const data = await response.json();
        
        if (data.error) {
          toast.error(data.error);
          return;
        }

        const result: AnalysisResult = await analyzeContract({
          files: data.files,
          contractName: data.contractName,
          chain: chain
        });

        setAnalysis({
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
          },
          contractInfo: {},
          analysis: result.report.analysis,
          recommendations: [],
        });
      } catch (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze contract');
      } finally {
        setLoading(false);
      }
    };

    startAnalysis();
  }, [address, chain]);

  return (
    <div className="min-h-screen bg-background">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-accent/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-3 bg-background rounded-full flex items-center justify-center border border-accent/20">
                <ChainVineLogo size={40} className="text-accent animate-bounce-slow" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-foreground">Analyzing Contract</h3>
              <p className="text-sm text-muted">Running dual-engine security analysis...</p>
            </div>
          </div>
        </div>
      ) : analysis ? (
        <div className="max-w-5xl mx-auto">
          {/* Hero Section — 与审计主页视觉一致 */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-accent/3 rounded-full blur-3xl" />
            </div>

            <div className="relative px-6 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <ChainVineLogo size={32} className="text-accent" />
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Chain<span className="text-accent">Vine</span> Analysis Report
                </h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span>Contract:</span>
                <code className="px-2 py-1 bg-secondary rounded border border-border text-accent font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
                <span>on</span>
                <span className="capitalize font-medium text-foreground/80">{chain}</span>
              </div>
            </div>
          </section>

          {/* Markdown Content */}
          <div className="px-6 pb-8">
            <div className="bg-gradient-to-br from-secondary to-card rounded-xl p-6 border border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0" />
              <div className="prose prose-invert max-w-none
                            prose-headings:text-foreground
                            prose-h1:text-3xl prose-h1:mb-8
                            prose-h2:text-2xl prose-h2:text-accent prose-h2:mt-8 prose-h2:mb-4
                            prose-h3:text-xl prose-h3:text-emerald-400 prose-h3:mt-6 prose-h3:mb-3
                            prose-p:text-foreground/80 prose-p:leading-relaxed
                            prose-strong:text-emerald-400
                            prose-code:text-accent prose-code:bg-secondary
                            prose-li:text-foreground/80
                            [&_ul]:mt-2 [&_ul]:mb-4 [&_ul]:pl-6
                            [&_li]:my-1
                            [&_table]:border-border [&_th]:bg-secondary [&_td]:border-border [&_th]:border-border">
                <ReactMarkdown>{analysis.analysis}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <ChainVineLogo size={48} className="text-muted/40 mx-auto mb-4" />
            <p className="text-foreground text-lg font-medium">No analysis results available</p>
            <p className="text-muted text-sm mt-1">Please try again or return to the audit page.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-t-accent border-r-accent/50 border-b-accent/30 border-l-accent/10 rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-accent/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-3 bg-background rounded-full flex items-center justify-center border border-accent/20">
              <ChainVineLogo size={32} className="text-accent animate-bounce-slow" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-foreground">Loading</h3>
            <p className="text-sm text-muted">Preparing analysis view...</p>
          </div>
        </div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}