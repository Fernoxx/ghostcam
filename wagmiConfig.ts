import { createConfig, configureChains } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { base } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

// Configure Base chain (L2) with public RPC provider
export const { chains, publicClient } = configureChains([base], [publicProvider()]);

// Create Wagmi client that automatically connects to the first available connector.
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    coinbaseWallet({ chains, appName: "GhostCam" })
  ],
  publicClient
});