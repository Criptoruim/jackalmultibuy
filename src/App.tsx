import { useState } from 'react';
import { Wallet, Plus, Minus } from 'lucide-react';
import { connectKeplr } from './utils/wallet';
import { storageService } from './utils/storage';

function App() {
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<'months' | 'years'>('months');
  const [storageValue, setStorageValue] = useState(1);
  const [storageUnit, setStorageUnit] = useState<'GB' | 'TB'>('GB');
  const [wallets, setWallets] = useState(['']);
  const [referralCode, setReferralCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await connectKeplr();
      await storageService.initialize();
      setConnected(true);
      setError(null);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to connect wallet. Please try again.');
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

  const addWallet = () => {
    setWallets([...wallets, '']);
  };

  const removeWallet = (index: number) => {
    const newWallets = wallets.filter((_, i) => i !== index);
    setWallets(newWallets);
  };

  const updateWallet = (index: number, value: string) => {
    const newWallets = [...wallets];
    newWallets[index] = value;
    setWallets(newWallets);
  };

  const calculateTotal = () => {
    // Convert everything to years and TB for calculation
    const yearsValue = durationType === 'years' ? duration : duration / 12;
    const tbValue = storageUnit === 'TB' ? storageValue : storageValue / 1024;
    const basePrice = 795.195; // JKL per TB per year
    return (basePrice * tbValue * yearsValue * wallets.length).toFixed(2);
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
            <Wallet className="w-5 h-5" />
            Connect Wallet
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
              <label className="block text-sm font-medium mb-2">Wallet Addresses</label>
              {wallets.map((wallet, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => updateWallet(index, e.target.value)}
                    placeholder="jkl1..."
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
                  />
                  {index === 0 ? (
                    <button
                      onClick={addWallet}
                      className="p-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => removeWallet(index)}
                      className="p-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Referral Code (Optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2"
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-lg font-medium">Total</p>
                <p className="text-sm text-gray-400">~${(parseFloat(calculateTotal()) * 0.226).toFixed(2)} USD</p>
              </div>
              <p className="text-2xl font-bold">{calculateTotal()} JKL</p>
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