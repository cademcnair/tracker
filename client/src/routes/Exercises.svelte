<script lang="ts">
  import Exercise from "../lib/Exercise.svelte";
  import type { Props, Exercise as ExerciseType } from "../lib/types"
  import { clone, EDIT_COMPLEX_PROACTIVE, EDIT_PROACTIVE, str } from "../lib/utils";
    import WorkoutTemplate from "../lib/WorkoutTemplate.svelte";
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
  
  let using_exercises = $state($state.snapshot(db.exercises))
  let using_workouts = $state($state.snapshot(db.workouts))
  // svelte-ignore state_referenced_locally
  let q: ExerciseType[][] = [clone($state.snapshot(using_exercises))]
  let pending_save = $state(false)
  let timeout: any = null;

  $effect(() => {
    if (str(using_exercises) != str(q[0])) {
      pending_save = true
      let local_save = clone($state.snapshot(using_exercises))
      q.push(local_save)
      try {clearTimeout(timeout)} catch {}
      timeout = setTimeout(() => {
        if (str(q[q.length - 1]) == str(local_save)) save(local_save)
      }, 2000)
    }
  })
  
  function save(local_save: ExerciseType[]) {
    try {clearTimeout(timeout)} catch {}
    db.exercises = local_save;
    db = { ...db }
    q = [local_save]
    pending_save = false
  }

  let new_exercise: ExerciseType = $state({
    // svelte-ignore state_referenced_locally
    id: using_exercises.length == 0 ? "0" : String($state.snapshot(using_exercises).reduce((a, b) => Math.max(a, Number(b.id)), 0) + 1),
    name: "",
    notes: "",
    sets: [
      {reps: 8, weight: 150},
      {reps: 8, weight: 150},
      {reps: 8, weight: 150},
      {reps: 8, weight: 150}
    ],
    rest: 90,
    leftright: false,
    repsonly: false,
    normalreps: 10,
    sincelastimprovement: 0
  })

  function make_new_exercise() {
    using_exercises = [...using_exercises, clone(new_exercise)]
    new_exercise.id = String(Number(new_exercise.id) + 1)
    new_exercise.name = ""
  }
</script>

{#if pending_save}
  <div class="saving"><span>Saving...</span><br><button onclick={() => save(using_exercises)}>save now</button></div>
{/if}

<h2>Workouts</h2>
<WorkoutTemplate workout={{
  name: "New Workout",
  notes: "",
  color: "#f00",
  exercises: using_exercises.map(i => i.id),
}} view_mode={EDIT_PROACTIVE} all_exercises={using_exercises}/>

<h2>Exercises</h2>
<div class="exercises">
  {#if using_exercises.length == 0}
    <p style:padding-left="2rem"><i>no exercises found ._.</i></p>
  {/if}
  {#each using_exercises as exercise, d (exercise.id)}
    <div class="exercise">
      <Exercise exercise={exercise} view_mode={EDIT_COMPLEX_PROACTIVE} save_changes={(c) => {using_exercises[d] = c}}/>
      <button onclick={() => {
        if (confirm(`Are you sure you want to delete the exercise "${exercise.name}" / ID = ${exercise.id}?`)) {
          using_exercises.splice(d, 1)
          db.workouts = db.workouts.map(i => {
            i.exercises = i.exercises.filter(ii => ii != exercise.id)
            return i
          })
          save(using_exercises)
        }
        if (using_exercises.length == 0) new_exercise.id = "0"
      }} style:font-size="1.25rem" style:cursor="pointer">delete exercise</button>
      <span style:font-size="1.375rem">Exercise ID: {exercise.id}</span>
    </div>
  {/each}
</div>
<h3 style:margin-bottom="0">Create a new exercise</h3>
<input type="text" placeholder="Exercise name" bind:value={new_exercise.name} onkeydown={(e) => {if(e.key == "Enter") make_new_exercise()}}>
<button disabled={new_exercise.name.length == 0} onclick={make_new_exercise}>create</button>

<style lang="scss">
  .exercises {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, 354px);
  }
  .saving {
    position: fixed;
    top: 1rem;
    right: 1rem;
    border: 5px solid black;
    padding: 1rem 3rem;
    background-color: white;
    font-size: 2rem;
    text-align: center;
    z-index: 30;
    animation: fade 2s infinite;
    button {
      background-color: lightgray;
      border-radius: .5rem;
      font-size: 1.25rem;
      border: none;
      cursor: pointer;
    }
  }
  @keyframes fade {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style>