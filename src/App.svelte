<script lang="ts">
  import axios from 'axios';
  import UriTemplate from 'uri-templates'

  import type { Link } from './links';
  import { _links } from './links';
  import type { NewGame } from './shared/types';

  export let name: string;

  const authority = window.location.origin;

  function handleLink(link: Link): Link {
    if (!link.templated) { return link; }

    return {
      ...link,
      href: UriTemplate(link.href).fill({ authority }),
      templated: false,
    }
  }

  function link(game: NewGame, fn: ((g: NewGame) => Link)): Link {
    return game ? handleLink(fn(game)) : undefined;
  }

  let game: NewGame;
  $: startLink = link(game, g => g._links.start);
  $: yieldLink = link(game, g => g._links.yield);

  const { get } = axios;

  get<NewGame>('/api/games/new').then(res => game = res.data);
</script>

<main>
  <h1>HATEOAS Tic-Tac-Toe</h1>

  <div>
    <a href={startLink?.href}>{startLink?.title}</a>
  </div>
  <hr/>
  <div>
    <a href={yieldLink?.href}>{yieldLink?.title}</a>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
