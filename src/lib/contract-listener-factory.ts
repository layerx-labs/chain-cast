import { ContractEventListener } from '@/types/events';
import { ContractCastType } from '@prisma/client';
import { Model } from '@taikai/dappkit';
import { ModelFactory } from './model-factory';
import { AbiItem } from 'web3-utils';

export class ContractListenerFactory {
  /**
   *
   * @param type
   * @param chainId
   * @param address
   * @returns
   */
  public create<T extends ContractEventListener>(
    constructorz: new (model: Model, name: string | null) => T,
    type: ContractCastType,
    chainId: number,
    address: string,
    abi: AbiItem[],
    name: string | null
  ): ContractEventListener {
    const model = new ModelFactory().create(type, chainId, address, abi);
    return new constructorz(model, name);
  }
}
