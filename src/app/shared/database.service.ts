import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Summoner } from '../summoner/summoner.model';
import { RiotService } from './riot.service';
import { Match } from './match.model';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    constructor(private http: HttpClient, private riotService: RiotService) { }

    checkForSummoner(puuid: string) {
        return new Promise((resolve) => {
            this.http.get('http://localhost:3000/summoners/' + puuid).subscribe(res => {
                var data: any;
                data = res;
                resolve(data.length);
            })
        });
    }


    putSummoner(summoner: Summoner) {
        return this.http.post('http://localhost:3000/summoners', summoner);
    }

    async storeMatches(puuid: string, matches: string[], region: string) {
        return new Promise(async (resolve) => {
            for (const match in matches) {
                var m = new Match;
                var data: any;

                data = (await this.riotService.getMatchData(matches[match], puuid, region));

                if (data.matchid) {

                    m = data;

                    const postPromise = new Promise((resolve) => {
                        this.http.post('http://localhost:3000/matches', m).subscribe(res => {
                            var data: any;
                            data = res;
                            if (!data.affectedRows) resolve(false);
                            else resolve(true);
                        });
                    });

                    const postSuccess = await postPromise;

                } else if (data.status) {
                    resolve(false);
                }
            }
            resolve(true);
        });
    }

    async getRSDData(puuid: string, queueId: number) {
        return new Promise(async (resolve) => {
            var data: any;
            var returnData: {
                wins: number,
                losses: number,
                gp: number,
                roleWins: {
                    top: number,
                    jungle: number,
                    mid: number,
                    bot: number,
                    support: number,
                },
                roleGp: {
                    top: number,
                    jungle: number,
                    mid: number,
                    bot: number,
                    support: number,
                },
                champWins: [
                    { name: string, gamesPlayed: number, wins: number },
                ],
            } = {
                wins: 0,
                losses: 0,
                gp: 0,
                roleWins: {
                    top: 0,
                    jungle: 0,
                    mid: 0,
                    bot: 0,
                    support: 0,
                },
                roleGp: {
                    top: 0,
                    jungle: 0,
                    mid: 0,
                    bot: 0,
                    support: 0,
                },
                champWins: [{ name: 'dummy', gamesPlayed: 0, wins: 0 }],
            }




            try {
                data = await new Promise((resolve1) => {
                    this.http.get('http://localhost:3000/RSDGames/' + puuid + '/' + queueId).subscribe(res => {
                        resolve1(res);
                    });
                })
                for (var x in data) {
                    returnData.gp++;
                    if (data[x].win) returnData.wins++;
                    else returnData.losses++;
                    switch (data[x].teamPosition) {
                        case 'TOP': {
                            returnData.roleGp.top++;
                            if (data[x].win) returnData.roleWins.top++;
                            break;
                        }
                        case 'JUNGLE': {
                            returnData.roleGp.jungle++;
                            if (data[x].win) returnData.roleWins.jungle++;
                            break;
                        }
                        case 'MIDDLE': {
                            returnData.roleGp.mid++;
                            if (data[x].win) returnData.roleWins.mid++;
                            break;
                        }
                        case 'BOTTOM': {
                            returnData.roleGp.bot++;
                            if (data[x].win) returnData.roleWins.bot++;
                            break;
                        }
                        case 'UTILITY': {
                            returnData.roleGp.support++;
                            if (data[x].win) returnData.roleWins.support++;
                            break;
                        }
                    }
                    var n: number = -1;
                    if (data[x].championName === 'FiddleSticks') data[x].championName = 'Fiddlesticks'; //RIOT api inconsistency
                    for (var i = 0; i < returnData.champWins.length; i++) {
                        if (returnData.champWins[i].name === data[x].championName) {
                            n = i;
                            break;
                        }
                    }
                    if (n != -1) {
                        returnData.champWins[i].gamesPlayed++;
                        if (data[x].win) returnData.champWins[i].wins++;
                    } else {
                        if (data[x].win) var w = 1;
                        else var w = 0;
                        returnData.champWins.push({
                            name: data[x].championName,
                            gamesPlayed: 1,
                            wins: w,
                        })
                    }
                }
                returnData.champWins.shift();
                returnData.champWins = returnData.champWins.sort(function (a, b) {
                    return b.gamesPlayed - a.gamesPlayed;
                });
                resolve(returnData);
                return returnData;
            } catch (error) {
                resolve(false);
                return false;
            }
        })
    }

}
