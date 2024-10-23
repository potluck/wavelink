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
    const completed = request.query.completed as string;
    if (!roundId || !submission || !thisLower || !completed) throw new Error('Missing param');
    if (thisLower == "true" && completed == "true") {
      await sql`UPDATE rounds SET link1=${submission}, completed_at = NOW() WHERE id=${roundId};`;
    } else if (thisLower == "true" && completed == "false"){
      await sql`UPDATE rounds SET link1=${submission} WHERE id=${roundId};`;
    } else if (thisLower == "false" && completed == "true"){
      await sql`UPDATE rounds SET link2=${submission}, completed_at = NOW() WHERE id=${roundId};`;
    } else if (thisLower == "false" && completed == "false"){
      await sql`UPDATE rounds SET link2=${submission} WHERE id=${roundId};`;
    }
  } catch (error) {
    return response.status(500).json({ error });
  }

  return response.status(200).json({});
}