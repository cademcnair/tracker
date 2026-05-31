<script lang="ts">
    import Exercise from "../lib/Exercise.svelte";
  import ExerciseSets from "../lib/ExerciseSets.svelte";
  import type { Props } from "../lib/types"
  import { EDIT_COMPLEX_PASSIVE, EDIT_PASSIVE, READONLY } from "../lib/utils";
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
</script>

<h2>Exercises</h2>

<ExerciseSets exercise_sets={[
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 }
]} view_mode={EDIT_PASSIVE} repsonly={false} leftright={true}/>

<Exercise
  exercise={{
    name: "test",
    sets: [
      { reps: 1, weight: 150 },
      { reps: 1, weight: 150 },
      { reps: 1, weight: 150 },
      { reps: 1, weight: 150 }
    ],
    rest: 0,
    leftright: true,
    repsonly: false,
    id: "-1",
    notes: "",
    sincelastimprovement: 0,
    normalreps: 10
  }}
  view_mode={EDIT_COMPLEX_PASSIVE}
/>