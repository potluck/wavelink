import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const slug = request.query.slug as string;
  if (!slug) throw new Error('Missing slug');
  const { rows } = await sql`SELECT * FROM users WHERE slug = ${slug};`;
  return response.status(200).json({ rows });
}
