import { Injectable, SimpleChange } from "@angular/core";
import { Router } from "@angular/router";
import { Summoner } from "../summoner/summoner.model";


@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    isAuthenticated = false;
    currentSummoner = new Summoner();
  
    constructor(private router: Router) { }

    auth(sum: Summoner){
        this.isAuthenticated = true;
        this.currentSummoner = sum;
    }

    deAuth(){
        this.isAuthenticated = false;
        this.currentSummoner = new Summoner();
        this.router.navigate(['/summoner']);
    }

    getSummoner(){
      return this.currentSummoner;
    }
  }