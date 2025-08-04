# Chain Cast API Documentation

## Overview

Chain Cast provides a GraphQL API for managing smart contract event listening and processing. This API allows you to create, manage, and monitor contract casts that listen to specific smart contract events.

## Base URL

```
http://localhost:4400/graphql
```

## Authentication

Currently, the API does not require authentication for development purposes. In production, you should implement proper authentication mechanisms.

## GraphQL Schema

### Types

#### ContractCast

```graphql
type ContractCast {
  id: ID!
  name: String!
  description: String
  contractAddress: String!
  networkId: String!
  abi: String!
  status: ContractCastStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
  events: [ContractEvent!]!
}
```

#### ContractEvent

```graphql
type ContractEvent {
  id: ID!
  contractCastId: String!
  eventName: String!
  eventData: String!
  blockNumber: Int!
  transactionHash: String!
  createdAt: DateTime!
}
```

#### ContractCastStatus

```graphql
enum ContractCastStatus {
  ACTIVE
  INACTIVE
  ERROR
  PROCESSING
}
```

### Queries

#### Get All Contract Casts

```graphql
query GetContractCasts {
  contractCasts {
    id
    name
    description
    contractAddress
    networkId
    status
    createdAt
    updatedAt
  }
}
```

#### Get Contract Cast by ID

```graphql
query GetContractCast($id: ID!) {
  contractCast(id: $id) {
    id
    name
    description
    contractAddress
    networkId
    abi
    status
    createdAt
    updatedAt
    events {
      id
      eventName
      eventData
      blockNumber
      transactionHash
      createdAt
    }
  }
}
```

#### Get Contract Events

```graphql
query GetContractEvents($contractCastId: String!) {
  contractEvents(contractCastId: $contractCastId) {
    id
    eventName
    eventData
    blockNumber
    transactionHash
    createdAt
  }
}
```

### Mutations

#### Create Contract Cast

```graphql
mutation CreateContractCast($input: CreateContractCastInput!) {
  createContractCast(input: $input) {
    id
    name
    description
    contractAddress
    networkId
    abi
    status
    createdAt
    updatedAt
  }
}
```

Input:
```graphql
input CreateContractCastInput {
  name: String!
  description: String
  contractAddress: String!
  networkId: String!
  abi: String!
}
```

#### Update Contract Cast

```graphql
mutation UpdateContractCast($id: ID!, $input: UpdateContractCastInput!) {
  updateContractCast(id: $id, input: $input) {
    id
    name
    description
    contractAddress
    networkId
    abi
    status
    createdAt
    updatedAt
  }
}
```

Input:
```graphql
input UpdateContractCastInput {
  name: String
  description: String
  contractAddress: String
  networkId: String
  abi: String
  status: ContractCastStatus
}
```

#### Delete Contract Cast

```graphql
mutation DeleteContractCast($id: ID!) {
  deleteContractCast(id: $id) {
    id
    name
  }
}
```

## Examples

### Creating a Contract Cast

```javascript
const createContractCast = `
  mutation CreateContractCast($input: CreateContractCastInput!) {
    createContractCast(input: $input) {
      id
      name
      description
      contractAddress
      networkId
      status
      createdAt
    }
  }
`;

const variables = {
  input: {
    name: "My ERC20 Token",
    description: "Listening to transfer events",
    contractAddress: "0x1234567890123456789012345678901234567890",
    networkId: "1", // Ethereum mainnet
    abi: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}]"
  }
};

fetch('http://localhost:4400/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: createContractCast,
    variables: variables
  })
});
```

### Querying Contract Events

```javascript
const getContractEvents = `
  query GetContractEvents($contractCastId: String!) {
    contractEvents(contractCastId: $contractCastId) {
      id
      eventName
      eventData
      blockNumber
      transactionHash
      createdAt
    }
  }
`;

const variables = {
  contractCastId: "your-contract-cast-id"
};

fetch('http://localhost:4400/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: getContractEvents,
    variables: variables
  })
});
```

## Error Handling

The API returns GraphQL errors in the following format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["fieldName"]
    }
  ],
  "data": null
}
```

Common error codes:
- `CONTRACT_CAST_NOT_FOUND`: Contract cast with the specified ID doesn't exist
- `INVALID_CONTRACT_ADDRESS`: The provided contract address is invalid
- `INVALID_ABI`: The provided ABI is malformed
- `NETWORK_NOT_SUPPORTED`: The specified network is not supported

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

## WebSocket Support

For real-time event streaming, consider implementing GraphQL subscriptions:

```graphql
subscription ContractEventStream($contractCastId: String!) {
  contractEventStream(contractCastId: $contractCastId) {
    id
    eventName
    eventData
    blockNumber
    transactionHash
    createdAt
  }
}
```

## Testing the API

You can test the API using tools like:
- [GraphQL Playground](https://github.com/prisma/graphql-playground)
- [Insomnia](https://insomnia.rest/)
- [Postman](https://www.postman.com/)

### Using GraphQL Playground

1. Start the Chain Cast server
2. Navigate to `http://localhost:4400/graphql`
3. Use the interactive GraphQL playground to explore the schema and test queries

## Production Considerations

1. **Authentication**: Implement proper authentication (JWT, API keys, etc.)
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **CORS**: Configure CORS properly for your domain
4. **HTTPS**: Always use HTTPS in production
5. **Monitoring**: Implement proper logging and monitoring
6. **Caching**: Consider implementing caching for frequently accessed data

## Support

For API-related issues or questions:
- Create an issue on [GitHub](https://github.com/layerx-labs/chain-cast/issues)
- Contact: chaincast@layerx.xyz

