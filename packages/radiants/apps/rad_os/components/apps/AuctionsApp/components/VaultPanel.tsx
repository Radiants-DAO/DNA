'use client';

import React, { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider, Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter, SheetClose } from '@dna/radiants/components/core';
import { NFTGrid } from '@/components/auctions/NFTGrid';
import { useAuctionsMockState } from '@/hooks/useAppMockState';
import { type VaultNFT } from '../types';

// ============================================================================
// Types
// ============================================================================

interface VaultPanelProps {
  isConnected: boolean;
  onConnect: () => void;
  onDeposit: () => void;
  onWithdraw: (nftIds: string[]) => void;
}

// ============================================================================
// Mock Wallet NFTs (available for deposit)
// ============================================================================

const mockWalletNFTs: VaultNFT[] = [
  { id: 'w1', name: 'DeGod #9999', collection: 'DeGods', price: 48 },
  { id: 'w2', name: 'y00t #123', collection: 'y00ts', price: 8 },
  { id: 'w3', name: 'y00t #456', collection: 'y00ts', price: 7.5 },
  { id: 'w4', name: 'Clayno #789', collection: 'Claynosaurz', price: 15 },
  { id: 'w5', name: 'Clayno #101', collection: 'Claynosaurz', price: 14 },
  { id: 'w6', name: 'Tensorian #222', collection: 'Tensorians', price: 3.5 },
];

// ============================================================================
// Mock Vault Data (will be replaced with real data in Phase 5)
// ============================================================================

const mockVaultNFTs: VaultNFT[] = [
  { id: 'v1', name: 'DeGod #1234', collection: 'DeGods', price: 45 },
  { id: 'v2', name: 'DeGod #5678', collection: 'DeGods', price: 42 },
  { id: 'v3', name: 'SMB #999', collection: 'SMB Gen2', price: 12 },
  { id: 'v4', name: 'Okay Bear #444', collection: 'Okay Bears', price: 25 },
];

// ============================================================================
// Main Component
// ============================================================================

