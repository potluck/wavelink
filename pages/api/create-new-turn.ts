// check if open turn exists. If not, create a new one and return it

import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const gameId = request.query.gameId as string;
  if (!gameId) throw new Error('Missing gameId');
  let pairToReturn = -1;

  try {
    const { rows } = await sql`SELECT * FROM turns t where t.game_id = ${gameId};`;
    let currTurn = null;
    let maxPair = -1;

    for (const turn of rows) {
      if (turn.completed_at == null) {
        currTurn = turn;
        pairToReturn = currTurn.pair_id;
      } else if (turn.pair_id > maxPair) {
        maxPair = turn.pair_id;
      }
    }
    if (currTurn == null) {
      await sql`INSERT INTO turns (game_id, pair_id) VALUES (${gameId}, ${Math.max(1, maxPair + 1)});`;
      pairToReturn = Math.max(1, maxPair + 1);
      const { rows } = await sql`
        SELECT * FROM turns t
        where t.game_id = ${gameId} and t.pair_id = ${pairToReturn};`;
      await sql`INSERT INTO submissions (turn_id, counter) VALUES (${rows[0]?.id}, 0);`;
    }

  } catch (error) {
    return response.status(500).json({ error });
  }
  const { rows } = await sql`
    SELECT t.id as turn_id, 
      t.created_at as turn_created_at,
      t.completed_at as turn_completed_at,
      t.rareness_score,
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
    where t.game_id = ${gameId} and t.pair_id=${pairToReturn};`;
  console.log("gameID: ", gameId, "pairToReturn: ", pairToReturn);
  // if (rows.length == 0) {
  //   return response.status(500).json({ error: "error finding turn I just created" });
  // }
  return response.status(200).json({ rows });
}