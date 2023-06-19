import { z } from 'zod';
import log from '@/services/log';
import axios from 'axios';
import { Instruction, ArgsSchema, InstructionArgs, VirtualMachine } from '@/types/vm';

export type ArgsType = {
  bodyInput: string;
  url: string;
  authorizationKey?: string;
};

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
      body: {
        type: 'string',
        required: true,
      },
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

  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();
    const castID = vm.getGlobalVariable('cast')?.id ?? '';
    const castAddress = vm.getGlobalVariable('cast')?.address ?? '';
    const castChainId = vm.getGlobalVariable('cast')?.chainId ?? '';
    log.d(
      `[${this.PROCESSOR_NAME}] Action Received on cast ${castID} address ${castAddress}`
    );

    const args: ArgsType = {
      bodyInput: (step?.args?.bodyInput.value as string) ?? '',
      url: (step?.args?.url.value as string) ?? '',
      authorizationKey: (step?.args?.authorizationKey?.value as string) ?? '',
    };

    if (args.url) {
      const body = vm.getGlobalVariableFromPath(args.bodyInput);
      log.d(
        `[${this.PROCESSOR_NAME}] Calling webhook for ${args.url} for variable ${args.bodyInput}`
      );
      const response = await axios.post(args.url, {
        body,
        metadata: {
          id: castID,
          address: castAddress,
          chainId: castChainId,
        },
      });
      if (response.status == 200) {
        log.d(`[${this.PROCESSOR_NAME}] Weekhook called succesfully`);
      } else {
        log.w(
          `[${this.PROCESSOR_NAME}] Weekhook failed to be called ` +
            `${response.status} ${response.statusText} on url `,
          args.url
        );
      }
    }
  }
}
