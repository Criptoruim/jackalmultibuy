import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { connectKeplr } from './utils/wallet';
import { storageService } from './utils/storage';
import LoadingSpinner from './components/LoadingSpinner';
import { priceService } from './utils/price';

function App() {
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<'months' | 'years'>('months');
  const [storageValue, setStorageValue] = useState(1);
  const [storageUnit, setStorageUnit] = useState<'GB' | 'TB'>('GB');
  const [wallets, setWallets] = useState(['']);
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
  const [referralCode, setReferralCode] = useState('criptoruim');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [jklPrice, setJklPrice] = useState<number>(0.083);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // Fetch JKL price on component mount
  useEffect(() => {
    const updatePrice = async () => {
      setIsPriceLoading(true);
      try {
        const price = await priceService.getPrice();
        setJklPrice(price);
      } catch (error) {
        console.error('Failed to update price:', error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    updatePrice();
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const address = await connectKeplr(); // Now returns string address directly
      await storageService.initialize();
      setConnected(true);
      setConnectedWalletAddress(address);
      setError(null);
      
      // If using connected wallet is checked, update the wallet list
      if (useConnectedWallet) {
        setWallets([address]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const validWallets = wallets.filter(wallet => wallet.trim() !== '');
      
      if (validWallets.length === 0) {
        throw new Error('Please enter at least one valid wallet address');
      }

      // Convert duration to months
      const durationMonths = durationType === 'years' ? duration * 12 : duration;
      const storageGB = storageUnit === 'TB' ? storageValue * 1024 : storageValue;

      const results = await storageService.purchaseStorageForWallets({
        walletAddresses: validWallets,
        storageGB,
        durationMonths,
        referralCode: referralCode.trim() || undefined
      });

      // Process results
      const successfulWallets = results.filter(r => r.success);
      const failedWallets = results.filter(r => !r.success);

      if (failedWallets.length > 0) {
        const failureMessages = failedWallets
          .map(r => `${r.wallet}: ${r.error}`)
          .join('\n');
        setError(`Failed to purchase storage for some wallets:\n${failureMessages}`);
      }

      if (successfulWallets.length > 0) {
        const successMessage = `Successfully purchased storage for ${successfulWallets.length} wallet(s)`;
        setSuccessMessage(successMessage);
        
        // Only clear form if all purchases were successful
        if (failedWallets.length === 0) {
          setWallets(['']);
          setStorageValue(1);
          setDuration(1);
          setDurationType('months');
          setReferralCode('');
        }
      }
    } catch (error: any) {
      console.error('Failed to purchase storage:', error);
      // Extract the most meaningful error message
      const errorMessage = error.message || 
        (typeof error === 'object' && error.errorText) || 
        'Failed to purchase storage. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Split by newline and filter out empty lines
      const newWallets = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (newWallets.length > 0) {
        setWallets(newWallets);
      }
    };
    reader.readAsText(file);
  };

  const handleAddWallet = () => {
    setWallets([...wallets, '']);
  };

  const handleRemoveWallet = (index: number) => {
    const newWallets = wallets.filter((_, i) => i !== index);
    setWallets(newWallets.length ? newWallets : ['']);
  };

  const handleWalletChange = (index: number, value: string) => {
    const newWallets = [...wallets];
    newWallets[index] = value;
    setWallets(newWallets);
  };

  const calculateTotal = () => {
    // Convert everything to months and TB for calculation
    const monthsValue = durationType === 'years' ? duration * 12 : duration;
    const tbValue = storageUnit === 'TB' ? storageValue : storageValue / 1024;
  
    // Price per TB per month depends on duration
    // $15 per TB per month for 1-11 months
    // $12.5 per TB per month for 12+ months
    const usdPerTBPerMonth = monthsValue >= 12 ? 12.5 : 15;
  
    // Calculate total USD
    let totalUSD = usdPerTBPerMonth * tbValue * monthsValue * wallets.length;
  
    // Apply referral discount if code is provided
    // 10% discount for 1-11 months, 5% discount for 12+ months
    if (referralCode.trim()) {
      if (monthsValue >= 12) {
        totalUSD *= 0.95; // 5% discount for 12+ months
      } else {
        totalUSD *= 0.90; // 10% discount for 1-11 months
      }
    }

    // Convert USD to JKL
    const totalJKL = totalUSD / jklPrice;
    return {
      jkl: totalJKL.toFixed(2),
      usd: totalUSD.toFixed(2)
    };
  };

  const Toggle = ({ value, onChange, leftOption, rightOption }: { 
    value: string; 
    onChange: (value: any) => void; 
    leftOption: string; 
    rightOption: string; 
  }) => (
    <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg p-1">
      <button
        onClick={() => onChange(leftOption)}
        className={`px-3 py-1 rounded-md transition-colors ${
          value === leftOption ? 'bg-[#3a3a3a] text-white' : 'text-gray-400'
        }`}
      >
        {leftOption}
      </button>
      <button
        onClick={() => onChange(rightOption)}
        className={`px-3 py-1 rounded-md transition-colors ${
          value === rightOption ? 'bg-[#3a3a3a] text-white' : 'text-gray-400'
        }`}
      >
        {rightOption}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Purchase a storage plan.</h1>
        <p className="text-gray-400 mb-8">
          To get started using Jackal Vault you will need to purchase a storage plan. Storage plans can be
          purchased with JKL. Minimum purchase is 1GB for 1 month.
        </p>

        {!connected ? (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] px-6 py-3 rounded-lg mb-8"
          >
            {isConnecting ? (
              <LoadingSpinner />
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </>
            )}
          </button>
        ) : (
          <div className="bg-[#2a2a2a] p-6 rounded-lg mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Duration</label>
                <Toggle
                  value={durationType}
                  onChange={setDurationType}
                  leftOption="months"
                  rightOption="years"
                />
              </div>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum: 1 {durationType}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Storage</label>
                <Toggle
                  value={storageUnit}
                  onChange={setStorageUnit}
                  leftOption="GB"
                  rightOption="TB"
                />
              </div>
              <input
                type="number"
                min="1"
                value={storageValue}
                onChange={(e) => setStorageValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum: 1 {storageUnit}
              </p>
            </div>

            <div className="mb-6">

              
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Wallet Addresses</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-3 py-1 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg text-sm">
                    Upload TXT
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading || useConnectedWallet}
                    />
                  </label>
                  <button
                    onClick={handleAddWallet}
                    className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg text-sm"
                    disabled={loading || useConnectedWallet}
                  >
                    Add Wallet
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {wallets.map((wallet, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={wallet}
                      onChange={(e) => handleWalletChange(index, e.target.value)}
                      placeholder="jkl1..."
                      className={`flex-1 border border-gray-700 rounded-lg px-4 py-2 ${useConnectedWallet ? 'bg-gray-800 text-gray-400' : 'bg-[#1a1a1a]'}`}
                      disabled={loading || useConnectedWallet}
                    />
                    <button
                      onClick={() => handleRemoveWallet(index)}
                      className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg"
                      disabled={wallets.length === 1 || loading || useConnectedWallet}
                    >
                      -
                    </button>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-1">Enter Jackal wallet addresses</p>
              </div>
              
              {connected && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400"></span>
                  <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                    <span className="text-sm">
                      Use connected wallet only
                    </span>
                    <input
                      type="checkbox"
                      checked={useConnectedWallet}
                      onChange={(e) => {
                        setUseConnectedWallet(e.target.checked);
                        if (e.target.checked && connectedWalletAddress) {
                          setWallets([connectedWalletAddress]);
                        } else if (!e.target.checked && wallets.length === 1 && wallets[0] === connectedWalletAddress) {
                          setWallets(['']);
                        }
                      }}
                      className="h-4 w-4 accent-[#e5fb75]"
                      disabled={!connected || loading}
                    />
                  </label>
                </div>
              )}
              
            </div>

            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-medium">Total</p>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-2xl font-bold">{calculateTotal().jkl} JKL</p>
                  <button
                    onClick={() => priceService.forceUpdate().then(setJklPrice)}
                    className="text-sm text-gray-500 hover:text-gray-400 disabled:opacity-50"
                    disabled={isPriceLoading}
                  >
                    {isPriceLoading ? '(updating...)' : '↻'}
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  ~${calculateTotal().usd} USD
                </p>
              </div>
            </div>

            <button 
              onClick={handlePurchase}
              disabled={loading || wallets.every(w => !w.trim())}
              className="w-full bg-[#e5fb75] hover:bg-[#d5eb65] disabled:bg-gray-500 disabled:cursor-not-allowed text-black font-medium py-3 rounded-lg"
            >
              {loading ? 'Processing...' : 'Purchase'}
            </button>

            {error && (
              <p className="mt-4 text-red-500 text-sm">{error}</p>
            )}
            {successMessage && (
              <p className="mt-4 text-green-500 text-sm">{successMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;