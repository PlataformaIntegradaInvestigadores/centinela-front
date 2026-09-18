import { Component } from '@angular/core';
import { Status } from 'src/app/search-engine/domain/entities/author.comparator.interface';
import { UpdateCentinelaService } from 'src/app/search-engine/domain/services/update-centinela.service';

@Component({
  selector: 'app-corpus',
  templateUrl: './update-centinela.component.html',
  styleUrls: ['./update-centinela.component.css'],
})
export class UpdateCentinelaComponent {
  integrationStatus: Status | undefined;
  loading: boolean = false;
  constructor(private updateCentinelaService: UpdateCentinelaService) {}
}
