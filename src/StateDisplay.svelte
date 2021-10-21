<script lang="ts">
  import type { Link } from './links';
  import { Board, emptySpace, EmptySpace, getSpaces, isEmpty, PlayerId, Space, TakeLinks } from "./shared/types";

  export let state: any;
  export let links: TakeLinks;
  export let fillTemplate: (link: Link) => Link;

  let board: Board;
  let rows: Space[][];
  let cols = [0, 1, 2] as const;

  const spaceLink = (space: Space) : Link | undefined =>
    fillTemplate(links[`take${space}`]);

  const spaceChar = (space: Space) : (PlayerId | EmptySpace) =>
    isEmpty(board)(space) ? board[space] : emptySpace;

  const isPlayable = (space: Space) =>
    !!board['_links'][`choose${space}`];

  $: {
    const b = state?.['board'];
    if (b) {
      board = b as Board; // 😬
      const spaces = getSpaces(b);
      rows = [
        spaces.slice(0, 3),
        spaces.slice(3, 6),
        spaces.slice(6, 9),
      ];
    }
  }
</script>

{#if board}
  <table>
    {#each rows as row (`row-${row}`)} <!-- your boat, gently down the stream -->
      <tr>
        {#each cols as col (`col-${col}`)}
          <td>
            {#if isEmpty(board)(row[col])}
              {#if isPlayable(row[col])}
                <a href={spaceLink(row[col]).href}>spaceChar(row[col])</a>
              {:else}
                spaceChar(row[col])
              {/if}
            {:else}
              {spaceChar(row[col])}
            {/if}
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
