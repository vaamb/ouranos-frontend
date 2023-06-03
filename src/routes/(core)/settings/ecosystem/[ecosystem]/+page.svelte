<script>
  import { page } from "$app/stores";
  import HeaderLine from "$lib/components/HeaderLine.svelte";

  $: ecosystemName = $page.params.ecosystem
</script>

<HeaderLine title="{ecosystemName} settings"/>