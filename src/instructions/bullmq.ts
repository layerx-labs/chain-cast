import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import { Queue } from 'bullmq';

const ArgsTypeSchema = z.object({
  bodyInput: z.string().min(2),
  queueName: z.string().min(2),
  redisHost: z.string().url(),
  redisPort: z.number().gt(0).lt(65500),
});

type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class BullMQProducer implements Instruction {
  PROCESSOR_NAME = 'bull-producer';

  validateArgs(args: InstructionArgs | undefined): boolean {
    if (!args || ArgsTypeSchema.safeParse(args).success) {
      return false;
    }
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }

  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast')?.id ?? '';
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

        log.d(`[${this.PROCESSOR_NAME}] Adding ${args.bodyInput} to queue ${args.queueName}`);
        await queue.add(event.event as string, event);
      }
    } catch (e: Error | any) {
      log.e(`[${this.PROCESSOR_NAME}] Failed to execute on ${castID} ${e.message}`);
      vm.setError(e.message, e.stack);
    }
  }
}
