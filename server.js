const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const request = require('request');
const cors = require('cors');
const apiKey = '';

// Set up MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ':)',
  database: 'lol-page'
});

connection.connect(error => {
  if (error) {
    console.error(error);
  } else {
    console.log('Connected to MySQL');
  }
});

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

// MySQL routes
app.get('/summoners/:puuid', (req, res) => {
  const id = req.params.puuid;
  connection.query('SELECT * FROM summoners WHERE puuid = ?', [id], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(results);
    }
  });
});

app.get('/matches/:puuid/:matchid', (req, res) => {
  const id = req.params.puuid;
  const matchid = req.params.matchid;
  connection.query('SELECT * FROM matches WHERE puuid = ? AND matchid = ?', [id, matchid], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else if(results.length > 0) {
      res.send(true);
    } else res.send(false);
  });
});

app.get('/RSDGames/:puuid/:queueId', (req, res) => {
  const id = req.params.puuid;
  const queueid = req.params.queueId;
  connection.query('SELECT * FROM matches WHERE puuid = ? AND queueId = ?', [id, queueid], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else{
      res.send(results);
    }
  });
});

app.post('/summoners/', (req, res) => {
  const summoner = req.body;
  const sql = 'INSERT INTO summoners SET ?';
  connection.query(sql, summoner, (error, result) => {
    if (error) {
      res.status(500).send(error.sqlMessage);
    } else {
      res.send(true);
    }
  });
});

app.post('/matches/', (req, res) => {
  const match = req.body;
  const sql = 'INSERT INTO matches SET ?';
  connection.query(sql, match, (error, result) => {
    if (error) {
      res.status(500).send(error.sqlMessage);
    } else {
      res.send(result);
      
    }
  });
});


//Request summoner
app.get('/online/summoner/:region/:username', (req, res) => {
  const username = req.params.username;
  const region = req.params.region;
  const options = {
    method: 'GET',
    url: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}?api_key=${apiKey}`,
    headers: {
    }
  };
  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(body);
    }
  });
});

app.get('/online/ranked/:region/:accountId', (req, res) => {
  const accountId = req.params.accountId;
  const region = req.params.region;
  const options = {
    method: 'GET',
    url: `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${accountId}?api_key=${apiKey}`,
    headers: {
    }
  };
  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(body);
    }
  });
});

//Request all matches
app.get('/online/matches/:region/:puuid/:start/:count', async (req, res) => {
  const puuid = req.params.puuid;
  const region = req.params.region;
  let start = 0;
  const count = 100;
  let data = [];
  let hundred = true;

  while (hundred && start < 10000) {
    const test = await new Promise((resolve, reject) => {
      request(`https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}&api_key=${apiKey}`, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
    start = start + 100;
    data = data.concat(test);
    hundred = test.length === 100;
  }
  res.send(data);
});

//get match data
app.get('/online/mData/:region/:puuid/:matchid', async (req, res) => {
  const puuid = req.params.puuid;
  const region = req.params.region;
  const matchid = req.params.matchid;
  const options = {
    method: 'GET',
    url: `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchid}?api_key=${apiKey}`,
    headers: {
    }
  };
  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send(body);
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('API server listening on port 3000');
});
