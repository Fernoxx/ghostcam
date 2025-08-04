# GhostCam Setup Guide

## Frontend NFT Minting Configuration

### 1. Get NFT.Storage API Key

1. Go to [NFT.Storage](https://nft.storage)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 2. Update the API Key in index.html

Open `index.html` and replace `YOUR_NFT_STORAGE_API_KEY_HERE` with your actual API key:

```javascript
const NFT_STORAGE_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

### 3. Contract Details

The app is configured to use the following NFT contract on Base network:
- Contract Address: `0x422d2d64835c76570dbe858bd58fadfd85b7cd67`
- Network: Base (Chain ID: 8453)

### 4. Wallet Support

The app supports the following wallets:
1. **Farcaster Wallet** - When opened inside the Farcaster app
2. **Coinbase Wallet** - When opened in a browser
3. **Other Web3 Wallets** - MetaMask, etc. (will auto-switch to Base network)

### 5. How It Works

1. User captures a ghost photo
2. Image is uploaded directly to IPFS via NFT.Storage
3. User signs the transaction with their wallet
4. NFT is minted on-chain with the IPFS URI

No backend required - everything happens in the browser!