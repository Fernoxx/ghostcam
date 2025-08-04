import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Handle Farcaster webhook events
    console.log('Farcaster webhook event:', req.body);
    
    // You can add specific event handling here
    // For example: user interactions, frame events, etc.
    
    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}