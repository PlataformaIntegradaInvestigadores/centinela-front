import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QueryList, ElementRef } from '@angular/core';
import { MfaCodeInputComponent } from './mfa-code-input.component';

describe('MfaCodeInputComponent', () => {
  let component: MfaCodeInputComponent;
  let inputs: HTMLInputElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MfaCodeInputComponent],
    });
    component = TestBed.createComponent(MfaCodeInputComponent).componentInstance;

    inputs = Array.from({ length: 6 }, () => document.createElement('input'));
    component.digitInputs = new QueryList<ElementRef<HTMLInputElement>>();
    component.digitInputs.reset(inputs.map((el) => new ElementRef(el)));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('writeValue', () => {
    it('splits a numeric string into digits, truncated to 6', () => {
      component.writeValue('1234567890');
      expect(component.digits).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('strips non-digit characters', () => {
      component.writeValue('1a2b3c');
      expect(component.digits).toEqual(['1', '2', '3', '', '', '']);
    });

    it('handles null by clearing digits', () => {
      component.writeValue(null);
      expect(component.digits).toEqual(['', '', '', '', '', '']);
    });
  });

  it('registerOnChange/registerOnTouched/setDisabledState wire the accessor', () => {
    const onChange = jasmine.createSpy();
    const onTouched = jasmine.createSpy();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);
    component.setDisabledState(true);
    expect(component.disabled).toBeTrue();

    component.markTouched();
    expect(onTouched).toHaveBeenCalled();
  });

  describe('handleInput', () => {
    it('sets a digit, emits the code, and focuses the next input', fakeAsync(() => {
      const onChange = jasmine.createSpy();
      component.registerOnChange(onChange);
      const input = document.createElement('input');
      input.value = '5';
      spyOn(inputs[1], 'focus');

      component.handleInput({ target: input } as unknown as Event, 0);
      tick();

      expect(component.digits[0]).toBe('5');
      expect(onChange).toHaveBeenCalledWith('5');
    }));

    it('clears the digit and emits when the value is empty', () => {
      const onChange = jasmine.createSpy();
      component.registerOnChange(onChange);
      component.digits[0] = '9';
      const input = document.createElement('input');
      input.value = '';
      component.handleInput({ target: input } as unknown as Event, 0);
      expect(component.digits[0]).toBe('');
      expect(onChange).toHaveBeenCalled();
    });

    it('applies a multi-character paste-like value across inputs', fakeAsync(() => {
      const input = document.createElement('input');
      input.value = '123';
      component.handleInput({ target: input } as unknown as Event, 0);
      tick();
      expect(component.digits.slice(0, 3)).toEqual(['1', '2', '3']);
    }));
  });

  describe('handleKeydown', () => {
    it('ignores ctrl/meta key combos', () => {
      const event = { ctrlKey: true, key: '5', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 0);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('sets a digit on numeric key press and focuses next', fakeAsync(() => {
      spyOn(inputs[1], 'focus');
      const event = { key: '7', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 0);
      tick();
      expect(component.digits[0]).toBe('7');
      expect(event.preventDefault).toHaveBeenCalled();
    }));

    it('Backspace clears current digit when present', fakeAsync(() => {
      component.digits[1] = '3';
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 1);
      tick();
      expect(component.digits[1]).toBe('');
    }));

    it('Backspace on an empty digit moves back and clears previous', fakeAsync(() => {
      component.digits[1] = '';
      component.digits[0] = '4';
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 1);
      tick();
      expect(component.digits[0]).toBe('');
    }));

    it('Delete clears the current digit', fakeAsync(() => {
      component.digits[2] = '9';
      const event = { key: 'Delete', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 2);
      tick();
      expect(component.digits[2]).toBe('');
    }));

    it('ArrowLeft/ArrowRight move focus without changing digits', fakeAsync(() => {
      spyOn(inputs[0], 'focus');
      spyOn(inputs[2], 'focus');
      component.handleKeydown(
        { key: 'ArrowLeft', preventDefault: jasmine.createSpy() } as any,
        1,
      );
      component.handleKeydown(
        { key: 'ArrowRight', preventDefault: jasmine.createSpy() } as any,
        1,
      );
      tick();
      expect(component.digits).toEqual(['', '', '', '', '', '']);
    }));

    it('prevents default for other single-character keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores multi-character non-digit keys like Tab', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy() } as any;
      component.handleKeydown(event, 0);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('handlePaste', () => {
    it('applies a full pasted code starting at index 0', fakeAsync(() => {
      const event = {
        clipboardData: { getData: () => '123456' },
        preventDefault: jasmine.createSpy(),
      } as any;
      component.handlePaste(event, 3);
      tick();
      expect(component.digits).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(event.preventDefault).toHaveBeenCalled();
    }));

    it('ignores an empty paste', () => {
      const event = {
        clipboardData: { getData: () => '' },
        preventDefault: jasmine.createSpy(),
      } as any;
      component.handlePaste(event, 0);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('handleFocus selects the input text', fakeAsync(() => {
    const input = document.createElement('input');
    spyOn(input, 'select');
    component.handleFocus({ target: input } as unknown as FocusEvent);
    tick();
    expect(input.select).toHaveBeenCalled();
  }));
});
