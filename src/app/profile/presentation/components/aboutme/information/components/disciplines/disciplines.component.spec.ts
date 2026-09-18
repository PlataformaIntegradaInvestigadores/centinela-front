import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { DisciplinesComponent } from './disciplines.component';

describe('DisciplinesComponent', () => {
  let component: DisciplinesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisciplinesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    component = TestBed.createComponent(DisciplinesComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges copies disciplines into the editable list when it changes', () => {
    component.disciplines = ['Math', 'CS'];
    component.ngOnChanges({ disciplines: new SimpleChange(null, component.disciplines, true) });
    expect(component.editableDisciplines).toEqual(['Math', 'CS']);
    expect(component.editableDisciplines).not.toBe(component.disciplines);
  });

  it('ngOnChanges ignores unrelated input changes', () => {
    component.editableDisciplines = ['kept'];
    component.ngOnChanges({ isOwnProfile: new SimpleChange(false, true, false) });
    expect(component.editableDisciplines).toEqual(['kept']);
  });

  it('toggleEditDisciplines flips isEditing and emits toggleEdit', () => {
    let emitted = false;
    component.toggleEdit.subscribe(() => (emitted = true));
    component.toggleEditDisciplines();
    expect(component.isEditing).toBeTrue();
    expect(emitted).toBeTrue();
  });

  describe('save', () => {
    it('emits the editable disciplines, stops editing, and shows a save message', fakeAsync(() => {
      let emitted: string[] | undefined;
      component.saveDisciplines.subscribe((d: string[]) => (emitted = d));
      component.isEditing = true;
      component.editableDisciplines = ['Physics'];

      component.save();

      expect(emitted).toEqual(['Physics']);
      expect(component.isEditing).toBeFalse();
      expect(component.saveMessage).toBe('Changes saved successfully!');

      tick(3000);
      expect(component.saveMessage).toBe('');
    }));
  });

  it('cancel stops editing and resets to the original disciplines', () => {
    component.disciplines = ['Math'];
    component.isEditing = true;
    component.editableDisciplines = ['Math', 'Extra'];
    component.cancel();
    expect(component.isEditing).toBeFalse();
    expect(component.editableDisciplines).toEqual(['Math']);
  });

  describe('addDiscipline', () => {
    it('appends a non-empty new discipline and clears the input', () => {
      component.editableDisciplines = ['Math'];
      component.newDiscipline = 'CS';
      component.addDiscipline();
      expect(component.editableDisciplines).toEqual(['Math', 'CS']);
      expect(component.newDiscipline).toBe('');
    });

    it('does nothing for an empty new discipline', () => {
      component.editableDisciplines = ['Math'];
      component.newDiscipline = '';
      component.addDiscipline();
      expect(component.editableDisciplines).toEqual(['Math']);
    });
  });

  it('removeDiscipline removes the item at the given index', () => {
    component.editableDisciplines = ['Math', 'CS', 'Physics'];
    component.removeDiscipline(1);
    expect(component.editableDisciplines).toEqual(['Math', 'Physics']);
  });
});
