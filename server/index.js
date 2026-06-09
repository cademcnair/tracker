const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { writeFileSync, readFileSync } = fs;

const app = express();
app.use(cors());
app.use(express.json());

//
// -----------------------
// ***********************
// -----------------------
// 
// ADD /server/... for cPanel file upload
//
// -----------------------
// ***********************
// -----------------------
// 


app.post("/get", (req, res) => {
  try {
    if (req.body.user.includes("..")) return res.status(403).send("Invalid username");
    const data = JSON.parse(readFileSync("data/" + req.body.user + ".json", "utf8"));
    if (data.pass == req.body.pass) {
      res.json(data);
    } else {
      res.status(401).send("Incorrect passcode");
    }
  } catch (e) {
    res.status(404).send("Could not find the user");
  }
})

app.post("/post", (req, res) => {
  try {
    if (req.body.user.includes("..") || req.body.user.includes("/")) return res.status(403).send("Invalid username");
    const data = JSON.parse(readFileSync("data/" + req.body.user + ".json", "utf8"));
    if (data.pass == req.body.pass) writeFileSync("data/" + req.body.user + ".json", JSON.stringify(req.body.data), "utf8")
    else res.status(401).send("Incorrect passcode");
  } catch (e) {
    writeFileSync("data/" + req.body.user + ".json", JSON.stringify(req.body.data), "utf8")
  }
  res.send();
})

app.post("/create", (req, res) => {
  try {
    if (req.body.user.includes("..") || req.body.user.includes("/")) return res.status(403).send("Invalid username");
    readFileSync("data/" + req.body.user + ".json", "utf8");
    res.send("true");
  } catch (e) {
    writeFileSync("data/" + req.body.user + ".json", JSON.stringify({
      user: req.body.user,
      pass: req.body.pass
    }))
    res.send("false");
  }
})

app.listen(3000)