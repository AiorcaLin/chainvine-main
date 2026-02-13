# `Mush Audit`
----------------------------------------

Mush Audit is an AI-powered smart contract security auditing platform. It uses the **Neversight API** as a unified gateway to multiple model providers to generate audit reports and optimization suggestions.

----------------------------------------

![image](https://github.com/user-attachments/assets/336fae3c-06af-4e09-a59a-3d815e1f0f53)

----------------------------------------


## Features

### 🛡️ Security Analysis
- Comprehensive vulnerability detection
- Smart contract security risk assessment
- Real-time security analysis

### ⚡ Gas Optimization
- Transaction cost analysis
- Gas usage optimization suggestions
- Performance improvement recommendations

### 📊 AI-Powered Reports
- Detailed security audit reports
- Multiple AI models analysis
- Clear and actionable insights

### 🔄 Multi-Model Support (via Neversight)
- `anthropic/claude-4.5-opus`
- `anthropic/claude-4.5-opus-max`
- `google/gemini-3-pro`
- `google/gemini-3-flash`
- `openai/gpt-5.2`
- `openai/gpt-5.2-high`

### 🌐 Multi-Chain Support
- Ethereum
- Base
- Arbitrum
- Optimism
- BSC
- Polygon
- Avalanche-C
- Aurora
- HashKey Chain (planned)
- More chains coming soon

## TODO
- [ ] Add HashKey Chain support (RPC + explorer integration, verified source fetching, and UI chain selector)

### 🚀 Super Prompt
- Enhanced analysis capabilities
- Specialized security prompts
- Deeper security insights

## Getting Started
- Clone the repository: ``git clone https://github.com/AiorcaLin/ChainVine``
- ``cd ChainVine`` (or the directory name after clone)
- Enter your **Neversight API Key** in the in-app **AI Configuration** modal (it will be saved to your browser `localStorage`)
- Install dependencies: ``bun install``
- Start the development server: ``bun dev``


## Usage

1. Visit the platform
2. Input your smart contract address
3. Select the blockchain network
4. Choose AI models for analysis
5. Get comprehensive security analysis and recommendations

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Multiple AI Models Integration

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE)

