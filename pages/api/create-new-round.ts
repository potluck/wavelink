// check if open round exists. If not, create a new one and return it

import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const gameId = request.query.gameId as string;
  const thisLower = request.query.thisLower as string;
  if (!gameId || !thisLower) throw new Error('Missing gameId or thisLower');
  let pairToReturn = -1;

  try {
    const {rows} = await sql`SELECT * FROM rounds r where r.game_id = ${gameId};`;
    let currRound = null;
    let maxPair = -1;

    for (const round of rows) {
      if (round.completed_at == null && (thisLower == "true"? round.link1 : round.link2) == null) {
        currRound = round;
        pairToReturn = currRound.pair_id;
      } else if (round.pair_id > maxPair) {
        maxPair = round.pair_id;
      }
    }
    if (currRound == null) {
      await sql`INSERT INTO rounds (game_id, pair_id) VALUES (${gameId}, ${Math.max(1, maxPair + 1)});`;
      pairToReturn = Math.max(1, maxPair + 1);
    }

  } catch (error) {
    return response.status(500).json({ error });
  }
  const {rows} = await sql`SELECT r.*, p.word1, p.word2 FROM rounds r JOIN pairs p on r.pair_id = p.id where r.game_id = ${gameId} and r.pair_id=${pairToReturn};`;
  // if (rows.length == 0) {
  //   return response.status(500).json({ error: "error finding round I just created" });
  // }
  return response.status(200).json({rows});
}