// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
import {stemmer} from 'stemmer'
import {distance} from 'fastest-levenshtein';
import {words} from 'popular-english-words';
 

function computeRareness(word: string) {
  const rank = words.getWordRank(word);
  if (rank < 500 ) {
    return 1;
  } else if (rank < 2000) {
    return 2;
  } else if (rank < 10000) {
    return 3;
  } else if (rank < 20000) {
    return 4;
  }
  return 5;
}
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const roundId = request.query.roundId as string;
    const submission = (request.query.submission as string).replace(/[.,/#!$%^&*;:{}=\_`~()]/g,"");
    const thisLower = request.query.thisLower as string;
    if (!roundId || !submission || !thisLower) throw new Error('Missing param');


    const {rows} = await sql`SELECT * FROM rounds r where id = ${roundId};`;
    let completed = false;
    let similarityScore = 0;
    let rarenessScore = 0;
    for (const row of rows) {
      if ((thisLower == "true" && row.link2 != null) || (thisLower == "false" && row.link1 != null)) {
        completed = true;
        const otherWord = thisLower == "true"? row.link2 : row.link1;
        if (distance(stemmer(submission), stemmer(otherWord)) <= 1) {
          similarityScore = 1;
          rarenessScore = computeRareness(submission.toLowerCase());
        }
      }
    }


    if (thisLower == "true" && completed) {
      await sql`UPDATE rounds SET link1=${submission}, completed_at = NOW(), similarity_score=${similarityScore}, rareness_score=${rarenessScore} WHERE id=${roundId};`;
    } else if (thisLower == "true" && !completed){
      await sql`UPDATE rounds SET link1=${submission} WHERE id=${roundId};`;
    } else if (thisLower == "false" && completed){
      await sql`UPDATE rounds SET link2=${submission}, completed_at = NOW(), similarity_score=${similarityScore}, rareness_score=${rarenessScore} WHERE id=${roundId};`;
    } else if (thisLower == "false" && !completed){
      await sql`UPDATE rounds SET link2=${submission} WHERE id=${roundId};`;
    }
  } catch (error) {
    return response.status(500).json({ error });
  }

  return response.status(200).json({});
}