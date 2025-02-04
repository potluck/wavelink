// Submit a player's answer for a turn
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
import { stemmer } from 'stemmer'
import { distance } from 'fastest-levenshtein';
import { words } from 'popular-english-words';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function computeRareness(word: string) {
  const rank = words.getWordRank(word);
  if (rank < 500) {
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

// TODO: Some better way to handle edge cases with the stemmer
function isStemmerEdgeCase(submission: string, otherLink: string) {
  const submissions = [submission.toLowerCase(), otherLink.toLowerCase()].sort();
  return (
    (submissions[0] === "feet" && submissions[1] === "foot") ||
    (submissions[0] === "vocal" && submissions[1] === "voice") ||
    (submissions[0] === "fry" && submissions[1] === "fryer") ||
    (submissions[0] === "clothes" && submissions[1] === "clothing") ||
    (submissions[0] === "coin" && submissions[1] === "coinage") ||
    (submissions[0] === "wait" && submissions[1] === "waiter") ||
    (submissions[0] === "flight" && submissions[1] === "fly")
  );
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const turnId = request.query.turnId as string;
    const submission = (request.query.submission as string).replace(/[.,/#!$%^&*;:{}=\_`~()]/g, "");
    const thisLower = request.query.thisLower as string;
    const player2 = request.query.player2 as string;
    const word1 = request.query.word1 as string;
    const word2 = request.query.word2 as string;
    const previousSubmissionWords = request.query.previousSubmissionWords as string;
    const latestWord1 = request.query.latestWord1 as string;
    const latestWord2 = request.query.latestWord2 as string;
    if (!turnId || !submission || !thisLower) throw new Error('Missing param');

    let aiWord = null;
    if (player2 === "ai") {
      const previousWords = previousSubmissionWords + ", " + [word1, word2].join(", ");
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are playing a word association game. You need to provide a word that creates a logical or clever connection between two given words. The word should be simple and clear. Your goal is to match the word your partner submitted.`
          },
          {
            role: "user",
            content: `Provide a single word (just the word, nothing else) that creates a connection between "${latestWord1}" and "${latestWord2}". Your word cannot match, contain any of, or be a substring of any of the following words: ${previousWords}`
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
        store: true
      });
      aiWord = aiResponse.choices[0].message.content?.trim() || "";
    }

    const { rows } = await sql`
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
    let gameId = null;
    for (const row of rows) {
      if (gameId == null) {
        gameId = row.game_id;
      }
      if ((thisLower == "true" && row.link1 == null) || (thisLower == "false" && row.link2 == null)) {
        counter = row.counter;
        otherLink = aiWord || (thisLower == "true" ? row.link2 : row.link1);
        if (otherLink != null) {
          submissionCompleted = true;
          if (distance(stemmer(submission), stemmer(otherLink)) <= 1) {
            speedScore = 5 - counter;
            rarenessScore = computeRareness(submission.toLowerCase());
            turnCompleted = true;
          } else if (isStemmerEdgeCase(submission, otherLink)) {
            speedScore = 5 - counter;
            rarenessScore = 0;
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
    if (aiWord == null) {
      aiWord = otherLink;
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")

    if (thisLower == "true" && turnCompleted) {
      await sql`
        UPDATE submissions 
        SET link1=${submission}, link2=${aiWord},completed_at = NOW()
        WHERE turn_id=${turnId} and counter=${counter};
      `;
      await sql`
        UPDATE turns 
        SET completed_at = NOW(), speed_score=${speedScore}, rareness_score=${rarenessScore} 
        WHERE id=${turnId};
      `;
    } else if (thisLower == "true" && !turnCompleted) {
      await sql`
        UPDATE turns 
        SET updated_at = NOW()
        WHERE id=${turnId};
      `;
      if (submissionCompleted) {
        await sql`
          UPDATE submissions 
          SET link1=${submission}, link2=${aiWord}, completed_at = NOW()
          WHERE turn_id=${turnId} and counter=${counter};
        `;
        await sql`
          INSERT into submissions (turn_id, counter)
          VALUES (${turnId}, ${counter + 1});
        `;
      } else {
        await sql`
          UPDATE submissions 
          SET link1=${submission}, link2=${aiWord}
          WHERE turn_id=${turnId} and counter=${counter};
        `;
      }
    } else if (thisLower == "false" && turnCompleted) {
      await sql`
        UPDATE submissions 
        SET link2=${submission}, link1=${aiWord}, completed_at = NOW()
        WHERE turn_id=${turnId} and counter=${counter};
      `;
      await sql`
        UPDATE turns 
        SET completed_at = NOW(), speed_score=${speedScore}, rareness_score=${rarenessScore} 
        WHERE id=${turnId};
      `;
    } else if (thisLower == "false" && !turnCompleted) {
      await sql`
        UPDATE turns 
        SET updated_at = NOW()
        WHERE id=${turnId};
      `;
      if (submissionCompleted) {
        await sql`
          UPDATE submissions 
          SET link2=${submission}, link1=${aiWord}, completed_at = NOW()
          WHERE turn_id=${turnId} and counter=${counter};
        `;
        await sql`
          INSERT into submissions (turn_id, counter)
          VALUES (${turnId}, ${counter + 1});
        `;
      } else {
        await sql`
          UPDATE submissions 
          SET link2=${submission}, link1=${aiWord}
          WHERE turn_id=${turnId} and counter=${counter};
        `;
      }
    }
    if (submissionCompleted && player2 != "ai") {
      const { error } = await supabase
        .from('completed-submissions')
        .insert({
          game_id: gameId,
          turn_id: turnId,
          counter: counter,
          link1: thisLower == "true" ? submission : otherLink,
          link2: thisLower == "true" ? otherLink : submission,
          turn_completed_at: turnCompleted ? new Date().toISOString() : null,
          speed_score: speedScore
        })
      if (error) {
        console.error("Error inserting completed submission to supabase: ", error);
      }
    }
    return response.status(200).json({
      turnCompleted: turnCompleted,
      submissionCompleted: submissionCompleted,
      speedScore: speedScore,
      link1: thisLower == "true" ? submission : otherLink,
      link2: thisLower == "true" ? otherLink : submission
    });
  } catch (error) {
    return response.status(500).json({ error });
  }
}