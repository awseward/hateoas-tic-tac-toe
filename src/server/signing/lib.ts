import hmacSHA256 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';

const base64HMAC = (str: string, signingKey: string) =>
  Base64.stringify(hmacSHA256(str, signingKey))
    // Signatures need to be URL-safe, and I couldn't get
    // `crypto-js/enc-base64url` to actually import 🤷
    .replace('=', '')
    .replace('+', '-')
    .replace('/', '_');

export const calculateSignature = (signingKey: string) => (uri: string) => {
  const parsedURL = new URL(uri, 'https://__placeholder__');
  parsedURL.searchParams.delete('_sig');

  const path = parsedURL.pathname;
  const normalizedPath = path.startsWith('/api')
    ? path.slice(4)
    : path
  const queryString = parsedURL.search;

  return base64HMAC(normalizedPath + queryString, signingKey);
}

export const signPathAndQuery = (signingKey: string) => (pathAndQuery: string) => {
  const parsedURL = new URL(pathAndQuery, 'https://__placeholder__');
  if (parsedURL.searchParams.has('_sig')) {
    throw new Error('Attempted to sign where signature is already present.');
  }
  const sig = calculateSignature(signingKey)(parsedURL.pathname + parsedURL.search);
  parsedURL.searchParams.append('_sig', sig);

  return parsedURL.pathname + parsedURL.search;
}
