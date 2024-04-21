const cron = require('node-cron');
const express = require('express')
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
const { platform } = require('os');
const { get } = require('http');

app.get ('/', (req, res) => {
  res.sendFile(__dirname + '/html/home.html');
})

app.get('/member', (req, res) => {
  res.sendFile(__dirname + '/html/member.html');
})

app.get('/data', (req, res) => {
  const data = fs.readFileSync('./data/data.json');
  res.send(JSON.parse(data));
})

app.put('/member', async(req, res) => {
  const response = await addMember(req.body);
  res.send(response);
})

app.delete('/member/:id', async(req, res) => {
  const response = await removeMember(req.params.id);
  res.send(response);
})

app.listen(3000);

async function addMember(arg) {
  const data = fs.readFileSync('./data/data.json');
  const json = JSON.parse(data);

  const epicId = await getEpicName(arg.id);
  console.log(epicId)
  if (!epicId.displayName) return { error : 'EpicID is not found.'}
  let pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`);
  if (pr.status === 500) {
    pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events`);
  }
  if (!pr.status === 200) return { error : 'FortniteTracker is not found.'}
  if (!pr.powerRank.region === 'ASIA') return { error : 'Region is not ASIA.'}

  const newMember = {
    [arg.id]: {
      season: pr.currentSeason,
      name: arg.name,
      id: arg.id,
      team: arg.team,
      epicId: epicId.displayName,
      powerRank: pr.powerRank.statRank,
      points: pr.powerRank.points,
      yearPointsRank: pr.powerRank.yearPointsRank,
      yearPoints: pr.powerRank.yearPoints,
      seasonRanking: (pr.prSegments.find(segment => segment.segment === `season-${pr.currentSeason}`) || {}).points || 0,
      trackerURL: `https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`,
      trackerEpicId: pr.powerRank.accountId,
      trackerEpicName: pr.powerRank.name,
      region: pr.powerRank.region,
      platform: pr.powerRank.platform,
      date: new Date().toISOString(),
    }
  }

  json.push(newMember);
  fs.writeFileSync('./data/data.json', JSON.stringify(json, null, 4));
  return { success : 'Member is added.'};
}

async function removeMember(memberId) {
  const data = fs.readFileSync('./data/data.json');
  const json = JSON.parse(data);

  // jsonがオブジェクトの配列を含んでいると仮定
  const newData = json.filter(item => Object.keys(item)[0] !== memberId);

  fs.writeFileSync('./data/data.json', JSON.stringify(newData, null, 4));
  return { success: 'Member is removed.' };
}

async function updateUserStats() {
  // メンバーリストのステータスを更新する
  const data = fs.readFileSync('./data/data.json');
  const json = JSON.parse(data);
  const memberArray = json.map(obj => Object.values(obj)[0]);
  
  const newJson = [];

  for (const item of memberArray) {
    const epicId = await getEpicName(item.id);
    const pr = await getPR(item.trackerURL);
    newJson.push({
      [item.id]: {
        season: pr.currentSeason,
        name: item.name,
        id: item.id,
        team: item.team,
        epicId: epicId.displayName || item.epicId,
        powerRank: pr.powerRank.statRank || item.powerRank,
        points: pr.powerRank.points || item.points,
        yearPointsRank: pr.powerRank.yearPointsRank || item.yearPointsRank,
        yearPoints: pr.powerRank.yearPoints || item.yearPoints,
        seasonRanking: (prSegments.find(segment => segment.segment === `season-${pr.currentSeason}`) || {}).points || item.seasonRanking,
        trackerURL: `https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`,
        trackerEpicId: pr.powerRank.accountId || item.trackerEpicId,
        trackerEpicName: pr.powerRank.name || item.trackerEpicName,
        region: pr.powerRank.region || item.region,
        platform: pr.powerRank.platform || item.platform,
        date: new Date().toISOString(),
      }
    });
  }
  
  fs.writeFileSync('./data/data.json', JSON.stringify(newJson, null, 4));
  return { success : 'Member stats are updated.'};
}

async function getEpicName(arg){
  const response = await fetch(`https://fortniteapi.srvr.asia/api/epicid/${arg}`)
  return response.json();
}

async function getPR(arg){
  const response = await fetch(`https://powerranking.srvr.asia/api/user`,{
    method: 'POST',  
    headers: {
      'Content-Type': 'application/json',
    },
    body : JSON.stringify({ url: arg }),
  })
  if (response.status === 404) getPR(arg);
  return response.json();
}

// 毎朝午前5時に定期的にupdateUserStatsを実行するコードを書いてほしい
cron.schedule('0 5 * * *', () => {
  updateUserStats();
});

// PRのレスポンスデータ
// {
//   "season": 29,
//   "accountID": "e6c5f8e5-3847-46b5-a7d0-92698b4fe82b",
//   "region": "ASIA",
//   "name": "ecs rafa1x",
//   "platform": "PC",
//   "powerRank": 707,
//   "points": 8139,
//   "yearPointsRank": 699,
//   "yearPoints": 1986,
//   "seasonRanking": 96
//   }

// EpicIDのレスポンスデータ
// {
//   "id": "51e5963cf8b4419a9380fbd1d36525ba",
//   "displayName": "ecs tnkmnz"
// }