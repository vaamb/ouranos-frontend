<script>
  import { createEventDispatcher } from "svelte";

  import Fa from "svelte-fa";
  import {faXmark} from "@fortawesome/free-solid-svg-icons";

  export let opened = false;
  export const title = null;

  const dispatch = createEventDispatcher();

  const closeModal = function() {
    opened = false;
    dispatch("closeModal");
  }
</script>

{#if opened}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal">
      {#if title}
        <h1>{ title }</h1>
      {/if}
      <button class="reset-button close" on:click={closeModal}>
        <Fa icon={faXmark} />
      </button>
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
{/if}



<style>
  h1 {
    font-size: 1.6rem;
    font-weight: 500;
    margin-bottom: 7px;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--main-25);
  }

  .modal {
    position: absolute;
    min-width: 30vw;
    max-width: 90vw;
    height: fit-content;
    border: 2px solid var(--main-40);
    padding: 15px 25px;
    border-radius: 15px;
    background-color: var(--main-95);
  }

  .close {
    position: absolute;
    top: 0;
    right: 0;
    width: 35px;
    height: 35px;
    cursor: pointer;
  }

  .content {
    padding: 10px 0;
  }
</style>
