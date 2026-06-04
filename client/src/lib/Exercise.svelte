<script lang="ts">
  import ExerciseSets from "./ExerciseSets.svelte";
  import type { Exercise } from "./types";
  import { READONLY, EDIT_PASSIVE, EDIT_PROACTIVE, EDIT_COMPLEX_PASSIVE, EDIT_COMPLEX_PROACTIVE, clone } from "./utils";

  let {exercise, view_mode, save_changes}: {
    exercise: Exercise,
    view_mode: typeof READONLY | typeof EDIT_PROACTIVE | typeof EDIT_PASSIVE | typeof EDIT_COMPLEX_PROACTIVE | typeof EDIT_COMPLEX_PASSIVE,
    save_changes?: (set: Exercise) => Promise<void> | void
  } = $props();

  // svelte-ignore state_referenced_locally
  let first_exercise = $state.snapshot(exercise)
  // svelte-ignore state_referenced_locally
  let using_exercise = $state($state.snapshot(exercise))
  let using_more_options = $state(false);

  $effect(() => {
    if (view_mode == EDIT_PROACTIVE || view_mode == EDIT_COMPLEX_PROACTIVE) {
      if(save_changes && JSON.stringify(first_exercise) != JSON.stringify(using_exercise)) {
        first_exercise = clone(using_exercise)
        save_changes(using_exercise)
      }
    }
  })
</script>

<div class="main">
  <input type="text" class="name" disabled={view_mode == READONLY} bind:value={using_exercise.name}><br>
  {#if !using_more_options}
    <textarea bind:value={using_exercise.notes} rows="3" disabled={view_mode == READONLY}></textarea><br>
    <p><ExerciseSets exercise_sets={using_exercise.sets} view_mode={
      view_mode == READONLY ? READONLY : ((view_mode == EDIT_PASSIVE || view_mode == EDIT_PROACTIVE) ? EDIT_PROACTIVE : EDIT_COMPLEX_PROACTIVE)
    } leftright={using_exercise.leftright} repsonly={using_exercise.repsonly} save_changes={(c) => {using_exercise.sets = c}} /></p>
    <p class="last">
      Days since last improvement: <b>{using_exercise.sincelastimprovement}</b>
      <button disabled={view_mode == READONLY} onclick={() => ++using_exercise.sincelastimprovement}>+</button>
      <button disabled={view_mode == READONLY} onclick={() => --using_exercise.sincelastimprovement}>-</button>
    </p>
  {/if}
  {#if view_mode == EDIT_COMPLEX_PASSIVE || view_mode == EDIT_COMPLEX_PROACTIVE || view_mode == READONLY}
    <details ontoggle={() => using_more_options = !using_more_options}>
      <summary>more options</summary>
      <div class="content">
        <label>
          <input type="checkbox" bind:checked={using_exercise.repsonly} disabled={view_mode == READONLY}> Exercise is for reps only?
        </label><br>
        <label>
          <input type="checkbox" bind:checked={using_exercise.leftright} disabled={view_mode == READONLY}> Exercise is a left-right movement?
        </label><br>
        <label>
          Rest between sets (seconds): <input type="number" bind:value={using_exercise.rest} disabled={view_mode == READONLY}>
        </label><br>
        <label>
          Normal reps (for config): <input type="number" bind:value={using_exercise.normalreps} disabled={view_mode == READONLY}>
        </label>
      </div>
    </details>
  {/if}
  {#if view_mode == EDIT_COMPLEX_PASSIVE || view_mode == EDIT_PASSIVE}
    <div class="full">
      <button class="save" onclick={() => {if(save_changes)save_changes(using_exercise)}}>save changes</button>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  .full {
    width: 100%;
    text-align: center;
  }
  .save {
    margin-top: 1rem;
    font-size: 1.25rem;
    cursor: pointer;
  }
  label {
    cursor: pointer;
  }
  details, summary {
    margin-top: -0.5rem;
  }
  details input {
    padding: 0;
    font-size: 1.125rem !important;
    field-sizing: content;
  }
  input {
    font-size: 1.25rem;
  }
  button:not(.save) {
    font-size: 1.25rem;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
  .last {
    font-size: 1.125rem;
  }
  b {
    font-size: 1.375rem;
    font-style: italic;
    padding: .1rem .5rem;
    background-color: lightgray;
    border-radius: .5rem;
  }
  details {
    margin-top: .5rem;
  }
  summary {
    font-size: 1.25rem;
    cursor: pointer;
  }
  label {
    font-size: 1.25rem;
  }
  .main {
    display: inline-block;
    border: 5px solid black;
    padding: .5rem;
    background-color: white;
  }
  .name {
    width: 325px;
    font-size: 1.5rem;
    font-style: italic;
    font-weight: 500;
  }
  textarea {
    width: 325px;
    font-size: 1.5rem;
    resize: none;
  }
  p {
    margin: 0;
  }
  p *:not(div) {
    font-size: 1.5rem;
  }
</style>