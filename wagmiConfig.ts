import { createConfig, configureChains } from "wagmi";
import { coinbaseWallet, farcasterWallet } from "@farcaster/miniapp-wagmi-connector";
import { base } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

// Configure Base chain (L2) with public RPC provider
export const { chains, publicClient } = configureChains([base], [publicProvider()]);

// Create Wagmi client that automatically connects to the first available connector.
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    farcasterWallet({ chains }),
    coinbaseWallet({ chains, appName: "GhostCam" })
  ],
  publicClient
});