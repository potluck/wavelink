// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
 
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userName1 = request.query.userName1 as string;
    const userName2 = request.query.userName2 as string;

    if (!userName1 || !userName2) throw new Error('Users 1 & 2');
    const {rows: user1} = await sql`SELECT u.id FROM users u where u.name=${userName1};`;

    const {rows: user2} = await sql`SELECT u.id FROM users u where u.name=${userName2};`;

    if (user1?.length != 1 || user2?.length != 1) {return response.status(500).json({ error: "user not found" });}

    let userId1 = user1[0].id;
    let userId2 = user2[0].id;

    if (userId1 > userId2) {
      const temp = userId1;
      userId1 = userId2;
      userId2 = temp;
    }

    const {rows: game} = await sql`SELECT g.*, u.name as lowerUserName FROM games g join users u on u.id = g.user_id1 where g.user_id1=${userId1} and g.user_id2=${userId2};`;

    if (game.length == 1) {
      return response.status(200).json({ rows: game });
    }

    await sql`INSERT INTO games (user_id1, user_id2) VALUES (${userId1}, ${userId2});`;
    const {rows: gameTake2} = await sql`SELECT g.*, u.name as lowerUserName FROM games g join users u on u.id = g.user_id1 where g.user_id1=${userId1} and g.user_id2=${userId2};`;
    return response.status(200).json({ rows: gameTake2 });
  } catch (error) {
    console.log("got an error: ", error);
    return response.status(500).json({ error });
  }
}