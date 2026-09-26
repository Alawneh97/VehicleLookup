import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('Vehicle lookup', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/vehicles/makes').flush([{ id: 474, name: 'Honda' }, { id: 448, name: 'Toyota' }]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('blocks search until a make and valid year are provided', () => {
    app.search();
    expect(app.validationError()).toBe('Select a make.');
    app.changeMake(474);
    http.expectOne('/api/vehicles/makes/474/types').flush([]);
    app.changeYear(1995);
    app.search();
    expect(app.validationError()).toContain('1996');
    http.expectNone(request => request.url.endsWith('/models'));
  });

  it('sends the selected criteria and renders models', async () => {
    app.changeMake(474);
    http.expectOne('/api/vehicles/makes/474/types').flush([{ id: 2, name: 'Passenger Car' }]);
    app.changeYear(2015);
    app.changeType('Passenger Car');
    app.search();
    const request = http.expectOne(req => req.url.endsWith('/models'));
    expect(request.request.params.get('makeId')).toBe('474');
    expect(request.request.params.get('year')).toBe('2015');
    expect(request.request.params.get('vehicleType')).toBe('Passenger Car');
    request.flush([{ id: 1, name: 'Accord' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.model-grid').textContent).toContain('Accord');
  });

  it('cancels obsolete requests when the make changes', () => {
    app.changeMake(474);
    const firstTypes = http.expectOne('/api/vehicles/makes/474/types');
    app.changeYear(2015);
    app.search();
    const firstModels = http.expectOne(req => req.url.endsWith('/models'));
    app.changeMake(448);
    expect(firstTypes.cancelled).toBe(true);
    expect(firstModels.cancelled).toBe(true);
    http.expectOne('/api/vehicles/makes/448/types').flush([]);
    expect(app.models()).toEqual([]);
    expect(app.vehicleType()).toBe('');
  });

  it('shows empty results and allows recovery after a server error', () => {
    app.changeMake(474);
    http.expectOne('/api/vehicles/makes/474/types').flush([]);
    app.changeYear(2015);
    app.search();
    http.expectOne(req => req.url.endsWith('/models')).flush({}, { status: 502, statusText: 'Bad Gateway' });
    expect(app.modelsError()).toContain('temporarily unavailable');
    expect(app.loadingModels()).toBe(false);
    app.search();
    http.expectOne(req => req.url.endsWith('/models')).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No models found');
    expect(app.modelsError()).toBe('');
  });
  it('filters and selects a make using the single combobox', async () => {
    const input = fixture.nativeElement.querySelector('#make') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('#make-filter')).toBeNull();
    input.value = 'hon';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(app.filteredMakes()).toEqual([{ id: 474, name: 'Honda' }]);
    expect(app.makeId()).toBeNull();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    http.expectOne('/api/vehicles/makes/474/types').flush([]);
    fixture.detectChanges();
    expect(app.makeId()).toBe(474);
    await fixture.whenStable();
    expect(input.value).toBe('Honda');
    expect(app.makeDropdownOpen()).toBe(false);
    input.value = 'toy';
    input.dispatchEvent(new Event('input'));
    expect(app.makeId()).toBeNull();
    expect(app.types()).toEqual([]);
  });

});
