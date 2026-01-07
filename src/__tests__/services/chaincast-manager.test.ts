import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type {
  Instruction,
  InstructionMap,
  Program,
  VirtualMachine,
  InstructionArgs,
} from '@/types/vm';
import type {
  CastInfo,
  ContractCast,
  SecretManager,
  SecretMap,
  ContractCastConstructor,
} from '@/types';
import type { PrismaClient, ContractCastType } from '@prisma/client';

// Mock dependencies
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

mock.module('@/util/secrets', () => ({
  loadSecresFromDb: mock(() => Promise.resolve({})),
}));

// Mock ChainCastProgram to avoid instruction validation
const mockProgramLoad = mock(() => {});
const mockProgramCompile = mock(() => true);

mock.module('@/lib/program', () => ({
  ChainCastProgram: class MockProgram {
    load = mockProgramLoad;
    compile = mockProgramCompile;
    getInstructionCalls() {
      return [];
    }
    getInstructionCall() {
      return undefined;
    }
    getInstructionsCallLen() {
      return 0;
    }
  },
}));

// Import after mocking
import { ChainCastManager } from '@/services/chaincast-manager';

// Mock implementations
class MockSecretManager implements SecretManager {
  private secrets: SecretMap = {};

  addSecrets(secrets: SecretMap): void {
    this.secrets = secrets;
  }

  addSecret(name: string, value: string): void {
    this.secrets[name] = value;
  }

  deleteSecret(name: string): void {
    delete this.secrets[name];
  }

  updateSecret(name: string, value: string): void {
    this.secrets[name] = value;
  }

  getSecret(name: string): string | undefined {
    return this.secrets[name];
  }

  getSecrets(): SecretMap {
    return this.secrets;
  }
}

class MockVirtualMachine implements VirtualMachine {
  private globalVariables: Record<string, unknown> = {};
  private program: Program | null = null;

  getGlobalVariables(): Record<string, unknown> {
    return this.globalVariables;
  }

  getGlobalVariable(name: string): unknown {
    return this.globalVariables[name];
  }

  getGlobalVariableFromPath(path: string): unknown {
    const parts = path.split('.');
    let value: unknown = this.globalVariables;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }
    return value;
  }

  setGlobalVariable(name: string, value: unknown): void {
    this.globalVariables[name] = value;
  }

  loadProgram(program: Program): void {
    this.program = program;
  }

  async execute(_event: { name: string; payload: unknown }): Promise<void> {}

  getCurrentStackItem() {
    return undefined;
  }

  getStack() {
    return [];
  }

  isHalted() {
    return false;
  }

  halt() {}

  getError() {
    return null;
  }

  setError() {}

  executeInstruction = mock(async () => {});
  executeInstructions = mock(async () => {});
}

class MockContractCast implements ContractCast {
  private _id: string;
  private _secretManager = new MockSecretManager();
  public startCalled = false;
  public stopCalled = false;
  public loadProgramCalled = false;
  public loadSecretsCalled = false;

  constructor(
    _secretManagerCreator: new () => MockSecretManager,
    _vmCreator: new (info: CastInfo, supportedInstructions: InstructionMap) => MockVirtualMachine,
    id: string,
    _type: ContractCastType,
    _name: string | null,
    _address: string,
    _chainId: number,
    _abi: string,
    _blockNumber: number,
    _transactionIndex: number,
    _supportedProcessors: InstructionMap
  ) {
    this._id = id;
  }

  getId() {
    return this._id;
  }

  getName() {
    return 'Mock Cast';
  }

  getAddress() {
    return '0x1234567890abcdef1234567890abcdef12345678';
  }

  getChainId() {
    return 1;
  }

  getBlockNumber() {
    return 0;
  }

  getTxIndex() {
    return 0;
  }

  getSecretsManager() {
    return this._secretManager;
  }

  async loadProgram(_program: Program) {
    this.loadProgramCalled = true;
  }

  async loadSecrets(_secrets: SecretMap) {
    this.loadSecretsCalled = true;
  }

  async start() {
    this.startCalled = true;
  }

  async stop() {
    this.stopCalled = true;
  }
}

// Mock instruction
class MockInstruction implements Instruction {
  INSTRUCTION_NAME = 'mock-instruction';

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  validateArgs(_args: InstructionArgs): boolean {
    return true;
  }

  getArgsSchema() {
    return { parse: () => ({}) };
  }

  async onAction(_vm: VirtualMachine): Promise<void> {}
}

