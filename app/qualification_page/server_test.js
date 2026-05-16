const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

// Set up MySQL connection (savienojums ar tavu K3s testa datubāzi)
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'root',
  password: 'testa_parole_123',
  database: 'lol_page'
});

connection.connect(error => {
  if (error) {
    console.error(error);
  } else {
    console.log('Connected to MySQL TEST Database');
  }
});

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ==========================================
// 1. STANDARTA MARŠRUTI (Mājaslapas iekšējai loģikai)
// ==========================================
app.get('/summoners/:puuid', (req, res) => {
  const id = req.params.puuid;
  connection.query('SELECT * FROM summoners WHERE puuid = ?', [id], (error, results) => {
    if (error) res.status(500).send(error);
    else res.send(results);
  });
});

app.get('/matches/:puuid/:matchid', (req, res) => {
  const id = req.params.puuid;
  const matchid = req.params.matchid;
  connection.query('SELECT * FROM matches WHERE puuid = ? AND matchid = ?', [id, matchid], (error, results) => {
    if (error) res.status(500).send(error);
    else if(results.length > 0) res.send(true);
    else res.send(false);
  });
});

app.get('/RSDGames/:puuid/:queueId', (req, res) => {
  const id = req.params.puuid;
  const queueid = req.params.queueId;
  connection.query('SELECT * FROM matches WHERE puuid = ? AND queueId = ?', [id, queueid], (error, results) => {
    if (error) res.status(500).send(error);
    else res.send(results);
  });
});

app.post('/summoners/', (req, res) => {
  const summoner = req.body;
  const sql = 'INSERT INTO summoners SET ?';
  connection.query(sql, summoner, (error, result) => {
    if (error) res.status(500).send(error.sqlMessage);
    else res.send(true);
  });
});

app.post('/matches/', (req, res) => {
  const match = req.body;
  const sql = 'INSERT INTO matches SET ?';
  connection.query(sql, match, (error, result) => {
    if (error) res.status(500).send(error.sqlMessage);
    else res.send(result);
  });
});

// ==========================================
// 2. MOCK RIOT API MARŠRUTI (Aizvieto īsto Riot API)
// ==========================================

// Simulējam Riot Summoner pieprasījumu
app.get('/online/summoner/:region/:username', (req, res) => {
  const username = req.params.username;
  const region = req.params.region;

  // Meklējam, lai sakrīt abi – gan vārds, gan reģions!
  connection.query('SELECT * FROM summoners WHERE name = ? AND region = ?', [username, region], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else if (results.length > 0) {
      res.send(results[0]);
    } else {
      // Ja reģions nesakrīt, tad sūtām 404, tieši kā Riot API
      res.send({ status: { status_code: 404, message: 'Summoner not found in this region' } });
    }
  });
});

// Simulējam Ranked datus
app.get('/online/ranked/:region/:summonerId', (req, res) => {
  const summonerId = req.params.summonerId;

  connection.query('SELECT * FROM ranked_stats WHERE summonerId = ?', [summonerId], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else {
      // Pārveidojam datu bāzes formātu Riot API JSON standartā
      const rankedData = results.map(row => {
        let entry = {
          queueType: row.queueType,
          tier: row.tier,
          rank: row.rank_tier,
          leaguePoints: row.leaguePoints,
          wins: row.wins,
          losses: row.losses
        };
        
        // Pievienojam promo datus, ja spēlētājam tādi ir ģenerēti
        if (row.miniSeries) {
          entry.miniSeries = typeof row.miniSeries === 'string' ? JSON.parse(row.miniSeries) : row.miniSeries;
        }
        return entry;
      });
      
      res.send(rankedData);
    }
  });
});

// Simulējam Riot Match list pieprasījumu
app.get('/online/matches/:region/:puuid/:start/:count', (req, res) => {
  const puuid = req.params.puuid;
  
  connection.query('SELECT matchId FROM matches WHERE puuid = ? LIMIT 100', [puuid], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else {
      // Angular frontend sagaida vienkāršu masīvu ar maču ID: ["EUW1_123", "EUW1_456"]
      const matchIds = results.map(row => row.matchId);
      res.send(matchIds);
    }
  });
});

// Simulējam viena mača datu pieprasījumu
app.get('/online/mData/:region/:puuid/:matchid', (req, res) => {
  const puuid = req.params.puuid;
  const matchid = req.params.matchid;

  connection.query('SELECT * FROM matches WHERE puuid = ? AND matchid = ?', [puuid, matchid], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else if (results.length > 0) {
      const row = results[0];
      
      // Iepakojam testa datubāzes datus "Fake Riot API" JSON struktūrā
      const mockRiotResponse = {
        info: {
          gameMode: row.gameMode,
          gameType: row.gameType,
          queueId: row.queueId,
          participants: [
            {
              puuid: row.puuid,
              win: row.win,
              championName: row.championName,
              teamPosition: row.teamPosition
            }
            // Pārējos 9 spēlētājus frontendam nevajag, tas pārbauda tikai pēc puuid
          ]
        }
      };
      res.send(mockRiotResponse);
    } else {
      res.send({ status: { status_code: 404, message: 'Test match not found' } });
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('TEST API server listening on port 3000');
});