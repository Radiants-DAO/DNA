import { getValidators, getValidatorStakeData } from '@/lib/validators';
import { StatsCard } from './StatsCard';
import { ValidatorGrid } from './ValidatorGrid';
import { DecorationDiv } from '@/components/ui/DecorationDiv';

export async function ValidatorsSection() {
  // Fetch validator data
  const { validators } = await getValidators();
  const stakeData = await getValidatorStakeData(validators);

  return (
    <section id="validators" className="py-16 md:py-24 lg:py-32">
      <div className="page-padding">
        <div className="w-full max-w-[77rem] mx-auto">
          <div className="pt-16 pb-16 md:pt-32 md:pb-32 relative">
            <h2 className="text-center">The Validators</h2>
            
            {/* Stats Card */}
            <div className="mt-8 md:mt-12 mb-10 md:mb-16">
              <StatsCard
                totalStake={stakeData.totalStake}
                percentageOfNetwork={stakeData.layer33Percentage}
                epoch={stakeData.epoch}
                validatorCount={stakeData.validators.length}
              />
            </div>

            {/* Validators Grid with Show More */}
            <ValidatorGrid validators={stakeData.validators} initialCount={6} />

            <DecorationDiv
              orientation="vertical"
              bottom="2.5rem"
              right="-2.5rem"
              className="hidden md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
