import React from 'react';

export interface FAQItem {
  id: string;
  question: string;
  content: React.ReactNode;
}

export const faqItems: FAQItem[] = [
  {
    id: 'layer33-what',
    question: 'What is Layer33?',
    content: (
      <>
        <p>Layer33 is a collective of independent, value-contributing Solana validators working together to ensure decentralization remains real as the network scales.</p>
        <p className="mt-4">The long-term objective is to support a healthy, sustainable independent validator class that collectively represents <strong>at least 33% of network stake</strong>.</p>
      </>
    ),
  },
  {
    id: 'layer33-who',
    question: 'Who is Layer33?',
    content: (
      <>
        <p>Layer33 is made up of 25 independent validator operators and organizations from across the Solana ecosystem.</p>
        <p className="mt-4">They are geographically distributed, technically capable, and actively contribute to Solana beyond simply running nodes.</p>
      </>
    ),
  },
  {
    id: 'layer33-support',
    question: 'How does Layer33 support independent validators?',
    content: (
      <>
        <p>Layer33 focuses on sustainability, not validator count.</p>
        <p className="mt-4">We support independent validators by:</p>
        <ul className="mt-4 list-disc list-inside space-y-2">
          <li>Improving validator economics through shared infrastructure and services</li>
          <li>Providing access to tooling, routing, and performance optimizations</li>
          <li>Creating alternative revenue streams beyond base staking rewards</li>
          <li>Coordinating incentives so stake doesn&apos;t naturally concentrate with the largest operators</li>
        </ul>
        <p className="mt-4">The goal is simple: keep independent validators viable long-term.</p>
      </>
    ),
  },
  {
    id: 'stake-distribution',
    question: 'How is stake distributed?',
    content: (
      <>
        <p>Stake is distributed across vetted Layer33 validators rather than concentrated in a single operator.</p>
        <p className="mt-4">This improves decentralization, reduces correlated risk, and ensures voting power and block production remain distributed across many independent entities.</p>
      </>
    ),
  },
  {
    id: 'staking-only',
    question: 'Is Layer33 only about staking?',
    content: (
      <>
        <p>No. Staking is the foundation, but it&apos;s not the full picture.</p>
        <p className="mt-4">Layer33 also provides transaction landing, RPC and gRPC services, education, tooling, and validator-owned infrastructure that supports builders and strengthens Solana&apos;s core.</p>
      </>
    ),
  },
  {
    id: 'stake-concentration',
    question: 'Why does stake concentration matter?',
    content: (
      <>
        <p>In Solana&apos;s consensus model, stake determines influence.</p>
        <p className="mt-4">When incentives consistently push stake toward fewer operators, control naturally concentrates. That doesn&apos;t mean Solana isn&apos;t decentralized, but it does mean incentive design matters.</p>
        <p className="mt-4">Diverse incentives lead to diverse operators. Concentrated incentives lead to concentrated power.</p>
      </>
    ),
  },
  {
    id: 'why-33',
    question: 'Why 33%?',
    content: (
      <>
        <p>33% is a critical threshold in Byzantine Fault Tolerant consensus systems.</p>
        <p className="mt-4">An independent validator class holding at least one-third of stake ensures that no small group of operators can unilaterally stall or steer the network. It&apos;s a defensive line for decentralization.</p>
      </>
    ),
  },
  {
    id: 'layer33-yield',
    question: 'What is Layer33 yield, and can it be used in DeFi?',
    content: (
      <>
        <p>Layer33 yield comes from standard Solana staking rewards and can be packaged into liquid staking tokens like <strong>IndieSOL</strong>.</p>
        <p className="mt-4">IndieSOL is designed to be composable across Solana DeFi, allowing users to earn staking yield while continuing to deploy capital elsewhere.</p>
      </>
    ),
  },
  {
    id: 'support-layer33',
    question: 'How can teams or users support Layer33?',
    content: (
      <>
        <p>The simplest way to support Layer33 is by staking with Layer33 validators or holding <strong>IndieSOL</strong>.</p>
        <p className="mt-4">Builders can also support Layer33 by using validator-owned infrastructure and aligning with decentralization-first tooling and services.</p>
        <p className="mt-4"><strong>Support by audience:</strong></p>
        <ul className="mt-4 list-disc list-inside space-y-2">
          <li><strong>Retail:</strong> Want staking yield plus exposure to ecosystem airdrops? Swap to <strong>IndieSOL</strong>.</li>
          <li><strong>Whales:</strong> Want a clean, scalable way to support decentralization without managing multiple validator positions? <strong>IndieSOL</strong>.</li>
          <li><strong>Projects:</strong> Want to reward real network contributors instead of concentrating stake further? Add incentives to <strong>IndieSOL</strong>.</li>
        </ul>
        <p className="mt-4">Supporting Layer33 means supporting incentive diversity, independent validator sustainability, and long-term Solana network health.</p>
      </>
    ),
  },
];
