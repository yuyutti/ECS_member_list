const express = require('express')
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');

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
  if (!epicId.displayName) return { error : 'EpicID is not found.'}
  let pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`);
  if (!pr.season) {
    pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`);
    if (!pr.season) return { error : 'PR is not found.'}
  }

  const newMember = {
    [arg.id]: {
      name: arg.name,
      id: arg.id,
      team: arg.team,
      id: epicId.accountID,
      epicId: epicId.displayName,
      powerRank: pr.powerRank,
      points: pr.points,
      yearPointsRank: pr.yearPointsRank,
      yearPoints: pr.yearPoints,
      seasonRanking: pr.seasonPoints,
      trackerURL: `https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`,
    }
  }

  json.push(newMember);
  fs.writeFileSync('./data/data.json', JSON.stringify(json, null, 4));
  return { success : 'Member is added.'};
}

async function removeMember(arg) {
  // リストからメンバーを削除する
  const data = fs.readFileSync('./data/data.json');
  const json = JSON.parse(data);
  const newData = json.filter((item) => item.id !== arg.id);
  fs.writeFileSync('./data/data.json', JSON.stringify(newData, null, 4));
  return { success : 'Member is removed.'};
}

async function updateUserStats() {
  // メンバーリストのステータスを更新する
  const data = fs.readFileSync('./data/data.json');
  const json = JSON.parse(data);
  
  // 並列処理を使用してメンバー一人一人getEpicNameとgetPRを実行する
  promises = json.map(async (item) => {
    const epicId = await getEpicName(item.id);
    const pr = await getPR(item.trackerURL);
    return {
      [item.id]: {
        name: item.name,
        id: item.id,
        team: item.team,
        id: epicId.accountID,
        epicId: epicId.displayName,
        powerRank: pr.powerRank,
        points: pr.points,
        yearPointsRank: pr.yearPointsRank,
        yearPoints: pr.yearPoints,
        seasonRanking: pr.seasonPoints,
        trackerURL: `https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`,
      }
    }
  })

  // 並列処理の結果を待って、データを更新する
  const newJson = await Promise.all(promises);
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