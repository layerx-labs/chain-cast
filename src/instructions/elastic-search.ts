import log from '@/services/log';
import type { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import { Client } from '@elastic/elasticsearch';
import { z } from 'zod';

const ArgsTypeSchema = z.object({
  bodyInput: z.string().min(3),
  indexName: z.string().regex(/^[a-z1-9-_]+$/),
  url: z.string().min(2),
  username: z.string().min(2),
  password: z.string().min(2),
});

type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class ElasticSearch implements Instruction {
  INSTRUCTION_NAME = 'elasticsearch';

  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction elasticsearch - ${res.error}`);
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
    log.d(`[${this.INSTRUCTION_NAME}] Action Received on cast ${castID}`);

    const args: ArgsType = {
      url: (step?.args?.url as string) ?? '',
      username: (step?.args?.username as string) ?? '',
      password: (step?.args?.password as string) ?? '',
      indexName: (step?.args?.indexName as string) ?? '',
      bodyInput: (step?.args?.bodyInput as string) ?? '',
    };

    try {
      const body = vm.getGlobalVariableFromPath(args.bodyInput);
      const username = vm.getGlobalVariable(args.username);
      const password = vm.getGlobalVariable(args.password);
      const elasticUrl = vm.getGlobalVariable(args.url);
      const client = new Client({
        node: elasticUrl,
        auth: {
          username: username,
          password: password,
        },
      });

      const response = await client.index({
        index: args.indexName,
        body: {
          ...body,
          timestamp: new Date().getTime(),
        },
      });
      log.d(`Event successfully pushed to Elastic Search on ${castID} `, response._id);
    } catch (e: unknown) {
      const error = e as Error;
      log.e(`Error pushing body to Elastic Search on ${castID} ${error.message}`);
    }
  }
}
