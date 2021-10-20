<script lang="ts">
  import axios from 'axios';

  import type { Link } from './links';
  import StateDisplay from './StateDisplay.svelte';

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
  <h1>Tic Tac Toe</h1>

  <StateDisplay {state} links={state?.['_links']} {fillTemplate} />

  {#each links as link}
    <div class="link-container">
      <a href={link.href}>{link.title}</a>
    </div>
  {/each}

  {#if state}
  <hr/>
  <details open>
    <pre class="under-the-hood">{
      JSON.stringify(
        {
          state,
        },
        null,
        2
      )
    }</pre>
  </details>
{/if}

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
    font-size: 2em;
    font-weight: 100;
  }

  .link-container {
    margin-bottom: 20px;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
