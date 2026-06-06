<script lang="ts">
  import Exercise from "../lib/Exercise.svelte";
  import * as t from "../lib/types";
  import { clone, EDIT_COMPLEX_PASSIVE, find_today, make_workout, READONLY, round, str } from "../lib/utils";
  import WorkoutTemplate from "../lib/WorkoutTemplate.svelte"

  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: t.Props = $props();

  let day = $state((find_today(db.days) as t.Day).workouts)
  let curr: null | t.Workout<true> = $derived(day.find(w => !w.completed) || null);
  let temp: null | t.Workout<false> = $derived(curr == null ? null : db.workouts.find(w => w.name == curr.name) as t.Workout<false>);
  let completed_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length == i[1].sets.length))
  let inprogress_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length != 0 && i[2].length < i[1].sets.length))
  let pending_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length == 0))
  let search = $state("")
  let exercise_focus: null | t.HappeningExercise = $state(null)
  let timer_left: number = $state(0);
  let timer_start: number = $state(-1);
  let number_offset: number = $state(0);
  let wakelock: any = $state(null);
  let sound: boolean = $state(false);
  $effect(() => {
    if (timer_left > 0) setTimeout(() => timer_left -= 0.1, 100)
    if (timer_left <= 0) {
      if (timer_start != -1) play_alarm()
      timer_start = -1
      if (wakelock != null) {
        wakelock.release()
        wakelock = null
      }
    }
  })

  function play_alarm() {
    sound = true
    ;(window as any).alarm.play()
  }
</script>

{#if sound == true}
  <button onclick={()=>{
    ;(window as any).alarm.pause()
    ;(window as any).alarm.currentTime = 0
    sound = false
  }} class="save">stop sound</button>
{/if}

{#if curr == null}
  <h2 style:margin-bottom="0">Start workout</h2>
  <input type="text" bind:value={search} placeholder="search workouts" style:margin-bottom="1rem">
  <div class="workouts">
    {#each db.workouts.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) as workout}
      <div class="workout">
        <button onclick={() => {
          if (confirm(`Are you sure you want to a "${workout.name}" workout?`)) {
            day.push(make_workout(workout, db))
            db = {...db}
          }
        }}>Start this workout</button>
        <WorkoutTemplate workout={workout} view_mode={READONLY} all_exercises={db.exercises} update_exercises_index={-1}/>
      </div>
    {/each}
  </div>
{:else if exercise_focus == null}
  <h2>Workout {curr.name} in progress</h2>
  <h3>Do exercises</h3>
  <div class="exercises">
    {#each inprogress_exercises as exercise (str(exercise[1]))}
      <div class="exercise in-progress">
        <button onclick={() => {
          exercise_focus = exercise
        }}>resume exercise</button>
        <Exercise exercise={exercise[1]} view_mode={READONLY}/>
      </div>
    {/each}
    {#each pending_exercises as exercise (str(exercise[1]))}
      <div class="exercise pending">
        <button onclick={() => {
          exercise_focus = exercise
        }}>start exercise</button>
        <Exercise exercise={exercise[1]} view_mode={READONLY}/>
      </div>
    {/each}
    {#each completed_exercises as exercise (str(exercise[1]))}
      <div class="exercise completed">
        <button>delete completed exercise</button>
        <Exercise exercise={exercise[1]} view_mode={READONLY}/>
      </div>
    {/each}
  </div>
  <p>
    not started = lightblue<br>
    in progress = lightgreen<br>
    completed = lightgray
  </p>
  <h3>Modify exercises</h3>
  <div class="exercises">
    {#each curr.exercises as exercise, d}
      <Exercise exercise={exercise[1]} view_mode={EDIT_COMPLEX_PASSIVE} save_changes={(e) => {
        exercise[1] = clone(e)
        db.exercises[db.exercises.findIndex(i => i.id == exercise[1].id)] = clone(e)
        db = {...db}
      }}/>
    {/each}
  </div>
{:else if timer_left <= 0}
  {@const target = exercise_focus[1].sets[exercise_focus[2].length]}
  <div class="mode">
    <div class="control-top control">
      <div class="left">
        {#if exercise_focus[2].length != 0}
          <button>←</button>
        {/if}
        <span>set #{exercise_focus[2].length}/{exercise_focus[1].sets.length}</span>
      </div>
      <div class="right">
        {target.weight}lbs
      </div>
    </div>
    <div class="center">
      {#if target != undefined}
        <button onclick={() => number_offset += 4}>↑</button>
        {#each [4, 3, 2, 1, 0, -1, -2, -3, -4] as off}
          {@const offset = off + number_offset}
          {#if (target.reps + offset) > 0}
          <button>
            <span>{target.reps + offset}</span>
            {#if offset == 0}
              (goal)
            {:else}
              ({offset > 0 ? "+" : "-"}{Math.abs(offset)})
            {/if}
          </button>
          {/if}
        {/each}
        {#if (target.reps + number_offset) > 0}
          <button onclick={() => number_offset -= 4}>↓</button>
        {/if}
      {/if}
    </div>
    <div class="control-bottom control">
      <div class="left">
        {#if exercise_focus[1].rest > 0}
          <button onclick={() => {
            try {
              wakelock = navigator.wakeLock.request("screen")
            } catch (e) {}
            timer_start = timer_left = (exercise_focus as t.HappeningExercise)[1].rest
          }}>timer ({exercise_focus[1].rest}s)</button>
        {/if}
      </div>
      <div class="right">
        <button onclick={() => exercise_focus = null}>exit</button>
      </div>
    </div>
  </div>
{:else}
  <div class="mode">
    <div class="control-top control">
      <button onclick={() => {
        if (timer_left < 20 || confirm("Do you want to end the timer?")) {
          timer_start = -1
          timer_left = 0
        }
      }}>exit timer</button>
    </div>
    <div class="center timer">
      {round(timer_left, 2)}
    </div>
    <div class="control-bottom control">
      <progress max="1" value={timer_left/timer_start}></progress>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .save {
    position: absolute;
    top: 0;
    left: 0;
    border: 2.5px solid black;
    font-weight: 700;
    z-index: 60;
    padding-bottom: 1rem;
    padding-top: 1rem;
  }
  .center:not(.timer) {
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    button {
      border: 2.5px solid black !important;
      background-color: white !important;
      border-radius: 0px !important;
      font-size: 2rem;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }
  }
  progress {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    height: 40px;
  }
  .timer {
    font-size: 5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .center {
    height: calc(100dvh - 100px);
    width: 100%;
  }
  .left {
    position: absolute;
    left: 0;
  }
  .right {
    position: absolute;
    right: 0;
  }
  .control {
    position: relative;
    font-size: 1.5rem;
    height: 50px;
    width: 100%;
  }
  .mode {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100vw - 2rem);
    height: calc(100% - 2rem);
    z-index: 40;
    background-color: white;
    padding: 1rem;
    overflow: hidden;
  }
  .in-progress {
    background-color: lightgreen;
  }
  .pending {
    background-color: lightblue;
  }
  .completed {
    background-color: lightgray;
  }
  .exercises {
    display: flex;
    gap: 1rem;
    overflow-x: scroll;
    flex-wrap: nowrap;
  }
  .exercise {
    padding: 1rem;
  }
  .workouts {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, 405px);
  }
  button {
    width: 100%;
    font-size: 1.5rem;
  }
</style>