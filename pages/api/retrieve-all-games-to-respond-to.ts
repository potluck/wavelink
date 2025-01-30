import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';


export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  // TODO: include games where the last turn was completed and no new turn has been started
  const userId = request.query.userId as string;
  if (!userId) throw new Error('Missing userId');
  const { rows } = await sql`
    SELECT distinct g.id FROM games g 
    JOIN turns t on t.game_id = g.id and t.completed_at is null 
    JOIN submissions s on s.turn_id = t.id and s.completed_at is null
    WHERE ((g.user_id1 = ${userId} and s.link1 is null)
      OR (g.user_id2 = ${userId} and s.link2 is null)
    )
    UNION ALL
    SELECT distinct g.id FROM games g
    JOIN turns t on t.game_id = g.id and t.completed_at is not null
    WHERE ((g.user_id1 = ${userId} or g.user_id2 = ${userId})) AND NOT EXISTS (
      SELECT 1
      FROM turns AS t
      WHERE t.game_id = g.id
      AND t.completed_at IS NULL
    )
    ;`;
  return response.status(200).json({ rows });
}