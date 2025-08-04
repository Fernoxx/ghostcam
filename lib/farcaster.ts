import { sdk } from '@farcaster/miniapp-sdk';

export class FarcasterSDK {
  private static instance: FarcasterSDK;
  private isReady = false;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FarcasterSDK {
    if (!FarcasterSDK.instance) {
      FarcasterSDK.instance = new FarcasterSDK();
    }
    return FarcasterSDK.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize the SDK first
      await sdk.init();
      this.isInitialized = true;
      console.log('Farcaster SDK initialized');
    } catch (error) {
      console.log('Farcaster SDK init failed, running in browser mode:', error);
      this.isInitialized = true; // Set to true even if init fails for browser compatibility
    }
  }

  async ready(): Promise<void> {
    if (this.isReady) return;
    
    try {
      // Call ready to hide splash screen and show content
      await sdk.actions.ready();
      this.isReady = true;
      console.log('Farcaster Mini App ready');
    } catch (error) {
      console.log('Farcaster ready call failed, running in browser mode:', error);
      this.isReady = true; // Set to true even if ready fails for browser compatibility
    }
  }

  async getContext() {
    try {
      return await sdk.context;
    } catch (error) {
      console.log('Failed to get Farcaster context:', error);
      return null;
    }
  }

  async getUser() {
    try {
      const context = await this.getContext();
      return context?.user || null;
    } catch (error) {
      console.log('Failed to get Farcaster user:', error);
      return null;
    }
  }

  // Check if we're running in a Farcaster environment
  isFarcasterEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for Farcaster-specific indicators
    return !!(
      window.parent !== window || // Running in iframe
      (window as any).farcaster || // Farcaster global
      navigator.userAgent.includes('Farcaster') ||
      window.location.hostname.includes('farcaster') ||
      window.location.search.includes('frame=')
    );
  }

  // Get wallet connection for Farcaster environment
  async connectWallet() {
    try {
      if (this.isFarcasterEnvironment()) {
        // In Farcaster, wallet is automatically available
        const context = await this.getContext();
        if (context?.user?.wallet) {
          return {
            address: context.user.wallet.address,
            connector: 'farcaster'
          };
        }
      }
      return null;
    } catch (error) {
      console.log('Failed to connect Farcaster wallet:', error);
      return null;
    }
  }
}

export const farcasterSDK = FarcasterSDK.getInstance();