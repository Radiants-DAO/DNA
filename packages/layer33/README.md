# Layer33

A coalition of independent Solana validators working together to ensure decentralization remains real as the network scales.

## About

Layer33 is a collective of 25 independent, value-contributing Solana validators. The long-term objective is to support a healthy, sustainable independent validator class that collectively represents **at least 33% of network stake** — the critical threshold in Byzantine Fault Tolerant consensus systems.

### Why 33%?

33% is a defensive line for decentralization. An independent validator class holding at least one-third of stake ensures that no small group of operators can unilaterally stall or steer the network.

## Features

- **Validator Dashboard** — Live data from the Layer33 validator network
- **Staking** — Delegate SOL to the Layer33 stake pool
- **RPC Services** — Fast, affordable RPC and gRPC services
- **SWQoS** — Stake-Weighted Quality of Service routing for reliable transaction landing
- **Design System** — Comprehensive UI component library

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework
- [React 19](https://react.dev/) — UI library
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first CSS
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [TypeScript](https://www.typescriptlang.org/) — Type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/layer33.git
cd layer33

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
layer33/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── brand-assets/      # Brand assets page
│   ├── media/             # Media assets page
│   ├── staking/           # Staking interface
│   └── page.tsx           # Homepage
├── components/            # Shared React components
│   ├── 33layout/         # Layout components
│   ├── icons/            # Icon system
│   ├── ui/               # UI component library
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── public/               # Static assets
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- Website: [layer33.io](https://layer33.io)
- Twitter: [@Layer33\_](https://twitter.com/Layer33_)
