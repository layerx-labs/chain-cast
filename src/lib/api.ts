
import { request, gql } from 'graphql-request';

/**
 * GraphQL mutation for creating a contract cast
 *
 * This mutation creates a new blockchain event listener in the ChainCast service.
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
* based on the contract address and chain ID.
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
 * @param chainCastUrl - URL of the ChainCast GraphQL API
 * @param id - The ID of the contract cast to delete
 * @returns Promise that resolves when the cast is deleted
 */
export async function deleteContractCast(chainCastUrl: string, id: string) {
  const variables = { id };
  const data: { deleteContractCast: { id: string } } =
    await request(chainCastUrl, DELETE_CAST, variables);
  return data.deleteContractCast;
}


/**
 * Queries a contract cast by address and chainId in the ChainCast service.
 *
 * @param chainCastUrl - URL of the ChainCast GraphQL API
 * @param address - The contract address to query
 * @param chainId - The blockchain network ID
 * @returns Promise that resolves to the contract cast (or null if not found)
 */
export async function queryContractCast(chainCastUrl: string, address: string, chainId: number) {
  const variables = { address, chainId };
  const data: { contractCast?: { id: string } } =
    await request(chainCastUrl, QUERY_CAST, variables);
  return data.contractCast ?? null;
}


/**
 * Parameters required to create a contract cast (blockchain event listener).
 *
 * @property address - The contract address to monitor.
 * @property name - The name identifier for the cast.
 * @property chainId - The blockchain network ID.
 * @property abi - The contract ABI, encoded as a base64 string.
 * @property type - The type of cast (e.g., 'CUSTOM').
 * @property blockNumber - The starting block number to begin monitoring from.
 * @property compiledProgram - The compiled program (base64-encoded) to process events.
 */
export type CreateContractCastParams = {
    address: string;
    name: string;
    chainId: number;
    abi: string;
    type: string;
    blockNumber: number;
    compiledProgram: string;
}

/**
 * Creates a contract cast (blockchain event listener) in the ChainCast service.
 *
 * This function sends a GraphQL mutation to the ChainCast service to create a new
 * contract cast, which listens for blockchain events from a specific contract and
 * processes them using a provided program.
 *
 * @param chainCastUrl - URL of the ChainCast GraphQL API.
 * @param params - Parameters required to create the contract cast.
 * @returns Promise that resolves when the contract cast is created.
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