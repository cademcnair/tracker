<script lang="ts">
  let date = $state("")
</script>

<h3>Change the date</h3>
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
