import { Notification } from '../notification';

describe('Notification', () => {
  describe('addError', () => {
    it('should add an error to the errors map', () => {
      const notification = new Notification();
      notification.addError('Invalid email', 'email');

      expect(notification.errors.size).toBe(1);
      expect(notification.errors.get('email')).toEqual(['Invalid email']);
    });

    it('should add an error to the errors map without a field', () => {
      const notification = new Notification();
      notification.addError('Invalid request');

      expect(notification.errors.size).toBe(1);
      expect(notification.errors.get('Invalid request')).toBe(
        'Invalid request',
      );
    });

    it('should add multiple errors to the same field', () => {
      const notification = new Notification();
      notification.addError('Invalid email', 'email');
      notification.addError('Email already taken', 'email');

      expect(notification.errors.size).toBe(1);
      expect(notification.errors.get('email')).toEqual([
        'Invalid email',
        'Email already taken',
      ]);
    });

    it('should not add duplicate error', () => {
      const notification1 = new Notification();
      notification1.addError('Invalid email', 'email');
      notification1.addError('Invalid email', 'email');

      expect(notification1.errors.size).toBe(1);
      expect(notification1.errors.get('email')).toEqual(['Invalid email']);

      const notification2 = new Notification();
      notification2.addError('Invalid email');
      notification2.addError('Invalid email');

      expect(notification2.errors.size).toBe(1);
      expect(notification2.errors.get('Invalid email')).toBe('Invalid email');
    });
  });

  describe('hasErrors', () => {
    it('should return false if there are no errors', () => {
      const notification = new Notification();

      expect(notification.hasErrors()).toBe(false);
    });

    it('should return true if there are errors', () => {
      const notification = new Notification();
      notification.addError('Invalid email', 'email');

      expect(notification.hasErrors()).toBe(true);
    });
  });

  describe('copyErrors', () => {
    it('should copy the errors from another notification', () => {
      const notification1 = new Notification();
      notification1.addError('Invalid email', 'email');

      const notification2 = new Notification();
      notification2.copyErrors(notification1);

      expect(notification2.errors.size).toBe(1);
      expect(notification2.errors.get('email')).toEqual(['Invalid email']);
    });

    it('should not overwrite existing errors', () => {
      const notification1 = new Notification();
      notification1.addError('Invalid email', 'email');

      const notification2 = new Notification();
      notification2.addError('Invalid password', 'password');
      notification2.copyErrors(notification1);

      expect(notification2.errors.size).toBe(2);
      expect(notification2.errors.get('email')).toEqual(['Invalid email']);
      expect(notification2.errors.get('password')).toEqual([
        'Invalid password',
      ]);
    });
  });
});
