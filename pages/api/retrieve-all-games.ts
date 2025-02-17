// retrieve all games for a user
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';


export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const userId = request.query.userId as string;
  if (!userId) throw new Error('Missing userId');
  const { rows } = await sql`
    SELECT g.id, u.name as other_player, u.slug as other_player_slug, MAX(t.updated_at) as last_turn_completed_at FROM games g
    JOIN users u on ((g.user_id1 = u.id and g.user_id2 = ${userId}) or (g.user_id2 = u.id and g.user_id1 = ${userId}))
    JOIN turns t on t.game_id = g.id
    WHERE g.user_id1 = ${userId} or g.user_id2 = ${userId}
    GROUP BY g.id, u.name, u.slug
    ORDER BY u.slug ASC;`;
  return response.status(200).json({ rows });
}