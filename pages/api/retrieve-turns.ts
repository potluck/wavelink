// given a game, retrieve all the turns
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';


export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const gameId = request.query.gameId as string;
  if (!gameId) throw new Error('Missing gameId');
  const {rows} = await sql`
    SELECT t.id as turn_id, 
      t.created_at as turn_created_at,
      t.completed_at as turn_completed_at,
      t.speed_score,
      p.word1, p.word2, 
      s.id,
      s.counter,
      s.link1,
      s.link2,
      s.created_at,
      s.completed_at
    FROM turns t 
    JOIN pairs p on t.pair_id = p.id 
    LEFT JOIN submissions s on t.id = s.turn_id
    where t.game_id = ${gameId}
    order by t.id asc, s.counter asc;`;
  
  return response.status(200).json({ rows });
}