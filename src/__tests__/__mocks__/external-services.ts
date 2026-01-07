import { mock } from 'bun:test';

/**
 * Mock for axios HTTP client
 */
export const mockAxios = {
  post: mock(() =>
    Promise.resolve({
      status: 200,
      statusText: 'OK',
      data: { success: true },
      headers: {},
      config: {},
    })
  ),
  get: mock(() =>
    Promise.resolve({
      status: 200,
      statusText: 'OK',
      data: {},
      headers: {},
      config: {},
    })
  ),
  put: mock(() =>
    Promise.resolve({
      status: 200,
      statusText: 'OK',
      data: {},
      headers: {},
      config: {},
    })
  ),
  delete: mock(() =>
    Promise.resolve({
      status: 200,
      statusText: 'OK',
      data: {},
      headers: {},
      config: {},
    })
  ),
  create: mock(() => mockAxios),
  defaults: {
    headers: {
      common: {},
    },
  },
};

/**
 * Mock for Elasticsearch client
 */
export const mockElasticsearchClient = {
  index: mock(() =>
    Promise.resolve({
      _index: 'test-index',
      _id: 'mock-doc-id',
      _version: 1,
      result: 'created',
    })
  ),
  search: mock(() =>
    Promise.resolve({
      hits: {
        total: { value: 0 },
        hits: [],
      },
    })
  ),
  delete: mock(() =>
    Promise.resolve({
      result: 'deleted',
    })
  ),
  bulk: mock(() =>
    Promise.resolve({
      errors: false,
      items: [],
    })
  ),
  ping: mock(() => Promise.resolve(true)),
};

/**
 * Creates a mock Elasticsearch Client class
 */
export function createMockElasticsearchClient() {
  return mockElasticsearchClient;
}

/**
 * Mock BullMQ Queue class
 */
export class MockQueue {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  add = mock((jobName: string, data: unknown) =>
    Promise.resolve({
      id: 'mock-job-id',
      name: jobName,
      data,
      timestamp: Date.now(),
    })
  );

  addBulk = mock((jobs: Array<{ name: string; data: unknown }>) =>
    Promise.resolve(
      jobs.map((job, i) => ({
        id: `mock-job-id-${i}`,
        name: job.name,
        data: job.data,
        timestamp: Date.now(),
      }))
    )
  );

  close = mock(() => Promise.resolve());
  pause = mock(() => Promise.resolve());
  resume = mock(() => Promise.resolve());

  getJobs = mock(() => Promise.resolve([]));
  getJobCounts = mock(() =>
    Promise.resolve({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    })
  );
}

/**
 * Mock Google Sheets API
 */
export const mockGoogleSheetsApi = {
  spreadsheets: {
    values: {
      append: mock(() =>
        Promise.resolve({
          data: {
            spreadsheetId: 'mock-spreadsheet-id',
            tableRange: 'Sheet1!A1:D1',
            updates: {
              updatedRows: 1,
              updatedColumns: 4,
              updatedCells: 4,
            },
          },
        })
      ),
      get: mock(() =>
        Promise.resolve({
          data: {
            values: [],
          },
        })
      ),
      update: mock(() =>
        Promise.resolve({
          data: {
            updatedRows: 1,
          },
        })
      ),
    },
  },
};

/**
 * Mock for google.auth.GoogleAuth
 */
export class MockGoogleAuth {
  credentials: unknown;

  constructor(options: { credentials: unknown; scopes: string[] }) {
    this.credentials = options.credentials;
  }

  getClient = mock(() => Promise.resolve({}));
}

/**
 * Mock for googleapis.google.sheets
 */
export const mockGoogleSheets = mock(() => mockGoogleSheetsApi);

/**
 * Mock fetch function for webhook tests
 */
export const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('OK'),
  })
);

/**
 * Mock Redis connection for BullMQ
 */
export const mockRedisConnection = {
  host: 'localhost',
  port: 6379,
};
