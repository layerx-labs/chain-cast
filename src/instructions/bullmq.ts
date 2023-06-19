import { z } from 'zod';
import log from '@/services/log';
import { Instruction, ArgsSchema, InstructionArgs, VirtualMachine } from '@/types/vm';
import { Queue } from 'bullmq';

export type ArgsType = {
  bodyInput: string;
  queueName: string;
  redisHost: string;
  redisPort: number;
};

export class BullMQProducer implements Instruction {
  PROCESSOR_NAME = 'bull-producer';

  validateArgs(_conf: InstructionArgs | undefined): boolean {
    const queueNameSchema = z.string().min(2);
    const queueName = _conf?.queueName ?? '';
    const redisHostSchema = z.string().url();
    const redisHost = _conf?.redisHost ?? '';
    const redisPortSchema = z.number().gt(0).lt(65500);
    const redisPort = _conf?.redisHost ?? 0;

    if (
      !_conf ||
      !queueNameSchema.safeParse(queueName).success ||
      !redisHostSchema.safeParse(redisHost).success ||
      !redisPortSchema.safeParse(redisPort).success
    ) {
      return false;
    }
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }

  getArgsSchema(): ArgsSchema {
    return {
      bodyInput: {
        type: 'string',
        required: true,
      },
      queueName: {
        type: 'string',
        required: true,
      },
      redisHost: {
        type: 'string',
        required: true,
      },
      redisPort: {
        type: 'number',
        required: false,
      },
    };
  }

  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast')?.id  ?? "";
    const event = vm.getGlobalVariable('event')  ?? {};
    try {


      const args: ArgsType = {
        bodyInput: (step?.args?.bodyInput?.value as string) ?? '',
        queueName: (step?.args?.queueName?.value as string) ?? '',
        redisHost: (step?.args?.redisHost?.value as string) ?? '',
        redisPort: (step?.args?.redisPort?.value as number) ?? '',
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
