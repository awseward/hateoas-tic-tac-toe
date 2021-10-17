import express from 'express';
import { calculateSignature } from './lib';

type Options = {
  exemptPaths: string[]
}
const defaultOptions : Options = { exemptPaths: [] }

export default (signingKey: string) => (options?: Options) => {
  const options_ = options || defaultOptions;
  const isExempt =
    (req: express.Request) => options_.exemptPaths.includes(req.path);

  return (req : express.Request, res: express.Response, next: () => void) => {
    if (!isExempt(req)) {
      const sig = req.query['_sig'] as string; // Probably should revisit this…

      if (!sig) {
        res.status(404).send({ error: 'Missing required signature' });
        return;
      }

      if (sig !== calculateSignature(signingKey)(req.originalUrl)) {
        res.status(404).send({ error: 'Signature mismatch' });
        return;
      }
    }

    next();
  }
};
