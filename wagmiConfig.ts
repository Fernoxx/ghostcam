import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { base } from "wagmi/chains";

// Create Wagmi client with new v2 API
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "GhostCam" })
  ],
  transports: {
    [base.id]: http()
  }
});