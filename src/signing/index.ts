import { signPathAndQuery } from "./lib"
import middleware from "./middleware"

export default (signingKey: string) => {
  return {
    middleware: middleware(signingKey),
    sign: signPathAndQuery(signingKey),
  }
}
