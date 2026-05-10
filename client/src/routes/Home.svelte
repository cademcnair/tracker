<script lang="ts">
  import type { Day, Food, Props } from "../lib/types"
  import { find_today, NICE_MACROS, MACROS, find_totals, MACRO_SETTING, round, clone } from "../lib/utils"
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
  let today = $derived(find_today(db.days)) as Day
  let totals = $derived(find_totals(today.foods))

  function delete_today(index: number) {
    const food = today.foods[index]
    if (!confirm(`Do you really want to delete "${food[0].name}" from today?`)) return;
    today.foods.splice(index, 1)
    db = {...db}
  }
  
  let editing_food = $state(false)
  let food_to_edit: Food = $state({
    id: "-2",
    name: "No food",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturated_fat: 0,
    sodium: 0
  })
  let editing_food_amount = $state(1)
  let editing_food_index = $state(0)
  function edit_today(index: number) {
    food_to_edit = clone<Food>(today.foods[index][0])
    editing_food_amount = today.foods[index][1]
    editing_food = true
    editing_food_index = index
  }

  let search = $state(""), cal_prot = $state(false)
  function filter_foods(foods: Food[], s: string, m: boolean) {
    if (s.length == 0 && !cal_prot) return foods
    let key_words = s.split(" ");
    if (!m) {
      if (isNaN(Number(search))) {
        return foods.filter(f => key_words.every(k => f.name.toLowerCase().includes(k.toLowerCase())))
      } else {
        return [foods[Number(search)]]
      }
    } else {
      let num = (!isNaN(Number(s)) && s.length != 0) ? Number(s) : (db.settings.goal_calories - totals.calories.total)/(db.settings.goal_protein - totals.protein.total)
      console.log(num)
      return foods.filter(f => s.length == 0 || !isNaN(Number(s)) || key_words.every(k => f.name.toLowerCase().includes(k.toLowerCase()))).filter(f => round(f.calories/f.protein, 2) <= num)
    }
  }

  let main = $state("none")

  let creating_food = $state(false)
  let new_food: Food = $state({
    id: "",
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturated_fat: 0,
    sodium: 0
  })
  let transform_food = $state(false)
  let transform_text = $state("")
  let transform_text_multp = $derived(
    transform_text.length == 0 ? 1 : 
    !isNaN(Number(transform_text.replace("lbs", ""))) ? Number(transform_text.replace("lbs", "")) :
    !isNaN(Number(transform_text.replace("g", ""))) ? Number(round(453.59 / Number(transform_text.replace("g", "")), 2)) :
    !isNaN(Number(transform_text.replace("oz", ""))) ? Number(round(16 / Number(transform_text.replace("oz", "")), 2)) : 1
  )
  function edit_food(id: string) {
    creating_food = true; editing_food = true;
    new_food = clone<Food>(db.foods.find(f => f.id == id) as Food)
    transform_food = false
    transform_text = ""
  }
  function delete_food(id: string) {
    if (!confirm(`Do you really want to delete "${db.foods.find(f => f.id == id)?.name}" from the database?`)) return; 
    db.foods = db.foods.filter(f => f.id != id)
    db = {...db}
  }

  let net_food_report: [string, number, number, number, number, number, number, number, string, number][] = $state([])
  $effect(() => {
    let helper: any = {}
    today.foods.forEach(f => {
      if (helper[f[0].id] === undefined) helper[f[0].id] = [f[0].name, 0, 0, 0, 0, 0, 0, 0, f[0].id, 0]
      helper[f[0].id][1] += f[1]
      helper[f[0].id][2] += f[0].calories * f[1]
      helper[f[0].id][3] += f[0].protein * f[1]
      helper[f[0].id][4] += f[0].carbs * f[1]
      helper[f[0].id][5] += f[0].fat * f[1]
      helper[f[0].id][6] += f[0].saturated_fat * f[1]
      helper[f[0].id][7] += f[0].sodium * f[1]
      ++helper[f[0].id][9];
    })
    console.log(helper)
    net_food_report = Object.values(helper)
  })
</script>

