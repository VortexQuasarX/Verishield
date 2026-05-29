import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(delay?: number, search?: string): Observable<User[]> {
    let params = new HttpParams();
    if (delay) params = params.set('delay', delay.toString());
    if (search) params = params.set('search', search);
    return this.http.get<User[]>('/api/users', { params });
  }

  createUser(data: { email: string; name: string; password: string; role: string }): Observable<User> {
    return this.http.post<User>('/api/users', data);
  }

  updateUser(id: string, data: { email?: string; name?: string; role?: string; isActive?: boolean }): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, data);
  }

  deleteUser(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/users/${id}`);
  }
}
