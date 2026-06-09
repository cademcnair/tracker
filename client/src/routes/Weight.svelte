<script lang="ts">
  import { onMount } from "svelte";
  import * as t from "../lib/types"
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: t.Props = $props();
  import Chart from "chart.js/auto"
  import { clone, format_date, get_week_number_from_date, make_date_into_date_object, make_fancy, median, today } from "../lib/utils";
    import ChangeDate from "../lib/ChangeDate.svelte";

  let can_disp = $state(false)
  onMount(() => {
    can_disp = true
  }) 
  $effect(() => {
    if (!can_disp) return;
    const c = Chart.getChart("chart")
    if (c) c.destroy()
    new Chart(document.querySelector("#chart") as HTMLCanvasElement, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Weight",
          data: dataset,
          spanGaps: true
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Weight (${current_view})`
          }
        },
        maintainAspectRatio: true,
        aspectRatio: 0.66,
        responsive: true,
        scales: {
          y: {
            grace: 5
          }
        },
        ...screen_size_options
      }
    })
  })
  let modifier: number = $state(0)
  let viewing: number = $state(today())
  let date_viewing: Date = $derived(new Date(make_date_into_date_object(viewing).getTime() + modifier))
  let mapped: [Date, number][] = $derived(db.days.map(d => [make_date_into_date_object(d.date), ((d.weights as any[]).reduce((a: number, b: {weight: number}) => a+b.weight, 0) / Math.max(1, d.weights.length)) as number]))
  let objectified: {[k in number]: number} = $derived(Object.fromEntries(mapped.map(i => [i[0].getTime(), i[1]])))
  let week_start = $derived(new Date(date_viewing.getFullYear(), date_viewing.getMonth(), date_viewing.getDate() - date_viewing.getDay()))
  let locked_week = $derived([0, 1, 2, 3, 4, 5, 6].map(i => objectified[week_start.getTime() + i * 24 * 60 * 60 * 1000]).map(i => i === undefined || i === 0 ? null : i))
  let locked_week_labels = $derived([0, 1, 2, 3, 4, 5, 6].map(i => make_fancy(format_date(new Date(week_start.getTime() + i * 24 * 60 * 60 * 1000)))))
  let week = $derived([-3, -2, -1, 0, 1, 2, 3].map(i => objectified[date_viewing.getTime() + i * 24 * 60 * 60 * 1000]).map(i => i === undefined || i === 0 ? null : i))
  let week_labels = $derived([-3, -2, -1, 0, 1, 2, 3].map(i => make_fancy(format_date(new Date(date_viewing.getTime() + i * 24 * 60 * 60 * 1000)))))
  let current_view = $state("week")
  let week_groups: [Date, number][][] = $derived(
    [...new Set(mapped.map(i => get_week_number_from_date(new Date(i[0].getTime()))))].map(weekNumber =>
      mapped
        .filter(j => get_week_number_from_date(new Date(j[0].getTime())) == weekNumber)
        .map(j => [new Date(j[0].getTime()), j[1]])
    )
  )
  let week_groups_median: [number, number][] = $derived(
    week_groups.map(i => [get_week_number_from_date(i[0][0]), median(i.map(ii => ii[1]))])
  )
  let weeks_objectified: {[k in number]: number} = $derived(Object.fromEntries(week_groups_median))
  let monthly_base = $derived(clone([-2, -1, 0, 1, 2]).filter(i => (get_week_number_from_date(date_viewing) + i) > 0))
  let monthly = $derived(monthly_base.map(i => weeks_objectified[get_week_number_from_date(date_viewing) + i]).map(i => i === undefined || i === 0 ? null : i))
  let monthly_labels = $derived(monthly_base.map(i => `Week #${get_week_number_from_date(date_viewing) + i}`))
  let dataset = $derived(current_view == "week" ? week : current_view == "monthly" ? monthly : locked_week)
  let labels = $derived(current_view == "week" ? week_labels : current_view == "monthly" ? monthly_labels : locked_week_labels)
  let width = $state(0)
  $effect(() => console.log(width))
  let screen_size_options: any = $derived(width > 600 ? {} : {scales: {
    x: {
      ticks: {
        minRotation: 90,
        maxRotation: 90
      }
    }
  }})
  let modifier_velocity = $state(3)
  let search = $state("")
</script>

<label>
  current view:
  <select bind:value={current_view}>
    <option value="week">week</option>
    <option value="monthly">monthly</option>
    <option value="locked_week">locked week</option>
  </select>
</label><br>
<button onclick={() => {
  modifier += (current_view == "monthly" ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24) * modifier_velocity
}}>go foward</button>
<button onclick={() => {
  modifier += (current_view == "monthly" ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24) * modifier_velocity * -1
}}>go back</button>
<button onclick={() => modifier = 0}>reset</button>
<label>
  velocity:
  <input bind:value={modifier_velocity} type="number">
</label><br>
Viewing date: {make_fancy(format_date(date_viewing))}
<canvas id="chart"></canvas>
<table>
  <tbody>
    {#each labels as i, d}
      <tr>
        <th>{i}</th>
        <td>{dataset[d]}{dataset[d] == null ? "" : "lbs"}</td>
      </tr>
    {/each}
  </tbody>
</table>
<details open>
  <summary>history of all weights</summary>
  <input type="text" placeholder="search (by date string representation)" bind:value={search}>
  <table>
    <tbody>
      {#each db.weights as i, d}
        {#if search == "" || make_fancy(i.date).toLowerCase().includes(search.toLowerCase())}
          <tr>
            <th>{make_fancy(i.date)}</th>
            <td>{i.weight}lbs</td>
            <td><button onclick={() => {
              if (!confirm(`are you sure you want to delete this record? date: ${make_fancy(i.date)}, weight: ${i.weight}`)) return
              db.weights.splice(d, 1)
              const w = (db.days.find(day => day.date === i.date) as t.Day).weights
              w.splice(w.findIndex(ii => ii.weight == i.weight), 1)
              db = {...db}
            }}>delete record</button></td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</details>
<details open>
  <summary>change the date</summary>
  <ChangeDate />
</details>
<div class="dummy" bind:clientWidth={width}></div>

<style lang="scss">
  #chart {
    position: relative;
    height: 70dvh !important;
  }
  table {
    position: relative;
    border-collapse: collapse;
    th, td {
      border: 1px solid black;
      padding: .5rem;
      width: fit-content;
    }
  }
</style>