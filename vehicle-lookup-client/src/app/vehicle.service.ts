import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LookupItem {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vehicles';

  getMakes(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseUrl}/makes`);
  }

  getTypes(makeId: number): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.baseUrl}/makes/${makeId}/types`);
  }

  getModels(makeId: number, year: number, vehicleType: string): Observable<LookupItem[]> {
    let params = new HttpParams().set('makeId', makeId).set('year', year);
    if (vehicleType) params = params.set('vehicleType', vehicleType);
    return this.http.get<LookupItem[]>(`${this.baseUrl}/models`, { params });
  }
}
