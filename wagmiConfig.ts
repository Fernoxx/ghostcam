import { createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { base } from "wagmi/chains";

// Create Wagmi client with new v2 API - Farcaster and Coinbase only
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
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