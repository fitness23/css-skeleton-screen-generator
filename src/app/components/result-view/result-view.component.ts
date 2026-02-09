import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-result-view',
  standalone: true,
  templateUrl: './result-view.component.html'
})
export class ResultViewComponent {
  @Input({ required: true }) randomSkeletonName!: string;
}
