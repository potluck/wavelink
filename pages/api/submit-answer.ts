// Submit a player's answer for a turn
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
  } else if (rank < 50000) {
    return 4;
  }
  return 5;
}
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const turnId = request.query.turnId as string;
    const submission = (request.query.submission as string).replace(/[.,/#!$%^&*;:{}=\_`~()]/g,"");
    const thisLower = request.query.thisLower as string;
    if (!turnId || !submission || !thisLower) throw new Error('Missing param');


    const {rows} = await sql`
      SELECT *
      FROM turns t 
      JOIN submissions s ON t.id = s.turn_id
      where t.id = ${turnId}
      order by s.counter asc;
    `;
    let turnCompleted = false;
    let submissionCompleted = false;
    let speedScore = 0;
    let rarenessScore = 0;
    let otherLink = null;
    let counter = -1;
    for (const row of rows) {
      if ((thisLower == "true" && row.link1 == null) || (thisLower == "false" && row.link2 == null)) {
        // completed = true;
        counter = row.counter;
        otherLink = thisLower == "true"? row.link2 : row.link1;
        if (otherLink != null) {
          submissionCompleted = true;
          if (distance(stemmer(submission), stemmer(otherLink)) <= 1) {
            speedScore = 5 - counter;
            rarenessScore = computeRareness(submission.toLowerCase());
            turnCompleted = true;
          } else if (counter == 4) {
            turnCompleted = true;
            speedScore = 0;
            rarenessScore = 0;
          }
        }
        break;
      }
    }


    if (thisLower == "true" && turnCompleted) {
      await sql`
        UPDATE submissions 
        SET link1=${submission}, completed_at = NOW()
        WHERE turn_id=${turnId} and counter=${counter};
      `;
      await sql`
        UPDATE turns 
        SET completed_at = NOW(), speed_score=${speedScore}, rareness_score=${rarenessScore} 
        WHERE id=${turnId};
      `;
    } else if (thisLower == "true" && !turnCompleted){
      await sql`
        UPDATE turns 
        SET updated_at = NOW()
        WHERE id=${turnId};
      `;
      if (submissionCompleted) {
        await sql`
          UPDATE submissions 
          SET link1=${submission}, completed_at = NOW()
          WHERE turn_id=${turnId} and counter=${counter};
        `;
        await sql`
          INSERT into submissions (turn_id, counter)
          VALUES (${turnId}, ${counter + 1});
        `;
      } else {
        await sql`
          UPDATE submissions 
          SET link1=${submission}
          WHERE turn_id=${turnId} and counter=${counter};
        `;
      }
    } else if (thisLower == "false" && turnCompleted){
      await sql`
        UPDATE submissions 
        SET link2=${submission}, completed_at = NOW()
        WHERE turn_id=${turnId} and counter=${counter};
      `;
      await sql`
        UPDATE turns 
        SET completed_at = NOW(), speed_score=${speedScore}, rareness_score=${rarenessScore} 
        WHERE id=${turnId};
      `;
    } else if (thisLower == "false" && !turnCompleted){
      await sql`
        UPDATE turns 
        SET updated_at = NOW()
        WHERE id=${turnId};
      `;
      if (submissionCompleted) {
        await sql`
          UPDATE submissions 
          SET link2=${submission}, completed_at = NOW()
          WHERE turn_id=${turnId} and counter=${counter};
        `;
        await sql`
          INSERT into submissions (turn_id, counter)
          VALUES (${turnId}, ${counter + 1});
        `;
      } else {
        await sql`
          UPDATE submissions 
          SET link2=${submission}
          WHERE turn_id=${turnId} and counter=${counter};
        `;
      }
    }
    return response.status(200).json({
      turnCompleted: turnCompleted, 
      submissionCompleted: submissionCompleted, 
      speedScore: speedScore, 
      rarenessScore: rarenessScore, 
      link1: thisLower == "true"? submission : otherLink, 
      link2:  thisLower == "true"? otherLink : submission
    });
  } catch (error) {
    return response.status(500).json({ error });
  }
}