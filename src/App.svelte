<script lang="ts">
  import axios from 'axios';

  import type { Link } from './links';

  export let entrypoint: Link;
  export let fillTemplate: (link: Link) => Link;

  let state;
  let links: Link[] = [];
  $: {
    const links_ = !!state
      ? (state['_links'] || {})
      : {};
    const rels = Object.keys(links_);
    links = rels.map(rel => fillTemplate(links_[rel]));
  }

  axios
    .request({
      method: entrypoint.method,
      url: fillTemplate(entrypoint).href
    })
    .then(res => state = res.data)
    .catch(x => state = x);
</script>

<main>
  <h1>Uhhhh…</h1>

  {#each links as link}
    <div class="link-container">
      <a href={link.href}>{link.title}</a>
    </div>
  {/each}

  <pre style="text-align: left">{
    JSON.stringify(
      {
        links,
        state,
      },
      null,
      2
    )
  }</pre>
</main>

<style>
  main {
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
