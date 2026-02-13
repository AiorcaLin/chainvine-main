/**
 * Finding Fusion Engine - dedup, cross-validate, score findings
 * Ref: Dietterich "Ensemble Methods in ML" MCS 2000
 * Ref: SWC Registry https://swcregistry.io/
 */
import { SlitherAnalysisResult, SLITHER_TO_SWC } from "@/types/slither";

export type UnifiedSeverity = "Critical" | "High" | "Medium" | "Low" | "Informational" | "Gas";
export type FindingSource = "slither" | "ai";

export interface UnifiedFinding {
  id: string;
  title: string;
  severity: UnifiedSeverity;
  description: string;
  impact?: string;
  location?: string;
  recommendation?: string;
  sources: FindingSource[];
  confidence: "high" | "medium" | "low";
  slitherCheck?: string;
  swcId?: string;
  category?: string;
}

export interface FusionResult {
  findings: UnifiedFinding[];
  summary: {
    total: number;
    bySeverity: Record<UnifiedSeverity, number>;
    bySource: { slitherOnly: number; aiOnly: number; both: number };
    byConfidence: { high: number; medium: number; low: number };
  };
  metadata: {
    slitherFindingsCount: number;
    aiFindingsCount: number;
    deduplicatedCount: number;
    crossValidatedCount: number;
  };
}

const VULN_CAT: Record<string, string[]> = {
  reentrancy: ["reentrancy", "reentrant", "re-entrant", "recursive call", "CEI"],
  "access-control": ["access control", "authorization", "permission", "onlyowner", "privileged", "unprotected", "tx.origin"],
  "integer-overflow": ["overflow", "underflow", "integer", "arithmetic", "SafeMath"],
  "unchecked-call": ["unchecked return", "unchecked call", "unchecked send", "low-level call", "return value"],
  "oracle-manipulation": ["oracle", "price manipulation", "flash loan", "sandwich", "frontrun", "MEV"],
  timestamp: ["timestamp", "block.timestamp", "time dependence"],
  delegatecall: ["delegatecall", "proxy", "storage collision"],
  dos: ["denial of service", "DoS", "gas limit", "unbounded loop"],
  "token-issue": ["ERC20", "ERC721", "approve", "allowance", "fee-on-transfer", "rebasing"],
  initialization: ["uninitiali", "constructor", "initializ"],
  shadowing: ["shadow", "shadowing"],
  gas: ["gas", "optimization", "optimize", "immutable", "constant"],
};

const CHECK_CAT: Record<string, string> = {
  "reentrancy-eth": "reentrancy",
  "reentrancy-no-eth": "reentrancy",
  "reentrancy-benign": "reentrancy",
  "reentrancy-events": "reentrancy",
  "unchecked-lowlevel": "unchecked-call",
  "unchecked-send": "unchecked-call",
  "unprotected-upgrade": "access-control",
  "suicidal": "access-control",
  "tx-origin": "access-control",
  "uninitialized-storage": "initialization",
  "uninitialized-state": "initialization",
  "uninitialized-local": "initialization",
  timestamp: "timestamp",
  "shadowing-state": "shadowing",
  "shadowing-local": "shadowing",
  "controlled-delegatecall": "delegatecall",
  "arbitrary-send-erc20": "access-control",
  "arbitrary-send-eth": "access-control",
  "locked-ether": "dos",
  "write-after-write": "gas",
};

function classify(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(VULN_CAT)) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) return cat;
    }
  }
  return undefined;
}

function extractField(text: string, field: string): string | null {
  const re = new RegExp(
    "[-*]*\\s*\\*\\*" + field + ":?\\*\\*:?\\s*(.+?)(?=\\n[-*]*\\s*\\*\\*|\\n###|\\n---|$)",
    "is"
  );
  const m = text.match(re);
  return m ? m[1].replace(/\n/g, " ").replace(/\s+/g, " ").trim() : null;
}

function isNonFinding(title: string): boolean {
  const skip = [
    "about", "overview", "summary", "introduction", "detailed analysis",
    "architecture", "code quality", "final recommendation", "improved code",
    "conclusion", "centralization", "systemic", "testing", "severity breakdown",
  ];
  const l = title.toLowerCase();
  return skip.some((s) => l.includes(s));
}

function normSev(raw: string): UnifiedSeverity {
  const l = raw.toLowerCase().trim();
  if (l.includes("critical")) return "Critical";
  if (l.includes("high")) return "High";
  if (l.includes("medium")) return "Medium";
  if (l.includes("low")) return "Low";
  if (l.includes("info")) return "Informational";
  if (l.includes("gas") || l.includes("optim")) return "Gas";
  return "Medium";
}

function impactToSev(impact: string): UnifiedSeverity {
  const m: Record<string, UnifiedSeverity> = {
    High: "High", Medium: "Medium", Low: "Low",
    Informational: "Informational", Optimization: "Gas",
  };
  return m[impact] || "Medium";
}

