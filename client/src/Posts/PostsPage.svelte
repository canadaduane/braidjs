<script>
  import { slide } from "svelte/transition";
  import NewPost from "./NewPost.svelte";
  import PostList from "./PostList.svelte";
  import NewPostButton from "./NewPostButton.svelte";
  import { config } from "../Settings/config";

  let serverUrl = config.serverUrl;

  export let posts; // : Resource<Array<any>>

  let connectState;
  $: connectState = posts.connectState;

  let newPostVisible = false;

  async function onPost({ detail }) {
    const { title, body } = detail;
    const index = $posts.length;
    // Use a regular PUT here, because we aren't really patching anything,
    // we're creating a new resource that will be linked to in our array
    // of posts.
    await fetch(new URL(`/post/${index}`, $serverUrl), {
      method: "PUT",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index, title, body }), // body data type must match "Content-Type" header
    });
    // TODO: optimize by creating locally first, then skipping
    // when server tells us it exists (instead of waiting for
    // the server to tell us what we already know)
    newPostVisible = false;
  }
</script>

<NewPostButton bind:visible={newPostVisible} />

{#if newPostVisible}
  <div transition:slide>
    <NewPost on:post={onPost} />
  </div>
{/if}

{#if $connectState === "connected"}
  <PostList {posts} />
{:else if $connectState === "init"}
  <status transition:slide> Loading... </status>
{:else}
  <status>
    Not connected: <span class:error={$connectState === "error"}
      >{$connectState}</span
    >
  </status>
{/if}

<style>
  status {
    display: flex;
    justify-content: center;

    color: white;
    font-size: 28px;
    font-weight: 700;
    margin-top: 64px;
  }

  span {
    padding-left: 16px;
  }
  .error {
    color: var(--cherry);
  }
</style>
