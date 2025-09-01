import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Stripe webhook signature verification will be added later.
  res.status(501).send('Not implemented');
}
