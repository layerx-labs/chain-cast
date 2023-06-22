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
  INSTRUCTION_NAME = 'webhook';

  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args)
    if (!res.success) {
      log.d(`Failed to compile instruction webhook - ${res.error}`)
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
    const castID = vm.getGlobalVariable('cast')?.id ?? '';
    const castAddress = vm.getGlobalVariable('cast')?.address ?? '';
    const castChainId = vm.getGlobalVariable('cast')?.chainId ?? '';
    log.d(`[${this.INSTRUCTION_NAME}] Action Received on cast ${castID} address ${castAddress}`);

    const args: ArgsType = {
      bodyInput: (step?.args?.bodyInput as string) ?? '',
      url: (step?.args?.url as string) ?? '',
      authorizationKey: (step?.args?.authorizationKey as string) ?? '',
    };

    if (args.url) {
      const body = vm.getGlobalVariableFromPath(args.bodyInput);
      log.d(
        `[${this.INSTRUCTION_NAME}] Calling webhook for ${args.url} for variable ${args.bodyInput}`
      );
      const response = await axios.post(args.url, {
        body,
        metadata: {
          id: castID,
          address: castAddress,
          chainId: castChainId,
        },
      });
      if (response.status != 200) {      
        log.w(
          `[${this.INSTRUCTION_NAME}] Weekhook failed to be called ` +
            `${response.status} ${response.statusText} on url `,
          args.url
        );
      }
    }
  }
}
