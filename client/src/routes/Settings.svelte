<script lang="ts">
  import { CAN_CARE, CAN_CARE_NICE, CAN_CARE_SETTINGS_NAME, CAN_CARE_UNITS, FUNC_CAN_CARE_SETTINGS_NAME } from "../lib/definitions";
  import type { Props, Macro, MacroSettingNames } from "../lib/types";
  let { db: using_db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
  let db = $state.snapshot(using_db);
</script>
<h2>Settings</h2>

<p>Select which macros you care about tracking</p>
{#each CAN_CARE as care, d}
  <label>
    <input type="checkbox" checked={db.settings.cares_about.includes(care as Macro)} onchange={e => {
      if (e.currentTarget.checked) {
        db.settings.cares_about.push(care as Macro);
      } else {
        db.settings.cares_about = db.settings.cares_about.filter(i => i != care as Macro);
      }
    }}>
    {CAN_CARE_NICE[care]}
  </label>
  <br>
{/each}

<hr>

<p><b>Set your goals for each macro</b></p>
{#each db.settings.cares_about as care, d}
  <label>
    {CAN_CARE_NICE[care]}
    <input type="number" value={db.settings[CAN_CARE_SETTINGS_NAME[care]]} onkeyup={e => {
      db.settings[CAN_CARE_SETTINGS_NAME[care]] = Number(e.currentTarget.value)
    }}>{CAN_CARE_UNITS[care]}
  </label>
  <br>
{/each}

<hr>
<button onclick={()=>using_db = db}>Save changes</button>

<style scoped>
  button {
    font-size: 2rem;
    font-weight: 900;
  }
</style>