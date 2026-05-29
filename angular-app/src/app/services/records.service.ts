import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VerificationRecord, RecordsResponse, RecordsQueryParams, CreateRecordRequest } from '../models/record.model';

@Injectable({
  providedIn: 'root',
})
export class RecordsService {
  constructor(private http: HttpClient) {}

  getRecords(params: RecordsQueryParams = {}): Observable<RecordsResponse> {
    let httpParams = new HttpParams();

    if (params.delay) httpParams = httpParams.set('delay', params.delay.toString());
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.riskLevel) httpParams = httpParams.set('riskLevel', params.riskLevel);
    if (params.verificationType) httpParams = httpParams.set('verificationType', params.verificationType);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

    return this.http.get<RecordsResponse>('/api/records', { params: httpParams });
  }

  createRecord(data: CreateRecordRequest): Observable<VerificationRecord> {
    return this.http.post<VerificationRecord>('/api/records', data);
  }
}
