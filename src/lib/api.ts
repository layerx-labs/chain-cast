import { gql, request } from 'graphql-request';

/**
 * GraphQL mutation for creating a contract cast
 *
 * This mutation creates a new blockchain event listener in the ChainCast service.
 * It registers a contract to be monitored for events and specifies the program
 * that should be executed when events are detected.
 */
export const CREATE_CONTRACT_CAST = gql`
  mutation createStream(
    $address: String!
    $name: String!
    $chainId: Int!
    $abi: String!
    $type: ContractCastType!
    $blockNumber: Int!
    $program: String!
  ) {
    createContractCast(
      data: {
        address: $address
        chainId: $chainId
        name: $name
        startFrom: $blockNumber
        abi: $abi
        type: $type
        program: $program
      }
    ) {
      id
    }
  }
`;

/**
 * GraphQL mutation for deleting a contract cast
 *
 * This mutation removes an existing blockchain event listener from the ChainCast service.
 * It permanently deletes the contract cast and stops all event monitoring.
 */
export const DELETE_CAST = gql`
  mutation deleteContractCast($id: String!) {
    deleteContractCast(id: $id) {
      id
    }
  }
`;

/**
 * GraphQL query for finding a contract cast
 *
 * This query retrieves information about an existing blockchain event listener
 * based on the contract address and chain ID. It's used to check if a contract
 * cast already exists before creating a new one.
 */
export const QUERY_CAST = gql`
  query contractCast($address: String!, $chainId: Int!) {
    contractCast(chainId_address: { chainId: $chainId, address: $address }) {
      id
    }
  }
`;

/**
 * Deletes a contract cast (blockchain event listener) in the ChainCast service.
 *
 * This function sends a GraphQL mutation to permanently remove a contract cast
 * from the ChainCast service. Once deleted, the contract cast will no longer
 * monitor for blockchain events.
 *
 * @param chainCastUrl - URL of the ChainCast GraphQL API endpoint
 * @param id - The unique identifier of the contract cast to delete
 * @returns Promise that resolves to the deleted contract cast information
 * @throws Error if the GraphQL request fails or the cast doesn't exist
 */
export async function deleteContractCast(chainCastUrl: string, id: string) {
  const variables = { id };
  const data: { deleteContractCast: { id: string } } = await request(
    chainCastUrl,
    DELETE_CAST,
    variables
  );
  return data.deleteContractCast;
}

/**
 * Queries a contract cast by address and chainId in the ChainCast service.
 *
 * This function searches for an existing contract cast using the contract address
 * and blockchain network ID. It's typically used to check if a contract cast
 * already exists before attempting to create a new one.
 *
 * @param chainCastUrl - URL of the ChainCast GraphQL API endpoint
 * @param address - The Ethereum contract address to search for
 * @param chainId - The blockchain network ID (e.g., 1 for Ethereum mainnet)
 * @returns Promise that resolves to the contract cast object if found, or null if not found
 * @throws Error if the GraphQL request fails
 */
export async function queryContractCast(chainCastUrl: string, address: string, chainId: number) {
  const variables = { address, chainId };
  const data: { contractCast?: { id: string } } = await request(
    chainCastUrl,
    QUERY_CAST,
    variables
  );
  return data.contractCast ?? null;
}

/**
 * Parameters required to create a contract cast (blockchain event listener).
 *
 * This type defines all the necessary information to create a new contract cast
 * in the ChainCast service. The contract cast will monitor the specified contract
 * for events and execute the provided program when events are detected.
 *
 * @property address - The Ethereum contract address to monitor for events
 * @property name - A human-readable name identifier for the contract cast
 * @property chainId - The blockchain network ID where the contract is deployed
 * @property abi - The contract ABI (Application Binary Interface), encoded as a base64 string
 * @property type - The type of contract cast (e.g., 'CUSTOM', 'ERC20', 'ERC721')
 * @property blockNumber - The starting block number to begin monitoring from
 * @property compiledProgram - The compiled program (base64-encoded) that will be executed
 * when events are detected
 */
export type CreateContractCastParams = {
  address: string;
  name: string;
  chainId: number;
  abi: string;
  type: string;
  blockNumber: number;
  compiledProgram: string;
};

/**
 * Creates a contract cast (blockchain event listener) in the ChainCast service.
 *
 * This function sends a GraphQL mutation to the ChainCast service to create a new
 * contract cast, which will monitor the specified contract for blockchain events
 * and execute the provided program when events are detected.
 *
 * The contract cast will:
 * - Monitor the specified contract address on the given blockchain network
 * - Listen for all events emitted by the contract
 * - Execute the provided program when events are detected
 * - Start monitoring from the specified block number
 *
 * @param chainCastUrl - URL of the ChainCast GraphQL API endpoint
 * @param params - Object containing all parameters required to create the contract cast
 * @returns Promise that resolves when the contract cast is successfully created
 * @throws Error if the GraphQL request fails or the parameters are invalid
 */
export async function createContractCast(chainCastUrl: string, params: CreateContractCastParams) {
  // Prepare variables for the GraphQL mutation
  const variables = {
    address: params.address,
    chainId: params.chainId,
    abi: params.abi,
    name: params.name,
    blockNumber: params.blockNumber,
    type: params.type,
    program: params.compiledProgram,
  };

  // Execute the GraphQL request to create the contract cast
  const data: { id: string } = await request(chainCastUrl, CREATE_CONTRACT_CAST, variables);
  console.log(`Created the stream id ${data.id}`);
}
