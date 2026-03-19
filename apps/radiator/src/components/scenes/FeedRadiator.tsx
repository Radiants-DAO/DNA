'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { NFTCard } from '@/components/ui/NFTCard';
import { FuelGauge } from '@/components/ui/FuelGauge';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
import type { NFTItem } from '@/store/burnSlice';
import { useRadiatorToast } from '@/hooks/useRadiatorToast';
import { createRadiatorClient } from '@/lib/radiator-client';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export function FeedRadiator() {
  const setView = useAppStore((s) => s.setView);
  const config = useAppStore((s) => s.config);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const eligibleNFTs = useAppStore((s) => s.eligibleNFTs);
  const gasNFTs = useAppStore((s) => s.gasNFTs);
  const offeringRealized = useAppStore((s) => s.offeringRealized);
  const entangledPair = useAppStore((s) => s.entangledPair);
  const escrowAccountB = useAppStore((s) => s.escrowAccountB);
  const addGasNFT = useAppStore((s) => s.addGasNFT);
  const incrementOffering = useAppStore((s) => s.incrementOffering);

  const [selectedGas, setSelectedGas] = useState<NFTItem | null>(null);
  const [burning, setBurning] = useState(false);
  const toast = useRadiatorToast();
  const { connection } = useConnection();
  const wallet = useWallet();

  const gasRequired = (config?.offeringSize ?? 3) - 1;
  const isFull = offeringRealized >= gasRequired;

  // NFTs available for burning (not the primary, not already burned)
  const burnedMints = new Set(gasNFTs.map((n) => n.mint));
  const availableNFTs = eligibleNFTs.filter((n) => !burnedMints.has(n.mint));

  const handleBurn = async () => {
    if (!selectedGas) return;
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      toast.walletRequired();
      return;
    }
    if (!config?.configAccountKey || !entangledPair || !escrowAccountB) {
      toast.txError(new Error('Missing burn context'));
      return;
    }

    setBurning(true);
    try {
      const client = await createRadiatorClient(connection, wallet);
      await client.burnGasNFT({
        nftMint: selectedGas.mint,
        configAccountKey: config.configAccountKey,
        entangledPair,
        escrowAccountB,
      });

      addGasNFT(selectedGas);
      incrementOffering();
      toast.burnComplete(selectedGas.name);
      setSelectedGas(null);
    } catch (err) {
      toast.txError(err instanceof Error ? err : new Error('Burn failed'));
    } finally {
      setBurning(false);
    }
  };

  if (!primaryNFT) {
    setView('choose-fate');
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* Fuel gauge */}
      <FuelGauge realized={offeringRealized} required={gasRequired} />

      {/* Primary NFT reference */}
      <div className="flex items-center gap-3 p-3 border border-rule pixel-rounded-sm bg-page">
        <img
          src={primaryNFT.image}
          alt={primaryNFT.name}
          className="w-10 h-10 rounded-sm object-cover"
        />
        <div className="flex flex-col">
          <span className="font-joystix text-xs uppercase text-mute">Primary</span>
          <span className="font-joystix text-xs uppercase text-head">{primaryNFT.name}</span>
        </div>
      </div>

      {/* Gas burn confirmation */}
      {selectedGas && !isFull && (
        <div className="flex items-center gap-4 p-4 border border-focus pixel-rounded-sm bg-depth">
          <img
            src={selectedGas.image}
            alt={selectedGas.name}
            className="w-16 h-16 rounded-sm object-cover"
          />
          <div className="flex flex-col gap-2 flex-1">
            <span className="font-joystix text-sm uppercase text-head">
              Feed to the radiator?
            </span>
            <span className="font-mondwest text-sm text-sub">
              {selectedGas.name} will be burned permanently
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGas(null)}
                disabled={burning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBurn}
                disabled={burning}
              >
                {burning ? 'Burning...' : 'Burn It'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Burned tombstones */}
      {gasNFTs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-joystix text-xs uppercase text-mute">
            Sacrificed
          </span>
          <div className="flex gap-2 flex-wrap">
            {gasNFTs.map((nft) => (
              <div key={nft.mint} className="w-14">
                <NFTCard name={nft.name} image={nft.image} burned />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available NFTs grid */}
      {!isFull && availableNFTs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-joystix text-xs uppercase text-mute">
            Select sacrifice
          </span>
          <div className="grid @sm:grid-cols-3 @md:grid-cols-4 gap-3">
            {availableNFTs.map((nft) => (
              <NFTCard
                key={nft.mint}
                name={nft.name}
                image={nft.image}
                selected={selectedGas?.mint === nft.mint}
                onClick={() => setSelectedGas(nft)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fully fueled CTA */}
      {isFull && (
        <div className="flex flex-col items-center gap-4 py-6 mt-auto">
          <Icon name="electric" size={32} className="text-accent" />
          <h2 className="font-joystix text-lg uppercase text-head">
            Radiator is fully fueled
          </h2>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setView('ignite')}
          >
            Ignite
          </Button>
        </div>
      )}
    </div>
  );
}
