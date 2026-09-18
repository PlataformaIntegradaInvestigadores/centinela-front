import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mini-loader',
  templateUrl: './mini-loader.component.html',
})
export class MiniLoaderComponent {
  @Input() size: string = '5'; // default tailwind size class (w-5 h-5)
  @Input() color: string = 'text-red-700'; // default tailwind color class
}
