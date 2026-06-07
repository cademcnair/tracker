<script lang="ts">
  import Exercise from "../lib/Exercise.svelte";
  import * as t from "../lib/types";
  import { clone, EDIT_COMPLEX_PASSIVE, find_today, make_fancy, make_workout, READONLY, round, str } from "../lib/utils";
  import WorkoutTemplate from "../lib/WorkoutTemplate.svelte"

  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: t.Props = $props();

  let day = $state((find_today(db.days) as t.Day).workouts)
  let curr: null | t.Workout<true> = $derived(day.find(w => !w.completed) || null);
  let temp: null | t.Workout<false> = $derived(curr == null ? null : db.workouts.find(w => w.name == (curr as t.Workout<true>).name) as t.Workout<false>);
  let completed_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length == i[1].sets.length))
  let inprogress_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length != 0 && i[2].length < i[1].sets.length))
  let pending_exercises: null | t.HappeningExercise[] = $derived(curr == null || temp == null ? null : curr.exercises.filter(i => i[2].length == 0))
  let search = $state("")
  let exercise_focus: null | t.HappeningExercise = $state(null)
  let timer_goal: number = $state(Infinity);
  let timer_start: number = $state(0);
  let number_offset: number = $state(0);
  let wakelock: any = $state(null);
  let sound: boolean = $state(false);
  let readonly: boolean = $state(false);
  let intv: any = $state(null);
  let timer_update: number = $state(0);
  let flash_left: number = $state(0);

  function fluff(n: number, l: number) {
    let str = String(n)
    if (str.length > l) {
      while (str.length != l) str = str.split("").filter((_,d,a) => d != a.length-1).join("")
    } else {
      while (str.length != l) str += "0"
    }
    return str
  }

  function play_alarm() {
    try {
      clearInterval(intv); intv = null
    } catch (e) {}
    sound = true; (window as any).alarm.play()
  }

  let reset_exercises = $state(7)
  let look_back = $state(localStorage.getItem("look-back") == null ? 7 : Number(localStorage.getItem("look-back")))
  $effect(() => {localStorage.setItem("look-back", String(look_back))})
  type recent_workouts_helper_type = [number, [t.Workout<true>, number, number][]];
  let recent_workouts: recent_workouts_helper_type[1] = $derived((db.days.toReversed() as any[]).reduce((a, i, d) => {
    if (a[0] <= 0) return a
    let width = Math.min(a[0], i.workouts.length)
    let next = clone(a[1]), using = i.workouts.map((ii: t.Workout<true>, dd: number) => [ii, dd])
      .slice(-1 * width).map((ii: [t.Workout<true>, number]) => [ii[0], i.date, ii[1]]);
    for (let ii = using.length - 1; ii > -1; --ii) next.push(using[ii]);
    return [a[0] - width, next]
  }, [look_back, [] as unknown] as recent_workouts_helper_type)[1])
  let target = $derived(exercise_focus == null ? null : (exercise_focus as t.HappeningExercise)[1].sets[(exercise_focus as t.HappeningExercise)[2].length])
  $effect(() => {
    if (flash_left - new Date().getTime() > 0) {
      setTimeout(() => {
        flash_left = 0;
      }, flash_left - new Date().getTime() + 100);
    }
  })
</script>

