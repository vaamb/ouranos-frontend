<script>
  import Fa from "svelte-fa";
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
</script>

<div class="container">
  <Fa icon={faSyncAlt} spin style="font-size: 4rem" />
  <p style="margin-top: 1rem">Loading</p>
</div>

<style>
  .container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
