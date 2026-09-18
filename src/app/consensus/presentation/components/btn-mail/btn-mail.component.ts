import { Component, Input } from '@angular/core';
import { UserG } from 'src/app/group/domain/entities/user.interface';

@Component({
  selector: 'btn-mail',
  templateUrl: './btn-mail.component.html',
  styleUrls: ['./btn-mail.component.css'],
})
export class BtnMailComponent {
  @Input() member: UserG | null = null;
}
