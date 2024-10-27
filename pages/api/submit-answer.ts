// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const roundId = request.query.roundId as string;
    const submission = request.query.submission as string;
    const thisLower = request.query.thisLower as string;
    if (!roundId || !submission || !thisLower) throw new Error('Missing param');


    const {rows} = await sql`SELECT * FROM rounds r where id = ${roundId};`;
    let completed = false;
    for (const row of rows) {
      if ((thisLower == "true" && row.link2 != null) || (thisLower == "false" && row.link1 != null)) {
        completed = true;
        // TODO: calculate scores
      }
    }


    if (thisLower == "true" && completed) {
      await sql`UPDATE rounds SET link1=${submission}, completed_at = NOW() WHERE id=${roundId};`;
    } else if (thisLower == "true" && !completed){
      await sql`UPDATE rounds SET link1=${submission} WHERE id=${roundId};`;
    } else if (thisLower == "false" && completed){
      await sql`UPDATE rounds SET link2=${submission}, completed_at = NOW() WHERE id=${roundId};`;
    } else if (thisLower == "false" && !completed){
      await sql`UPDATE rounds SET link2=${submission} WHERE id=${roundId};`;
    }
  } catch (error) {
    return response.status(500).json({ error });
  }

  return response.status(200).json({});
}