import { NextApiResponse, NextApiRequest } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader('Content-Encoding', 'none');

  // Example: Polling the database every 5 seconds
  const gameId = req.query.gameId as string;
  if (gameId == "0") {
    return;
  }
  setInterval(async () => {
    const { rows } = await sql`
      SELECT
        t.id as turn_id,
        t.speed_score,
        t.rareness_score,
        t.completed_at as turn_completed_at,
        s.link1,
        s.link2,
        s.counter,
        p.word1,
        p.word2
      FROM turns t
      JOIN submissions s on s.turn_id = t.id
      JOIN pairs p on t.pair_id = p.id
      where t.game_id = ${gameId}
        and s.completed_at > now() - interval '15 seconds'
      ORDER BY s.completed_at DESC;`;
    if (rows.length > 0) {
      console.log("sending data: ", rows);
      res.write(`data: ${JSON.stringify(rows)}\n\n`);
    }
    else {
      res.write(`data: {}\n\n`);
    }
  }, 5000);

  res.on("close", () => {
    console.log("closed...");
    res.end();
  });
}
