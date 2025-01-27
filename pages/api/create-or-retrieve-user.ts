import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userName = request.query.userName as string;
    if (!userName) throw new Error('User name required');
    const slug = userName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const {rows: existingUsers} = await sql`
      SELECT u.id, u.passkey, u.name, u.slug, u2.name as other_player, g.id as game_id
      FROM users u
      LEFT JOIN games g on u.id = g.user_id1 or u.id = g.user_id2
      LEFT JOIN users u2 on ((g.user_id1 = u2.id and g.user_id2 = u.id) or (g.user_id2 = u2.id and g.user_id1 = u.id))
      where u.slug=${slug};
      `;
    if (existingUsers.length > 0) {
      const passkey = existingUsers[0].passkey;
      const otherPlayers = existingUsers
        .filter(row => row.other_player != null)
        .map(row => row.other_player);
      return response.status(200).json({ user: existingUsers[0], retrievedUser: true, userHasPasskey: passkey != null, otherPlayers });
    }
    if (slug === "invite" || slug === "help" || slug === "ai") {
      return response.status(500).json({ error: "Invalid user name" });
    }
    const {rows: user} = await sql`INSERT INTO users (name, slug) VALUES (${userName}, ${slug}) returning *;`;
    return response.status(200).json({ user: user[0], retrievedUser: false, userHasPasskey: false });
  } catch (error) {
    return response.status(500).json({ error });
  }
}