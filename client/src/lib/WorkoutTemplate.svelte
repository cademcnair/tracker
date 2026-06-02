<script lang="ts">
  import Exercise from "./Exercise.svelte";
  import ExerciseSets from "./ExerciseSets.svelte";
  import type { Exercise as ExerciseType, Workout } from "./types";
  import { READONLY, EDIT_PASSIVE, EDIT_PROACTIVE, EDIT_COMPLEX_PASSIVE, EDIT_COMPLEX_PROACTIVE, clone } from "./utils";

  let {workout, all_exercises, view_mode, save_changes, save_changes_exercise}: {
    workout: Workout<false>,
    all_exercises: ExerciseType[],
    view_mode: typeof READONLY | typeof EDIT_PROACTIVE | typeof EDIT_PASSIVE | typeof EDIT_COMPLEX_PROACTIVE | typeof EDIT_COMPLEX_PASSIVE,
    save_changes?: (w: Workout<false>) => Promise<void> | void,
    save_changes_exercise?: (id: string, e: ExerciseType) => (Promise<void> | void)
  } = $props();

  // svelte-ignore state_referenced_locally
  let using_workout = $state($state.snapshot(workout))
  const VIEW_ONLY = 0, ADDING = 1, MOVING = 2, DELETING = 3;
  let exercise_mode: 0 | 1 | 2 | 3 = $state(0);
  let exercise_options = $derived(all_exercises.filter(i => !using_workout.exercises.includes(i.id)).map(i => [`${i.name} (ID=${i.id})`, i.id]))
  let adding_exercise = $state("");
  let q: [string, ExerciseType][] = $state([]);

  $effect(() => {
    if (view_mode == EDIT_PROACTIVE || view_mode == EDIT_COMPLEX_PROACTIVE) {
      if(save_changes) {
        save_changes(using_workout)
      }
    }
  })

  $effect(() => {
    let found = exercise_options.filter(i => i[0] == adding_exercise)
    if (found.length > 0) {
      using_workout.exercises = [...using_workout.exercises, found[0][1]]
      adding_exercise = ""
    }
  })
</script>

<div class="main" style:background-color="color-mix(in srgb, {using_workout.color} 30%, white)">
  <input type="text" class="name" disabled={view_mode == READONLY} bind:value={using_workout.name}><br>
  <textarea bind:value={using_workout.notes} rows="3" disabled={view_mode == READONLY}></textarea><br>
  {#if view_mode == EDIT_COMPLEX_PASSIVE || view_mode == EDIT_COMPLEX_PROACTIVE}
    <input type="color" style:width="100%" bind:value={using_workout.color}><br>
  {/if}
  {#if using_workout.exercises.length > 0}
    {#each using_workout.exercises as exercise, d (exercise)}
      {@const current_exercise = $state.snapshot(all_exercises).find(e => e.id == exercise) as ExerciseType}
      <div class="exercise-display" class:normal={exercise_mode == VIEW_ONLY || exercise_mode == ADDING}>
        <div class="exercise">
          <Exercise 
            exercise={current_exercise} 
            view_mode={
              view_mode == READONLY ? READONLY : 
              ((view_mode == EDIT_PASSIVE || view_mode == EDIT_PROACTIVE) ? 
              EDIT_PROACTIVE : EDIT_COMPLEX_PROACTIVE)
            } 
            save_changes={(c) => {
              if (view_mode == EDIT_PROACTIVE || view_mode == EDIT_COMPLEX_PROACTIVE) {
                if(save_changes_exercise) {
                  save_changes_exercise(exercise, c)
                }
              } else q.push([exercise, c])
            }}
          />
        </div>
        <div class="option">
          {#if exercise_mode == DELETING}
            <button class="mode" onclick={() => {
              if (confirm(`Are you sure you want to delete the exercise "${current_exercise.name}" from this workout?`)) {
                using_workout.exercises.splice(d, 1);
                using_workout = {...using_workout}
              }
            }}>delete</button>
          {:else if exercise_mode == MOVING}
            {#if d != 0}
              <button class="mode" onclick={()=>{
                let temp = exercise;
                using_workout.exercises[d] = using_workout.exercises[d - 1];
                using_workout.exercises[d - 1] = temp
              }}>←</button>
            {/if}
            {#if d != using_workout.exercises.length - 1}
              <button class="mode" onclick={()=>{
                let temp = exercise;
                using_workout.exercises[d] = using_workout.exercises[d + 1];
                using_workout.exercises[d + 1] = temp
              }}>→</button>
            {/if}
            {#if using_workout.exercises.length == 1}
              <button class="mode" disabled>nowhere to move ._.</button>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
  {:else}
    <h3><i>(no exercises found ._.)</i></h3>
  {/if}
  {#if exercise_mode == ADDING}
    <h3 style="margin-top: 1rem; font-size: 1.5rem;">Find an exercise</h3>
    {#if exercise_options.length > 0}
      <input style="width:100%; font-size: 1.25rem;" type="text" list="exercises" bind:value={adding_exercise}>
      <datalist id="exercises">
        {#each exercise_options as option}
          <option value={option[0]} data-id={option[1]}></option>
        {/each}
      </datalist><br>
    {:else}
      <h3>no exercises to add :(</h3>
    {/if}
  {/if}
  {#if view_mode == EDIT_COMPLEX_PASSIVE || view_mode == EDIT_COMPLEX_PROACTIVE}
    <br><button class="top" onclick={() => exercise_mode = ADDING}>+</button><br>
    <button class="side" onclick={() => exercise_mode = DELETING}>-</button>
    <button class="side" onclick={() => exercise_mode = MOVING}>=</button>
    {#if exercise_mode != VIEW_ONLY}
      <button class="top" onclick={() => exercise_mode = VIEW_ONLY}>exit</button>
    {/if}
  {/if}
</div>

<style scoped lang="scss">
  .exercise-display:not(:first-of-type) {
    margin-top: 0.5rem;
  }
  .exercise-display:not(.normal) {
    display: grid;
    grid-template-columns: calc(354px * .85) calc(354px * .15);
    .exercise :global(.main) {
      transform: scaleX(0.85) translateX(-30.55px);
    }
    .option {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 0.5rem;
    }
    .option button {
      writing-mode: vertical-lr;
      font-size: 1.25rem;
      cursor: pointer;
      background-color: white;
      color: black;
      border: none;
      border-radius: 0.5rem;
    }
  }
  button:not(.mode) {
    width: 100%;
    font-size: 1.5rem;
    font-weight: 500;
    background-color: white;
    border-radius: .5rem;
    border: none;
    cursor: pointer;
  }
  .top {
    margin-bottom: 0.25rem;
    margin-top: 0.25rem;
  }
  .side {
    width: calc(50% - .125rem) !important;
  }
  h3 {
    background-color: white;
    margin: 0;
    text-align: center;
    font-size: 1.25rem;
    font-style: italic;
    border-radius: .5rem;
  }
  .main {
    display: inline-block;
    border: 5px solid black;
    padding: .5rem;
  }
  .name {
    width: 326px;
    font-size: 1.5rem;
    font-style: italic;
    font-weight: 500;
  }
  textarea {
    width: 326px;
    font-size: 1.5rem;
    resize: none;
  }
</style>