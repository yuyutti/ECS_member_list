const express = require('express')
const app = express()
const SteinStore = require("stein-js-client");
const ECS = new SteinStore("https://api.steinhq.com/v1/storages/64f9cb3beced9b09e9ef9e3f");
const ECG_competitive = new SteinStore("https://api.steinhq.com/v1/storages/64f9cb6ed27cdd09f0146222");
const ECS_nurturing = new SteinStore("https://api.steinhq.com/v1/storages/64f9cb55eced9b09e9ef9e4e");

process.on('uncaughtException', function(err) {
  console.log(err);
});

app.use(express.static('./'));

let send_data_ecs
let send_data_ecg_c
let send_data_ecg_n

app.get('/',(req, res) => {
  let id = req.query.id;
  if (id !== 'ecs' && id !== 'ecg_c' && id !== 'ecg_n') id = 'ecs';
  if(id === "ecs"){
    ECS.read("index", {authentication: { username: "yuyutti", password: "yuyutti0625" }}).then(data => {
      send_data_ecs = data
    });
    res.sendFile(__dirname + "/html/index.html")
  }
  if(id === "ecg_c"){
    ECG_competitive.read("index", {authentication: { username: "yuyutti", password: "yuyutti0625" }}).then(data => {
      send_data_ecg_c = data
    });
    res.sendFile(__dirname + "/html/index.html")
  }
  if(id === "ecg_n"){
    ECS_nurturing.read("index", {authentication: { username: "yuyutti", password: "yuyutti0625" }}).then(data => {
      send_data_ecg_n = data
    });
    res.sendFile(__dirname + "/html/index.html")
  }
})

app.get('/data',(req,res) => {
  let id = req.query.id;
  if(id === "ecs"){
    if (send_data_ecs && Array.isArray(send_data_ecs)) {
      const hasPlayerName = send_data_ecs.every(item => item.playername);
      if (hasPlayerName) {
        res.json(send_data_ecs);
        send_data_ecs = null;
      } else {
        res.status(400).json({ error: 'playername property is missing in some elements' });
      }
    } else {
      res.status(400).json({ error: 'send_data is not defined or is not an array' });
    }
    return;
  }

  if(id === "ecg_c"){
    if (send_data_ecg_c && Array.isArray(send_data_ecg_c)) {
      const hasPlayerName = send_data.every(item => item.playername);
      if (hasPlayerName) {
        res.json(send_data_ecg_c);
        send_data_ecg_c = null;
      } else {
        res.status(400).json({ error: 'playername property is missing in some elements' });
      }
    } else {
      res.status(400).json({ error: 'send_data is not defined or is not an array' });
    }
    return;
  }

  if(id === "ecg_n"){
    if (send_data_ecg_n && Array.isArray(send_data_ecg_n)) {
      const hasPlayerName = send_data_ecg_n.every(item => item.playername);
      if (hasPlayerName) {
        res.json(send_data_ecg_n);
        send_data_ecg_n = null;
      } else {
        res.status(400).json({ error: 'playername property is missing in some elements' });
      }
    } else {
      res.status(400).json({ error: 'send_data is not defined or is not an array' });
    }
    return;
  }
})

app.listen(3000, function(){
  console.log('起動完了 => Express')
})
