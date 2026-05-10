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
  
  function edit_food(id: string) {
    
  }
  function delete_food(id: string) {
    
  }
</script>

{#if editing_food}
  <div class="container">
    <div class="editor">
      <p><b>Editing food "{food_to_edit.name}"</b></p>
      {#each db.settings.cares_about as macro}
        {NICE_MACROS[macro][0]}: <input type="number" bind:value={food_to_edit[macro]} disabled={Number(food_to_edit.id) > -1}> * {editing_food_amount} = {round(food_to_edit[macro] * editing_food_amount, 2)} {NICE_MACROS[macro][2]}<br>
      {/each}
      <b>Amount: </b> <input type="number" bind:value={editing_food_amount}><br><br>
      <button onclick={() => {
        today.foods[editing_food_index] = [food_to_edit, editing_food_amount]
        editing_food = false
        db = {...db}
      }}>Save</button>
      <button onclick={() => editing_food = false}>Cancel</button>
    </div>
  </div>
{/if}

<div class="macros">
  {#each db.settings.cares_about as macro}
    {@const report = totals[macro]}
    {@const goal = db.settings[MACRO_SETTING[macro]]}
    <details class="macro" ontoggle = {e => document.querySelectorAll<HTMLDetailsElement>(".macro").forEach(d => d.open = e.currentTarget.open)}>
      <summary><b>{NICE_MACROS[macro][1]}: {goal} - {round(report.total, 2)} = {round(goal - report.total, 2)}{NICE_MACROS[macro][2]} left ({round((goal == 0 ? 1 : report.total/goal)*100, 1)}%)</b></summary>
      <ul>
        {#each report.foods as food}
          <li>
            ({food[1]}{NICE_MACROS[macro][2]}) "{food[0]}" * {today.foods[food[2]][1]}
            <button onclick={() => edit_today(food[2])}>edit</button>
            <button onclick={() => delete_today(food[2])}>delete</button>
          </li>
        {/each}
      </ul>
    </details>
  {/each}
</div>

<div class="foods">
  <p>
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
  <ol>
    {#each db.foods as food}
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