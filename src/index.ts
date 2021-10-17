import cors from 'cors';
import express from 'express'
import expressWinston from 'express-winston';
import winston from 'winston';
import { HasLinks, _links } from './links';
import { v4 as uuidv4 } from 'uuid';

import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;
function ok<T>(res: Res<T>, body: T) {
  res.status(200).send(body);
}

const app = express();
const port = 5001;
app.use(express.json());

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.simple(),
  meta: true,
}));
app.use(cors());

const secret = '__SECRET__';

const base64HMAC = (str: string) =>
  Base64.stringify(hmacSHA256(str, secret))
    // Signatures need to be URL-safe, and I couldn't get
    // `crypto-js/enc-base64url` to actually import 🤷
    .replace('=', '')
    .replace('+', '-')
    .replace('/', '_');

const calculateSignature = (uri: string) => {
  const parsedURL = new URL(uri, 'https://__placeholder__');
  parsedURL.searchParams.delete('_sig');
  return base64HMAC(parsedURL.pathname + parsedURL.search);
}

const signPathAndQuery = (pAndQ: string) => {
  const parsedURL = new URL(pAndQ, 'https://__placeholder__');
  if (parsedURL.searchParams.has('_sig')) {
    throw new Error('Attempted to sign where signature is already present.');
  }
  const sig = base64HMAC(parsedURL.pathname + parsedURL.search);
  parsedURL.searchParams.append('_sig', sig);
  return parsedURL.pathname + parsedURL.search;
}

const mkHref = (pathAndQuery: string) => `{+authority}${signPathAndQuery(pathAndQuery)}`

app.use(function (req, res, next) {
  if (req.path !== '/games/new') {
    const sig = req.query['_sig'] as string; // Probably should revisit this…
    if (!sig) {
      res.status(404).send({ error: 'Missing required signature' });
      return;
    }
    const calculatedSig = calculateSignature(req.originalUrl);

    if (sig !== calculatedSig) {
      res.status(404).send({ error: 'Signature mismatch' });
      return;
    }
  }

  next();
})

type NewGame = { id: string } & HasLinks<'start'|'invite'>;
app.get('/games/new', async (_req: Req<void>, res: Res<NewGame>) => {
  const uuid = uuidv4();

  ok(res, {
    id: uuid,
    ..._links({
      start: {
        href: mkHref(`/games/${uuid}/start?foo=bar`),
        method: 'GET',
        title: 'Start this game by making the first move',
        templated: true
      },
      invite: {
        href: mkHref(`/games/${uuid}/invite?foo=bar`),
        method: 'GET',
        title: 'Share this link with someone else to invite them to make the first move',
        templated: true,
      },
    })
  });
});

app.get('/games/:uuid/invite', async(req, res) => {
  res.status(501).send('TODO');
});

app.get('/games/:uuid/start', async(req, res) => {
  res.status(501).send('TODO');
});


app.listen(port, () => console.log(`Running on port ${port}`));
