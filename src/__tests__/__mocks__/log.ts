import { mock } from 'bun:test';

/**
 * Mock logging service that captures all log calls for testing.
 * Mimics the interface of @taikai/scribal LogService.
 */
export const mockLog = {
  /** Debug level logging */
  d: mock((..._args: unknown[]) => {}),
  /** Info level logging */
  i: mock((..._args: unknown[]) => {}),
  /** Warning level logging */
  w: mock((..._args: unknown[]) => {}),
  /** Error level logging */
  e: mock((..._args: unknown[]) => {}),
  /** Trace level logging */
  t: mock((..._args: unknown[]) => {}),
  /** Fatal level logging */
  f: mock((..._args: unknown[]) => {}),
};

/**
 * Creates a fresh mock log instance with all mocks reset.
 */
export function createMockLog() {
  return {
    d: mock((..._args: unknown[]) => {}),
    i: mock((..._args: unknown[]) => {}),
    w: mock((..._args: unknown[]) => {}),
    e: mock((..._args: unknown[]) => {}),
    t: mock((..._args: unknown[]) => {}),
    f: mock((..._args: unknown[]) => {}),
  };
}

/**
 * Resets all mock log functions to clear call history.
 */
export function resetMockLog() {
  mockLog.d.mockClear();
  mockLog.i.mockClear();
  mockLog.w.mockClear();
  mockLog.e.mockClear();
  mockLog.t.mockClear();
  mockLog.f.mockClear();
}

/**
 * Gets all logged messages at a specific level.
 */
export function getLoggedMessages(level: 'd' | 'i' | 'w' | 'e' | 't' | 'f'): unknown[][] {
  return mockLog[level].mock.calls;
}

/**
 * Checks if a specific message was logged at the given level.
 */
export function wasMessageLogged(
  level: 'd' | 'i' | 'w' | 'e' | 't' | 'f',
  messageSubstring: string
): boolean {
  const calls = mockLog[level].mock.calls;
  return calls.some((args) =>
    args.some((arg) => typeof arg === 'string' && arg.includes(messageSubstring))
  );
}
