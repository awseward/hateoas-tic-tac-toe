import type { Method } from 'axios';
import UriTemplate from 'uri-templates'

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

type SansRel = Omit<Link, 'rel'>;

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

export const tryLink = <Rel extends string>(
  hasLinks: HasLinks<Rel>,
  fn: ((links: Links<Rel>) => Link)
) => !hasLinks ? undefined : fn(hasLinks._links);

export const fillTemplate = (values: any) => (link: Link): Link => {
  if (!link.templated) { return link; }

  return {
    ...link,
    href: UriTemplate(link.href).fill(values),
    templated: false,
  };
}

export const fillAllTemplates = (values: any) => <Rel extends string>(hasLinks: HasLinks<Rel>): HasLinks<Rel> => {
  const rels = Object.keys(hasLinks) as Array<keyof SansRels<Rel>>;
  return {
    ...hasLinks,
    _links: (
      rels.reduce<Partial<Links<Rel>>>(
        (links, rel) => {
          const link = hasLinks._links[rel];
          links[rel] = fillTemplate(values)(link);
          return links;
        },
        {}
      ) as Links<Rel>
    )
  };
}

export type WeakHasLinks = {
  _links: { [rel: string]: Link }
};

export const collectLinks = (values: any) => (hasLinks: WeakHasLinks): Link[] => {
  const rels = Object.keys(hasLinks);
  const fillTmpl = fillTemplate(values);

  return rels.map(rel => fillTmpl(hasLinks._links[rel]));
}
