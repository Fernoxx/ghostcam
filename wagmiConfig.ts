import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { farcasterWallet } from "@farcaster/miniapp-wagmi-connector";
import { base } from "wagmi/chains";

// Create Wagmi client with new v2 API - Farcaster and Coinbase
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterWallet(),
    coinbaseWallet({ 
      appName: "GhostCam",
      appLogoUrl: "/favicon.svg"
    })
  ],
  transports: {
    [base.id]: http()
  },
  ssr: true,
});