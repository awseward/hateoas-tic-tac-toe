import cors from 'cors';
import express from 'express';
import expressWinston from 'express-winston';
import path from 'path';
import winston from 'winston';
import { ulid } from 'ulid'

import { HasLinks, Link, Links, SansRel, _links } from './links';
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

const spaces = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
type Space = typeof spaces[number];

type EmptySpace = '_';
const emptySpace: EmptySpace = '_';

type Board = Record<Space, (PlayerId | EmptySpace)>;
const emptyBoard = () =>
  spaces.reduce(
    (board: Partial<Board>, space: Space) => {
      board[space] = emptySpace;
      return board;
    },
    {}
  ) as Board;




const mergeBoard = (base: Board) => (taken: Partial<Board>): Board => Object.assign({}, base, taken);
const fillHoles = mergeBoard(emptyBoard());

const getSpaces = (board: Board): Space[] => Object.keys(board).map(s => parseInt(s)) as Space[];
const getEmptySpaces = (board: Board): Space[] => getSpaces(board).filter(s => board[s] === emptySpace);

function parseBoard(req: express.Request): Board {
  const taken_ = Object.assign({}, req.query.taken) as Record<string, PlayerId>;
  const taken = Object.keys(taken_).reduce(
    (pBoard: Partial<Board>, key) => {
      const space = parseInt(key.replace('_', '')) as Space;
      pBoard[space] = taken_[key];

      return pBoard;
    },
    {}
  );
  return fillHoles(taken);
}

const renderTakenQueryParam = (board: Board) =>
  getSpaces(board).reduce(
    (kvps: string[], key: Space) => (board[key] === emptySpace)
      ? kvps
      : [...kvps, `taken[_${key}]=${board[key]}`]
    ,
    []
  ).join('&');

const mkTake =
  (gameId: string, mergeBoard: (taken: Partial<Board>) => Board) =>
  (playerId: PlayerId) =>
  (space: Space): Link => {
  return {
    rel: `take${space}`,
    href: mkHref(`/player/${playerId}/game/${gameId}?active=${getOpponentId(playerId)}&${renderTakenQueryParam(mergeBoard({ [space]: playerId }))}`),
    method: 'GET',
    title: `Take space ${space}`,
    templated: true,
  }
};

type TakeLinks = Partial<Links<'take0'|'take1'|'take2'|'take3'|'take4'|'take5'|'take6'|'take7'|'take8'>>
const mkTakeLinks = (board: Board, mkTakeLink: (space: Space) => Link) =>
  getEmptySpaces(board).reduce(
    (links: TakeLinks, space) => Object.assign(links, { [`take${space}`]: mkTakeLink(space) }),
    {}
  );

// This is essentially the "game loop"; what that looks like:
// - deserialize the state from the query params
// - render the correct links / state accordingly
app.get('/api/player/:playerId/game/:gameId', (req: Req<void>, res: Res<any>) => {
  const playerId: PlayerId = req.params.playerId as PlayerId; // 😬
  const opponentId = getOpponentId(playerId);
  const gameId = req.params.gameId;

  const activePlayerId = req.query.active as PlayerId; // 😬
  const board = parseBoard(req);

  const mkTake_ = mkTake(gameId, mergeBoard(board))

  const commonLinks = _links({ reset })._links;
  const placeholderLinks = _links({
    boardPlaceholder: {
      href: '#',
      method: 'GET',
      title: '=== Pretend there is a board rendered here ==='
    },
    statusPlaceholder: {
      href: '#',
      method: 'GET',
      title: `=== Active player: ${activePlayerId} ===`
    },
  })._links

  switch(activePlayerId) {
    case playerId:
      ok(res, {
        board,
        _links: {
          ...commonLinks,
          ...placeholderLinks,
          ...mkTakeLinks(board, mkTake_(playerId))
        }
      });
      break;

    case opponentId:
      ok(res, {
        board,
        _links: {
          ...commonLinks,
          ...placeholderLinks,
          ...mkTakeLinks(board, mkTake_(opponentId))
        },
      });
      break;

    default:
      res.status(500).send({ error: "This isn't supposed to happen…" });
  }
});

app.get('/api/*', (_req, res) => {
  res.status(501).send({ error: 'Unimplemented API route' });
})

app.get('*', (_req, res) => {
   res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => console.log(`Running on port ${port}`));
