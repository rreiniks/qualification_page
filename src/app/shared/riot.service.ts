import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Match } from './match.model';
import { catchError, first, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RiotService {

    constructor(private http: HttpClient) {
    }

    getRiotSummonerData(region: string, username: string) {
        return this.http.get('http://localhost:3000/online/summoner/' + region + '/' + username);
    }

    async updateMatchList(region: string, puuid: string): Promise<any> {
        try {
            const start = 0;
            const count = 100;
            var data: any;
            data = await this.http.get('http://localhost:3000/online/matches/' + region + '/' + puuid + '/' + start + '/' + count).pipe(first()).toPromise();
            const matches = [];
            for (const m in data) {
                const match = await this.http.get('http://localhost:3000/matches/' + puuid + '/' + data[m]).pipe(first()).toPromise();
                if (!match) {
                    matches.push(data[m]);
                }
            }
            return matches;
        } catch (error) {
            return false;
        }
    }


    async getMatchData(matchid: string, puuid: string, region: string) {
        return new Promise((resolve) => {
            this.http.get('http://localhost:3000/online/mData/' + region + '/' + puuid + '/' + matchid).pipe(
                catchError(error => {
                    return of(false);
                })
            ).subscribe(res => {
                var data: any;
                data = res;
                var match = new Match;
                var i = 0;
                if (data.info && data.info.participants[0]) {
                    if (data.info.gameType === 'CUSTOM_GAME' || !data.info.gameType) resolve(false);
                    for (i; i < 9; i++) {
                        if (data.info.participants[i].puuid === puuid) break;
                    }
                    match.gameMode = data.info.gameMode;
                    match.gameType = data.info.gameType;
                    match.matchid = matchid;
                    match.puuid = puuid;
                    match.win = data.info.participants[i].win;
                    match.championName = data.info.participants[i].championName;
                    match.queueId = data.info.queueId;
                    if (match.gameMode === 'CLASSIC') {
                        match.teamPosition = data.info.participants[i].teamPosition;
                    }
                    resolve(match);
                } else if (data.status && data.status.status_code) {
                    resolve(data);
                } else {
                    //unknown error ignore
                    resolve(false);
                }
            })
        })
    }

    async getRankedData(region: string, id: string) {
        return new Promise((resolve) => {
            this.http.get('http://localhost:3000/online/ranked/' + region + '/' + id).pipe(
                catchError(error => {
                    console.error(error);
                    resolve(false);
                    return of(false);
                })
            ).subscribe(res => {
                var data: any;
                data = res;
                resolve(data);
            })
        })
    }

}