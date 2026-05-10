<script lang="ts">
  const SERVER = "http://localhost:3000/"

  import { onMount, untrack } from "svelte";
  import type { User, Day, Food } from "./lib/types";
  import Signup from "./routes/Signup.svelte";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import { find_today, today, capitalize } from "./lib/utils";

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
    days: [] as Day[],
    foods: [] as Food[]
  });
  let page: string = $state("signup");
  let error: any = $state(null);
  // let mounted = $state(false);

  async function save_changes(read_db: User, read_page: string) {
    const working = { ...read_db, page: read_page }
    localStorage.setItem("data", JSON.stringify(working))
    if (working.store_method !== "server") return

    try {
      const response = await fetch(`${SERVER}post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: working.user,
          pass: working.pass,
          data: working
        })
      })

      if (!response.ok) {
        const text = await response.text()
        page = "error"
        error = `Server save failed: ${response.status} ${text}`
      }
    } catch (e) {
      page = "error"
      error = "Could not connect to the server."
    }
  }

  let runs = 0;
  $effect(() => {
    const current_db = db;
    const current_page = page;
    
    if (runs < 2) {
      ++runs;
      return;
    }
    
    save_changes(current_db, current_page)
  })

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
      if (find_today(db.days) === undefined) {
        db.days.push({
          date: today(),
          foods: [],
          workouts: [],
          weights: []
        })
        save_changes(db, page)
      }
    }
    page = db.page
    // mounted = true
  })

  function add_calories(args: string[]) {

  }
  const special_commands: { [k in string]: (args: string[]) => void } = {
    cal: add_calories,
    cals: add_calories,
    calorie: add_calories,
    calories: add_calories,
  }
  let command = $state("");
  let normal_command = $derived(special_commands[command.split(" ")[0].toLowerCase()] !== undefined)

  function narrow_foods(foods: Food[], command: string) {
    if (!isNaN(Number(command))) return [foods[Number(command)]]
    let key_words = command.split(" "); if (!isNaN(Number(key_words.at(-1)))) key_words.pop()
    return foods.filter(f => key_words.every(k => f.name.toLowerCase().includes(k.toLowerCase())))
  }
</script>

{#if page != "signup" && page != "error"}
  <div class="header">
    <input type="text" placeholder="run a command..." autocorrect="off" autocapitalize="off" spellcheck="false" autocomplete="off" bind:value={command}>
    {normal_command}
    {JSON.stringify(narrow_foods(db.foods, command).map(f => f.name))}
  </div>
  <div class="header-spacer"></div>
{/if}

<div class="content">
  {#if page == "signup"}
    <Signup bind:db={db} SERVER={SERVER} bind:page={page} bind:error={error}/>
  {:else if page == "home"}
    <Home bind:db={db} SERVER={SERVER} bind:page={page} bind:error={error}/>
  {:else if page == "settings"}
    <Settings bind:db={db} SERVER={SERVER} bind:page={page} bind:error={error}/>
  {/if}
</div>

{#if page != "signup" && page != "error"}
  <div class="footer">
    <i style:font-size="1rem">Hello, {db.user}!</i><br>
    <div class="footer-place">
      Current page: {page.split("").map((i,d) => d == 0 ? i.toUpperCase() : i).join("")}
    </div>
    <div class="footer-nav">
      Go to:
      <select bind:value={page}>
        {#each ["home", "settings"] as place}
          <option value={place} selected={page == place}>{capitalize(place)}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="spacer"></div>
{/if}


<style scoped lang="scss">
  .spacer {
    height: 10rem;
    width: 1rem;
  }
  .footer-place, .footer-nav {
    display: inline-block;
  }
  .footer-nav {
    margin-right: 2rem;
    float: right;
    select {
      font-size: 1.5rem;
    }
  }
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 2.5px solid black;
    position: fixed;
    top: 0;
    width: 100%;
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
    background-color: white;
  }
  .header-spacer {
    height: 4rem;
    width: 1rem;
  }
  .content {
    padding: 20px;
  }
</style>