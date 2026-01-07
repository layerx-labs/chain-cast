import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { ContractCast, ContractCastType } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';

// Mock the log service
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

// Mock ChainCastProgram - need to control compile() return value
let mockCompileResult = true;
mock.module('@/lib/program', () => ({
  ChainCastProgram: class MockProgram {
    compile(code: string) {
      // Return false for 'invalid-program'
      if (code === 'invalid-program') {
        return false;
      }
      return mockCompileResult;
    }
    load() {}
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

// Import resolvers after mocking
import { contractCast, type ContractCastArgType } from '@/graphql/resolvers/contract-cast/contract-cast';
import createContractCast, { type CreateContractCastArgType } from '@/graphql/resolvers/contract-cast/create';
import updateContractCast, { type UpdateContractCastArgType } from '@/graphql/resolvers/contract-cast/update';
import { deleteContractCast } from '@/graphql/resolvers/contract-cast/delete';
import { UserInputError } from '@/middleware/errors';

// Mock context type
type MockContext = {
  db: {
    contractCast: {
      findUnique: ReturnType<typeof mock>;
      findMany: ReturnType<typeof mock>;
      create: ReturnType<typeof mock>;
      update: ReturnType<typeof mock>;
      delete: ReturnType<typeof mock>;
      count: ReturnType<typeof mock>;
    };
  };
  log: {
    d: ReturnType<typeof mock>;
    i: ReturnType<typeof mock>;
    w: ReturnType<typeof mock>;
    e: ReturnType<typeof mock>;
  };
  manager: {
    addCast: ReturnType<typeof mock>;
    deleteCast: ReturnType<typeof mock>;
    restartCast: ReturnType<typeof mock>;
    getSupportedInstructions: ReturnType<typeof mock>;
  };
};

describe('Contract Cast Resolvers', () => {
  let ctx: MockContext;
  const sampleCast: Partial<ContractCast> = {
    id: 'cast-123',
    name: 'Test Cast',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    blockNumber: 100,
    transactionIndex: 0,
    type: 'CUSTOM' as ContractCastType,
    abi: btoa(JSON.stringify([{ type: 'event', name: 'Transfer' }])),
    program: btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }])),
    status: 'IDLE',
    createdAt: new Date(),
  };

  beforeEach(() => {
    ctx = {
      db: {
        contractCast: {
          findUnique: mock(() => Promise.resolve(null)),
          findMany: mock(() => Promise.resolve([])),
          create: mock(() => Promise.resolve(sampleCast)),
          update: mock(() => Promise.resolve(sampleCast)),
          delete: mock(() => Promise.resolve(sampleCast)),
          count: mock(() => Promise.resolve(0)),
        },
      },
      log: {
        d: mock(() => {}),
        i: mock(() => {}),
        w: mock(() => {}),
        e: mock(() => {}),
      },
      manager: {
        addCast: mock(() => {}),
        deleteCast: mock(() => Promise.resolve()),
        restartCast: mock(() => Promise.resolve()),
        getSupportedInstructions: mock(() => ({
          debug: class {
            name() {
              return 'debug';
            }
            validateArgs() {
              return true;
            }
            getArgsSchema() {
              return { parse: () => ({}) };
            }
          },
        })),
      },
    };
  });

  describe('contractCast query', () => {
    it('should find cast by id', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));

      const args: ContractCastArgType = { id: 'cast-123' };
      const result = await contractCast(null, args, ctx as any, null);

      expect(result).toEqual(sampleCast);
      expect(ctx.db.contractCast.findUnique).toHaveBeenCalledWith({
        where: { id: 'cast-123' },
        select: expect.any(Object),
      });
    });

    it('should find cast by chainId_address', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));

      const args: ContractCastArgType = {
        chainId_address: {
          chainId: 1,
          address: '0x1234567890abcdef1234567890abcdef12345678',
        },
      };
      const result = await contractCast(null, args, ctx as any, null);

      expect(result).toEqual(sampleCast);
    });

    it('should throw UserInputError when cast not found', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));

      const args: ContractCastArgType = { id: 'non-existent' };

      await expect(contractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });
  });

  describe('createContractCast mutation', () => {
    const validProgram = btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }]));
    const validAbi = btoa(JSON.stringify([{ type: 'event', name: 'Transfer' }]));

    it('should create a new contract cast', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));
      ctx.db.contractCast.create.mockImplementation(() => Promise.resolve(sampleCast));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          name: 'Test Cast',
          chainId: 1,
          abi: validAbi,
          program: validProgram,
        },
      };

      const result = await createContractCast(null, args, ctx as any, null);

      expect(result).toEqual(sampleCast);
      expect(ctx.db.contractCast.create).toHaveBeenCalled();
      expect(ctx.manager.addCast).toHaveBeenCalled();
    });

    it('should throw UserInputError when cast already exists', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          chainId: 1,
          abi: validAbi,
          program: validProgram,
        },
      };

      await expect(createContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should throw UserInputError for invalid program', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          chainId: 1,
          abi: validAbi,
          program: 'invalid-program',
        },
      };

      await expect(createContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should throw UserInputError when CUSTOM type has no ABI', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          chainId: 1,
          abi: '',
          program: validProgram,
        },
      };

      await expect(createContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should create secrets when provided', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));
      ctx.db.contractCast.create.mockImplementation(() => Promise.resolve(sampleCast));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          chainId: 1,
          abi: validAbi,
          program: validProgram,
          secrets: [
            { name: 'API_KEY', value: 'secret-key' },
            { name: 'WEBHOOK_TOKEN', value: 'webhook-token' },
          ],
        },
      };

      await createContractCast(null, args, ctx as any, null);

      const createCall = ctx.db.contractCast.create.mock.calls[0][0];
      expect(createCall.data.secrets.createMany.data.length).toBe(2);
    });

    it('should use startFrom block number when provided', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));
      ctx.db.contractCast.create.mockImplementation(() => Promise.resolve(sampleCast));

      const args: CreateContractCastArgType = {
        data: {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'CUSTOM' as ContractCastType,
          chainId: 1,
          abi: validAbi,
          program: validProgram,
          startFrom: 500,
        },
      };

      await createContractCast(null, args, ctx as any, null);

      const createCall = ctx.db.contractCast.create.mock.calls[0][0];
      expect(createCall.data.blockNumber).toBe(500);
    });
  });

  describe('updateContractCast mutation', () => {
    const validProgram = btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }]));

    it('should update cast program by id', async () => {
      ctx.db.contractCast.update.mockImplementation(() => Promise.resolve(sampleCast));

      const args: UpdateContractCastArgType = {
        where: { id: 'cast-123' },
        data: { program: validProgram },
      };

      const result = await updateContractCast(null, args, ctx as any, null);

      expect(result).toEqual(sampleCast);
      expect(ctx.db.contractCast.update).toHaveBeenCalled();
      expect(ctx.manager.restartCast).toHaveBeenCalledWith('cast-123');
    });

    it('should update cast by name', async () => {
      ctx.db.contractCast.update.mockImplementation(() => Promise.resolve(sampleCast));

      const args: UpdateContractCastArgType = {
        where: { name: 'Test Cast' },
        data: { program: validProgram },
      };

      await updateContractCast(null, args, ctx as any, null);

      const updateCall = ctx.db.contractCast.update.mock.calls[0][0];
      expect(updateCall.where.name).toBe('Test Cast');
    });

    it('should throw UserInputError when no id or name provided', async () => {
      const args: UpdateContractCastArgType = {
        where: {},
        data: { program: validProgram },
      };

      await expect(updateContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should throw UserInputError for invalid program', async () => {
      const args: UpdateContractCastArgType = {
        where: { id: 'cast-123' },
        data: { program: 'invalid-program' },
      };

      await expect(updateContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should update ABI without restart validation', async () => {
      ctx.db.contractCast.update.mockImplementation(() => Promise.resolve(sampleCast));

      const args: UpdateContractCastArgType = {
        where: { id: 'cast-123' },
        data: { abi: btoa(JSON.stringify([{ type: 'event', name: 'NewEvent' }])) },
      };

      await updateContractCast(null, args, ctx as any, null);

      expect(ctx.db.contractCast.update).toHaveBeenCalled();
    });
  });

  describe('deleteContractCast mutation', () => {
    it('should delete cast by id', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));
      ctx.db.contractCast.delete.mockImplementation(() => Promise.resolve(sampleCast));

      const args = { id: 'cast-123' };
      const result = await deleteContractCast(null, args, ctx as any, null);

      expect(result).toEqual(sampleCast);
      expect(ctx.manager.deleteCast).toHaveBeenCalledWith('cast-123');
      expect(ctx.db.contractCast.delete).toHaveBeenCalled();
    });

    it('should delete cast by name', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));
      ctx.db.contractCast.delete.mockImplementation(() => Promise.resolve(sampleCast));

      const args = { name: 'Test Cast' };
      await deleteContractCast(null, args, ctx as any, null);

      expect(ctx.db.contractCast.findUnique).toHaveBeenCalledWith({
        where: { name: 'Test Cast' },
      });
    });

    it('should throw UserInputError when cast not found', async () => {
      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(null));

      const args = { id: 'non-existent' };

      await expect(deleteContractCast(null, args, ctx as any, null)).rejects.toThrow(UserInputError);
    });

    it('should call manager.deleteCast before database delete', async () => {
      const callOrder: string[] = [];

      ctx.db.contractCast.findUnique.mockImplementation(() => Promise.resolve(sampleCast));
      ctx.manager.deleteCast.mockImplementation(() => {
        callOrder.push('manager.deleteCast');
        return Promise.resolve();
      });
      ctx.db.contractCast.delete.mockImplementation(() => {
        callOrder.push('db.delete');
        return Promise.resolve(sampleCast);
      });

      await deleteContractCast(null, { id: 'cast-123' }, ctx as any, null);

      expect(callOrder).toEqual(['manager.deleteCast', 'db.delete']);
    });
  });
});
