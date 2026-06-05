<script lang="ts">
  import Exercise from "../lib/Exercise.svelte";
  import type { Props, Exercise as ExerciseType, Workout as WorkoutType } from "../lib/types"
  import { clone, EDIT_COMPLEX_PROACTIVE, EDIT_PROACTIVE, str } from "../lib/utils";
  import WorkoutTemplate from "../lib/WorkoutTemplate.svelte";
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
  
  let using_exercises = $state($state.snapshot(db.exercises))
  let using_workouts = $state($state.snapshot(db.workouts))
  // svelte-ignore state_referenced_locally
  let q: [ExerciseType[], WorkoutType<false>[]][] = [[clone($state.snapshot(using_exercises)), clone($state.snapshot(using_workouts))]]
  let pending_save = $state(false)
  let timeout: any = null;

  $effect(() => {
    if (str(using_exercises) != str(q[0])) {
      let local_save: [ExerciseType[], WorkoutType<false>[]] = [clone($state.snapshot(using_exercises)), clone($state.snapshot(using_workouts))]
      if (str(q[q.length - 1]) != str(local_save)) {
        pending_save = true
        q.push(local_save)
        try {clearTimeout(timeout)} catch {}
        timeout = setTimeout(() => {
          if (str(q[q.length - 1]) == str(local_save)) save(local_save)
        }, 2000)
      }
    }
  })
  
  function save(local_save: [ExerciseType[], WorkoutType<false>[]]) {
    console.log(str(q), q.length)
    try {clearTimeout(timeout)} catch {}
    db.exercises = local_save[0];
    db.workouts = local_save[1];
    db = { ...db }
    q = [local_save]
    pending_save = false
  }

  let new_exercise: ExerciseType = $state({
    // svelte-ignore state_referenced_locally
    id: using_exercises.length == 0 ? "0" : String($state.snapshot(using_exercises).reduce((a, b) => Math.max(a, Number(b.id)), 0) + 1),
    // id: "0",
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

  let new_workout: WorkoutType<false> = $state({
    name: "",
    exercises: [],
    notes: "",
    color: "#000000"
  })

  function make_new_exercise() {
    using_exercises = [...using_exercises, clone(new_exercise)]
    new_exercise.id = String(Number(new_exercise.id) + 1)
    new_exercise.name = ""
  }

  function make_new_workout() {
    using_workouts = [...using_workouts, clone(new_workout)]
    new_workout.name = ""
  }

  // svelte-ignore state_referenced_locally
  let change_exercises: number[] = $state($state.snapshot(using_exercises).map(i => 0))
  // svelte-ignore state_referenced_locally
  let change_workout_exercises: number[] = $state($state.snapshot(using_workouts).map(i => 0))

  $effect(() => {change_workout_exercises = $state.snapshot(using_workouts).map(i => 0)})
  $effect(() => {change_exercises = $state.snapshot(using_exercises).map(i => 0)})

  let workout_search = $state(""), exercise_search = $state("")
</script>

{#if pending_save}
  <div class="saving"><span>Saving...</span><br><button onclick={() => save([using_exercises, using_workouts])}>save now</button></div>
{/if}

<h2 style:margin-bottom="0">Workouts</h2>
<input style:margin-bottom="1rem" type="text" bind:value={workout_search} placeholder="search workouts">
<div class="workouts">
  {#each using_workouts as workout, d (workout.name)}
    {#if workout.name.toLowerCase().includes(workout_search.toLowerCase())}
      <div class="workout">
        <WorkoutTemplate 
          workout={workout} view_mode={EDIT_COMPLEX_PROACTIVE} 
          all_exercises={using_exercises} 
          save_changes={(c) => {using_workouts[d] = c}} 
          update_exercises_index={change_workout_exercises[d]}
          save_changes_exercise={(id, e) => {
            using_exercises[using_exercises.findIndex(i => i.id == id)] = e
            ++change_exercises[using_exercises.findIndex(i => i.id == id)]
            change_workout_exercises.forEach((i, dd) => {
              if (using_workouts[dd].exercises.includes(id) && d != dd) {
                ++change_workout_exercises[dd]
              }
            })
            using_exercises = [...using_exercises]
        }}/><br>
        <button onclick={() => {
          if (confirm(`Are you sure you want to delete the workout "${workout.name}"?`)) {
            using_workouts.splice(d, 1)
            save([using_exercises, using_workouts])
          }
          if (using_workouts.length == 0) new_exercise.id = "0"
        }} style:font-size="1.25rem" style:cursor="pointer">delete workout</button>
      </div>
    {/if}
  {/each}
</div>
<h3 style:margin-bottom="0">Create a new workout</h3>
<input type="text" placeholder="Exercise name" bind:value={new_workout.name} onkeydown={(e) => {if(e.key == "Enter") make_new_workout()}}>
<button disabled={new_workout.name.length == 0 || using_workouts.filter(i => i.name == new_workout.name).length > 0} onclick={make_new_workout}>create</button>

<h2 style:margin-bottom="0">Exercises</h2>
<input style:margin-bottom="1rem" type="text" bind:value={exercise_search} placeholder="search exercises">
<div class="exercises">
  {#if using_exercises.length == 0}
    <p style:padding-left="2rem"><i>no exercises found ._.</i></p>
  {/if}
  {#each using_exercises as exercise, d (exercise.id)}
    {#if exercise.name.toLowerCase().includes(exercise_search.toLowerCase())}
      <div class="exercise">
        {#key change_exercises[d]}
          <Exercise exercise={exercise} view_mode={EDIT_COMPLEX_PROACTIVE} save_changes={(c) => {
            using_exercises[d] = c
            change_workout_exercises.forEach((_, dd) => {
              if (using_workouts[dd].exercises.includes(exercise.id)) {
                ++change_workout_exercises[dd]
              }
            })
          }}/>
        {/key}
        <button onclick={() => {
          if (confirm(`Are you sure you want to delete the exercise "${exercise.name}" / ID = ${exercise.id}?`)) {
            using_exercises.splice(d, 1)
            db.workouts = db.workouts.map(i => {
              i.exercises = i.exercises.filter(ii => ii != exercise.id)
              return i
            })
            db.days.forEach(i => {
              i.workouts = i.workouts.map(ii => {
                ii.exercises = ii.exercises.filter(iii => iii[0] != exercise.id)
                return ii
              })
            })
            save([using_exercises, using_workouts])
          }
          if (using_exercises.length == 0) new_exercise.id = "0"
        }} style:font-size="1.25rem" style:cursor="pointer">delete exercise</button>
        <span style:font-size="1.375rem">Exercise ID: {exercise.id}</span>
      </div>
    {/if}
  {/each}
</div>
<h3 style:margin-bottom="0">Create a new exercise</h3>
<input type="text" placeholder="Exercise name" bind:value={new_exercise.name} onkeydown={(e) => {if(e.key == "Enter") make_new_exercise()}}>
<button disabled={new_exercise.name.length == 0} onclick={make_new_exercise}>create</button>

<style lang="scss">
  .workouts {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, 405px);
  }

  .exercises {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, 379px);
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