describe('ChainCastManager', () => {
  let manager: ChainCastManager<MockContractCast, MockVirtualMachine, MockSecretManager>;
  let mockDb: Partial<PrismaClient>;
  let mockFindMany: ReturnType<typeof mock>;
  let mockFindUnique: ReturnType<typeof mock>;

  const sampleCast = {
    id: 'cast-123',
    type: 'CUSTOM' as ContractCastType,
    name: 'Test Cast',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    blockNumber: 100,
    transactionIndex: 0,
    abi: btoa(JSON.stringify([{ type: 'event', name: 'Transfer' }])),
    program: btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }])),
  };

  beforeEach(() => {
    mockProgramLoad.mockClear();
    mockProgramCompile.mockClear();

    mockFindMany = mock(() => Promise.resolve([]));
    mockFindUnique = mock(() => Promise.resolve(sampleCast));

    mockDb = {
      contractCast: {
        findMany: mockFindMany,
        findUnique: mockFindUnique,
      },
    } as unknown as Partial<PrismaClient>;

    manager = new ChainCastManager(
      MockContractCast as unknown as ContractCastConstructor<
        MockContractCast,
        MockSecretManager,
        MockVirtualMachine
      >,
      MockVirtualMachine,
      MockSecretManager,
      mockDb as PrismaClient
    );
  });

  describe('registerInstruction', () => {
    it('should register an instruction constructor', () => {
      manager.registerInstruction('mock', MockInstruction);

      const instructions = manager.getSupportedInstructions();
      expect(instructions.mock).toBe(MockInstruction);
    });

    it('should allow multiple instruction registrations', () => {
      manager.registerInstruction('mock1', MockInstruction);
      manager.registerInstruction('mock2', MockInstruction);

      const instructions = manager.getSupportedInstructions();
      expect(Object.keys(instructions)).toHaveLength(2);
    });
  });

  describe('getSupportedInstructions', () => {
    it('should return empty object initially', () => {
      const instructions = manager.getSupportedInstructions();
      expect(instructions).toEqual({});
    });

    it('should return registered instructions', () => {
      manager.registerInstruction('test', MockInstruction);

      const instructions = manager.getSupportedInstructions();
      expect(instructions.test).toBeDefined();
    });
  });

  describe('getCasts', () => {
    it('should return empty array initially', () => {
      const casts = manager.getCasts();
      expect(casts).toEqual([]);
    });

    it('should return added casts', async () => {
      await manager.addCast(sampleCast);

      const casts = manager.getCasts();
      expect(casts.length).toBe(1);
    });
  });

  describe('getCast', () => {
    it('should return undefined for non-existent cast', () => {
      const cast = manager.getCast('non-existent');
      expect(cast).toBeUndefined();
    });

    it('should return cast by id', async () => {
      await manager.addCast(sampleCast);

      const cast = manager.getCast('cast-123');
      expect(cast).toBeDefined();
      expect(cast?.getId()).toBe('cast-123');
    });
  });

  describe('start', () => {
    it('should load casts from database', async () => {
      mockFindMany.mockImplementation(() => Promise.resolve([sampleCast]));

      await manager.start();

      expect(mockFindMany).toHaveBeenCalled();
    });

    it('should setup and start all loaded casts', async () => {
      mockFindMany.mockImplementation(() => Promise.resolve([sampleCast]));

      await manager.start();

      // Give async operations time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const casts = manager.getCasts();
      expect(casts.length).toBe(1);
    });

    it('should handle empty database', async () => {
      mockFindMany.mockImplementation(() => Promise.resolve([]));

      await manager.start();

      const casts = manager.getCasts();
      expect(casts).toEqual([]);
    });
  });

  describe('stop', () => {
    it('should stop all casts', async () => {
      await manager.addCast(sampleCast);

      await manager.stop();

      const cast = manager.getCast('cast-123') as MockContractCast;
      expect(cast.stopCalled).toBe(true);
    });

    it('should handle no casts gracefully', async () => {
      // Should not throw
      await manager.stop();
    });
  });

  describe('addCast', () => {
    it('should create and register a new cast', async () => {
      await manager.addCast(sampleCast);

      const cast = manager.getCast('cast-123');
      expect(cast).toBeDefined();
    });

    it('should load program into cast', async () => {
      await manager.addCast(sampleCast);

      const cast = manager.getCast('cast-123') as MockContractCast;
      expect(cast.loadProgramCalled).toBe(true);
    });

    it('should start the cast', async () => {
      await manager.addCast(sampleCast);

      // Give async operations time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cast = manager.getCast('cast-123') as MockContractCast;
      expect(cast.startCalled).toBe(true);
    });
  });

  describe('deleteCast', () => {
    it('should stop and remove a cast', async () => {
      await manager.addCast(sampleCast);

      await manager.deleteCast('cast-123');

      expect(manager.getCast('cast-123')).toBeUndefined();
    });

    it('should handle non-existent cast', async () => {
      // Should not throw
      await manager.deleteCast('non-existent');
    });

    it('should call stop on the cast', async () => {
      await manager.addCast(sampleCast);
      const cast = manager.getCast('cast-123') as MockContractCast;

      await manager.deleteCast('cast-123');

      expect(cast.stopCalled).toBe(true);
    });
  });

  describe('restartCast', () => {
    it('should stop, reload, and start a cast', async () => {
      await manager.addCast(sampleCast);
      const originalCast = manager.getCast('cast-123') as MockContractCast;

      await manager.restartCast('cast-123');

      // Give async operations time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Original cast should have been stopped
      expect(originalCast.stopCalled).toBe(true);

      // New cast should exist
      const newCast = manager.getCast('cast-123');
      expect(newCast).toBeDefined();
    });

    it('should reload cast configuration from database', async () => {
      await manager.addCast(sampleCast);

      await manager.restartCast('cast-123');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'cast-123' },
        select: expect.any(Object),
      });
    });

    it('should handle non-existent cast', async () => {
      // Should not throw
      await manager.restartCast('non-existent');

      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('should handle cast not found in database after delete', async () => {
      await manager.addCast(sampleCast);
      mockFindUnique.mockImplementation(() => Promise.resolve(null));

      await manager.restartCast('cast-123');

      // Cast should have been removed but not re-added
      expect(manager.getCast('cast-123')).toBeUndefined();
    });
  });
});
