const cron = require('node-cron');
const express = require('express')
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

app.get ('/', (req, res) => {
  res.sendFile(__dirname + '/html/home.html');
})

app.get('/member', (req, res) => {
  res.sendFile(__dirname + '/html/member.html');
})

app.get('/data', (req, res) => {
  const data = readFile('./data/data.json');
  res.send(JSON.parse(data));
})

app.get('/update', (req, res) => {
  updateUserStats();
  res.send({ success : 'Member stats are updated.'});
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
  let pr;
  let epicId = false;

  if (arg.epicName) {
    pr = await getPR(`https://fortnitetracker.com/profile/kbm/${arg.epicName}/events?region=ASIA`);
  }
  else {
    epicId = await getEpicName(arg.id);
    console.log(epicId)
    if (!epicId.displayName) return { error : 'EpicID is not found.'}
    pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`);
    if (pr.status === 500) {
      pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events`);
    }
    if (!pr.status === 200) return { error : 'FortniteTracker is not found.'}
    if (!pr.powerRank.region === 'ASIA') return { error : 'Region is not ASIA.'}
  }

  const newMember = {
    [arg.id]: {
      season: pr.currentSeason,
      name: arg.name,
      id: arg.id,
      team: arg.team,
      epicId: arg.epicName || epicId.displayName,
      powerRank: pr.powerRank.statRank,
      points: pr.powerRank.points,
      yearPointsRank: pr.powerRank.yearPointsRank,
      yearPoints: pr.powerRank.yearPoints,
      seasonRanking: (pr.prSegments.find(segment => segment.segment === `season-${pr.currentSeason}`) || {}).points || 0,
      trackerURL: `https://fortnitetracker.com/profile/kbm/${arg.epicName || epicId.displayName}/events?region=ASIA`,
      trackerEpicId: pr.powerRank.accountId,
      trackerEpicName: pr.powerRank.name,
      region: pr.powerRank.region,
      platform: pr.powerRank.platform,
      date: new Date().toISOString(),
    }
  }
  const data = readFile('./data/data.json');
  const json = JSON.parse(data);
  json.push(newMember);
  writeFile('./data/data.json', JSON.stringify(json, null, 4));
  return { success : 'Member is added.'};
}

async function removeMember(memberId) {
  const data = readFile('./data/data.json');
  const json = JSON.parse(data);

  const newData = json.filter(item => Object.keys(item)[0] !== memberId);

  writeFile('./data/data.json', JSON.stringify(newData, null, 4));
  return { success: 'Member is removed.' };
}

async function updateUserStats() {
  try {
    const data = await readFile('./data/data.json');
    const json = JSON.parse(data);

    for (const item of json) {
      const key = Object.keys(item)[0]; // 例えば '51e5963cf8b4419a9380fbd1d36525ba'
      try {
        const userData = item[key];
        const epicId = await getEpicName(userData.id);
        const pr = await getPR(`https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`);
        
        // 更新するデータを設定
        userData.season = pr.currentSeason;
        userData.epicId = epicId.displayName || userData.epicId;
        userData.powerRank = pr.powerRank.statRank || userData.powerRank;
        userData.points = pr.powerRank.points || userData.points;
        userData.yearPointsRank = pr.powerRank.yearPointsRank || userData.yearPointsRank;
        userData.yearPoints = pr.powerRank.yearPoints || userData.yearPoints;
        userData.seasonRanking = (pr.prSegments.find(segment => segment.segment === `season-${pr.currentSeason}`) || {}).points || userData.seasonRanking;
        userData.trackerURL = `https://fortnitetracker.com/profile/kbm/${epicId.displayName}/events?region=ASIA`;
        userData.trackerEpicId = pr.powerRank.accountId || userData.trackerEpicId;
        userData.trackerEpicName = pr.powerRank.name || userData.trackerEpicName;
        userData.region = pr.powerRank.region || userData.region;
        userData.platform = pr.powerRank.platform || userData.platform;
        userData.date = new Date().toISOString();

        // JSONファイルに変更を書き込む
        await writeFile('./data/data.json', JSON.stringify(json, null, 4));
      } catch (error) {
        continue; // エラー発生時、そのデータをスキップ
      }
    }
    return { success: 'Member stats are updated.' };
  } catch (error) {
    console.error('Fatal error reading or writing file:', error);
    throw new Error('Failed to update user stats');
  }
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
  return response.json();
}

// 毎朝午前5時に定期的にupdateUserStatsを実行するコードを書いてほしい
cron.schedule('0 5 * * *', () => {
  updateUserStats();
});