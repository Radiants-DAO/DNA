'use client';

import { useState } from 'react';
import { ValidatorCard } from './ValidatorCard';
import { Button } from '@/components/ui/Button';
import type { ValidatorWithStake } from '@/lib/validators/types';

interface ValidatorGridProps {
  validators: ValidatorWithStake[];
  initialCount?: number;
}

export function ValidatorGrid({ validators, initialCount = 6 }: ValidatorGridProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedValidators = showAll ? validators : validators.slice(0, initialCount);
  const hasMore = validators.length > initialCount;
  const remainingCount = validators.length - initialCount;

  return (
    <>
      <div className="flex justify-between items-stretch gap-4 md:gap-10">
        <div className="bg-black w-1 hidden md:block" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {displayedValidators.map((validator) => (
            <ValidatorCard key={validator.voteAccount} validator={validator} />
          ))}
        </div>
      </div>

      {/* Show More / Show Less Button */}
      {hasMore && (
        <div className="flex justify-center mt-8 md:mt-12">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <span>Show Less</span>
                <img
                  src="/assets/icons/chevron-up.svg"
                  alt=""
                  className="w-4 h-4 ml-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </>
            ) : (
              <>
                <span>Show All {validators.length} Validators</span>
                <img
                  src="/assets/icons/chevron-down.svg"
                  alt=""
                  className="w-4 h-4 ml-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
