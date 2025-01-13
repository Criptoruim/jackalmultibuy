import { ClientHandler } from '@jackallabs/jackal.js';
import type { 
  IClientSetup, 
  IStorageHandler,
  IWrappedEncodeObject
} from '@jackallabs/jackal.js';

const MAINNET_CONFIG = {
  chainId: 'jackal-1',
  endpoint: 'https://rpc.jackalprotocol.com',
  chainConfig: {
    chainId: 'jackal-1',
    chainName: 'Jackal Mainnet',
    rpc: 'https://rpc.jackalprotocol.com',
    rest: 'https://api.jackalprotocol.com',
    bip44: {
      coinType: 118
    },
    stakeCurrency: {
      coinDenom: 'JKL',
      coinMinimalDenom: 'ujkl',
      coinDecimals: 6
    },
    bech32Config: {
      bech32PrefixAccAddr: 'jkl',
      bech32PrefixAccPub: 'jklpub',
      bech32PrefixValAddr: 'jklvaloper',
      bech32PrefixValPub: 'jklvaloperpub',
      bech32PrefixConsAddr: 'jklvalcons',
      bech32PrefixConsPub: 'jklvalconspub'
    },
    currencies: [
      {
        coinDenom: 'JKL',
        coinMinimalDenom: 'ujkl',
        coinDecimals: 6
      }
    ],
    feeCurrencies: [
      {
        coinDenom: 'JKL',
        coinMinimalDenom: 'ujkl',
        coinDecimals: 6,
        gasPriceStep: {
          low: 0.002,
          average: 0.002,
          high: 0.02
        }
      }
    ],
    features: []
  }
};

interface PurchaseResult {
  wallet: string;
  success: boolean;
  error?: string;
  txHash?: string;
}

export interface StoragePurchaseOptions {
  walletAddresses: string[];
  storageGB: number;
  durationMonths: number;
  referralCode?: string;
}

interface TransactionResult {
  success: boolean;
  error?: string;
  txHash?: string;
}

