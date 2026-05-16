import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Summoner } from '../summoner/summoner.model';

@Component({
  selector: 'app-summonersrift',
  templateUrl: './summonersrift.component.html',
  styleUrls: ['./summonersrift.component.css']
})
export class SummonersriftComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  currentSummoner!: Summoner;

  ngOnInit(): void {
  }

}
