<script lang="ts">
  const SERVER = "http://localhost:3000/"

  import { onMount } from "svelte";
  import type { User, Day } from "./lib/types";

  let db: User = $state({
    user: "",
    pass: "",
    settings: {
      cares_about: ["calories", "protein"],
      goal_calories: 0,
      goal_protein: 0,
      goal_carbs: 0,
      goal_fat: 0,
      max_saturated_fat: 0,
      max_sodium: 0
    },
    store_method: "client",
    page: "signup",
    days: [] as Day[]
  });
  let page: string = $state("signup");
  let error: any = $state(null);
  let update = false;

  onMount(async () => {
    if (localStorage.getItem("store_method")) {
      if (localStorage.getItem("store_method") === "server") {
        const request = await fetch(`${SERVER}get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user: localStorage.getItem("user"),
            pass: localStorage.getItem("pass")
          })
        })

        if (request.status === 200) {
          db = await request.json() as User
        } else {
          page = "error"
          error = "Could not connect to the server."
        }

      } else {
        db = JSON.parse(localStorage.getItem("data") as string) as User
      }
    }
    page = db.page
    update = true
  })

  $effect(() => {
    if (!update) return

    console.log(1)
    const read_db = db
    const read_page = page

    const working = { ...read_db, page: read_page }

    localStorage.setItem("data", JSON.stringify(working));
    if (working.store_method === "server") {
      fetch(`${SERVER}post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: working.user,
          pass: working.pass,
          data: working
        })
      }).catch(() => {
        page = "error"
        error = "Could not connect to the server. Your changes are not being saved."
      })
    }

  })

  import Signup from "./routes/Signup.svelte";
</script>

{#if page != "signup" && page != "error"}
  <div class="header">
    <input type="text" placeholder="run a command...">
  </div>
{/if}

<div class="content">
  {#if page == "signup"}
    <Signup bind:db={db} SERVER={SERVER} bind:page={page} bind:error={error}/>
  {/if}
</div>

{#if page != "signup" && page != "error"}
  <div class="footer">
    <i style:font-size="1rem">Hello, {db.user}!</i><br>
    <div class="footer-place">
      Current page: {page.split("").map((i,d) => d == 0 ? i.toUpperCase() : i).join("")}
    </div>
    <div class="footer-nav">

    </div>
  </div>
{/if}

<style scoped lang="scss">
  .footer-place, .footer-nav {
    display: inline-block;
  }
  .footer-nav {
    margin-left: 2rem;
  }
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 2.5px solid black;
    input {
      width: calc(100% - 2rem);
      padding: 1rem;
      font-size: 1.5rem;
      border: none;
      outline: none;
      &::placeholder {
        font-style: italic;
        color: #444;
      }
    }
  }
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    border-top: 2.5px solid black;
    padding: 1rem;
    padding-top: 0.5rem;
    font-size: 1.5rem;
  }
  .content {
    padding: 20px;
  }
</style>