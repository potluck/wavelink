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
    const {rows} = await sql`SELECT r.*, p.word1, p.word2 FROM rounds r
      JOIN pairs p on r.pair_id = p.id
      where r.game_id = ${gameId}
        and r.completed_at > now() - interval '10 seconds';`;
    if (rows.length > 0) {
      res.write(`data: ${JSON.stringify(rows)}\n\n`);
      console.log("pots sent message: ", rows);
    }
  }, 5000);

  res.on("close", () => {
    console.log("closed...");
    res.end();
  });
}
