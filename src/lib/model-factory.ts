import { ContractListenerConstructor } from '../types';
import { ContractCastType } from '@prisma/client';
import {
  BountyToken,
  ERC1155Standard,
  ERC20,
  Erc721Standard,
  Model,
  NetworkRegistry,
  Network_v2,
  Web3Connection,
} from '@taikai/dappkit';
import { chainsSupported } from '@/constants/chains';

export class ModelFactory {
  _supportedClasses: { [key: string]: ContractListenerConstructor<Model> } = {
    [ContractCastType.BEPRO_NETWORK_V2 as string]: Network_v2,
    [ContractCastType.BEPRO_REGISTRY as string]: NetworkRegistry,
    [ContractCastType.BEPRO_POP as string]: BountyToken,
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
  public create(type: ContractCastType, chainId: number, address: string): Model {
    const constructorZ = this._supportedClasses[type as string];
    if (!constructorZ) {
      throw Error('trying to create an unsupported Listneter');
    }
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == chainId);
    const web3Con: Web3Connection = new Web3Connection({
      debug: false,
      web3Host: chain.wsUrl,
    });
    const model = new constructorZ(web3Con, address);
    return model;
  }
}
