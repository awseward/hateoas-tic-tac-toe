import cors from 'cors';
import express from 'express';
import expressWinston from 'express-winston';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

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
app.use(signing.middleware({ exemptPaths: ['/games/new'] }));

const mkHref = (pathAndQuery: string) => `{+authority}${signing.sign(pathAndQuery)}`;

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
