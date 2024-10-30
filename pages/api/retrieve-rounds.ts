// given a game, retrieve all the rounds
import { sql } from '@vercel/postgres';
import { NextApiResponse, NextApiRequest } from 'next';
import { spawn } from 'child_process';
var util = require("util");



export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {

  var process = spawn('python3',["./pages/api/scripts/similarity.py"]);
  process.stdout.on('data',function(chunk){

    var textChunk = chunk.toString('utf8');// buffer to string

    util.log(textChunk);
  });

  process.stderr.on('data', (stderr) => {
    console.log(`stderr: ${stderr}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  const gameId = request.query.gameId as string;
  const {rows} = await sql`SELECT * FROM rounds r JOIN pairs p on r.pair_id = p.id where r.game_id = ${gameId};`;
  return response.status(200).json({ rows });
}