export function VaultPanel({
  isConnected,
  onConnect,
  onDeposit,
  onWithdraw,
}: VaultPanelProps) {
  const { vaultNfts: mockStateVaultNfts } = useAuctionsMockState();

  // Use mock state vault NFTs if available, otherwise use local mock
  const initialVaultNFTs = mockStateVaultNfts.length > 0
    ? mockStateVaultNfts.map(nft => ({
        id: nft.id,
        name: nft.name,
        collection: nft.collection,
        price: nft.floorPrice,
        image: nft.image,
      }))
    : mockVaultNFTs;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [vaultNFTs, setVaultNFTs] = useState<VaultNFT[]>(initialVaultNFTs);
  const [depositSheetOpen, setDepositSheetOpen] = useState(false);
  const [depositSelectedIds, setDepositSelectedIds] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(0);

  // Calculate total value
  const totalValue = vaultNFTs.reduce((sum, nft) => sum + (nft.price || 0), 0);

  // Calculate selected deposit value
  const selectedDepositValue = mockWalletNFTs
    .filter(nft => depositSelectedIds.includes(nft.id))
    .reduce((sum, nft) => sum + (nft.price || 0), 0);

  // Handle slider-based selection for vault items
  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    // Select first N items based on slider position
    const itemCount = Math.round((value / 100) * vaultNFTs.length);
    const newSelection = vaultNFTs.slice(0, itemCount).map(nft => nft.id);
    setSelectedIds(newSelection);
  };

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    const newNFTs = mockWalletNFTs.filter(nft => depositSelectedIds.includes(nft.id));
    setVaultNFTs(prev => [...prev, ...newNFTs]);
    setDepositSelectedIds([]);
    setDepositSheetOpen(false);
    onDeposit();
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <p className="font-mondwest text-sm text-black/60 mb-4">
            Connect wallet to access your vault
          </p>
          <Button variant="primary" onClick={onConnect}>
            Connect Wallet
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Empty vault state
  if (vaultNFTs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-joystix text-xs text-black">Your Vault</h3>
          <Button variant="primary" size="sm" onClick={onDeposit}>
            + Deposit NFTs
          </Button>
        </div>
        <Card>
          <CardBody className="p-8 text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="font-mondwest text-black/60">
              Your vault is empty
            </p>
            <p className="font-mono text-2xs text-black/40 mt-1">
              Deposit NFTs to use as bid collateral
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Vault with NFTs
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-joystix text-xs text-black">Your Vault</h3>
          <p className="font-mono text-2xs text-black/60 mt-0.5">
            {vaultNFTs.length} NFT{vaultNFTs.length !== 1 ? 's' : ''} • {totalValue.toFixed(1)} SOL total
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setDepositSheetOpen(true)}>
          + Deposit
        </Button>
      </div>

      {/* Batch Selection Slider */}
      {vaultNFTs.length > 1 && (
        <div className="bg-warm-cloud border border-black/10 rounded-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-2xs text-black/60 uppercase">
              Quick Select
            </span>
            <span className="font-mondwest text-xs text-black">
              {selectedIds.length} / {vaultNFTs.length}
            </span>
          </div>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
          />
          <div className="flex justify-between mt-1">
            <button
              className="font-mono text-2xs text-black/40 hover:text-black"
              onClick={() => handleSliderChange(0)}
            >
              None
            </button>
            <button
              className="font-mono text-2xs text-black/40 hover:text-black"
              onClick={() => handleSliderChange(100)}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* NFT Grid */}
      <NFTGrid
        items={vaultNFTs.map((nft) => ({
          id: nft.id,
          name: nft.name,
          collection: nft.collection,
          price: nft.price?.toString(),
          currency: 'SOL',
        }))}
        columns={2}
        cardSize="sm"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Withdraw Button (when items selected) */}
      {selectedIds.length > 0 && (
        <Card variant="raised" className="bg-sun-yellow/10">
          <CardBody className="p-3 flex items-center justify-between">
            <span className="font-mondwest text-sm">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onWithdraw(selectedIds);
                  setVaultNFTs((prev) =>
                    prev.filter((nft) => !selectedIds.includes(nft.id))
                  );
                  setSelectedIds([]);
                }}
              >
                Withdraw
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vault Summary */}
      <Card>
        <CardBody className="p-3">
          <div className="flex justify-between">
            <div>
              <p className="font-mono text-2xs text-black/60 uppercase">
                Collections
              </p>
              <p className="font-mondwest text-sm text-black">
                {new Set(vaultNFTs.map((n) => n.collection)).size}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xs text-black/60 uppercase">
                Est. Value
              </p>
              <p className="font-mondwest text-sm text-black">
                {totalValue.toFixed(1)} SOL
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Deposit Sheet */}
      <Sheet open={depositSheetOpen} onOpenChange={setDepositSheetOpen} side="right">
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Deposit NFTs</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <p className="font-mondwest text-sm text-black/60 mb-4">
              Select NFTs from your wallet to deposit into the vault as bid collateral.
            </p>

            <NFTGrid
              items={mockWalletNFTs.map((nft) => ({
                id: nft.id,
                name: nft.name,
                collection: nft.collection,
                price: nft.price?.toFixed(1),
                currency: 'SOL',
              }))}
              columns={2}
              cardSize="sm"
              selectable
              selectedIds={depositSelectedIds}
              onSelectionChange={setDepositSelectedIds}
              emptyMessage="No NFTs in wallet"
            />

            {depositSelectedIds.length > 0 && (
              <Card variant="raised" className="bg-sun-yellow/10 mt-4">
                <CardBody className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-2xs text-black/60 uppercase">
                        Selected Value
                      </p>
                      <p className="font-mondwest text-lg text-black">
                        {selectedDepositValue.toFixed(1)} SOL
                      </p>
                    </div>
                    <p className="font-joystix text-xs text-black">
                      {depositSelectedIds.length} NFT{depositSelectedIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="ghost">Cancel</Button>
            </SheetClose>
            <Button
              variant="primary"
              onClick={handleConfirmDeposit}
              disabled={depositSelectedIds.length === 0}
            >
              Deposit {depositSelectedIds.length > 0 ? `(${depositSelectedIds.length})` : ''}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default VaultPanel;
