<script lang="ts">
  import type { Link } from './links';
  import { Board, getSpaces, isEmpty, Space, TakeLinks } from "./shared/types";
  import SpaceComponent from './SpaceComponent.svelte';

  export let state: any;
  export let fillTemplate: (link: Link) => Link;

  let board: Board;
  let links: TakeLinks
  let rows: Space[][];
  let cols = [0, 1, 2] as const;

  $: {
    const b = state?.['board'];
    if (b) {
      board = b as Board; // 😬
      links = b?._links;

      const spaces = getSpaces(b);
      rows = [
        spaces.slice(0, 3),
        spaces.slice(3, 6),
        spaces.slice(6, 9),
      ];
    }
  }
  $: render = (space: Space) => board[space];
  $: getLink = (space: Space) => board['_links']?.[`take${space}`]
</script>

{#if board}
  <table>
    {#each rows as row (`row-${row}`)} <!-- your boat, gently down the stream -->
      <tr>
        {#each cols as col (`col-${col}`)}
          <td>
            <SpaceComponent space={row[col]} {render} {getLink} isEmpty={isEmpty(board)} />
          </td>
        {/each}
      </tr>
    {/each}
  </table>
{/if}

<style>
  td {
    padding: 20px;
    font-size: 40pt;
  }
</style>
