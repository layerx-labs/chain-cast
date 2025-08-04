import { ContractEventListener } from '@/types/events';
import { ContractCastType } from '@prisma/client';
import { Model } from '@taikai/dappkit';
import { ModelFactory } from './model-factory';
import { AbiItem } from 'web3-utils';

/**
 * Factory class for creating contract event listeners.
 *
 * This factory is responsible for creating the appropriate contract event listener
 * based on the contract type. It uses the ModelFactory to create the underlying
 * contract model and then wraps it with the specified listener constructor.
 *
 * The factory supports different contract types (ERC20, ERC721, ERC1155, CUSTOM)
 * and creates the appropriate listener implementation for each type.
 */
export class ContractListenerFactory {
  /**
   * Creates a contract event listener for the specified contract type.
   *
   * This method creates a contract model using the ModelFactory and then
   * instantiates the provided listener constructor with the model. The listener
   * will be responsible for monitoring events from the specified contract.
   *
   * @param constructorz - Constructor function for the event listener class
   * @param type - The type of contract (ERC20, ERC721, ERC1155, CUSTOM)
   * @param chainId - The blockchain network ID where the contract is deployed
   * @param address - The Ethereum contract address to monitor
   * @param abi - The contract ABI (Application Binary Interface) for custom contracts
   * @param name - Optional name identifier for the contract listener
   * @returns A configured contract event listener instance
   * @throws Error if the contract type is not supported or model creation fails
   */
  public create<T extends ContractEventListener>(
    constructorz: new (model: Model, name: string | null) => T,
    type: ContractCastType,
    chainId: number,
    address: string,
    abi: AbiItem[],
    name: string | null
  ): ContractEventListener {
    // Create the appropriate contract model using the ModelFactory
    const model = new ModelFactory().create(type, chainId, address, abi);
    // Instantiate the listener with the model and name
    return new constructorz(model, name);
  }
}
