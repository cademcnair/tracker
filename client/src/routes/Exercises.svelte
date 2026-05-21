<script lang="ts">
  import ExerciseSets from "../lib/ExerciseSets.svelte";
  import type { Props } from "../lib/types"
  import { EDIT_PASSIVE, READONLY } from "../lib/utils";
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
</script>

<h2>Exercises</h2>

<ExerciseSets exercise_sets={[
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 },
  { reps: 1, weight: 150 }
]} view_mode={EDIT_PASSIVE} leftright={true}/> h47u3ifwhu43th uig3riujghu23ri fjkg23rhufi jg324huirkjg3rhqui kjg3qrhfu jkg3qrhwufi 