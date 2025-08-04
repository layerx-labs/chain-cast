import { ContractListenerConstructor } from '../types';
import { ContractCastType } from '@prisma/client';
import { ERC1155Standard, ERC20, Erc721Standard, Model, Web3Connection } from '@taikai/dappkit';
import { chainsSupported } from '@/constants/chains';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';

/**
 * Factory class for creating contract models based on contract type.
 *
 * This factory is responsible for creating the appropriate contract model instances
 * for different contract types (ERC20, ERC721, ERC1155, CUSTOM). It handles the
 * setup of Web3 connections and provider configurations for each contract type.
 *
 * The factory supports standard token contracts (ERC20, ERC721, ERC1155) as well
 * as custom contracts with custom ABIs.
 */
export class ModelFactory {
  /**
   * Mapping of supported contract types to their corresponding model constructors.
   *
   * This object maps contract type strings to the appropriate model class that
   * should be used to interact with that type of contract.
   */
  _supportedClasses: { [key: string]: ContractListenerConstructor<Model> } = {
    [ContractCastType.ERC20 as string]: ERC20,
    [ContractCastType.ERC721 as string]: Erc721Standard,
    [ContractCastType.ERC1155 as string]: ERC1155Standard,
  };

  /**
   * Creates a contract model instance for the specified contract type.
   *
   * This method creates the appropriate contract model based on the contract type.
   * For standard token contracts (ERC20, ERC721, ERC1155), it uses predefined
   * model classes. For custom contracts, it creates a generic Model instance
   * with the provided ABI.
   *
   * The method also sets up the Web3 connection with appropriate provider
   * configuration including websocket connection, reconnection settings, and
   * timeout configurations.
   *
   * @param type - The type of contract (ERC20, ERC721, ERC1155, CUSTOM)
   * @param chainId - The blockchain network ID where the contract is deployed
   * @param address - The Ethereum contract address
   * @param abi - The contract ABI (Application Binary Interface) - required for CUSTOM contracts
   * @returns A configured contract model instance
   * @throws Error if the contract type is not supported or chain configuration is invalid
   */
  public create(type: ContractCastType, chainId: number, address: string, abi: AbiItem[]): Model {
    // Get the constructor for the specified contract type
    const constructorZ = this._supportedClasses[type as string];

    // Validate that the contract type is supported (except for CUSTOM type)
    if (!constructorZ && type !== ContractCastType.CUSTOM) {
      throw Error('trying to create an unsupported Listener');
    }

    // Find the chain configuration for the specified chainId
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == chainId);

    // Configure WebSocket provider options for reliable blockchain connection
    const providerWebOptions = {
      timeout: 30000, // 30 seconds timeout for requests
      // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
      clientConfig: {
        // Useful if requests are large
        maxReceivedFrameSize: 100000000, // 100MB - default: 1MiB
        maxReceivedMessageSize: 100000000, // 100MB - default: 8MiB
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000, // 60 seconds
      },
      // Enable auto reconnection for reliability
      reconnect: {
        auto: true,
        delay: 5000, // 5 seconds delay between reconnection attempts
        maxAttempts: 5,
        onTimeout: false,
      },
    };

    // Create WebSocket provider with the configured options
    const provider = new Web3.providers.WebsocketProvider(chain.wsUrl, providerWebOptions);

    // Create Web3 connection with the custom provider
    const web3Con: Web3Connection = new Web3Connection({
      debug: false,
      web3CustomProvider: provider,
    });

    // Create the appropriate model based on contract type
    const model =
      type !== ContractCastType.CUSTOM
        ? new constructorZ(web3Con, address)  // Use predefined model for standard contracts
        : new Model(web3Con, abi as AbiItem[], address);  // Use generic model for custom contracts

    return model;
  }
}
