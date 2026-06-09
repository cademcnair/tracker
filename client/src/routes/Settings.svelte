<script lang="ts">
  import type { User, Props } from "../lib/types";
  import { MACROS, MACRO_SETTING, NICE_MACROS, clone } from "../lib/utils";
  let {
    db = $bindable(),
    SERVER,
    page = $bindable(),
    error = $bindable(),
  }: Props = $props();
  let using_db = $state($state.snapshot(db));
  let downloaded = $state(false);
  let date = $state("")
</script>

<h2>Settings</h2>
<p><b>Select which macros you care about</b></p>
{#each MACROS as macro}
  <label>
    <input
      type="checkbox"
      checked={using_db.settings.cares_about.includes(macro)}
      onchange={(e) => {
        if (e.currentTarget.checked) {
          using_db.settings.cares_about.push(macro);
        } else {
          using_db.settings.cares_about = using_db.settings.cares_about.filter(
            (m) => m !== macro,
          );
        }
      }}
      disabled={macro == "calories" || macro == "protein"}
    />
    {NICE_MACROS[macro][0]}
  </label><br />
{/each}
<hr />
<p>Daily goals / limits</p>
{#each using_db.settings.cares_about as macro}
  {NICE_MACROS[macro][0]}:
  <input
    value={using_db.settings[MACRO_SETTING[macro]]}
    onkeyup={(e) => {
      using_db.settings[MACRO_SETTING[macro]] = Number(e.currentTarget.value);
    }}
    type="number"
  />{NICE_MACROS[macro][2]}<br />
{/each}
<hr />
<input type="file" accept=".cm-utils" onchange={async (e) => {

  const files = e.currentTarget.files
  if (!files || files.length == 0) return;
  if (files.length > 1) {
    alert("Too many files")
    return;
  }
  const file = files[0]
  const text = await file.text();
  const json: User = JSON.parse(text)

  db.days = json.days
  db.exercises = json.exercises
  db.foods = json.foods
  db.weights = json.weights
  db.workouts = json.workouts
  db.settings = json.settings

  db = { ...db }

  alert("Imported user profile.")
  location.reload()
}}><br />
<button disabled={!downloaded}>import data (requires download of your own data as backup)</button>
<hr />
<button onclick={() => {
  const blob = new Blob([JSON.stringify({
    days: db.days,
    exercises: db.exercises,
    foods: db.foods,
    weights: db.weights,
    workouts: db.workouts,
    settings: db.settings
  })])

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a")
  link.href = url;
  link.download = (new Date().getTime()) + ".cm-utils"
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  downloaded = true
}}>download account data</button>
<hr />
<button onclick={() => (db = clone(using_db))}>Save changes (importing data leads to an autosave)</button>
<hr />
<button disabled={!downloaded && db.store_method == "client"} onclick={() => {
  localStorage.clear()
  location.reload()
}}>log out of server account / delete locally stored account (requires download of your own data as backup)</button>
<hr>
<h3>Change the date (will delete all in progress pages here, date change will be automatically saved though)</h3>
{#if location.search == ""}
<input type="date" bind:value={date}>
<button onclick={() => {
  try {
    if (date.length == 0) throw "";
    let nice = Number(date.replaceAll("-", ""))
    nice -= 100
    location.replace("/?" + nice)
  } catch (e) {
    alert("Problem with saving new date - most likely incorrectly formatted")
  }
}}>save new date</button>
{:else}
<button onclick={() => {
  location.replace("/")
}}>revert the date back to the current day</button>
{/if}

<style scoped lang="scss">
  button {
    font-size: 2rem;
    font-weight: 700;
  }
</style>
