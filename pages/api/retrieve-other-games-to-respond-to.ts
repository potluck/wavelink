// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';


export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const gameId = request.query.gameId as string;
  const userId = request.query.userId as string;
  if (!gameId || !userId) throw new Error('Missing gameId or userId');
  const { rows } = await sql`
    SELECT distinct g.id FROM games g 
    JOIN turns t on t.game_id = g.id and t.completed_at is null 
    JOIN submissions s on s.turn_id = t.id and s.completed_at is null
    WHERE g.id != ${gameId}
    and ((g.user_id1 = ${userId} and s.link1 is null and s.link2 is not null)
      OR (g.user_id2 = ${userId} and s.link2 is null and s.link1 is not null)
    );`;
  return response.status(200).json({ rows });
}