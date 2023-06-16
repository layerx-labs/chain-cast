import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  SupportPlugInsMap,
  ProcessorRuntime,
  ContractCastEventProcessor,
  Program,
} from '@/types/processor';
import { CastInfo } from '../types';
import { UserInputError } from '@/middleware/errors';
import { ErrorsEnum } from '../constants';

/**
 *  Class to excute a program, a set of processors in sequence
 */
export class ContractCastProgram<CI extends CastInfo> implements Program {
  private _supportedProcessors: SupportPlugInsMap;
  private _steps: ProcessorRuntime[] = [];
  private _processors: ContractCastEventProcessor[] = [];
  private _info: CI;

  constructor(info: CI, supportedProcessors: SupportPlugInsMap) {
    this._supportedProcessors = supportedProcessors;
    this._info = info;
  }

  loadProgram(program: ProcessorRuntime[]) {
    this._processors = [];
    this._steps = program;
    for (const step of this._steps) {
      const constructorZ = this._supportedProcessors[step.name];
      const processor: ContractCastEventProcessor = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      if (!processor.validatConf(step.configuration)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._processors.push(processor);
    }
  }

  async execute<N extends string, T>(event: Web3Event<N, T>) {
    let stepIndex = 0;
    log.d(`Executing Program for ${this._info.getId()}  `);
    try {
      for (const step of this._steps) {
        const variables = {};
        const processor = this._processors[stepIndex];
        log.d(`Executing Step for ${this._info.getId()}  - ${step.name}`);
        await processor.onEvent(
          {
            cast: {
              id: this._info.getId(),
              address: this._info.getAddress(),
              chainId: this._info.getChainId(),
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
      }
    } catch (e: Error | any) {
      log.e(
        `Failed to execute Program ${this._info.getId()} ` +
          `on Step ${stepIndex} ${e.message} ${e.stack}`
      );
    }
  }
}
