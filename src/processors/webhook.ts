import { Web3Event } from '@/types/events';
import { z } from 'zod';
import log from '@/services/log';
import axios from 'axios';
import {
  ContractCastEventProcessor,
  ArgumentsSchema,
  ProcessorArgs,
  VirtualMachine,
} from '@/types/processor';

export class WebHookEventProcessor implements ContractCastEventProcessor {
  PROCESSOR_NAME = 'webhook';

  validatConf(_conf: ProcessorArgs | undefined): boolean {
    const urlSchema = z.string().url();
    const url = _conf?.url ?? '';
    if (!_conf || !urlSchema.safeParse(url).success) {
      return false;
    }
    return true;
  }

  name(): string {
    return this.PROCESSOR_NAME;
  }
  getArgsSchema(): ArgumentsSchema {
    return {
      url: {
        type: 'string',
        required: true,
      },
      authorizationKey: {
        type: 'string',
        required: false,
      },
    };
  }

  async onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): Promise<void> {
    const step = vm.getCurrentStackItem();
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${vm.getCast().id} address ${vm.getCast().address}`
    );

    const url = (step?.args?.url.value as string) ?? null;

    if (url) {
      log.d(`[${this.PROCESSOR_NAME}] Calling webhook for ${url} for ${event.event}`);
      const response = await axios.post(url, {
        event,
        metadata: {
          id: vm.getCast().id,
          address: vm.getCast().address,
          chainId: vm.getCast().chainId,
        },
      });
      if (response.status == 200) {
        log.d(`[${this.PROCESSOR_NAME}] Weekhook called succesfully`);
      } else {
        log.w(
          `[${this.PROCESSOR_NAME}] Weekhook failed to be called ` +
            `${response.status} ${response.statusText} on url `,
          url
        );
      }
    }
  }
}
