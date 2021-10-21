import cors from 'cors';
import express from 'express';
import expressWinston from 'express-winston';
import path from 'path';
import winston from 'winston';
import { ulid } from 'ulid'

import { HasLinks, Link, Links, SansRel, _links } from './links';
import requestSigning from './signing';

import { spaces, Space, EmptySpace, emptySpace, PlayerId, Board, TakeLinks } from '../shared/types';

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

const wins =
  // NOTE: There's probably some cool math that can figure this out instead,
  // but it's such a small space that this is just fine.
  [
    // Horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonal
    [0, 4, 8],
    [2, 4, 6]
  ] as const;
type Win = typeof wins[number]; // Not sure we actually need this.

const isWinner = (spaces: Space[]) =>
  wins.some(w => w.map(n => n as Space).every((space: Space) => spaces.includes(space)))

export function getOpponentId(playerId: PlayerId) {
  switch(playerId) {
    case 'O':
      return 'X';
    case 'X':
      return 'O';
  }
}

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
const chooseSpaces = (value: PlayerId | EmptySpace) => (board: Board) => getSpaces(board).filter(s => board[s] === value);

const getTakenSpaces = (board: Board, playerId: PlayerId) => chooseSpaces(playerId)(board);
const getEmptySpaces = chooseSpaces(emptySpace);

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
  const activePlayerHasWon = isWinner(getTakenSpaces(board, activePlayerId));

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
  const activePlayerHasWonLink =
    activePlayerHasWon
      ? _links({
        winPlaceholder: {
          href: '#',
          method: 'GET',
          title: '=== Active player has won!!! ==='
        },
      })._links
      : {};

  switch(activePlayerId) {
    case playerId:
      ok(res, {
        board: {
          _links: { ...mkTakeLinks(board, mkTake_(playerId)) },
          ...board,
        },
        _links: {
          ...commonLinks,
          ...placeholderLinks,
          ...activePlayerHasWonLink,
        }
      });
      break;

    case opponentId:
      ok(res, {
        board,
        _links: {
          ...commonLinks,
          ...placeholderLinks,
          ...activePlayerHasWonLink,
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
