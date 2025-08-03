// /api/mint.js for Vercel Backend
import { ethers } from 'ethers';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { imageData, walletAddress } = req.body;

  if (!imageData || !walletAddress) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    // Upload image to IPFS via NFT.Storage
    const uploadRes = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(imageData.split(',')[1], 'base64'),
    });

    const uploadJson = await uploadRes.json();
    const tokenURI = `ipfs://${uploadJson.value.cid}`;

    // Mint NFT on Base
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract('0xdde147b07790708cdcd753148716817b54b6f450', [
      "function mintWithURI(address to, string memory tokenURI) external"
    ], wallet);

    const tx = await contract.mintWithURI(walletAddress, tokenURI);
    await tx.wait();

    return res.status(200).json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Minting failed' });
  }
}