{#if sound == true}
  <button onclick={()=>{
    ;(window as any).alarm.pause()
    ;(window as any).alarm.currentTime = 0
    sound = false
  }} class="save">stop sound</button>
{/if}

{#key flash_left}
  {#if flash_left - new Date().getTime() > 0}
    <div class="flash">
      <p>Saved Changes!</p>
    </div>
  {/if}
{/key}

{#if curr == null}
  <h2 style:margin-bottom="0">Past workouts</h2>
  <label style:margin-bottom="1rem">
    Lookback:
    <input type="number" bind:value={look_back}>
  </label>
  <ul>
    {#each recent_workouts as workout}
      <li>
        <div class="color" style:background-color={workout[0].color}></div>
        <div>
          <span>{workout[0].name}</span> completed on <span>{make_fancy(workout[1])}</span>
        </div>
        <button onclick={() => {
          readonly = true
          curr = workout[0]
          window.scrollTo(0, 0)
        }}>revisit</button>
        <button onclick={() => {
          if (!confirm(`Do you really want to delete this workout (${workout[0].name} / ${make_fancy(workout[1])})?`)) return;
          db.days.find(i => i.date == workout[1])?.workouts.splice(workout[2], 1)
          db = { ...db }
        }}>delete</button>
      </li>
    {/each}
  </ul>
  <h2 style:margin-bottom="0">Start workout</h2>
  <input type="text" bind:value={search} placeholder="search workouts" style:margin-bottom="1rem">
  <div class="workouts">
    {#each db.workouts.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) as workout}
      <div class="workout">
        <button onclick={() => {
          if (confirm(`Are you sure you want to a "${workout.name}" workout?`)) {
            day.push(make_workout(workout, db))
            db = {...db}
            window.scrollTo(0, 0)
          }
        }} style:border={"none"}>Start this workout</button>
        <WorkoutTemplate workout={workout} view_mode={READONLY} all_exercises={db.exercises} update_exercises_index={-1}/>
      </div>
    {/each}
  </div>

{:else if exercise_focus == null}
  <h2>Workout {curr.name} {readonly ? "completed portions overview" : "in progress"}</h2>
  <h3>{readonly ? "Done" : "Do"} exercises</h3>
  {#key reset_exercises}
    <div class="exercises" style:flex-direction={readonly ? "column" : "row"}>
      {#if !readonly}
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
      {/if}
      {#each completed_exercises as exercise (str(exercise[1]))}
        {@const net = exercise[2].reduce((a, i, d) => a + (i.reps - exercise[1].sets[d].reps), 0)}
        <div class="exercise completed">
          <button onclick={() => {
            if (readonly) return; 
            exercise[2] = clone([])
            db = { ...db }
            ++reset_exercises
          }}>{readonly ? "" : "undo completed exercise"} ({net == 0 ? "" : net > 0 ? "+" : "-"}{Math.abs(net)})</button>
          <Exercise exercise={exercise[1]} view_mode={READONLY}/>
        </div>
      {/each}
    </div>
  {/key}
  {#if !readonly}
    <p>
      not started = lightblue<br>
      in progress = lightgreen<br>
      completed = lightgray
    </p>
    <h3>Modify exercises (global -- applies to this workout and template workouts)</h3>
    <div class="exercises">
      {#each curr.exercises as exercise, d}
        <Exercise exercise={exercise[1]} view_mode={EDIT_COMPLEX_PASSIVE} save_changes={(e) => {
          exercise[1] = clone(e)
          db.exercises[db.exercises.findIndex(i => i.id == exercise[1].id)] = clone(e)
          db = {...db}
        }}/>
      {/each}
    </div>
    <button class="finish" onclick={() => {
      if (!confirm("Do you really want to finish this workout?")) return;
      (curr as t.Workout<true>).completed = true
      db = { ...db }
      window.scrollTo(0, 0)
    }}>COMPLETE WORKOUT</button>
  {:else}
    {#if (completed_exercises as t.HappeningExercise[]).length == 0}
      <p>completed no exercises ._.</p>
    {/if}
    <button class="finish" onclick={() => {
      readonly = false
      curr = null
      window.scrollTo(0, 0)
    }}>close</button>
  {/if}
{:else if timer_goal == Infinity}
  {@const total_diff = exercise_focus[2].reduce((a, i, d) => a + (i.reps - (exercise_focus as t.HappeningExercise)[1].sets[d].reps), 0)}
  <div class="mode">
    <div class="control-top control">
      <div class="left">
        {#if exercise_focus[2].length != 0}
          <button onclick={() => {
            (exercise_focus as t.HappeningExercise)[2].pop()
            db = { ...db }
          }}>←</button>
        {/if}
        {#if target != undefined}
          <span>set #{exercise_focus[2].length+1}/{exercise_focus[1].sets.length}</span>
        {:else}
          <span>completed exercise</span>
        {/if}
      </div>
      <div class="right">
        "{exercise_focus[1].name}" /
        {#if target != undefined}
          {target.weight}lbs
        {/if}
      </div>
    </div>
    <div class="center">
      {#if target != undefined}
        <button onclick={() => number_offset += 4}>↑</button>
        {#each [4, 3, 2, 1, 0, -1, -2, -3, -4] as off}
          {@const offset = off + number_offset}
          {#if (target.reps + offset) > 0}
          <button onclick={() => {
            (exercise_focus as t.HappeningExercise)[2].push({
              reps: target.reps + offset,
              weight: target.weight
            })
            db = { ...db }
            flash_left = new Date().getTime() + 500
          }}>
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
      {:else}
        {#key reset_exercises}
          <Exercise exercise={exercise_focus[1]} view_mode={EDIT_COMPLEX_PASSIVE} save_changes={(e) => {
            db.exercises[db.exercises.findIndex(i => i.id == (exercise_focus as t.HappeningExercise)[1].id)] = clone(e)
            db = {...db}
          }}/>
        {/key}
        <button onclick={() => ++reset_exercises}>see exercise copy</button>
        (this only changes the template exercise)
      {/if}
    </div>
    <div class="control-bottom control">
      <div class="left">
        {#if target != undefined && exercise_focus[1].rest > 0}
          <button onclick={() => {
            try {
              wakelock = navigator.wakeLock.request("screen")
            } catch (e) {}
            timer_start = new Date().getTime()
            timer_goal = timer_start + ((exercise_focus as t.HappeningExercise)[1].rest * 1000)
            intv = setInterval(() => {
              ++timer_update
              if ((timer_goal - new Date().getTime()) < 0) {
                play_alarm()
                timer_goal = Infinity
              }
            }, 100)
          }}>timer ({exercise_focus[1].rest}s)</button>
        {/if}
      </div>
      <div class="right">
        <span>net = {total_diff == 0 ? "" : total_diff > 0 ? "+" : "-"}{Math.abs(total_diff)}</span>
        <button onclick={() => {
          exercise_focus = null
          number_offset = 0
        }}>exit</button>
      </div>
    </div>
  </div>
{:else}
  <div class="mode">
    <div class="control-top control">
      <div class="left">
        <button onclick={() => {
          if ((timer_goal - new Date().getTime()) <= (20 * 1000) || confirm("Do you want to end the timer?")) {
            timer_goal = Infinity
            try {
              clearInterval(intv);
              intv = null
            } catch (e) {}
          }
        }}>exit timer</button>
      </div>
      <div class="right">
        "{exercise_focus[1].name}" /
        {#if target != undefined}
          {target.weight}lbs
        {/if}
      </div>
    </div>
    {#key timer_update}
      <div class="center timer">
        {fluff(round((timer_goal - new Date().getTime()) / 1000, 3), 5)}
      </div>
      <div class="control-bottom control">
        <progress max="1" value={(new Date().getTime() - timer_start)/(timer_goal-timer_start)}></progress>
      </div>
    {/key}
  </div>
{/if}

<style lang="scss" scoped>
  .flash {
    background-color: white;
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
    font-size: 5rem;
    font-weight: 900;
    color: green;
    pointer-events: none;
    p {
      margin: 0;
    }
  }
  ul {
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .color {
      width: 25px;
      height: 25px;
    }
    button {
      width: fit-content !important;
    }
  }
  .finish {
    margin-top: 1rem;
    width: fit-content;
  }
  .control > div {
    display: flex;
    gap: 0.5rem;
    text-wrap: nowrap;
  }
  button {
    display: inline-block !important;
  }
  .control-bottom span {
    font-size: 2rem;
  }
  .save {
    position: absolute;
    top: 0;
    left: 0;
    border: 2.5px solid black;
    font-weight: 700;
    z-index: 60;
    padding-bottom: .25rem;
    padding-top: .25rem;
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