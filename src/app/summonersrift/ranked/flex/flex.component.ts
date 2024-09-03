import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import { DatabaseService } from 'src/app/shared/database.service';
import { RiotService } from 'src/app/shared/riot.service';
import { Summoner } from 'src/app/summoner/summoner.model';

@Component({
  selector: 'app-flex',
  templateUrl: './flex.component.html',
  styleUrls: ['./flex.component.css']
})
export class FlexComponent implements OnInit {

  roles: any = null;
  champs: any = null;
  champs1: any = null;
  roles1: any = null;

  rank = {
    name: 'None',
    rank: '',
    lp: 0,
    games: 0,
    wr: 'None',
    wins: 0,
    losses: 0
  };

  bestRole = 'None';

  bestChamp = {
    name: 'None',
    wr: ''
  };

  rowRank = false;
  rowWr = false;
  inPromo = false;
  promo: any;
  role = false;
  champ = false;

  currentSummoner = new Summoner();
  rnk: any;

  constructor(private riotService: RiotService, private authService: AuthService, private databaseService: DatabaseService) {
  }

  async ngOnInit(): Promise<void> {
    this.currentSummoner = this.authService.getSummoner();
    var data: any;
    data = await this.riotService.getRankedData(this.currentSummoner.region, this.currentSummoner.id);
    if (data.length != 0) {

      if (data.status) {
        alert(data.status.message);
        this.authService.deAuth;
      }
      else if (data[1].queueType === "RANKED_FLEX_SR")
        this.rnk = data[1];
      else if (data[0].queueType === "RANKED_FLEX_SR") this.rnk = data[0];
      if (data === false) {
        alert('Could not connect to backend server, please try again later');
        this.authService.deAuth();
      }
      else {
        this.rank.lp = this.rnk.leaguePoints;
        this.rank.name = this.toCapitalizedLower(this.rnk.tier);
        this.rank.rank = this.rnk.rank;
        if (this.rnk.miniSeries) {
          this.inPromo = true;
          this.promo = Array(this.rnk.miniSeries.wins).fill('W').concat(Array(this.rnk.miniSeries.losses).fill('L')).concat(Array(5).fill('*'));
        }
      }
    }

    var data2: any;
    data2 = await this.databaseService.getRSDData(this.currentSummoner.puuid, 440);
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

      var val: number[];
      val = Object.values(data2.roleWins);
      const high = Math.max(...val);

      switch (high) {
        case data2.roleWins.top: {
          this.bestRole = 'Top';
          break;
        }
        case data2.roleWins.jungle: {
          this.bestRole = 'Jungle';
          break;
        }
        case data2.roleWins.mid: {
          this.bestRole = 'Mid';
          break;
        }
        case data2.roleWins.bot: {
          this.bestRole = 'Bot';
          break;
        }
        case data2.roleWins.support: {
          this.bestRole = 'Support';
          break;
        }
      }

      this.champs1 = data2.champWins;

      this.roles1 = [
        { name: 'Top', games: data2.roleGp.top, wr: this.getPercent(data2.roleWins.top, data2.roleGp.top) },
        { name: 'Jungle', games: data2.roleGp.jungle, wr: this.getPercent(data2.roleWins.jungle, data2.roleGp.jungle) },
        { name: 'Mid', games: data2.roleGp.mid, wr: this.getPercent(data2.roleWins.mid, data2.roleGp.mid) },
        { name: 'Bot', games: data2.roleGp.bot, wr: this.getPercent(data2.roleWins.bot, data2.roleGp.bot) },
        { name: 'Support', games: data2.roleGp.support, wr: this.getPercent(data2.roleWins.support, data2.roleGp.support) }
      ]
    }

  }

  toggleRole() {
    this.role = !this.role;
    if (this.role) {
      this.roles = this.roles1;
    } else {
      this.roles = null;
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

  toCapitalizedLower(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getPercent(n1: number, n2: number) {
    if (n2 === 0) return '0%';
    return Math.round(((n1 / n2) * 100)).toString() + '%';
  }
}
