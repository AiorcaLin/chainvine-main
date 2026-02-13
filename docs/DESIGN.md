# Mush Audit — Design Doc

## 1. Overview

Mush Audit is an AI-powered smart contract security auditing web app. Users provide a contract address and target chain, optionally select an AI model, and receive a Markdown audit report covering security findings and gas optimizations. The app uses **Neversight API** as a unified gateway to multiple model providers.

Goals:
- Provide a fast “paste address → get audit” experience for EVM smart contracts.
- Support multi-chain contract discovery and verified source retrieval via Etherscan-compatible explorers.
- Handle proxy contracts by separating proxy source and implementation source to audit the effective logic.
- Generate a portable report artifact (Markdown + structured summary) suitable for download/sharing.

Non-goals:
- On-chain execution or simulation of transactions.
- Formal verification or full semantic equivalence checking.
- Private source ingestion beyond public explorer APIs.

## 2. High-Level Architecture

The system is a Next.js application with:
- **UI** pages and components (user input, file explorer, preview, report view).
- **API routes** for fetching contract metadata and verified source from explorers.
- **Audit service** that builds prompts, calls Neversight, and generates a report object.
- **Utilities** for chain configuration, proxy detection, source merging/filtering, and model selection.

```mermaid
flowchart LR
  U[User Browser] -->|Address/Chain/Model| UI[Next.js UI]
  UI -->|GET /api/contract-info| API1[API Route: contract-info]
  UI -->|GET /api/source| API2[API Route: source]
  API1 --> EXP[Explorer APIs]
  API2 --> EXP
  UI -->|analyzeContract()| AUD[Audit Service]
  AUD -->|build prompt| P[Prompt Builder]
  AUD -->|POST chat/completions| NS[Neversight API]
  NS -->|Markdown analysis| AUD
  AUD --> REP[Report Generator]
  UI <-->|render/download| REP
```

## 3. Module Breakdown & Responsibilities

### 3.1 Frontend (Next.js App Router)

- `src/app/**`
  - Pages for the audit workflow (address input, source selection/view, analysis view).
  - Manages UI state (selected chain, contract address, analysis progress, errors).
  - Reads/writes AI config from browser `localStorage` (API key, selected model, language, super-prompt toggle).

- `src/components/**`
  - Audit UI widgets: contract info card, proxy alert, file explorer, source preview, AI config modal, etc.
  - Error boundary and layout components.

### 3.2 API Layer (Server Routes)

- `src/app/api/contract-info/route.ts`
  - Fetches metadata needed for UI display:
    - contract name/compiler/optimizer settings (via explorer `getsourcecode`)
    - deployed bytecode (via explorer proxy endpoint `eth_getCode`)
    - creator + creation tx (via explorer `getcontractcreation`)
    - implementation address if explorer reports a proxy
  - Contains a special-case path for Aurora explorer.

- `src/app/api/source/route.ts`
  - Fetches **verified source code** and (best-effort) compiler settings from explorer APIs.
  - Supports:
    - single-file source
    - multi-file sources (Etherscan-style JSON packed into `SourceCode`)
    - proxy contracts: returns `proxy/...` and `implementation/...` prefixed paths
    - ABI retrieval for proxy and implementation (`getabi`)
  - Auto-upgrades to explorer **v2** endpoint when v1 is deprecated (best-effort compatibility).

### 3.3 Audit Domain Service

- `src/services/audit/contractAnalyzer.ts`
  - Orchestrates analysis:
    - loads AI configuration from `localStorage`
    - selects files to analyze (filters out interfaces and vendored libs, handles proxy/implementation split)
    - merges contract content into a single promptable payload
    - adds language wrapper and optional “super prompt”
    - calls Neversight (`analyzeWithAI`)
    - formats the response and hands it to `generateReport`
  - Includes retry logic with backoff and abort support.

- `src/services/audit/prompts.ts`
  - Owns the base security audit prompt template and optional “super prompt” enhancer.

- `src/services/audit/reportGenerator.ts`
  - Produces a report object including severity summary, contract info stub, analysis markdown, and recommendations list.

