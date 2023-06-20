import { z } from 'zod';
import log from '@/services/log';
import axios from 'axios';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';

const ArgsTypeSchema = z.object({
  url: z.string().url(),
  bodyInput: z.string().min(2),
  authorizationKey: z.string().optional(),
});

type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class WebHook implements Instruction {
  PROCESSOR_NAME = 'webhook';

  validateArgs(args: InstructionArgs | undefined): boolean {
    if (!ArgsTypeSchema.safeParse(args).success) {
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
    const castAddress = vm.getGlobalVariable('cast')?.address ?? '';
    const castChainId = vm.getGlobalVariable('cast')?.chainId ?? '';
    log.d(`[${this.PROCESSOR_NAME}] Action Received on cast ${castID} address ${castAddress}`);

    const args: ArgsType = {
      bodyInput: (step?.args?.bodyInput as string) ?? '',
      url: (step?.args?.url as string) ?? '',
      authorizationKey: (step?.args?.authorizationKey as string) ?? '',
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
