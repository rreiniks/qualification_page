CREATE DATABASE IF NOT EXISTS lol_page;
USE lol_page;

ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'testa_parole_123';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS summoners (
    puuid varchar(78) NOT NULL PRIMARY KEY,
    name varchar(50) NOT NULL,
    profileIconId INT NULL,
    summonerLevel INT NOT NULL,
    accountId varchar(56) NOT NULL,
    region varchar(10) NOT NULL,
    id varchar(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
    puuid varchar(78) NOT NULL,
    matchId varchar(80) NOT NULL,
    championName varchar(20) NOT NULL,
    teamPosition varchar(10) NULL,
    win tinyint NOT NULL,
    gameMode varchar(45) NOT NULL,
    gameType varchar(45) NOT NULL,
    queueId int NOT NULL,
    PRIMARY KEY (puuid, matchId),
    FOREIGN KEY (puuid) REFERENCES summoners(puuid)
);