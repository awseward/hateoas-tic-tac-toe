<script lang="ts">
  import type { Link } from "./links";
  import type { EmptySpace, PlayerId, Space } from "./shared/types";

  export let space: Space;
  export let render: (s: Space) => PlayerId | EmptySpace;
  export let getLink: (s: Space) => Link;
  export let isEmpty: (s: Space) => boolean;

  $: link = getLink(space);
  $: rendered = render(space);

</script>

{#if space}
  {#if isEmpty(space) && !!link}
    <a href={link.href}>{rendered}</a>
  {:else}
    {rendered}
  {/if}
{/if}

<style></style>
