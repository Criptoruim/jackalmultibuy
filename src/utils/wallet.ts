import { Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
  interface Window extends KeplrWindow {}
}

export const connectKeplr = async () => {
  if (!window.keplr) {
    throw new Error("Keplr wallet not found");
  }

  // Testnet chain config
  const chainId = "jackal-1";
  
  try {
    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    // Return the address as a string instead of the full account object
    return accounts[0].address;
  } catch (error) {
    console.error("Error connecting to Keplr:", error);
    throw error;
  }
};