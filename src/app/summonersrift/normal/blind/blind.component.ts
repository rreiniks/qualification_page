import { Component, ErrorHandler, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { DatabaseService } from 'src/app/shared/database.service';
import { Summoner } from 'src/app/summoner/summoner.model';

@Component({
  selector: 'app-blind',
  templateUrl: './blind.component.html',
  styleUrls: ['./blind.component.css']
})
export class BlindComponent implements OnInit {

  champs: any = null;
  champs1: any = null;

  rank = {
    games: 0,
    wr: 'None',
    wins: 0,
    losses: 0
  };

  bestChamp = {
    name: 'None',
    wr: ''
  };

  rowWr = false;
  champ = false;

  currentSummoner = new Summoner();
  rnk: any;

  constructor(private authService: AuthService, private databaseService: DatabaseService) {
  }

  async ngOnInit(): Promise<void> {
    this.currentSummoner = this.authService.getSummoner();

    var data2: any;
    data2 = await this.databaseService.getRSDData(this.currentSummoner.puuid, 430);
    if (data2 === false) {
      alert('Could not connect to backend server, please try again later');
      this.authService.deAuth();
    }
    if (!(data2.champWins.length === 0)) {

      this.rank.games = data2.gp;
      this.rank.wins = data2.wins;
      this.rank.losses = data2.losses;
      this.rank.wr = this.getPercent(this.rank.wins, this.rank.games);

      this.bestChamp.name = data2.champWins[0].name;
      this.bestChamp.wr = this.getPercent(data2.champWins[0].wins, data2.champWins[0].gamesPlayed);


      this.champs1 = data2.champWins;

    }

  }

  toggleChamp() {
    this.champ = !this.champ;
    if (this.champ && this.champs1) {
      this.champs = this.champs1.map((champ: { name: string; gamesPlayed: number; wins: number; }) => {
        return {
          name: champ.name,
          games: champ.gamesPlayed,
          wr: this.getPercent(champ.wins, champ.gamesPlayed)
        }
      });
    } else {
      this.champs = null;
    }
  }

  getPercent(n1: number, n2: number) {
    if (n2 === 0) return '0%';
    return Math.round(((n1 / n2) * 100)).toString() + '%';
  }

}
