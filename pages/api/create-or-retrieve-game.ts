// create or retrieve a game for two users
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    const userName1 = request.query.userName1 as string;
    const userName2 = request.query.userName2 as string;

    if (!userName1 || !userName2) throw new Error('Users 1 & 2 required');
    let { rows: user1 } = await sql`SELECT u.id, u.name, u.passkey FROM users u where u.slug=${userName1.toLowerCase()};`;
    let { rows: user2 } = await sql`SELECT u.id, u.name, u.passkey FROM users u where u.slug=${userName2.toLowerCase()};`;
    let newUserCreated = false;

    if (user1?.length == 0 && user2?.length > 0) {
      // No User 1 but yes User 2 - create User 1
      const slug = userName1.toLowerCase().replace(/ /g, '-');
      const { rows: newUser } = await sql`INSERT INTO users (name, slug) VALUES (${userName1}, ${slug}) returning *;`;
      user1 = newUser;
      newUserCreated = true;
    } else if (user1?.length > 0 && user2?.length == 0) {
      // Yes User 1 but no User 2 - create User 2. Previously was not creating but might as well.
      const slug = userName2.toLowerCase().replace(/ /g, '-');
      const { rows: newUser } = await sql`INSERT INTO users (name, slug) VALUES (${userName2}, ${slug}) returning *;`;
      user2 = newUser;
      newUserCreated = true;
    } else if (!(user1?.length > 0 && user2?.length > 0)) {
      return response.status(500).json({ error: `Sorry - there's been an error. Users ${userName1} and ${userName2} were not found.` });
    }

    let userId1 = user1[0].id;
    let userId2 = user2[0].id;
    let thisLower = true;

    if (userId1 > userId2) {
      const temp = userId1;
      userId1 = userId2;
      userId2 = temp;
      thisLower = false;
    }

    if (!newUserCreated) {
      const { rows: game } = await sql`SELECT g.* FROM games g where g.user_id1=${userId1} and g.user_id2=${userId2};`;
      if (game.length > 0) {
        return response.status(200).json({
          rows: game,
          thisLower,
          userId1: thisLower ? userId1 : userId2,
          userId2: thisLower ? userId2 : userId1,
          userName1: user1[0].name,
          userName2: user2[0].name,
          userHasPasskey: (user1[0].passkey) != null
        });
      }
    }
    const { rows: gameTake2 } = await sql`INSERT INTO games (user_id1, user_id2) VALUES (${userId1}, ${userId2}) returning *;`;
    return response.status(200).json({
      rows: gameTake2,
      thisLower,
      userId1: thisLower ? userId1 : userId2,
      userId2: thisLower ? userId2 : userId1,
      userName1: user1[0].name,
      userName2: user2[0].name,
      userHasPasskey: (user1[0].passkey) != null
    });
  } catch (error) {
    console.log("got an error: ", error);
    return response.status(500).json({ error });
  }
}