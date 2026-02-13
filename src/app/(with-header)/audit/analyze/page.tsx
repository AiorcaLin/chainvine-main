"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyzeContract } from '@/services/audit/contractAnalyzer';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Analysis, AnalysisResult } from "@/types/blockchain";

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
        // Fetch contract source and analyze
        const response = await fetch(`/api/source?address=${address}&chain=${chain}`);
        const data = await response.json();
        
        if (data.error) {
          toast.error(data.error);
          return;
        }

        // Start analysis
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
    <div className="min-h-screen bg-card">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-foreground">Analyzing contract...</p>
          </div>
        </div>
      ) : analysis ? (
        <div className="max-w-5xl mx-auto py-8 px-6">
          {/* Contract Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">Contract Analysis</h1>
            <div className="flex items-center gap-2 text-muted text-sm">
              <span>Contract:</span>
              <code className="px-2 py-1 bg-secondary rounded text-[#CE9178]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </code>
              <span>on</span>
              <span className="capitalize">{chain}</span>
            </div>
          </div>

          {/* Markdown Content */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="prose prose-invert max-w-none
                          prose-headings:text-foreground
                          prose-h1:text-3xl prose-h1:mb-8
                          prose-h2:text-2xl prose-h2:text-accent prose-h2:mt-8 prose-h2:mb-4
                          prose-h3:text-xl prose-h3:text-emerald-400 prose-h3:mt-6 prose-h3:mb-3
                          prose-p:text-foreground/80 prose-p:leading-relaxed
                          prose-strong:text-emerald-400
                          prose-code:text-[#CE9178] prose-code:bg-card
                          prose-li:text-foreground/80
                          [&_ul]:mt-2 [&_ul]:mb-4 [&_ul]:pl-6
                          [&_li]:my-1">
              <ReactMarkdown>{analysis.analysis}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-foreground">
            No analysis results available
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
} 