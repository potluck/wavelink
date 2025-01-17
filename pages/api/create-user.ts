import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userName = request.query.userName as string;
    if (!userName) throw new Error('User name required');
    let slug = userName.toLowerCase().replace(/ /g, '-');
    const {rows: collisions} = await sql`SELECT u.id FROM users u where u.slug=${slug};`;
    if (collisions.length > 0) {
      slug = slug + '-' + collisions.length;
    }

    const {rows: user} = await sql`INSERT INTO users (name, slug) VALUES (${userName}, ${slug}) returning *;`;
    return response.status(200).json({ user });
  } catch (error) {
    return response.status(500).json({ error });
  }
}