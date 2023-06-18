import { Web3Event } from '@/types/events';
import { z } from 'zod';
import log from '@/services/log';
import axios from 'axios';
import {
  Instruction,
  ArgsSchema,
  InstructionArgs,
  VirtualMachine,
} from '@/types/vm';

export class WebHookEventProcessor implements Instruction {
  PROCESSOR_NAME = 'webhook';

  validateArgs(_conf: InstructionArgs | undefined): boolean {
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
  getArgsSchema(): ArgsSchema {
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
    const castID = vm.getGlobalVariable('cast.id');
    const castAddres = vm.getGlobalVariable('cast.address');
    const castChainId = vm.getGlobalVariable('cast.chainId');
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${castID} address ${castAddres}`
    );

    const url = (step?.args?.url.value as string) ?? null;

    if (url) {
      log.d(`[${this.PROCESSOR_NAME}] Calling webhook for ${url} for ${event.event}`);
      const response = await axios.post(url, {
        event,
        metadata: {
          id: castID,
          address: castAddres,
          chainId: castChainId,
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
