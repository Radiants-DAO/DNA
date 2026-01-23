'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import type { 
  StakingState, 
  WalletConnectionStatus, 
  TransactionStatus,
  StakingPosition 
} from '@/app/staking/types';

// ============================================================================
// Types
// ============================================================================

export interface UseStakingOptions {
  // Replace these with real Solana wallet adapter calls
  onConnect?: () => Promise<{ address: string; balance: string }>;
  onDisconnect?: () => Promise<void>;
  onStake?: (amount: string) => Promise<{ signature: string }>;
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useStaking(options?: UseStakingOptions) {
  const { addToast } = useToast();

  // Wallet state - disconnected by default, will be updated by real wallet adapter
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
  });

  // Local state
  const [amount, setAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [signature, setSignature] = useState<string | undefined>();
  const [transactionError, setTransactionError] = useState<string | undefined>();

  // Track connecting state locally
  const [isConnecting, setIsConnecting] = useState(false);

  // Derive wallet status from state
  const walletStatus: WalletConnectionStatus = isConnecting
    ? 'connecting'
    : walletState.isConnected
    ? 'connected'
    : transactionStatus === 'signing' || transactionStatus === 'pending'
    ? 'connected' // Stay connected during transaction
    : 'disconnected';

  // Exchange rate (1:1 for now)
  const exchangeRate = '1.0';

  // Position (null for now, can be populated from real staking data later)
  const position: StakingPosition | null = null;

  // Build state object
  const state: StakingState = {
    wallet: {
      status: walletStatus,
      address: walletState.address,
      balance: walletState.balance,
    },
    transaction: {
      status: transactionStatus,
      amount,
      signature,
      error: transactionError,
    },
    position,
    exchangeRate,
  };

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);

    if (options?.onConnect) {
      // Real wallet adapter implementation
      try {
        setTransactionStatus('idle');
        const result = await options.onConnect();
        setWalletState({
          isConnected: true,
          address: result.address,
          balance: result.balance,
        });
        setIsConnecting(false);
        addToast({
          title: 'Wallet Connected',
          description: 'Your wallet has been connected successfully.',
          variant: 'success',
        });
      } catch (error) {
        setIsConnecting(false);
        addToast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect wallet.',
          variant: 'error',
        });
      }
    } else {
      // No wallet adapter provided - connection is a no-op
      // Real wallet integration should be provided via options.onConnect
      setIsConnecting(false);
      addToast({
        title: 'Wallet Not Available',
        description: 'No wallet adapter configured. Please integrate a Solana wallet adapter.',
        variant: 'warning',
      });
    }
  }, [options, addToast]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (options?.onDisconnect) {
      await options.onDisconnect();
    }
    setIsConnecting(false);
    setWalletState({
      isConnected: false,
      address: null,
      balance: '0',
    });
    setAmount('');
    setTransactionStatus('idle');
    setSignature(undefined);
    setTransactionError(undefined);
  }, [options]);

  // Set stake amount
  const handleSetAmount = useCallback((newAmount: string) => {
    setAmount(newAmount);
  }, []);

  // Stake
  const stake = useCallback(async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      addToast({
        title: 'Invalid Amount',
        description: 'Please enter a valid stake amount greater than 0.',
        variant: 'error',
      });
      return;
    }

    const balance = parseFloat(walletState.balance);
    if (parseFloat(amount) > balance) {
      addToast({
        title: 'Insufficient Balance',
        description: `You only have ${balance} SOL available.`,
        variant: 'error',
      });
      return;
    }

    if (options?.onStake) {
      // Real implementation
      try {
        setTransactionStatus('signing');
        setTransactionError(undefined);
        
        const result = await options.onStake(amount);
        
        setSignature(result.signature);
        setTransactionStatus('pending');
        
        addToast({
          title: 'Transaction Submitted',
          description: 'Your transaction has been submitted to the network.',
          variant: 'info',
        });

        // In real implementation, wait for confirmation
        // For now, simulate success after delay
        setTimeout(() => {
          setTransactionStatus('success');
          addToast({
            title: 'Stake Successful!',
            description: result.signature 
              ? `Transaction confirmed: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`
              : 'Your SOL has been staked successfully.',
            variant: 'success',
          });
          
          // Reset to idle after showing success
          setTimeout(() => {
            setTransactionStatus('idle');
            setAmount('');
            setSignature(undefined);
          }, 2000);
        }, 2000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
        setTransactionError(errorMessage);
        setTransactionStatus('error');
        
        if (errorMessage.includes('reject') || errorMessage.includes('cancel')) {
          addToast({
            title: 'Transaction Cancelled',
            description: 'You cancelled the transaction in your wallet.',
            variant: 'warning',
          });
        } else {
          addToast({
            title: 'Transaction Failed',
            description: errorMessage,
            variant: 'error',
          });
        }
        
        // Reset to idle after showing error
        setTimeout(() => {
          setTransactionStatus('idle');
          setTransactionError(undefined);
        }, 3000);
      }
    } else {
      // No wallet adapter - stake is a no-op
      addToast({
        title: 'Wallet Not Connected',
        description: 'Please connect a wallet to stake.',
        variant: 'warning',
      });
    }
  }, [amount, walletState.balance, options, addToast]);

  // Reset transaction state
  const reset = useCallback(() => {
    setTransactionStatus('idle');
    setAmount('');
    setSignature(undefined);
    setTransactionError(undefined);
  }, []);

  // Simulation helpers
  const simulate = {
    advanceToNextState: useCallback(() => {
      if (transactionStatus === 'idle') {
        setTransactionStatus('signing');
      } else if (transactionStatus === 'signing') {
        setTransactionStatus('pending');
      } else if (transactionStatus === 'pending') {
        setTransactionStatus('success');
        setTimeout(() => setTransactionStatus('idle'), 2000);
      }
    }, [transactionStatus]),
    
    triggerError: useCallback((message: string) => {
      setTransactionError(message);
      setTransactionStatus('error');
      addToast({
        title: 'Transaction Failed',
        description: message,
        variant: 'error',
      });
      setTimeout(() => {
        setTransactionStatus('idle');
        setTransactionError(undefined);
      }, 3000);
    }, [addToast]),
    
    setBalance: useCallback((newBalance: string) => {
      setWalletState((prev) => ({
        ...prev,
        balance: newBalance,
      }));
    }, []),
  };

  return {
    state,
    connect,
    disconnect,
    setAmount: handleSetAmount,
    stake,
    reset,
    simulate,
  };
}
