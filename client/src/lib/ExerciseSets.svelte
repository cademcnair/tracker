<script lang="ts">
  import type { ExerciseSet } from "./types";
  import { READONLY, EDIT_PASSIVE, EDIT_PROACTIVE, clone } from "./utils";
  import EDIT from "./edit.png";
  import OPEN from "./open.png";
  import CLOSE from "./close.png";
  import UP from "./up.png";
  import DOWN from "./down.png";
  

  let { exercise_sets, leftright, view_mode, save_changes }: {
    exercise_sets: ExerciseSet[],
    leftright: boolean;
    view_mode: typeof READONLY | typeof EDIT_PROACTIVE | typeof EDIT_PASSIVE,
    save_changes?: (set: ExerciseSet[]) => Promise<void> | void
  } = $props();

  // svelte-ignore state_referenced_locally
  let using_exercise_sets = $state($state.snapshot(exercise_sets))

  let processed_set = $derived((using_exercise_sets as any).reduce((a: [ExerciseSet, number][], b: ExerciseSet) => {
    let last = a[a.length - 1]
    if (last[0].reps == b.reps && last[0].weight == b.weight) {
      ++last[1]; return a
    } else return [...a, [b, 1]]
  }, [[using_exercise_sets[0], 0]])) as [ExerciseSet, number][]

  let weight_varies = $derived(processed_set.filter((i, d, a) => i[0].weight != a[0][0].weight).length > 0)
  // svelte-ignore state_referenced_locally
  let editing = $state(false), editing_different_weights = $state(weight_varies), editing_view_basic = $state(true)
  let total_reps = $derived(using_exercise_sets.reduce((a, b) => a + b.reps, 0))
  function plus() {
    console.log(processed_set)
    let last = processed_set[processed_set.length - 1][0]; ++last.reps
    using_exercise_sets = using_exercise_sets
  }
  function minus() {
    let values = processed_set[0][0]; 
    let first = using_exercise_sets.reduce((a, b) => b.reps == values.reps && b.weight == values.weight ? b : a, values)
    --first.reps; verify_integrity()
  }
  function verify_integrity() {
    using_exercise_sets = using_exercise_sets.filter(i => i.reps > 0 && i.weight > 0)
  }

  $effect(() => {
    if (weight_varies == true) editing_different_weights = true
    if (view_mode == EDIT_PROACTIVE) {
      if (save_changes) save_changes(using_exercise_sets)
    }
  })
</script>

<div class:anchor={true} class:editing={editing} class:editing-view-basic={editing_view_basic}>
  {#if editing_view_basic}
    {#if !weight_varies}
      {@const weight = processed_set[0][0].weight}
      {weight}{ weight != 1 ? "lbs" : "lb"}, 
    {/if}
    {#each processed_set as set, d}
      {set[0].reps}/{set[1]}{leftright ? "/LR" : ""}
      {#if weight_varies}
        ({set[0].weight}{ set[0].weight != 1 ? "lbs" : "lb"})
      {/if}
      {#if d != processed_set.length - 1}
        ->&nbsp;
      {/if}
    {/each}
    {#if view_mode != READONLY}
      {#if using_exercise_sets.length != 0 && total_reps > 1}
        <button onclick={plus} class:tiny={true}>+</button>
        <button onclick={minus} class:tiny={true}>-</button>
      {/if}
      <button onclick={()=>{
        editing = !editing
        editing_view_basic = true
      }} class:tiny={true}><img src={EDIT} alt="edit"></button>
      {#if view_mode == EDIT_PASSIVE}
        <button onclick={() => {
          if (save_changes) save_changes(using_exercise_sets)
        }} style:font-size="1.25rem">save</button>
      {/if}
    {/if}
  {/if}
  {#if editing}
    <div class="editor" class:editing-view-basic={editing_view_basic}>
      <button class:tiny={true} onclick={() => editing_view_basic = !editing_view_basic}><img src={editing_view_basic ? OPEN : CLOSE} alt="open"></button><br><br>
      {#if !weight_varies || editing_different_weights}
        <label style:cursor="pointer"><input type="checkbox" bind:checked={editing_different_weights} onchange={(e) => {
          if (!e.currentTarget.checked) {
            using_exercise_sets = using_exercise_sets.map(i => ({reps: i.reps, weight: using_exercise_sets[0].weight}))
          }
        }}> Sets use a different weight</label>
      {/if}
      {#if !editing_different_weights}
        <br><br>exercise weight: <input type="number" value={using_exercise_sets[0].weight} onchange={(e) => using_exercise_sets.forEach(i => i.weight = Number(e.currentTarget.value))}>
      {/if}
      <ol>
        {#each using_exercise_sets as set, d}
          <li>
            reps: <input type="number" value={set.reps} onchange={(e) => {
              using_exercise_sets[d].reps = Number(e.currentTarget.value)
            }}>
            {#if editing_different_weights}
              weight: <input type="number" value={set.weight} onchange={(e) => {
                using_exercise_sets[d].weight = Number(e.currentTarget.value)
              }}>
            {/if}
            <button onclick={() => using_exercise_sets.splice(d, 1)} style:display="inline">del</button>
            {#if d != 0}
              <button onclick={() => {
                let temp = using_exercise_sets[d]; 
                using_exercise_sets[d] = using_exercise_sets[d - 1]; 
                using_exercise_sets[d - 1] = temp
              }} class:move-tiny={true}><img src={UP} alt="move up"></button>
            {/if}
            {#if d != using_exercise_sets.length - 1}
              <button onclick={() => {
                let temp = using_exercise_sets[d]; 
                using_exercise_sets[d] = using_exercise_sets[d + 1]; 
                using_exercise_sets[d + 1] = temp
              }} class:move-tiny={true}><img src={DOWN} alt="move down"></button>
            {/if}
          </li>
        {/each}
      </ol>
      <button onclick={() => {
        using_exercise_sets.push(clone(using_exercise_sets[0]))
      }}>add new set</button><br><br>
      <button onclick={()=>{
        editing = false
        editing_view_basic = true
      }}>close</button>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  input {
    field-sizing: content;
  }
  .move-tiny {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    img {
      width: .75rem;
      height: .75rem;
    }
  }
  .editor {
    background-color: white;
    padding: 1rem;
    border: .25rem solid lightgray;
    border-radius: .5rem;
    position: absolute;
    top: 0;
    left: 0;
    width: min(calc(100vw - 10rem), 20rem);
    &:not(.editing-view-basic) {
      position: static !important;
    }
  }
  :global(body) {
    anchor-name: --body;
  }
  .anchor {
    display: inline-block;
  }
  .editing {
    position: relative;
    height: 1.25rem;
    width: fit-content;
    &:not(.editing-view-basic) {
      position-anchor: --body;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 20;
      background: rgba(0, 0, 0, 0.5);
      width: 100%;
      height: 100vh;
      display: flex !important;
      justify-content: center;
      align-items: center;
    }
  }
  button {
    cursor: pointer;
  }
  button.tiny {
    font-size: 1.25rem;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    img {
      width: .75rem;
      height: .75rem;
    }
  }
</style>