import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

HTMLElement.prototype.scrollTo = vi.fn();
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
