// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    let userId1 = request.query.user1 as string;
    let userId2 = request.query.user2 as string;

    if (!userId1 || !userId2) throw new Error('Users 1 & 2');

    if (userId1 > userId2) {
      const temp = userId1;
      userId1 = userId2;
      userId2 = temp;
    }

    // TODO: get game
    // TODO: if game doesn't exist, create game
    await sql`INSERT INTO users (name) VALUES (${userId1});`;
  } catch (error) {
    return response.status(500).json({ error });
  }
 
  const users = await sql`SELECT * FROM users;`;
  return response.status(200).json({ users });
}