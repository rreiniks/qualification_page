import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lol-page';

  loadedFeature = 'summoner';

  onNavigate(feature: Event) {
    console.log('test');
    console.log(feature);
    // this.loadedFeature = feature.fea;
  }

}
