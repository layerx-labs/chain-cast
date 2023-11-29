import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import { Queue } from 'bullmq';

const ArgsTypeSchema = z.object({
  bodyInput: z.string().min(2),
  queueName: z.string().min(2),
  redisHost: z.string().min(2),
  redisPort: z.number().gt(0).lt(65500),
});

type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class BullMQProducer implements Instruction {
  INSTRUCTION_NAME = 'bullmq-producer';

  validateArgs(args: InstructionArgs): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile bullmq instruction - ${res.error}`);
      return false;
    }
    return true;
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();
    const cast = vm.getGlobalVariable('cast') ?? {};
    const event = vm.getGlobalVariable('event') ?? {};
    try {
      const args: ArgsType = {
        bodyInput: (step?.args?.bodyInput as string) ?? '',
        queueName: (step?.args?.queueName as string) ?? '',
        redisHost: (step?.args?.redisHost as string) ?? '',
        redisPort: (step?.args?.redisPort as number) ?? '',
      };
      const body = vm.getGlobalVariableFromPath(args.bodyInput);

      if (args.queueName && args.redisHost && args.redisPort && body) {
        const queue = new Queue(args.queueName, {
          connection: {
            host: args.redisHost,
            port: args.redisPort,
          },
        });

        log.d(`[${this.INSTRUCTION_NAME}] Adding ${args.bodyInput} to queue ${args.queueName}`);
        await queue.add(args.queueName, {
          ...event,
          ...cast,
        });
      } else {
        log.w(`[${this.INSTRUCTION_NAME}] Skipping execution ${cast.id} invalid arguments`);
      }
    } catch (e: Error | any) {
      log.e(`[${this.INSTRUCTION_NAME}] Failed to execute on ${cast.id} ${e.message}`);
      vm.setError(e.message, e.stack);
    }
  }
}
