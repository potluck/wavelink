import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userId = request.query.userId as string;
    const passkey = request.query.passkey as string;
    if (!userId || !passkey) throw new Error('User name and passkey required');

    const {rows: user} = await sql`SELECT * FROM users WHERE id=${userId};`;
    if (user[0].passkey === passkey) {
      return response.status(200).json({ user });
    } else {
      return response.status(401).json({ error: "Incorrect passkey" });
    }
  } catch (error) {
    return response.status(500).json({ error });
  }
}