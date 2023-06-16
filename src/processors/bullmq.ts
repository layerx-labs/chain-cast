import { Web3Event } from '@/types/events';
import { z } from 'zod';
import log from '@/services/log';
import {
  ContractCastEventProcessor,
  ConfigurationTemplate,
  EventProcessorCtx,
  ProcessorConfiguration,
} from '@/types/processor';
import { Queue } from 'bullmq';

export class WebHookEventProcessor implements ContractCastEventProcessor {
  PROCESSOR_NAME = 'bull-producer';

  validatConf(_conf: ProcessorConfiguration | undefined): boolean {
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

  getConfTemplate(): ConfigurationTemplate {
    return {
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

  async onEvent<N, T>(ctx: EventProcessorCtx, event: Web3Event<N, T>): Promise<void> {
    const queueName = (ctx.curStep?.configuration?.queueName.value as string) ?? null;
    const redisHost = (ctx.curStep?.configuration?.redisHost.value as string) ?? null;
    const redisPort = (ctx.curStep?.configuration?.redisHost.value as number) ?? 0;

    if (queueName && redisHost && redisPort) {
      const queue = new Queue(queueName, {
        connection: {
          host: redisHost,
          port: redisPort,
        },
      });

      log.d(`[${this.PROCESSOR_NAME}] Adding ${event.event} to queue ${queueName}`);
      await queue.add(event.event as string, event);
    }
  }
}
