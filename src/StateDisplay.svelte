<script lang="ts">
  import type { Link } from './links';
  import { Board, getSpaces, isEmpty, Space } from "./shared/types";

  export let state: any;
  export let links: { [key: string]: Link };
  export let fillTemplate: (link: Link) => Link;

  const spaceLink = (space: Space) =>
    fillTemplate(links[`take${space}`]);

  let board: Board;
  let rows: Space[][];
  let cols = [0, 1, 2] as const;

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
              <a href={spaceLink(row[col]).href}>☐</a>
            {:else}
              {board[row[col]]}
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
