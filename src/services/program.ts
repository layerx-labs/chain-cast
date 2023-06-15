import {
  ContractCastEventProcessor,
  ProcessorRuntime,
  SupportPlugInsMap,
  Web3Event,
} from '@/types/events';
import { ContractCast } from './contract-cast';
import log from '@/services/log';

/**
 *  Class to excute a program, a set of processors in sequence 
 */
export class Program {
  _supportedProcessors: SupportPlugInsMap;
  _steps: ProcessorRuntime[] = [];
  _processors: ContractCastEventProcessor[] = [];
  _contractCast: ContractCast;

  constructor(contractCast: ContractCast, supportedProcessors: SupportPlugInsMap) {
    this._supportedProcessors = supportedProcessors;
    this._contractCast = contractCast;
  }

  loadProgram(program: ProcessorRuntime[]) {
    this._processors = [];
    this._steps = program;
    for (const step of this._steps) {
      const constructorZ = this._supportedProcessors[step.name];
      const processor: ContractCastEventProcessor = new constructorZ(
        this._contractCast.getId(),
        this._contractCast.getAddress(),
        this._contractCast.getChainId()
      );
      this._processors.push(processor);
    }
  }

  async execute<N extends string, T>(event: Web3Event<N, T>) {
    let stepIndex = 0;
    log.d(`Executing Program for ${this._contractCast._id}  `);
    for (const step of this._steps) {
      const variables = {};
      const processor = this._processors[stepIndex];
      log.d(`Executing Step for ${this._contractCast._id}  - ${step.name}`);
      try {
        await processor.onEvent(
          {
            cast: {
              id: this._contractCast.getId(),
              address: this._contractCast.getAddress(),
              chainId: this._contractCast.getChainId(),
            },
            steps: this._steps,
            processors: this._processors,
            curProcessor: processor,
            curStepIndex: stepIndex,
            curStep: step,
            variables,
          },
          event
        );
        stepIndex++;
      } catch (e: Error | any) {
        log.e(`Failed to execute Program ${this._contractCast._id} ` + 
             `on Step ${stepIndex} ${e.message} ${e.stack}`)
      }
    }
  }
}
