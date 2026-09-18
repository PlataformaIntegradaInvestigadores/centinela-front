import { Component, OnInit } from '@angular/core';
import { AuthorService } from '../../../../search-engine/domain/services/author.service';
import { ActivatedRoute } from '@angular/router';
import { NameValue } from '../../../../shared/interfaces/dashboard.interface';
import { Subscription } from 'rxjs';
import { User } from '../../../domain/entities/user.interfaces';
import { UserDataService } from '../../../domain/services/user_data.service';

@Component({
  selector: 'app-fingerprint',
  templateUrl: './fingerprint.component.html',
  styleUrls: ['./fingerprint.component.css'],
})
export class FingerprintComponent implements OnInit {
  constructor(
    private authorService: AuthorService,
    private route: ActivatedRoute,
    private userDataService: UserDataService,
  ) {}

  private userSubscription: Subscription = new Subscription();
  user: User | null = null;
  // author!:Author
  scopusId!: number;
  words: NameValue[] = [];
  loading = false;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = parseInt(params.get('id') ?? '');
      if (this.isNumeric(id.toString())) {
        this.scopusId = id;
        this.getTopics();
      } else {
        this.userSubscription = this.userDataService.getUser().subscribe((user: User | null) => {
          this.user = user;
          if (this.user?.scopus_id) {
            this.scopusId = parseInt(this.user.scopus_id);
            this.getTopics();
          }
        });
      }
    });
  }
  isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }

  getTopics() {
    if (!this.scopusId) {
      return;
    }
    this.loading = true;
    this.authorService.getTopicsById(this.scopusId).subscribe({
      next: (data) => {
        this.words = data || [];
        this.loading = false;
      },
      error: () => {
        this.words = [];
        this.loading = false;
      },
    });
  }
}
