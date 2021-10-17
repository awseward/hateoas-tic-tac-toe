import type { HasLinks } from "../links";

export type PlayerId = 'A' | 'B';
export type NewGame = { gameId: string, playerId: PlayerId } & HasLinks<'start'|'yield'>;