export class StorageService {
  private static instance: StorageService;
  private storageHandler: IStorageHandler | null = null;
  private client: any = null;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async waitForTransaction(promise: Promise<any>, timeoutMs: number = 60000): Promise<TransactionResult> {
    try {
      const result = await Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timed out')), timeoutMs)
        )
      ]);

      if (result?.error || result?.errorText) {
        throw new Error(result.errorText || 'Transaction failed');
      }

      return {
        success: true,
        txHash: result?.transactionHash || result?.txHash
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.storageHandler) {
      await this.initialize();
    }
  }

  public async initialize(): Promise<void> {
    try {
      const setup: IClientSetup = {
        selectedWallet: 'keplr',
        ...MAINNET_CONFIG
      };

      this.client = await ClientHandler.connect(setup);
      this.storageHandler = await this.client.createStorageHandler();
      
      if (!this.storageHandler) {
        throw new Error('Failed to create storage handler');
      }

      // Initialize provider pool and signer once
      await this.storageHandler.loadProviderPool();
      await this.storageHandler.upgradeSigner();
      
      this.initialized = true;
    } catch (error: any) {
      this.initialized = false;
      this.storageHandler = null;
      console.error('Failed to initialize storage service:', error);
      throw new Error(error.message || 'Failed to initialize storage service');
    }
  }

  private async broadcastTransaction(msgs: IWrappedEncodeObject[]): Promise<TransactionResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Client not initialized'
        };
      }

      if (!Array.isArray(msgs) || msgs.length === 0) {
        return {
          success: false,
          error: 'No valid transaction messages provided'
        };
      }

      console.log('Broadcasting transaction messages:', msgs);
      const txResult = await this.waitForTransaction(
        this.client.broadcastAndMonitorMsgs(msgs)
      );

      return txResult;
    } catch (error: any) {
      console.error('Transaction broadcast error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to broadcast transaction'
      };
    }
  }

  public async purchaseStorageForWallets(options: StoragePurchaseOptions): Promise<PurchaseResult[]> {
    await this.ensureInitialized();

    if (!this.storageHandler) {
      throw new Error('Storage handler not initialized');
    }

    const { walletAddresses, storageGB, durationMonths, referralCode } = options;

    // Validate inputs
    if (storageGB < 1) {
      throw new Error('Minimum storage size is 1GB');
    }
    if (durationMonths < 1) {
      throw new Error('Minimum duration is 1 month');
    }
    if (walletAddresses.length === 0) {
      throw new Error('At least one wallet address is required');
    }

    // Validate wallet addresses
    for (const address of walletAddresses) {
      if (!address.startsWith('jkl1')) {
        throw new Error(`Invalid wallet address format: ${address}`);
      }
    }

    const results: PurchaseResult[] = [];

    try {
      // Get the connected wallet's address
      const connectedAddress = this.client.getJackalAddress();
      console.log('Connected wallet:', connectedAddress);

      // Purchase storage for each wallet separately
      for (const targetAddress of walletAddresses) {
        try {
          console.log(`Attempting to purchase storage for: ${targetAddress}`);
          
          // Convert months to days for the API
          const days = durationMonths * 30;
          console.log('Creating storage purchase transaction...', {
            gb: storageGB,
            days,
            receiver: targetAddress,
            referrer: referralCode
          });

          // Create a new transaction for this wallet
          const response = await this.storageHandler.purchaseStoragePlan({
            gb: storageGB,
            days,
            receiver: targetAddress,
            referrer: referralCode
          });

          console.log('Purchase plan response:', response);

          // Handle null or undefined response
          if (!response) {
            console.error('Received null response from purchaseStoragePlan');
            results.push({
              wallet: targetAddress,
              success: false,
              error: 'Failed to create storage purchase transaction: null response'
            });
            continue;
          }

          // Check for errors in the response
          if (response.errors || !response.txEvent || !Array.isArray(response.txEvent) || response.txEvent.length === 0) {
            const errorMessage = response.errorText || 'Failed to create storage purchase transaction';
            console.error('Failed to create transaction:', errorMessage, response);
            results.push({
              wallet: targetAddress,
              success: false,
              error: errorMessage
            });
            continue;
          }

          // Broadcast the transaction
          console.log('Broadcasting transaction with events:', response.txEvent);
          const result = await this.broadcastTransaction(response.txEvent);

          if (!result.success) {
            console.error('Broadcast failed:', result);
            results.push({
              wallet: targetAddress,
              success: false,
              error: result.error || 'Failed to broadcast transaction'
            });
            continue;
          }

          console.log(`Successfully purchased storage for wallet: ${targetAddress}`);
          console.log('Transaction hash:', result.txHash);
          results.push({
            wallet: targetAddress,
            success: true,
            txHash: result.txHash
          });

        } catch (error: any) {
          console.error(`Failed to purchase storage for wallet ${targetAddress}:`, error);
          results.push({
            wallet: targetAddress,
            success: false,
            error: error.message || `Failed to purchase storage for ${targetAddress}`
          });
        }
      }

    } catch (error: any) {
      // If we hit a critical error that affects all transactions
      console.error('Critical error in storage purchase:', error);
      const errorMessage = error.message || 'Failed to purchase storage';
      // Add failure results for any remaining wallets
      for (const address of walletAddresses) {
        if (!results.find(r => r.wallet === address)) {
          results.push({
            wallet: address,
            success: false,
            error: errorMessage
          });
        }
      }
    }

    // Check if any purchases succeeded
    const successes = results.filter(r => r.success);
    if (successes.length === 0) {
      throw new Error('Failed to purchase storage for any wallet');
    }

    return results;
  }

  public async getStorageInfo(): Promise<any> {
    await this.ensureInitialized();

    if (!this.storageHandler) {
      throw new Error('Storage handler not initialized');
    }

    try {
      // Get storage plan status
      const status = await this.storageHandler.planStatus();
      return status;
    } catch (error: any) {
      this.initialized = false;
      console.error('Failed to get storage info:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();
