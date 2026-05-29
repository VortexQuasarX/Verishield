import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'verishield_theme';
  private isDarkSubject = new BehaviorSubject<boolean>(true);
  public isDark$ = this.isDarkSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem(this.THEME_KEY);
    const isDark = stored ? stored === 'dark' : true;
    this.applyTheme(isDark);
  }

  get isDark(): boolean {
    return this.isDarkSubject.value;
  }

  toggle(): void {
    this.applyTheme(!this.isDarkSubject.value);
  }

  setDark(isDark: boolean): void {
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    this.isDarkSubject.next(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }
}
