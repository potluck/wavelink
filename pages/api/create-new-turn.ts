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
  let currTurn = null;

  try {
    const { rows: turnsPlayed } = await sql`SELECT * FROM turns t where t.game_id = ${gameId};`;
    const pairsUsed = new Set<number>();

    for (const turn of turnsPlayed) {
      if (turn.completed_at == null) {
        currTurn = turn;
        pairToReturn = currTurn.pair_id;
      } else {
        pairsUsed.add(turn.pair_id);
      }
    }
    if (currTurn == null) {
      const { rows: allPairs } = await sql`SELECT p.id, p.easy FROM pairs p`;

      let availablePairs : number[];
      if (turnsPlayed.length == 0) {
        // First Turn for this game - get a random easy pair ID
        const easyPairs = allPairs.filter(pair => pair.easy);
        availablePairs = easyPairs.map((pair) => pair.id)

      } else {
        // Get random unused pair ID
        const maxPairId = allPairs.length;
        availablePairs = Array.from(
          { length: maxPairId },
          (_, i) => i + 1
        ).filter(id => !pairsUsed.has(id));
      }


      if (availablePairs.length === 0) {
        return response.status(400).json({ error: "No more available pairs" });
      }

      const randomIndex = Math.floor(Math.random() * availablePairs.length);
      pairToReturn = availablePairs[randomIndex];;

      const { rows: newTurn } = await sql`INSERT INTO turns (game_id, pair_id) VALUES (${gameId}, ${pairToReturn}) RETURNING *;`;
      currTurn = newTurn[0];
      await sql`INSERT INTO submissions (turn_id, counter) VALUES (${newTurn[0]?.id}, 0);`;
    }

  } catch (error) {
    return response.status(500).json({ error });
  }
  const { rows } = await sql`
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
    where t.id = ${currTurn?.id};`;
  console.log("gameID: ", gameId, "pairToReturn: ", pairToReturn);
  // if (rows.length == 0) {
  //   return response.status(500).json({ error: "error finding turn I just created" });
  // }
  return response.status(200).json({ rows });
}