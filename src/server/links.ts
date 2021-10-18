import type { Method } from 'axios';

export interface Link {
  rel: string;
  href: string;
  method: Method;
  title: string;
  templated?: boolean;
}

export type Links<Rel extends string> = Record<Rel, Link>;

export interface HasLinks<Rel extends string> {
  _links: Links<Rel>;
}

export type SansRel = Omit<Link, 'rel'>;

type SansRels<Rel extends string> = Record<Rel, SansRel>

export function mkLinks<Rel extends string>(partialLinks: SansRels<Rel>): Links<Rel> {
  const rels = Object.keys(partialLinks) as Array<keyof SansRels<Rel>>;

  return rels.reduce<Partial<Links<Rel>>>(
    (links, rel) => {
      links[rel] = { rel, ...partialLinks[rel] };
      return links;
    },
    {}
  ) as Links<Rel>;
}

export function _links<Rel extends string,>(links: SansRels<Rel>): HasLinks<Rel> {
  return { _links: mkLinks(links) };
}
