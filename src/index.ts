import cors from 'cors';
import express from 'express';
import expressWinston from 'express-winston';
import winston from 'winston';
import { ulid } from 'ulid'

import { HasLinks, _links } from './links';
import requestSigning from './signing';

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;
function ok<T>(res: Res<T>, body: T) {
  res.status(200).send(body);
}

const app = express();
const port = 5001;
const signing = requestSigning('__FIXME__');

app.use(express.json());
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.simple(),
  meta: true,
}));
app.use(cors());
app.use(signing.middleware({ exemptPaths: ['/api/games/new'] }));

const mkHref = (pathAndQuery: string) => `{+authority}${signing.sign(pathAndQuery)}`;

type NewGame = { gameId: string, playerId: string } & HasLinks<'start'|'yield'>;
app.get('/api/games/new', async (_req: Req<void>, res: Res<NewGame>) => {
  const gameId = ulid();
  const playerId = 'A';

  ok(res, {
    gameId,
    playerId,
    ..._links({
      start: {
        href: mkHref(`/games/${gameId}?firstMove=${playerId}`),
        method: 'GET',
        title: 'Make the first move',
        templated: true
      },
      yield: {
        href: mkHref(`/games/${gameId}`),
        method: 'GET',
        title: 'Share this link to allow your opponent to make the first move',
        templated: true,
      },
    })
  });
});

app.get('/games/:uuid', async(req, res) => {
  res.status(501).send('TODO');
});

app.listen(port, () => console.log(`Running on port ${port}`));
