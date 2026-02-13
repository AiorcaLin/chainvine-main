import type { ContractFile } from "@/types/blockchain";
// test edit

interface AuditReportInput {
  code: string;
  aiAnalysis: string;
  vulnerabilities: any[];
  gasOptimizations: any[];
  files: ContractFile[];
  contractName?: string;
  chain?: string;
}

interface AuditReport {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    gasOptimizations: number;
  };
  contractInfo: {
    name?: string;
    address?: string;
    chain?: string;
    compiler?: string;
  };
  analysis: string;
  recommendations: string[];
}

export async function generateReport(
  input: AuditReportInput
): Promise<AuditReport> {
  const vulnerabilitiesBySeverity = {
    Critical: input.vulnerabilities.filter((v) => v.severity === "Critical"),
    High: input.vulnerabilities.filter((v) => v.severity === "High"),
    Medium: input.vulnerabilities.filter((v) => v.severity === "Medium"),
    Low: input.vulnerabilities.filter((v) => v.severity === "Low"),
  };

  const recommendations = [
    ...input.vulnerabilities.map((v) => v.recommendation),
    ...input.gasOptimizations.map((o) => o.description),
  ].filter(Boolean);

  return {
    summary: {
      totalIssues: input.vulnerabilities.length,
      criticalIssues: vulnerabilitiesBySeverity.Critical.length,
      highIssues: vulnerabilitiesBySeverity.High.length,
      mediumIssues: vulnerabilitiesBySeverity.Medium.length,
      lowIssues: vulnerabilitiesBySeverity.Low.length,
      gasOptimizations: input.gasOptimizations.length,
    },
    contractInfo: {
      // TODO: Add contract info from source code analysis
    },
    analysis: input.aiAnalysis,
    recommendations: recommendations,
  };
}
