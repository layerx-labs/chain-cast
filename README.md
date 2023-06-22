# BEPRO Chain Cast
Our software is a powerful tool designed to listen to and recover events from smart contracts deployed on various blockchain platforms. By seamlessly integrating with blockchain networks, our software provides developers and businesses with the ability to extract and process valuable event data in a reliable and efficient manner.

## Event Listening and Recovery:
Our software establishes a connection with smart contracts and monitors their event logs in real-time. It actively listens to events emitted by the smart contracts, ensuring no event goes unnoticed. In the event of a network interruption or downtime, the software automatically recovers missed events, ensuring a robust and uninterrupted data flow.

## Programmable Event Processing Pipeline:
Our software empowers users to define a customized event processing pipeline tailored to your specific needs. Through a programable configurations, developers can define a sequence of processors and actions to be executed on each event. These processors can include data transformation, filtering, enrichment, aggregation, or any other desired operations. The software provides a flexible and extensible framework to accommodate a wide range of processing requirements.

## Seamless Integration with External Systems:
Our software allows for seamless integration with external systems and services. Processed events can be easily forwarded to databases, message queues, analytics platforms, or any other desired destinations. This integration capability enables users to leverage the event data to trigger downstream actions, generate reports, drive decision-making processes, or create real-time notifications.

## Project Setup
The following technologies and components are used in the project setup:

* **Prisma 4**: An ORM (Object-Relational Mapping) for interacting with the database. 👍
* **Postgres**: A powerful open-source relational database management system. 👍
* **GraphQL Yoga**: A fully-featured GraphQL server library. 👍
* **ESLint**: A widely used linter tool for identifying and reporting code style issues. 👍
* **Prettier**: A code formatter that helps maintain consistent code style. 👍
* **Logs**: Logging functionality for tracking and debugging application behavior. 👍
* **Jest** + Coverage: A testing framework for JavaScript applications, with code coverage reporting. 👍

## :jigsaw: Third Party Components

* **Node 16 or above**: Node.js runtime environment.
* **Postgres SQL**: Local database recommended for development.
* **Prisma**: Database ORM (Object-Relational Mapping) for GraphQL.
* **Dappkit**: LayerX Framework for 

## Suported Contracts on this version

* NetworkV2
* Network Registry
* Bounty Token 
* ERC1155
* ERC20
* ERC721

## Main Features

## :jigsaw: Quick Start Development 

1. Create an environment file (.env) and configure the required variables

```js
DATABASE_URL=postgresql://heldervasc@localhost:5432/heldervasc?schema=bepro-api-devel
LOG_LEVEL=debug
SILENT=false
LOG_TO_FILE=false
CHAIN_CAST_API_PORT=4400
```

Alternatively, you can copy the example environment file:

```
cp env.example env.local
```

2. Install Dependendencies

```
npm install
```

3. Initialize the Database

```
npx prisma migrate dev
```

4. Run the Development Environment

```
npm run dev
```

Note: API, Redis and Waka(Queue Worker) applications will be started

## :computer: NPM Commands

- `npm run dev`: Start application in development mode.
- `npm run dev:debug`: Start application in development mode with debug.
- `npm run build`: Build the Application for production
- `npm run pretty`: Check all the code against prettier's standards.
- `npm run test`: Run tests.
- `npm run test:debug`: Debug the jest tests
- `npm run test:coverage`: Run all the tests and the coverage report
- `npm run prettier`: Prettify the javascript source code files
- `npm run lint`: Run the ES Lint on the code
