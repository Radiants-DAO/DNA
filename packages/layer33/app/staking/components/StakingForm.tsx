'use client';

import { useStaking } from '@/hooks/useStaking';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Progress';
import { StakingPositionCard } from './StakingPositionCard';

export function StakingForm() {
  const staking = useStaking();

  const { state } = staking;
  const { wallet, transaction, position } = state;

  // Calculate INDIESOL amount
  const indiesolAmount = transaction.amount 
    ? (parseFloat(transaction.amount) * parseFloat(state.exchangeRate)).toFixed(2)
    : '0.00';

  // Determine button text and state based on wallet and transaction status
  const getButtonText = () => {
    if (wallet.status === 'disconnected') {
      return 'CONNECT WALLET';
    }
    if (wallet.status === 'connecting') {
      return 'CONNECTING...';
    }
    if (transaction.status === 'signing') {
      return 'APPROVE IN WALLET';
    }
    if (transaction.status === 'pending') {
      return 'CONFIRMING...';
    }
    if (transaction.status === 'success') {
      return 'STAKE MORE';
    }
    if (transaction.status === 'error') {
      return 'RETRY';
    }
    return 'STAKE';
  };

  const isButtonLoading = 
    wallet.status === 'connecting' ||
    transaction.status === 'signing' ||
    transaction.status === 'pending';

  const isButtonDisabled = 
    wallet.status === 'connecting' ||
    transaction.status === 'signing' ||
    transaction.status === 'pending' ||
    (wallet.status === 'connected' && !transaction.amount && transaction.status === 'idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (wallet.status === 'disconnected') {
      staking.connect();
      return;
    }

    if (transaction.status === 'error') {
      staking.stake();
      return;
    }

    if (transaction.status === 'success') {
      staking.reset();
      return;
    }

    staking.stake();
  };

  return (
    <div className="staking_form">
      <div className="flex flex-row items-center justify-center gap-x-2 gap-y-2 mb-6">
        <div className="heading-line"></div>
        <h1 className="heading-style-h2">
          liquid <span className="heading_padding">Staking</span>
        </h1>
        <div className="heading-line"></div>
      </div>

      {/* Show position card if user has existing stake */}
      {position && (
        <div className="mb-6">
          <StakingPositionCard position={position} />
        </div>
      )}

      <div className="stake_form w-form">
        <form
          id="staking-form"
          name="staking-form"
          className="form"
          onSubmit={handleSubmit}
        >
          <Label htmlFor="stake-amount" className="caption uppercase mb-2 block">
            Stake SOL
          </Label>

          {/* You Stake Section */}
          <div className="div-block mb-6">
            <div className="flex flex-row items-start gap-x-2 gap-y-2">
              <Label htmlFor="stake-amount" className="caption uppercase">
                You Stake
              </Label>
              <div className="flex items-center gap-2">
                <span className="caption uppercase">
                  Total Balance: {wallet.balance} SOL
                </span>
                {wallet.address && (
                  <span className="caption uppercase">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                )}
              </div>
            </div>
            <div className="position-relative h-10">
              <Input
                id="stake-amount"
                name="Amount"
                type="number"
                step="0.01"
                placeholder="0.00 SOL…"
                autoComplete="off"
                variant="dark"
                fullWidth
                value={transaction.amount}
                onChange={(e) => staking.setAmount(e.target.value)}
                disabled={transaction.status === 'signing' || transaction.status === 'pending'}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex justify-center items-center gap-3 h-full pl-3 pr-3">
                <Button
                  type="button"
                  variant="text"
                  onClick={() => {
                    const halfBalance = (parseFloat(wallet.balance) / 2).toString();
                    staking.setAmount(halfBalance);
                  }}
                  disabled={
                    wallet.status !== 'connected' || 
                    parseFloat(wallet.balance) === 0 ||
                    transaction.status !== 'idle'
                  }
                  style={{ justifyContent: 'center', color: 'white' }}
                >
                  HALF
                </Button>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => staking.setAmount(wallet.balance)}
                  disabled={
                    wallet.status !== 'connected' || 
                    parseFloat(wallet.balance) === 0 ||
                    transaction.status !== 'idle'
                  }
                  style={{ justifyContent: 'center', color: 'white' }}
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* You Receive Section */}
          <div className="div-block mb-6">
            <div className="flex flex-row items-start gap-x-2 gap-y-2">
              <span className="caption uppercase">
                You Receive
              </span>
              <span className="caption uppercase">
                Total Balance: 0 INDIESOL
              </span>
            </div>
            <div className="received-field">
              {indiesolAmount} INDIESOL
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isButtonDisabled}
            style={{ justifyContent: 'center' }}
          >
            {isButtonLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size={16} />
                {getButtonText()}
              </span>
            ) : (
              getButtonText()
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