function higherSev(a: UnifiedSeverity, b: UnifiedSeverity): UnifiedSeverity {
  const o: UnifiedSeverity[] = ["Critical", "High", "Medium", "Low", "Informational", "Gas"];
  return o.indexOf(a) <= o.indexOf(b) ? a : b;
}

function fmtCheck(check: string): string {
  return check.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getFiles(loc: string): string[] {
  return loc.match(/[\w/.-]+\.sol/g) || [];
}

function tokenize(t: string): string[] {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

function matchScore(a: UnifiedFinding, b: UnifiedFinding): number {
  let s = 0;
  if (a.category && b.category && a.category === b.category) s += 0.5;
  if (a.location && b.location) {
    const af = getFiles(a.location);
    const bf = getFiles(b.location);
    if (af.some((x) => bf.some((y) => x === y || x.includes(y) || y.includes(x)))) {
      s += 0.3;
    }
  }
  const aw = tokenize(a.title + " " + a.description);
  const bw = tokenize(b.title + " " + b.description);
  const inter = aw.filter((w) => bw.includes(w));
  s += (inter.length / (new Set([...aw, ...bw]).size || 1)) * 0.2;
  return Math.min(s, 1);
}

export function parseAIFindings(report: string): UnifiedFinding[] {
  if (!report) return [];
  const out: UnifiedFinding[] = [];
  for (const sec of report.split(/(?=^###\s)/m)) {
    const t = sec.trim();
    if (!t || !t.startsWith("###")) continue;
    const tm = t.match(/^###\s+(.+?)$/m);
    if (!tm) continue;
    const raw = tm[1].replace(/\[|\]/g, "").replace(/^\d+\.\s*/, "").trim();
    if (isNonFinding(raw)) continue;
    const sev = extractField(t, "Severity");
    const title = extractField(t, "Title") || raw;
    if (!title || !sev) continue;
    out.push({
      id: "ai-" + (out.length + 1),
      title,
      severity: normSev(sev),
      description: extractField(t, "Description") || t,
      impact: extractField(t, "Impact") || undefined,
      location: extractField(t, "Location") || undefined,
      recommendation: extractField(t, "Recommendation") || undefined,
      sources: ["ai"],
      confidence: "medium",
      category: classify(title + " " + (extractField(t, "Description") || "")),
    });
  }
  return out;
}

export function normSlither(result: SlitherAnalysisResult): UnifiedFinding[] {
  if (!result.success || !result.findings.length) return [];
  return result.findings.map((f, i) => {
    const locs = f.elements
      .filter((e) => e.source_mapping?.filename_relative && e.source_mapping?.lines?.length)
      .map((e) => {
        const sm = e.source_mapping!;
        return sm.filename_relative + ":" + sm.lines[0] + "-" + sm.lines[sm.lines.length - 1];
      });
    return {
      id: "slither-" + (i + 1),
      title: fmtCheck(f.check),
      severity: impactToSev(f.impact),
      description: f.description,
      location: locs.length ? locs.join(", ") : undefined,
      sources: ["slither"] as FindingSource[],
      confidence: (f.confidence === "Low" ? "low" : "medium") as "low" | "medium",
      slitherCheck: f.check,
      swcId: SLITHER_TO_SWC[f.check],
      category: CHECK_CAT[f.check] || classify(f.description),
    };
  });
}

export function fuseResults(
  slitherResult: SlitherAnalysisResult | null,
  aiReport: string | null,
): FusionResult {
  const sf = slitherResult ? normSlither(slitherResult) : [];
  const af = aiReport ? parseAIFindings(aiReport) : [];
  const used = new Set<number>();
  const merged: UnifiedFinding[] = [];
  let xc = 0;

  for (const s of sf) {
    let best: { i: number; sc: number } | null = null;
    for (let i = 0; i < af.length; i++) {
      if (used.has(i)) continue;
      const sc = matchScore(s, af[i]);
      if (sc > 0.5 && (!best || sc > best.sc)) best = { i, sc };
    }
    if (best) {
      used.add(best.i);
      xc++;
      const a = af[best.i];
      merged.push({
        id: "fused-" + (merged.length + 1),
        title: a.title || s.title,
        severity: higherSev(s.severity, a.severity),
        description: a.description + "\n\n**Slither:** " + s.description,
        impact: a.impact,
        location: s.location || a.location,
        recommendation: a.recommendation,
        sources: ["slither", "ai"],
        confidence: "high",
        slitherCheck: s.slitherCheck,
        swcId: s.swcId,
        category: s.category || a.category,
      });
    } else {
      merged.push(s);
    }
  }

  for (let i = 0; i < af.length; i++) {
    if (!used.has(i)) merged.push(af[i]);
  }

  const ord: Record<UnifiedSeverity, number> = {
    Critical: 0, High: 1, Medium: 2, Low: 3, Informational: 4, Gas: 5,
  };
  merged.sort((a, b) =>
    (ord[a.severity] - ord[b.severity]) || (b.sources.length - a.sources.length)
  );

  const bySev: Record<UnifiedSeverity, number> = {
    Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0, Gas: 0,
  };
  const byCon = { high: 0, medium: 0, low: 0 };
  let so = 0, ao = 0, bo = 0;
  for (const f of merged) {
    bySev[f.severity]++;
    byCon[f.confidence]++;
    if (f.sources.length === 2) bo++;
    else if (f.sources.includes("slither")) so++;
    else ao++;
  }

  return {
    findings: merged,
    summary: {
      total: merged.length,
      bySeverity: bySev,
      bySource: { slitherOnly: so, aiOnly: ao, both: bo },
      byConfidence: byCon,
    },
    metadata: {
      slitherFindingsCount: sf.length,
      aiFindingsCount: af.length,
      deduplicatedCount: xc,
      crossValidatedCount: xc,
    },
  };
}

function fmtF(f: UnifiedFinding): string {
  const src = f.sources.length === 2
    ? "**[Slither + AI]**"
    : f.sources.includes("slither") ? "**[Slither]**" : "**[AI]**";
  const conf = f.confidence === "high" ? "High" : f.confidence === "medium" ? "Medium" : "Low";
  const p = [
    "#### " + f.title,
    "- **Severity:** " + f.severity,
    "- **Source:** " + src + " | " + conf + " Confidence",
  ];
  if (f.swcId) p.push("- **SWC:** [" + f.swcId + "](https://swcregistry.io/docs/" + f.swcId + ")");
  if (f.description) p.push("- **Description:** " + f.description.substring(0, 500));
  if (f.impact) p.push("- **Impact:** " + f.impact);
  if (f.location) p.push("- **Location:** `" + f.location + "`");
  if (f.recommendation) p.push("- **Recommendation:** " + f.recommendation);
  return p.join("\n");
}

export function formatFusionReport(
  fusion: FusionResult,
  name: string,
  engines: string[],
  slither: SlitherAnalysisResult | null,
  ai: string | null,
): string {
  const L: string[] = [];
  const { findings, summary: su, metadata: m } = fusion;

  L.push("# Smart Contract Security Audit Report\n");
  L.push("**Contract**: " + name + "  ");
  L.push("**Engines**: " + (engines.join(" + ") || "None") + "  ");
  L.push("**Time**: " + new Date().toISOString() + "  ");
  L.push("**Tool**: ChainVine - Dual-Engine Vulnerability Scanner\n");
  L.push("---\n");

  L.push("## Dual-Engine Overview\n");
  L.push("| Metric | Count |");
  L.push("|--------|-------|");
  L.push("| Total | **" + su.total + "** |");
  L.push("| Cross-Validated | **" + su.bySource.both + "** |");
  L.push("| Slither Only | " + su.bySource.slitherOnly + " |");
  L.push("| AI Only | " + su.bySource.aiOnly + " |");
  L.push("| High Confidence | " + su.byConfidence.high + " |");
  L.push("| Deduplicated | " + m.deduplicatedCount + " |\n");

  L.push("### Severity\n");
  L.push("| Level | Count |");
  L.push("|-------|-------|");
  for (const [k, v] of Object.entries(su.bySeverity)) {
    if (v > 0) L.push("| " + k + " | " + v + " |");
  }
  L.push("");

  const cv = findings.filter((f) => f.sources.length === 2);
  if (cv.length) {
    L.push("---\n");
    L.push("## Cross-Validated (High Confidence)\n");
    L.push("> Detected by **both** engines.\n");
    for (const f of cv) L.push(fmtF(f) + "\n");
  }

  L.push("---\n");
  L.push("## All Findings\n");
  const sevs: UnifiedSeverity[] = ["Critical", "High", "Medium", "Low", "Informational", "Gas"];
  for (const sev of sevs) {
    const g = findings.filter((f) => f.severity === sev);
    if (!g.length) continue;
    L.push("### " + sev + " (" + g.length + ")\n");
    for (const f of g) L.push(fmtF(f) + "\n");
  }

  if (ai) {
    L.push("---\n");
    L.push("## Appendix: AI Report\n");
    const c = ai
      .replace(/^#\s+.*?(Security|Audit|Report|Analysis|Generated).*$/gim, "")
      .replace(/^\s*---\s*$/gm, "")
      .trim();
    L.push(c + "\n");
  }

  if (slither?.success && slither.findings.length) {
    L.push("---\n");
    L.push("## Appendix: Slither Raw\n");
    L.push("*" + slither.summary.total + " findings | " + slither.duration_ms + "ms*\n");
    for (const f of slither.findings) {
      L.push("- **[" + f.impact + "]** `" + f.check + "`: " + f.description.trim().substring(0, 200));
    }
    L.push("");
  }

  L.push("---\n");
  L.push("> *Generated by ChainVine. Cross-validated findings have higher confidence. Manual review recommended.*");
  return L.join("\n");
}
