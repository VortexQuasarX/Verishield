import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationLoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private progressSubject = new BehaviorSubject<number>(0);
  public progress$ = this.progressSubject.asObservable();

  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.startLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.stopLoading();
      }
    });
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  private startLoading(): void {
    this.loadingSubject.next(true);
    this.progressSubject.next(10);

    // Simulate progress increments for smooth UX
    if (this.progressInterval) clearInterval(this.progressInterval);
    let progress = 10;
    this.progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 85) {
        progress = 85;
        if (this.progressInterval) clearInterval(this.progressInterval);
      }
      this.progressSubject.next(progress);
    }, 150);
  }

  private stopLoading(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.progressSubject.next(100);

    // Small delay to show 100% before hiding
    setTimeout(() => {
      this.loadingSubject.next(false);
      this.progressSubject.next(0);
    }, 200);
  }
}
