import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { DatabaseService } from 'src/app/shared/database.service';
import { Summoner } from 'src/app/summoner/summoner.model';

@Component({
  selector: 'app-aram',
  templateUrl: './aram.component.html',
  styleUrls: ['./aram.component.css']
})
export class AramComponent implements OnInit {

  champs: any = null;
  champs1: any = null;

  rank = {
    games: 0,
    wr: 'None',
    wins: 0,
    losses: 0
  };

  currentSummoner = new Summoner();
  rnk: any;

  constructor(private authService: AuthService, private databaseService: DatabaseService) {
  }

  async ngOnInit(): Promise<void> {
    this.currentSummoner = this.authService.getSummoner();

    var data2: any;
    data2 = await this.databaseService.getRSDData(this.currentSummoner.puuid, 450);
    console.log(data2);
    if (data2 === false) {
      alert('Could not connect to backend server, please try again later');
      this.authService.deAuth();
    }
    if (!(data2.champWins.length === 0)) {

      this.rank.games = data2.gp;
      this.rank.wins = data2.wins;
      this.rank.losses = data2.losses;
      this.rank.wr = this.getPercent(this.rank.wins, this.rank.games);


      this.champs1 = data2.champWins;

      this.champs = this.champs1.map((champ: { name: string; gamesPlayed: number; wins: number; }) => {
        return {
          name: champ.name,
          games: champ.gamesPlayed,
          wins: champ.wins,
          wr: this.getPercent(champ.wins, champ.gamesPlayed)
        }
      });
    }
  }

  getPercent(n1: number, n2: number) {
    if (n2 === 0) return '0%';
    return Math.round(((n1 / n2) * 100)).toString() + '%';
  }

}
