import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthorService } from 'src/app/search-engine/domain/services/author.service';
import { Author } from 'src/app/shared/interfaces/author.interface';
import { User } from '../../../domain/entities/user.interfaces';
import { Subscription } from 'rxjs';
import { UserDataService } from '../../../domain/services/user_data.service';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.css'],
})
export class NetworkComponent implements OnInit {
  author: Author | undefined;
  scopusId!: number;
  loading = false;
  private userSubscription: Subscription = new Subscription();
  user: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private authorService: AuthorService,
    private userDataService: UserDataService,
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = parseInt(params.get('id') ?? '');
      if (this.isNumeric(id.toString())) {
        this.scopusId = id;
        this.getAuthor();
      } else {
        this.userSubscription = this.userDataService.getUser().subscribe((user: User | null) => {
          this.user = user;
          if (this.user?.scopus_id) {
            this.scopusId = parseInt(this.user.scopus_id);
            this.getAuthor();
          }
        });
      }
    });
  }

  isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }

  getAuthor(): void {
    if (this.scopusId) {
      this.loading = true;
      this.authorService.getAuthorById(this.scopusId.toString()).subscribe({
        next: (data) => {
          this.author = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching author', error);
          this.loading = false;
        },
      });
    }
  }
}
