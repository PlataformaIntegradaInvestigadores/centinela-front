import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PhaseStateService {
  private phaseSubject = new BehaviorSubject<number>(0);
  public phase$ = this.phaseSubject.asObservable();

  setPhase(phase: number, groupId: string) {
    this.phaseSubject.next(phase);
    localStorage.setItem('phase_' + groupId, phase.toString());
  }

  getPhase(groupId: string): number {
    const storedPhase = localStorage.getItem('phase_' + groupId);
    return storedPhase !== null ? parseInt(storedPhase, 10) : 0;
  }
}