### 3.4 Utilities & Types

- `src/utils/ai.ts`
  - Loads/saves AI config; calls Neversight chat-completions with a security-auditor system prompt.

- `src/utils/blockchain.ts`, `src/utils/chainServices.ts`, `src/utils/rpc.ts`
  - Chain metadata, RPC URLs, explorer URLs, proxy detection (EIP-1967/UUPS/transparent/beacon and fallback patterns).

- `src/utils/contractFilters.ts`
  - Merges and sanitizes contract source files into a unified analysis payload.

- `src/types/*`
  - Shared types for AI config and blockchain contract/source primitives.

## 4. Key Flows

### 4.1 User Path (End-to-End)

1. User enters:
   - contract address
   - chain/network
   - AI model + options (language, super prompt)
2. UI requests contract metadata (`/api/contract-info`) for display and proxy hints.
3. UI requests verified source (`/api/source`):
   - if proxy: receives both `proxy/*` and `implementation/*`
   - else: receives contract sources directly
4. User triggers analysis.
5. `analyzeContract()` filters/merges code and sends prompt to Neversight.
6. AI returns Markdown analysis.
7. Report generator builds summary + recommendation list.
8. UI renders the report and supports export/download.

### 4.2 Proxy Contract Handling

Proxy handling is critical because auditing the proxy shell is rarely useful without the implementation logic.

Design:
- In `/api/source`, detect proxy via explorer-reported `Implementation` field.
- Return two logical folders:
  - `proxy/...` for proxy source
  - `implementation/...` for implementation source
- In analysis:
  - default to implementation files when both exist
  - keep paths so findings can cite file locations meaningfully

### 4.3 Prompt Construction & AI Inference

Prompt is assembled as:

1. Base template from `SECURITY_AUDIT_PROMPT` containing:
   - injected merged code
   - injected contract name
   - required output structure and severity taxonomy
2. Language wrapper (e.g., “respond in English”)
3. Optional “super prompt” prepend/augment for deeper analysis
4. Neversight chat-completions request:
   - `system`: static “security auditor” role prompt
   - `user`: final prompt

Output:
- Markdown response is normalized (remove accidental code fences, ensure section formatting).
- A header is added identifying Mush Audit as the generator.

## 5. Contract / AI / Data Flows

### 5.1 Contract Data Flow

Sources of truth:
- RPC: existence check, on-chain bytecode, proxy slot reads (best-effort).
- Explorer APIs: verified source, compiler metadata, ABI, creation info.

Trade-offs:
- Explorer data is used when available because it provides verified source and metadata.
- RPC probing is used for chain detection and proxy slot reads, but cannot replace verified source.

### 5.2 AI Data Flow

- The user provides a Neversight API key through an in-app modal.
- The key is stored in browser `localStorage` and sent directly from the client to Neversight.
- Only the merged source code and audit prompt are transmitted to Neversight for inference.

Security considerations:
- Storing API keys in `localStorage` is convenient but increases exposure to XSS. The UI should maintain strict content sanitization and avoid rendering untrusted HTML.
- An alternative design would move Neversight calls server-side and store keys securely; this project favors simplicity and local control.

## 6. Core Technology Choices (and Why)

- **Next.js (App Router)**: integrated routing + API routes, easy deployment (serverless friendly), good DX.
- **TypeScript**: safer refactors, clearer contracts for chain/source/report shapes.
- **ethers v6**: standard EVM RPC client; used for bytecode checks and proxy slot probing.
- **Neversight API**: single integration point for multiple model providers; reduces vendor-specific glue code.
- **Monaco editor + Markdown rendering** (UI): improves source browsing and audit report readability.
- **Tailwind CSS**: rapid UI iteration and consistent styling.

## 7. Operational Notes & Limits

- Rate limits and API key requirements vary by explorer; the API layer attempts best-effort fallbacks (including v2 upgrade when v1 is deprecated).
- Large multi-file codebases can exceed model context limits; the merge/filter stage reduces noise (interfaces, vendored libs).
- Findings are AI-generated and should be treated as recommendations requiring human verification.

