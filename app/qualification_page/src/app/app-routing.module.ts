import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AramComponent } from './howlingabyss/aram/aram.component';
import { SummonerComponent } from './summoner/summoner.component';
import { SummonersriftComponent } from './summonersrift/summonersrift.component';

const routes: Routes = [
  {path: "", redirectTo: '/summoner', pathMatch: 'full'},
  {path: "rift", component: SummonersriftComponent, canActivate: [AuthGuard]},
  {path: "ARAM", component: AramComponent, canActivate: [AuthGuard]},
  {path: "summoner", component: SummonerComponent},
  {path: "**", redirectTo: '/summoner'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
