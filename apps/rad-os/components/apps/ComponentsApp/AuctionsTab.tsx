'use client';

import React, { useState } from 'react';
import { Button, Badge, Card, CardBody } from '@rdna/radiants/components/core';
import { NFTCard } from '@/components/auctions/NFTCard';
import { NFTGrid } from '@/components/auctions/NFTGrid';
import { DataTable } from '@/components/auctions/DataTable';
import { StatCard, StatCardGroup } from '@/components/auctions/StatCard';
import { InfoChip, InfoChipGroup } from '@/components/auctions/InfoChip';

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-joystix text-xs uppercase tracking-wide text-black mb-3">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      <code className="font-mono text-2xs text-black/50 uppercase">{label}</code>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

// ============================================================================
// NFTCard Section
// ============================================================================

function NFTCardSection() {
  const mockNFT = {
    name: 'Radiant #1234',
    collection: 'Radiants Collection',
    price: '12.5',
    tokenId: '1234',
    attributes: [
      { trait_type: 'Background', value: 'Cosmic' },
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Element', value: 'Fire' },
    ],
  };

  return (
    <Section title="NFTCard">
      <Row label="sizes — sm | md | lg">
        <NFTCard {...mockNFT} size="sm" />
        <NFTCard {...mockNFT} size="md" />
        <NFTCard {...mockNFT} size="lg" />
      </Row>
      <Row label="variants — default | compact | selectable">
        <NFTCard {...mockNFT} variant="default" />
        <NFTCard {...mockNFT} variant="compact" />
        <NFTCard {...mockNFT} variant="selectable" selected={false} />
        <NFTCard {...mockNFT} variant="selectable" selected={true} badge="1/1" />
      </Row>
    </Section>
  );
}

// ============================================================================
// NFTGrid Section
// ============================================================================

function NFTGridSection() {
  const mockNFTs = [
    { id: '1', name: 'Radiant #1', collection: 'Radiants', price: '10' },
    { id: '2', name: 'Radiant #2', collection: 'Radiants', price: '12' },
    { id: '3', name: 'Radiant #3', collection: 'Radiants', price: '8', badge: 'RARE' },
    { id: '4', name: 'Radiant #4', collection: 'Radiants', price: '15' },
    { id: '5', name: 'Radiant #5', collection: 'Radiants', price: '11' },
    { id: '6', name: 'Radiant #6', collection: 'Radiants', price: '9' },
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>(['2', '4']);

  return (
    <Section title="NFTGrid">
      <Row label="columns={3} cardSize='sm'">
        <NFTGrid items={mockNFTs.slice(0, 3)} columns={3} cardSize="sm" />
      </Row>
      <Row label="selectable with selectedIds">
        <NFTGrid
          items={mockNFTs}
          columns={3}
          cardSize="sm"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Row>
    </Section>
  );
}

// ============================================================================
// DataTable Section
// ============================================================================

function DataTableSection() {
  const mockAdmins = [
    { id: '1', name: 'Kemosabe', wallet: 'fx8dfdsa...', role: 'Owner' },
    { id: '2', name: 'Devour', wallet: 'kj3nf82...', role: 'Admin' },
    { id: '3', name: 'Maroo', wallet: '9xm2kd1...', role: 'Admin' },
  ];

  const mockTimelocks = [
    { id: '1', duration: '3 months', multiplier: '1.25x' },
    { id: '2', duration: '6 months', multiplier: '1.5x' },
    { id: '3', duration: '1 Year', multiplier: '1.75x' },
  ];

  return (
    <Section title="DataTable">
      <Row label="with actions">
        <DataTable
          data={mockAdmins}
          keyAccessor="id"
          columns={[
            { header: 'Name', accessor: 'name' },
            { header: 'Wallet', accessor: 'wallet' },
            { header: 'Role', accessor: 'role' },
          ]}
          actions={[
            { label: 'Edit', onClick: () => {}, variant: 'default' },
            { label: 'Remove', onClick: () => {}, variant: 'danger' },
          ]}
        />
      </Row>
      <Row label="compact + headerVariant='yellow'">
        <DataTable
          data={mockTimelocks}
          keyAccessor="id"
          headerVariant="yellow"
          compact
          columns={[
            { header: 'Duration', accessor: 'duration' },
            { header: 'Multiplier', accessor: 'multiplier' },
          ]}
          actions={[
            { label: 'Edit', onClick: () => {} },
          ]}
        />
      </Row>
    </Section>
  );
}

// ============================================================================
// StatCard Section
// ============================================================================

function StatCardSection() {
  return (
    <Section title="StatCard">
      <Row label="basic values">
        <StatCard value="$184.84" label="Solana Price" />
        <StatCard value="7.84" suffix="%" label="Validator APY" />
      </Row>
      <Row label="variants — default | highlight | dark + sizes">
        <StatCard value="42" label="NFTs" size="sm" />
        <StatCard value="1,234" label="Users" variant="highlight" />
        <StatCard value="99.9" suffix="%" label="Uptime" variant="dark" />
      </Row>
      <Row label="with trend + StatCardGroup">
        <StatCardGroup columns={2}>
          <StatCard
            value="$184.84"
            label="Solana Price"
            trend={{ direction: 'up', value: '+5.2%' }}
          />
          <StatCard
            value="7.84"
            suffix="%"
            label="APY"
            trend={{ direction: 'down', value: '-0.3%' }}
          />
        </StatCardGroup>
      </Row>
    </Section>
  );
}

// ============================================================================
// InfoChip Section
// ============================================================================

function InfoChipSection() {
  return (
    <Section title="InfoChip">
      <Row label="InfoChipGroup">
        <InfoChipGroup>
          <InfoChip>1XP = $0.0001</InfoChip>
          <InfoChip>Total stake: 90 SOL</InfoChip>
          <InfoChip>Average Lock: 1.5 years</InfoChip>
        </InfoChipGroup>
      </Row>
      <Row label="variants — default | outline | filled">
        <InfoChipGroup>
          <InfoChip variant="default">Default</InfoChip>
          <InfoChip variant="outline">Outline</InfoChip>
          <InfoChip variant="filled">Filled</InfoChip>
        </InfoChipGroup>
      </Row>
      <Row label="interactive">
        <InfoChipGroup>
          <InfoChip onClick={() => {}}>Clickable</InfoChip>
          <InfoChip onClick={() => {}} disabled>Disabled</InfoChip>
        </InfoChipGroup>
      </Row>
    </Section>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AuctionsTab() {
  return (
    <div className="p-4 space-y-2">
      <div className="mb-4">
        <p className="font-mondwest text-sm text-black/60">
          App-specific components from <code className="text-xs bg-black/5 px-1 rounded">components/auctions/</code>
        </p>
      </div>
      <NFTCardSection />
      <NFTGridSection />
      <DataTableSection />
      <StatCardSection />
      <InfoChipSection />
    </div>
  );
}
