// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';



export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const gameId = request.query.gameId as string;
  const {rows} = await sql`SELECT * FROM rounds r JOIN pairs p on r.pair_id = p.id where r.game_id = ${gameId};`;
  return response.status(200).json({ rows });
}