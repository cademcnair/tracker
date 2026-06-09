<script lang="ts">
  import type { StoreMethod, User, Props } from "../lib/types";
  let { db = $bindable(), SERVER, page = $bindable(), error = $bindable() }: Props = $props();
  let user = $state("");
  let pass = $state(""), verify_pass = $state("");
  let create = async function (store_method: StoreMethod, method?: string) {
    if (store_method == "client") if (!confirm("Are you sure you want to create a local account?")) return;
    if (store_method == "server")
      if (method == "login") {if (!confirm("Are you sure you want to login?")) return;}
      else if (!confirm("Are you sure you want to create a server account?")) return;
    if (store_method === "server" && method === "login") {
      const request = await fetch(`${SERVER}get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: user,
          pass: pass
        })
      })
      
      if (request.ok) {
        let data = await request.json() as User
        page = data.page;
        db = data;
      } else {
        alert(request.status + " " + await request.text())
        return;
      }
    } else if (store_method === "server" && method === "create") {
      const request = await fetch(`${SERVER}create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: user,
          pass: pass
        })
      })
      
      if (request.ok) {
        let data = await request.text() as string
        if (data == "true") {
          alert("Username already exists. Please choose another username. (username could be illegal too - no '..' or '/' is allowed)");
          return;
        }
      } else {
        page = "error";
        error = "Could not connect to the server to verify your username is unique.";
        return;
      }
    }
    db.user = user;
    db.pass = pass;
    db.store_method = store_method;
    localStorage.setItem("store_method", store_method);
    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);
    if (store_method === "client") {
      localStorage.setItem("data", JSON.stringify(db))
    } else if (method === "create") {
      const request = await fetch(`${SERVER}post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: user,
          pass: pass,
          data: db
        })
      })
      if (!request.ok) {
        page = "error"
        error = "Something went wrong with the server, your account could not be loaded with the proper data."
        localStorage.clear()
        return;
      }
    }
    page = "home"
  }
  let show_home = $state(true)
</script>

{#if db.user.length == 0}
  <h2>Input your account settings</h2>
  <input type="text" bind:value={user} placeholder="*Username">
  <hr>
  <p><b>Create a local account</b></p>
  <p>Using a local account means that your data is kept on your device. The advantage of a local account is that you only need to rely on yourself to store your data, and privacy (the data stays on your device). The disadvantage is that you can't share your data between different devices and may risk losing your data if you lose this device.</p>
  <button onclick={()=>create("client")} disabled={user.length == 0}>Create a local acount</button>
  <hr>
  <p><b>Create a server account</b></p>
  <p>You must remember your passcode with a server account. If you already have a server account, push the login button. Otherwise, push the create button to create a server account. Read more under the "Create a local account" section. <br> <i>You cannot change or recover your passcode after creating it.</i></p>
  <input type="password" bind:value={pass} placeholder="*Passcode"><br>
  <input type="password" bind:value={verify_pass} placeholder="*Verify Passcode"><br>
  <button onclick={()=>create("server", "create")} disabled={pass.length == 0 || user.length == 0 || pass != verify_pass}>Create a server account</button>
  <button onclick={()=>create("server", "login")} disabled={pass.length == 0 || user.length == 0 || pass != verify_pass}>Login</button>
{:else if db.user.length != 0}
  <p>Loading...</p>
  {#if show_home}
    <button onclick={() => page = "home"}>Go home</button>
  {/if}
{/if}