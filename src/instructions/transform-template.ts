import { z } from 'zod';
import log from '@/services/log';
import { Instruction, InstructionArgs, VirtualMachine } from '@/types/vm';
import Handlebars  from 'handlebars';

  const TemplateTransformSchema = z
  .object({
    context: z.array(z.string().min(2)),
    template: z.string().min(2),
    output: z.string().min(2),
  });


const ArgsTypeSchema = TemplateTransformSchema;

type ArgsType = z.infer<typeof TemplateTransformSchema>;

export class TransformTemplate implements Instruction {
  INSTRUCTION_NAME = 'transform-template';

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
    if (!step || !step.args) {
      return;
    }
    const args: ArgsType = {
        context: (step?.args?.variable as string[]) ?? '',
        template: (step?.args?.transform as string) ?? '',
        output: (step?.args?.key as string) ?? '',
      };
   
    this.templateTransform(vm, args);
  }

  private templateTransform(vm: VirtualMachine, templt: z.infer<typeof TemplateTransformSchema>) {
    const context: {[key: string]: unknown} = {};    
    if(templt) {     
      templt.context.forEach((variable, index: number)=> {
        context[`var${index}`] = vm.getGlobalVariableFromPath(variable);
      })
      const template = Handlebars.compile(templt.template);   
      const result = template(context);
      vm.setGlobalVariable(templt?.output ?? '', result);
    }   
  }
}