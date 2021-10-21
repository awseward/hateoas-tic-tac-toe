import type { PlayerId } from "./types";

export const mkOutboxId = (gameId: string, playerId: PlayerId) =>
  `${gameId}-${playerId}-outbox`;
