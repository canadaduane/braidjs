<script>
  import { ArrayResource } from "./braid";

  import Background from "./Background.svelte";
  import Sidebar from "./Sidebar.svelte";

  import FeedPage from "./Feed/FeedPage.svelte";
  import PostsPage from "./Posts/PostsPage.svelte";
  import LikesPage from "./Likes/LikesPage.svelte";
  import SettingsPage from "./Settings/SettingsPage.svelte";

  import { config } from "./Settings/config";

  let posts, likes;
  let serverUrl = config.serverUrl;

  $: {
    if (posts) posts.cancel();
    posts = new ArrayResource(new URL("/posts", $serverUrl));
  }

  $: {
    if (likes) likes.cancel();
    likes = new ArrayResource(new URL("/likes", $serverUrl));
  }

  let page = "posts";
</script>

<Background />

<Sidebar bind:page />

<app>
  {#if page === "feed"}
    <FeedPage {likes} />
  {:else if page === "posts"}
    <PostsPage {posts} />
  {:else if page === "likes"}
    <LikesPage {likes} />
  {:else if page === "settings"}
    <SettingsPage on:done={() => (page = "posts")} />
  {/if}
</app>

<style>
  app {
    display: block;
    margin-left: 160px;
  }
  @media only screen and (max-width: 600px) {
    app {
      margin-left: 0;
      margin-top: 88px;
    }
  }
</style>