{#if editing_food || creating_food}
  <div class="container">
    <div class="editor">
      <p><b>{creating_food && !editing_food ? "Creating new food" : `Editing ${creating_food ? "database food" : "food from today"}`} named "{creating_food ? new_food.name : food_to_edit.name}"</b></p>
      {#each (creating_food ? MACROS : db.settings.cares_about) as macro}
        {#if editing_food && !creating_food}
          {NICE_MACROS[macro][0]}: <input type="number" bind:value={food_to_edit[macro]} disabled={Number(food_to_edit.id) > -1}> * {editing_food_amount} = <span>{round(food_to_edit[macro] * editing_food_amount, 2)} {NICE_MACROS[macro][2]}</span>
        {:else}
          {NICE_MACROS[macro][0]}: <input type="number" bind:value={new_food[macro]}> {NICE_MACROS[macro][2]}
          {#if transform_food}
            * {transform_text_multp} = <span>{round(new_food[macro] * transform_text_multp, 2)} {NICE_MACROS[macro][2]}</span>
          {/if}
        {/if}
        <br>
      {/each}
      {#if editing_food && !creating_food}
        <b>Amount: </b> <input type="number" bind:value={editing_food_amount}>
      {:else}
        <b>Food name: </b> <input type="text" bind:value={new_food.name}>
      {/if}
      {#if creating_food && !editing_food}
        <br><br><label style:cursor="pointer">
          <input type="checkbox" bind:checked={transform_food}>Transform amounts based off of serving size?<br>
          <i>Default unit: lbs; can specific units: g, oz</i>
        </label>
        {#if transform_food}
          <br><input type="text" placeholder="Serving size" bind:value={transform_text}>
        {/if}
      {/if}
      <br><br><button onclick={() => {
        if (editing_food && !creating_food) {
          today.foods[editing_food_index] = [food_to_edit, editing_food_amount]
        } else if (creating_food && !editing_food) {
          if (transform_food) {
            new_food.calories = Number(round(new_food.calories * transform_text_multp, 2))
            new_food.protein = Number(round(new_food.protein * transform_text_multp, 2))
            new_food.carbs = Number(round(new_food.carbs * transform_text_multp, 2))
            new_food.fat = Number(round(new_food.fat * transform_text_multp, 2))
            new_food.saturated_fat = Number(round(new_food.saturated_fat * transform_text_multp, 2))
            new_food.sodium = Number(round(new_food.sodium * transform_text_multp, 2))
          }
          db.foods.push(new_food)
        } else {
          let r = db.foods.filter(i => i.id == new_food.id)[0]
          r.name = new_food.name
          r.calories = new_food.calories
          r.protein = new_food.protein
          r.carbs = new_food.carbs
          r.fat = new_food.fat
          r.saturated_fat = new_food.saturated_fat
          r.sodium = new_food.sodium
        }
        editing_food = false
        creating_food = false
        db = {...db}
      }} disabled={creating_food && new_food.name.length == 0}>Save</button>
      <button onclick={() => {editing_food = false; creating_food = false}}>Cancel</button>
    </div>
  </div>
{/if}

<div class="macros">
  {#each db.settings.cares_about as macro}
    {@const add_func = () => {
      let new_food = {
        name: `Simple add (${macro})`,
        id: "-1",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturated_fat: 0,
        sodium: 0
      }
      const e = document.querySelector(`input[data-macro="${macro}"]`) as HTMLInputElement
      new_food[macro] = Number(e.value); e.value = ""
      today.foods.push([new_food, 1])
      db = {...db}
    }}
    {@const report = totals[macro]}
    {@const goal = db.settings[MACRO_SETTING[macro]]}
    <details class="macro single-macro" ontoggle = {e => {
      if (main == "none") {main = macro; setTimeout(() => main = "none", 100)}
      document.querySelectorAll<HTMLDetailsElement>(".single-macro").forEach(d => d.open = e.currentTarget.open)
      if (main == macro) {
        e.currentTarget.scrollIntoView({block: "center"})
      }
    }}>
      <summary><b>{NICE_MACROS[macro][1]}: {goal} - {round(report.total, 2)} = <span>{round(goal - report.total, 2)}{NICE_MACROS[macro][2]} left</span> ({round((goal == 0 ? 1 : report.total/goal)*100, 1)}%)</b></summary>
      <ul>
        {#each report.foods as food}
          <li>
            ({food[1]}{NICE_MACROS[macro][2]}) "{food[0]}" * {today.foods[food[2]][1]}
            <button onclick={() => edit_today(food[2])}>edit</button>
            <button onclick={() => delete_today(food[2])}>delete</button>
          </li>
        {/each}
      </ul>
      <input placeholder="Simple add" type="number" data-macro={macro} onkeyup={e => {if (e.key == "Enter") add_func()}}>
      <button onclick={add_func}>add</button>
    </details>
  {/each}
  <details class="macro">
    <summary><b>Net food reports</b></summary>
    <ul>
      {#each net_food_report as food}
        <li><span>{food[0]} * {round(food[1], 2)}</span> ({round(food[2], 2)}kcal, {round(food[3], 2)}g PROTEIN, {round(food[4], 2)}g CARBS, {round(food[5], 2)}g FAT, {round(food[6], 2)}g SATURATED FAT, {round(food[7], 2)}mg SODIUM) 
          {#if food[8] != "-1" && food[9] != 1}
            <button onclick={() => {
              let id = food[8]
              let indexes: number[] = []
              today.foods.forEach((i, d) => {
                if (i[0].id == id) {
                  indexes.push(d)
                }
              })
              indexes.reverse()
              indexes.forEach(i => {
                today.foods.splice(i, 1)
              })
              today.foods.push([{
                name: food[0], id,
                calories: round(food[2] / food[1], 2),
                protein: round(food[3] / food[1], 2),
                carbs: round(food[4] / food[1], 2),
                fat: round(food[5] / food[1], 2),
                saturated_fat: round(food[6] / food[1], 2),
                sodium: round(food[7] / food[1], 2)
              }, round(food[1], 2)])
              db = {...db}
            }}>Compress</button>
          {/if}
        </li>
      {/each}
    </ul>
    <button onclick={() => {
      let totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturated_fat: 0,
        sodium: 0
      }
      let simple_add_indexes: number[] = []
      today.foods.forEach((i, d) => {
        if (i[0].id == "-1") {
          totals.calories += i[0].calories * i[1]
          totals.protein += i[0].protein * i[1]
          totals.carbs += i[0].carbs * i[1]
          totals.fat += i[0].fat * i[1]
          totals.saturated_fat += i[0].saturated_fat * i[1]
          totals.sodium += i[0].sodium * i[1]
          simple_add_indexes.push(d)
        }
      })
      simple_add_indexes.reverse()
      simple_add_indexes.forEach(i => {
        today.foods.splice(i, 1)
      })
      today.foods.push([{
        name: "Simple add (compressed)",
        id: "-1", ...totals
      }, 1])
      db = {...db}
    }}>Compress today's "Simple add"s</button>
  </details>
</div>

<div class="foods">
  {#key totals}
    <p style:transform={"translateZ(0)"}>
      Remaining: {round((db.settings.goal_calories - totals.calories.total)/(db.settings.goal_protein - totals.protein.total), 5)}kcal/g
    </p>
    <p>
      {#if totals.calories.total > 0}
        Consumed: {round(totals.calories.total / totals.protein.total, 2)}kcal/g
      {:else}
        Consumed: (nothing :/)
      {/if}
    </p>
    <p>
      Goal: {round(db.settings.goal_calories / db.settings.goal_protein, 2)}kcal/g
    </p>
  {/key}
  <button onclick={() => {
    creating_food = true
    transform_food = false
    transform_text = ""
    let max_id = Math.max(...db.foods.map(i => Number(i.id)))
    new_food = {id: String(max_id + 1), name: "", calories: 0, protein: 0, carbs: 0, fat: 0, saturated_fat: 0, sodium: 0}
  }}>Add food (open window)</button><br><br>
  <input type="text" placeholder="Search" bind:value={search}>
  <label>
    <input type="checkbox" bind:checked={cal_prot}>kcal/g mode
  </label>
  {#if search.length > 0 || cal_prot}
    <br><b>{filter_foods(db.foods, search, cal_prot).length} result{filter_foods(db.foods, search, cal_prot).length == 1 ? "" : "s"}</b>
  {/if}
  <ol>
    {#each filter_foods(db.foods, search, cal_prot) as food}
      <li value={food.id}>
        {food.name}{#each db.settings.cares_about as macro, d}, {food[macro]}{NICE_MACROS[macro][2]}{/each}
        <button>{round(food.calories/food.protein, 2)}kcal/g</button>
        <button onclick={()=>edit_food(food.id)}>edit</button>
        <button onclick={()=>delete_food(food.id)}>delete</button>
      </li>
    {/each}
  </ol>
</div>

<style scoped lang="scss">
  .container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    .editor {
      background-color: white;
      padding: 1rem;
    }
  }
  button {
    cursor: pointer;
  }
  .macros {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: masonry;
  }
  @media (max-width: 600px) {
    .macros {
      grid-template-columns: 1fr;
    }
  }
  @media (min-width: 1500px) {
    .macros {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
  .macro {
    border: 2.5px solid black;
    padding: 1rem;
    display: block;
    overflow-x: auto;
    text-wrap: nowrap;
  }
  .foods {
    margin-top: 2rem;
    border: 2.5px solid black;
    padding: 1rem;
    overflow-x: auto;
    text-wrap: nowrap;
    p:first-child {
      margin-top: 0;
    }
    p {
      font-size: 1.25rem;
    }
  }
</style>