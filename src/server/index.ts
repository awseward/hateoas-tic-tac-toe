import cors from 'cors';
import express from 'express';
import expressWinston from 'express-winston';
import path from 'path';
import winston from 'winston';
import { ulid } from 'ulid'

import { HasLinks, SansRel, _links } from './links';
import requestSigning from './signing';

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;
function ok<T>(res: Res<T>, body: T) {
  res.status(200).send(body);
}

const app = express();
const port = process.env.PORT || 5001;
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
app.use(express.static('public'));
app.use(signing.middleware({ exemptPaths: ['/', '/api'] }));

const mkHref = (pathAndQuery: string) => `{+authority}${signing.sign(pathAndQuery)}`;

const reset: SansRel = {
  href: '/',
  method: 'GET',
  title: "I would like to start over from the beginning",
}

type PlayerId = 'X' | 'O';
function getOpponentId(playerId: PlayerId) {
  switch(playerId) {
    case 'O':
      return 'X';
    case 'X':
      return 'O';
  }
}

type Game = {
  gameId: string,
  playerId: PlayerId,
  opponentId: PlayerId,
};

app.get('/api', (_req: Req<void>, res: Res<HasLinks<'chooseX'|'chooseO'>>) => {
  ok(res, {
    ..._links({
      chooseX: {
        href: mkHref('/player/X/games/new'),
        method: 'GET',
        title: 'I choose X',
        templated: true
      },
      chooseO: {
        href: mkHref('/player/O/games/new'),
        method: 'GET',
        title: 'I choose O',
        templated: true
      }
    }),
  });
});

// type NewGame = HasLinks<'start'|'yield'> & Game;
app.get('/api/player/:playerId/games/new', (req: Req<void>, res: Res<HasLinks<'start'|'yield'>>) => {
  const gameId = ulid();
  const playerId = req.params.playerId as PlayerId; // 😬
  const opponentId = getOpponentId(playerId);

  ok(res, {
    ..._links({
      reset,

      start: {
        href: mkHref(`/player/${playerId}/game/${gameId}?active=${playerId}`),
        method: 'GET',
        title: 'I will go first',
        templated: true
      },

      yield: {
        href: mkHref(`/player/${playerId}/game/${gameId}?active=${opponentId}`),
        method: 'GET',
        title: 'My opponent will go first',
        templated: true,
      },
    }),
  });
});

// This is essentially the "game loop"; what that looks like:
// - deserialize the state from the query params
// - render the correct links / state accordingly
app.get('/api/player/:playerId/game/:gameId', (req: Req<void>, res: Res<any>) => {
  const playerId: PlayerId = req.params.playerId as PlayerId; // 😬
  const gameId = req.params.gameId;
  const activePlayerId = req.query.active as PlayerId; // 😬

  const isYourTurn = playerId === activePlayerId;

  if (isYourTurn) {
    ok(res, {
      ..._links({
        reset,
        todo: {
          href: '#',
          method: 'GET',
          title: 'TODO: Implement the next step(s)'
        },
      }),
      TODO: 'Need to implement the actual game now!'
    });
  } else {
    ok(res, {
      ..._links({
        reset,
        todo: {
          href: '#',
          method: 'GET',
          title: 'TODO: Implement the next step(s)'
        },
      }),
      TODO: 'Need to implement the actual game now!'
    });
  }


  ok(res, {
    yourTurn: playerId === activePlayerId,
  });
});

app.get('/api/*', (_req, res) => {
  res.status(501).send({ error: 'Unimplemented API route' });
})

app.get('*', (_req, res) => {
   res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => console.log(`Running on port ${port}`));
