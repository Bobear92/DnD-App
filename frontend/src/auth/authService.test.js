import { describe, it, expect } from 'vitest';
import { errorText, PASSWORD_MIN_LENGTH } from './authService';

const err = (detail) => ({ response: { data: { detail } } });

describe('errorText — always hands the UI a string (a 422 list used to crash the login page)', () => {
  it('passes a string detail through', () => {
    expect(errorText(err('Invalid email or password'), 'x')).toBe('Invalid email or password');
  });

  it('joins a FastAPI validation list into its messages', () => {
    const detail = [
      { type: 'string_too_short', loc: ['body', 'password'], msg: 'String should have at least 8 characters' },
      { type: 'value_error', loc: ['body', 'email'], msg: 'value is not a valid email address' },
    ];
    expect(errorText(err(detail), 'x')).toBe(
      'String should have at least 8 characters; value is not a valid email address',
    );
  });

  it('falls back when there is no usable detail', () => {
    expect(errorText(err(undefined), 'Login failed')).toBe('Login failed');
    expect(errorText(err([]), 'Login failed')).toBe('Login failed');
    expect(errorText(err([{}]), 'Login failed')).toBe('Login failed');
    expect(errorText({}, 'Login failed')).toBe('Login failed');
    expect(errorText(undefined, 'Login failed')).toBe('Login failed');
  });

  it('mirrors the backend password minimum', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});
