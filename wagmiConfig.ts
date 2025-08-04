import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { base } from "wagmi/chains";

// Create Wagmi client with new v2 API
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Browser Wallet',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      },
    }),
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