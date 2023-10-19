import { ContractListenerConstructor } from '../types';
import { ContractCastType } from '@prisma/client';
import {
  ERC1155Standard,
  ERC20,
  Erc721Standard,
  Model,
  Web3Connection,
} from '@taikai/dappkit';
import { chainsSupported } from '@/constants/chains';
import { AbiItem } from 'web3-utils'

export class ModelFactory {
  _supportedClasses: { [key: string]: ContractListenerConstructor<Model> } = {
    [ContractCastType.ERC20 as string]: ERC20,
    [ContractCastType.ERC721 as string]: Erc721Standard,
    [ContractCastType.ERC1155 as string]: ERC1155Standard,
  };
  /**
   *
   * @param type
   * @param chainId
   * @param address
   * @returns
   */
  public create(type: ContractCastType, chainId: number, address: string, abi: AbiItem[]): Model {

    const constructorZ = this._supportedClasses[type as string];
    if (!constructorZ && type !== ContractCastType.CUSTOM) {
      throw Error('trying to create an unsupported Listneter');
    }
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == chainId);
    const web3Con: Web3Connection = new Web3Connection({
      debug: false,
      web3Host: chain.wsUrl,
    });
    const model = type !== ContractCastType.CUSTOM ? 
      new constructorZ(web3Con, address):
      new Model(web3Con,  abi as  AbiItem[], address);
    return model;
  }
}
