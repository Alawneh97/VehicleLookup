import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { VehicleService, LookupItem } from './vehicle.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly vehicles = inject(VehicleService);
  private readonly destroyRef = inject(DestroyRef);
  private typesRequest?: Subscription;
  private modelsRequest?: Subscription;

  readonly makes = signal<LookupItem[]>([]);
  readonly types = signal<LookupItem[]>([]);
  readonly models = signal<LookupItem[]>([]);
  readonly makeFilter = signal('');
  readonly makeDropdownOpen = signal(false);
  readonly activeMakeIndex = signal(-1);
  readonly makeId = signal<number | null>(null);
  readonly year = signal<number | null>(null);
  readonly vehicleType = signal('');
  readonly loadingMakes = signal(false);
  readonly loadingTypes = signal(false);
  readonly loadingModels = signal(false);
  readonly makesError = signal('');
  readonly typesError = signal('');
  readonly modelsError = signal('');
  readonly validationError = signal('');
  readonly searched = signal(false);
  readonly resultSummary = signal('');
  readonly filteredMakes = computed(() => {
    const query = this.makeFilter().trim().toLowerCase();
    return this.makes().filter(x => x.name.toLowerCase().includes(query));
  });

  constructor() {
    this.loadMakes();
  }

  loadMakes(): void {
    this.loadingMakes.set(true);
    this.makesError.set('');
    this.vehicles.getMakes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.makes.set(data);
        this.loadingMakes.set(false);
      },
      error: error => {
        this.makesError.set(this.errorMessage(error));
        this.loadingMakes.set(false);
      }
    });
  }

  openMakeDropdown(): void {
    this.makeDropdownOpen.set(true);
    this.activeMakeIndex.set(-1);
  }

  filterMakes(value: string): void {
    this.makeFilter.set(value);
    this.changeMake(null);
    this.openMakeDropdown();
  }

  selectMake(make: LookupItem): void {
    this.makeFilter.set(make.name);
    this.changeMake(make.id);
    this.makeDropdownOpen.set(false);
    this.activeMakeIndex.set(-1);
  }

  onMakeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.makeDropdownOpen.set(false);
      this.activeMakeIndex.set(-1);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.makeDropdownOpen.set(true);
      const count = this.filteredMakes().length;
      if (!count) return;
      const current = this.activeMakeIndex();
      const next = event.key === 'ArrowDown'
        ? Math.min(current + 1, count - 1)
        : (current <= 0 ? count - 1 : current - 1);
      this.activeMakeIndex.set(next);
      setTimeout(() => document.getElementById(`make-option-${next}`)?.scrollIntoView({ block: 'nearest' }));
    }
    if (event.key === 'Enter' && this.makeDropdownOpen()) {
      event.preventDefault();
      const make = this.filteredMakes()[this.activeMakeIndex()];
      if (make) this.selectMake(make);
    }
  }

  changeMake(value: number | null): void {
    this.makeId.set(value);
    this.vehicleType.set('');
    this.types.set([]);
    this.typesError.set('');
    this.typesRequest?.unsubscribe();
    this.loadingTypes.set(false);
    this.clearResults();
    if (value !== null) this.loadTypes();
  }

  loadTypes(): void {
    const makeId = this.makeId();
    if (makeId === null) return;
    this.typesRequest?.unsubscribe();
    this.typesError.set('');
    this.loadingTypes.set(true);
    this.typesRequest = this.vehicles.getTypes(makeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.types.set(data);
        this.loadingTypes.set(false);
      },
      error: error => {
        this.typesError.set(this.errorMessage(error));
        this.loadingTypes.set(false);
      }
    });
  }

  changeYear(value: number | null): void {
    this.year.set(value);
    this.clearResults();
  }

  changeType(value: string): void {
    this.vehicleType.set(value);
    this.clearResults();
  }

  clearResults(): void {
    this.modelsRequest?.unsubscribe();
    this.loadingModels.set(false);
    this.models.set([]);
    this.modelsError.set('');
    this.validationError.set('');
    this.searched.set(false);
  }

  search(): void {
    this.clearResults();
    const makeId = this.makeId();
    const year = this.year();
    if (makeId === null || !this.makes().some(x => x.id === makeId)) {
      this.validationError.set('Select a make.');
      return;
    }
    if (year === null || !Number.isInteger(year) || year < 1996 || year > 9999) {
      this.validationError.set('Enter a whole model year from 1996 to 9999.');
      return;
    }
    const make = this.makes().find(x => x.id === makeId)!;
    const type = this.vehicleType();
    this.resultSummary.set(`${make.name} · ${year}${type ? ' · ' + type : ''}`);
    this.loadingModels.set(true);
    this.modelsRequest = this.vehicles.getModels(makeId, year, type)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          this.models.set(data);
          this.loadingModels.set(false);
          this.searched.set(true);
        },
        error: error => {
          this.modelsError.set(this.errorMessage(error));
          this.loadingModels.set(false);
        }
      });
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 0 || error.status === 504 || error.status === 502) {
      return 'Vehicle data is temporarily unavailable. Please try again.';
    }
    return 'Unable to load vehicle data. Please try again.';
  }
}
