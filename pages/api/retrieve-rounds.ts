// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userName = request.query.user as string;
    if (!userName) throw new Error('User name required');
    await sql`INSERT INTO users (name) VALUES (${userName});`;
  } catch (error) {
    return response.status(500).json({ error });
  }
 
  const users = await sql`SELECT * FROM users;`;
  return response.status(200).json({ users });
}