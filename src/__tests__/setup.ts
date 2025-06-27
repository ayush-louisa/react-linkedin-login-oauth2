// Vitest setup file for DOM testing
import { expect, vi } from 'vitest';

// Mock window.open for LinkedIn popup tests
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(() => ({
    close: vi.fn(),
    closed: false,
    focus: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
