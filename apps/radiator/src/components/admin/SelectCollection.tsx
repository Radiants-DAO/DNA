'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { WizardStep } from '@/components/ui/WizardStep';
import { Button, Input, Label } from '@rdna/radiants/components/core';
import { AlertCircle } from '@rdna/radiants/icons';

/** Mock collection lookup — simulates DAS API fetch */
async function mockFetchCollection(address: string) {
  await new Promise((r) => setTimeout(r, 800));
  // Accept any string >= 32 chars as a "valid" pubkey
  if (address.length < 32) throw new Error('Invalid collection address');
  return {
    name: 'Ded Monkes',
    image: 'https://placehold.co/400x400/FCE184/0F0E0C?text=DM',
    nftCount: 3333,
  };
}

export function SelectCollection({ onBack }: { onBack: () => void }) {
  const setAdminStep = useAppStore((s) => s.setAdminStep);
  const setAdminCollection = useAppStore((s) => s.setAdminCollection);
  const adminCollection = useAppStore((s) => s.adminCollection);
  const adminCollectionName = useAppStore((s) => s.adminCollectionName);
  const adminCollectionImage = useAppStore((s) => s.adminCollectionImage);
  const adminNftCount = useAppStore((s) => s.adminNftCount);

  const [input, setInput] = useState(adminCollection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validated = adminCollectionName.length > 0;

  const handleLookup = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await mockFetchCollection(input.trim());
      setAdminCollection(input.trim(), result.name, result.image, result.nftCount);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch collection');
      setAdminCollection('', '', '', 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardStep
      heading="Select Collection"
      description="What collection are you irradiating?"
      onBack={onBack}
      onNext={validated ? () => setAdminStep('upload-art') : undefined}
      nextDisabled={!validated}
    >
      <div className="flex flex-col gap-4">
        {/* Address input */}
        <div className="flex flex-col gap-1.5">
          <Label className="font-joystix text-xs uppercase text-mute">
            Collection address
          </Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste collection mint address..."
              fullWidth
              error={!!error}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
            <Button
              variant="outline"
              size="md"
              onClick={handleLookup}
              disabled={loading || !input.trim()}
              className="font-joystix text-xs uppercase px-4 py-2 border border-line rounded-sm
                bg-page text-head
                hover:bg-depth disabled:opacity-40 disabled:cursor-not-allowed
                shrink-0"
            >
              {loading ? '...' : 'Look up'}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-danger">
              <AlertCircle size={14} />
              <span className="font-mondwest text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Collection preview */}
        {validated && (
          <div className="flex items-center gap-4 p-4 border border-line rounded-sm bg-depth">
            <img
              src={adminCollectionImage}
              alt={adminCollectionName}
              className="w-16 h-16 rounded-sm object-cover"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-joystix text-sm uppercase text-head">
                {adminCollectionName}
              </span>
              <span className="font-mondwest text-sm text-sub">
                {adminNftCount.toLocaleString()} NFTs
              </span>
              <span className="font-mondwest text-xs text-mute truncate max-w-[16rem]">
                {adminCollection}
              </span>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
