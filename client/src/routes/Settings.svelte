<script lang="ts">
    import type { User, Props } from "../lib/types";
    import { MACROS, MACRO_SETTING, NICE_MACROS, clone } from "../lib/utils"
    let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
    let using_db = $state($state.snapshot(db))
</script>

<h2>Settings</h2>
<p><b>Select which macros you care about</b></p>
{#each MACROS as macro}
    <label>
        <input 
            type="checkbox" 
            checked={using_db.settings.cares_about.includes(macro)}
            onchange={e=>{
                if (e.currentTarget.checked) {
                    using_db.settings.cares_about.push(macro)
                } else {
                    using_db.settings.cares_about = using_db.settings.cares_about.filter(m => m !== macro)
                }
            }}
            disabled={macro=="calories" || macro == "protein"}
        > {NICE_MACROS[macro][0]}
    </label><br>
{/each}
<hr>
<p>Daily goals / limits</p>
{#each using_db.settings.cares_about as macro}
    {NICE_MACROS[macro][0]}: <input 
        value={using_db.settings[MACRO_SETTING[macro]]}
        onkeyup={e=>{
            using_db.settings[MACRO_SETTING[macro]] = Number(e.currentTarget.value)
        }}
        type="number"
    >{NICE_MACROS[macro][2]}<br/>
{/each}
<hr>
<button onclick={()=>db = clone(using_db)}>Save changes</button>

<style scoped lang="scss">
    button {
        font-size: 2rem;
        font-weight: 700;
    }
</style>