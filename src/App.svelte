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

  let game: NewGame;
  $: startLink = game ? handleLink(game._links.start) : undefined;

  const { get } = axios;

  get<NewGame>('/api/games/new').then(res => game = res.data);
</script>

<main>
  <h1>HATEOAS Tic-Tac-Toe</h1>
  <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>

  <a href={startLink?.href}>{startLink?.title}</a>
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
