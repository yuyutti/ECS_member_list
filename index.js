const express = require('express')
const app = express()
const SteinStore = require("stein-js-client");
const store = new SteinStore("https://api.steinhq.com/v1/storages/63eb636aeced9b09e9beb441");

process.on('uncaughtException', function(err) {
  console.log(err);
});

app.use(express.static('./'));

let send_data

app.get('/',(req, res) => {
  store.read("index", {authentication: { username: "yuyuttikunnhatennsainanodaxa", password: "fwuasicjnks@fecknfaweioknmjsedfvnihowfveomfowe" }}).then(data => {
    send_data = data
  });
  res.sendFile(__dirname + "/html/index.html")
})

app.get('/data',(req,res) => {
  if (send_data && Array.isArray(send_data)) {
    const hasPlayerName = send_data.every(item => item.playername);
    if (hasPlayerName) {
      res.json(send_data);
      send_data = null;
    } else {
      res.status(400).json({ error: 'playername property is missing in some elements' });
    }
  } else {
    res.status(400).json({ error: 'send_data is not defined or is not an array' });
  }
})

app.listen(3000, function(){
  console.log('起動完了 => Express')
})
