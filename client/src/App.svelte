<script lang="ts">
  const SERVER = "http://localhost:3000/"

  import { onMount, untrack } from "svelte";
  import type { User, Day, Food } from "./lib/types";
  import Signup from "./routes/Signup.svelte";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import { find_today, today, capitalize, NICE_MACROS, round } from "./lib/utils";

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

  function add_calories_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} calories</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_calories() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add " + (find_today(db.days) as Day).foods.length,
      calories: amount(command),
      protein: 0,
      carbs: 0,
      fat: 0,
      saturated_fat: 0,
      sodium: 0
    }, 1])
  }
  function add_protein_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} grams of protein</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_protein() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add " + (find_today(db.days) as Day).foods.length,
      calories: 0,
      protein: amount(command),
      carbs: 0,
      fat: 0,
      saturated_fat: 0,
      sodium: 0
    }, 1])
  }
  function add_carbs_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} grams of carbs</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_carbs() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add " + (find_today(db.days) as Day).foods.length,
      calories: 0,
      protein: 0,
      carbs: amount(command),
      fat: 0,
      saturated_fat: 0,
      sodium: 0
    }, 1])
  }
  function add_fat_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} grams of fat</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_fat() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add " + (find_today(db.days) as Day).foods.length,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: amount(command),
      saturated_fat: 0,
      sodium: 0
    }, 1])
  }
  function add_saturated_fat_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} grams of saturated fat</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_saturated_fat() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add " + (find_today(db.days) as Day).foods.length,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      saturated_fat: amount(command),
      sodium: 0
    }, 1])
  }
  function add_sodium_message(): string {
    if (amount(command) != 0) return `<h2>Adding <span>${amount(command)} milligrams of sodium</span>.</h2>`
    return `<h2>Doing nothing.</h2>`
  }
  function add_sodium() {
    if (amount(command) === 0) return;
    (find_today(db.days) as Day).foods.push([{
      id: "-1",
      name: "Simple add",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      saturated_fat: 0,
      sodium: amount(command)
    }, 1])
  }
  const special_commands: { [k in string]: [() => void, () => string] } = {
    cal: [add_calories, add_calories_message],
    cals: [add_calories, add_calories_message],
    calorie: [add_calories, add_calories_message],
    calories: [add_calories, add_calories_message],
    protein: [add_protein, add_protein_message],
    pro: [add_protein, add_protein_message],
    prot: [add_protein, add_protein_message],
    carbs: [add_carbs, add_carbs_message],
    carb: [add_carbs, add_carbs_message],
    car: [add_carbs, add_carbs_message],
    fat: [add_fat, add_fat_message],
    fats: [add_fat, add_fat_message],
    saturated: [add_saturated_fat, add_saturated_fat_message],
    sat: [add_saturated_fat, add_saturated_fat_message],
    sf: [add_saturated_fat, add_saturated_fat_message],
    sodium: [add_sodium, add_sodium_message],
    sod: [add_sodium, add_sodium_message],
    mg: [add_sodium, add_sodium_message]
  }
  let command = $state("");
  let normal_command = $derived(command.length > 0 && special_commands[command.split(" ")[0].toLowerCase()] === undefined)
  let header_height = $state(0);

  function narrow_foods(foods: Food[], command: string) {
    if (!isNaN(Number(command))) return [foods[Number(command)]]
    let key_words = command.split(" "); if (!isNaN(Number(key_words.at(-1)))) key_words.pop();
    if (key_words.length == 1 && !isNaN(Number(key_words[0]))) return [foods[Number(key_words[0])]]
    return foods.filter(f => key_words.every(k => f.name.toLowerCase().includes(k.toLowerCase())))
  }

  function amount(command: string) {
    let key_words = command.split(" ");
    if (!isNaN(Number(key_words[0]))) key_words.shift()
    if (isNaN(Number(key_words.at(-1)))) return 0
    return Number(key_words.at(-1))
  }

  function run_command() {
    if (normal_command) {
      const food = narrow_foods(db.foods, command)[0]
      const a = amount(command)
      if (a == 0 || food === undefined || food === null) {command = ""; return;}
      ;(find_today(db.days) as Day).foods.push([food, a])
      db = {...db}; command = ""
    } else if (command.length > 0){
      special_commands[command.split(" ")[0].toLowerCase()][0]()
      db = {...db}; command = ""
    }
  }

</script>

{#if page != "signup" && page != "error"}
  <div class="header" bind:clientHeight={header_height}>
    <input type="text" placeholder="run a command..." autocorrect="off" autocapitalize="off" spellcheck="false" autocomplete="off" bind:value={command} class="command" onkeyup={e => {if (e.key == "Enter") run_command()}}>
    {#if normal_command}
      {@const foods = narrow_foods(db.foods, command)}
      {@const food = foods.length == 0 ? {"name":"Nothing","calories":0,"protein":0,"id":"-2","carbs":0,"fat":0,"saturated_fat":0,"sodium":0} : foods[0]}
      <div class="food-preview">
        <h2>Adding "{food.name}" * {amount(command)}</h2>
        {#each db.settings.cares_about as macro, d}
          <p>↪ {food[macro]}{NICE_MACROS[macro][2]} {NICE_MACROS[macro][0].toLowerCase()} * {amount(command)} = <span>{round(food[macro] * amount(command), 2)} {NICE_MACROS[macro][2]}</span></p>
        {/each}
        {#if foods.length > 1}
          <h3>Did you mean:</h3>
          <ol>
            {#each foods as i, d}
            <li value={i.id}><button onclick={() => {
              let a = amount(command)
              command = `${i.id}${a == 0 ? "" : " " + a}`
              document.querySelector<HTMLInputElement>(".command")?.focus()
              }}>{i.name}</button></li>
            {/each}
          </ol>
        {/if}
      </div>
    {:else if command.length == 0}
      <div></div>
    {:else}
      <div class="food-preview">{@html special_commands[command.split(" ")[0].toLowerCase()][1]()}</div>
    {/if}
  </div>
  <div class="header-spacer" style:height="{header_height+8}px"></div>
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


<style lang="scss">
  :global(span) {
    background-color: yellow;
    font-weight: 700;
    font-style: italic;
  }
  :global(.food-preview) {
    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    padding-left: 1rem;
    padding-bottom: 1rem;
    * {
      margin: 0;
    }
    button {
      cursor: pointer;
      font-size: 1.25rem;
    }
    p {
      font-size: 1.5rem;
    }
    h3 {
      margin-top: 0.5rem;
      font-size: 1.5rem;
      text-decoration: underline;
    }
    li {
      font-size: 1.25rem;
    }
  }
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
    max-height: calc(100% - 10rem);
    overflow-y: auto;
    border-bottom: 2.5px solid black;
    position: fixed;
    top: 0;
    width: 100%;
    background-color: white;
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
  .content {
    padding: 20px;
  }
</style>