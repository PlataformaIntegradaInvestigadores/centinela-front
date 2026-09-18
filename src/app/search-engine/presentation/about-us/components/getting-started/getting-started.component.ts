import { ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

interface Collaborator {
  name: string;
  role: string;
}

@Component({
  selector: 'app-getting-started',
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.css'],
})
export class GettingStartedComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {}

  collaborators: Collaborator[] = [
    {
      name: 'PhD. Gabriela Lorena Suntaxi Oña',
      role: 'Academic Advisor'
    },
    {
      name: 'Ing. Fernando Sangopanta',
      role: 'Contributed with the information retrieval system',
    },
    {
      name: 'Ing. Joffre Condor',
      role: 'Contributed with the analytic tool',
    },
    {
      name: 'Ing. Danny Cabrera',
      role: 'Contributed with  the academic interation space',
    },
    {
      name: 'Ing. Rommel Masabanda',
      role: 'Contributed with the decision support (consensus workshop)',
    },
    {
      name: 'Ing. Mateo Morales',
      role: 'Contributed with the Voting & Consensus Module (consensus workshop)',
    },
    {
      name: 'Ing. Jorge Cordero',
      role: 'Contributed with the Debate & Discussion Module (consensus workshop)',
    },
    {
      name: 'Ing. Marco Quichimbo',
      role: 'Contributed with improving the search engine model',
    },
    {
      name: 'Ing. Mateo Dávalos',
      role: 'Contributed with the Jobs Recommender'
    },
    {
      name: 'Ing. Christian Hernández',
      role: 'Contributed with the Software Security Framework'
    },
    {
      name: 'Ing. Kenny Pinchao',
      role: 'Contributed with the Feeds Recommender'
    },
    {
      name: 'Ing. Alejandro Chávez',
      role: 'Contributed with the Search Engine based on RAG models'
    },
    {
      name: 'Ing. Andrés Quillupangui',
      role: 'Contributed with the Search and Retrieval module Re-engineering'
    },
    {
      name: 'Ing. Marlow Armijo',
      role: 'Contributed with the Social Network module Re-engineering'
    },
    {
      name: 'Ing. Ángel Chuncho',
      role: 'Contributed with the Data Life-Cicle Re-engineering'
    },
    {
      name: 'Ing. Cristopher Bonilla',
      role: 'Contributed with the Admin Decision Support module Re-engineering'
    },
    {
      name: 'Ing. Stuart Palma',
      role: 'Contributed with the CI/CD development for Centinela'
    },
    {
      name: 'Ing. Andrés Suárez',
      role: 'Contributed with the Group Recommender of Topics'
    },
    {
      name: 'Ing. César Sarango',
      role: 'Contributed with the Bias Mitigation Framework'
    },
    {
      name: 'Ing. Ariel Amaguaña',
      role: 'Contributed with the Software Security Framework Implementation'
    }
  ];

  ngOnInit() {
    // Escucha los eventos de navegación
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/collaborators')) {
        // Desplaza hacia el elemento con el id 'collaborators'
        this.viewportScroller.scrollToAnchor('collaborators');
      }
    });
  }
}
