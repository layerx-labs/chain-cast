import log from '@/services/log';
import { appConfig } from './config';
import os from 'os';
import { createContext } from './context';
import { AppContext } from './types';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import express from 'express';
import { useMaskedErrors } from '@envelop/core';
import { errorHandlingFunction } from './middleware/errors';
import { LoggerChainCastEventProcessor } from './services/processors/logger';

async function run() {
  const ctx: AppContext = createContext();
  // Initialize Express Server
  const app = express();
  // Initialize logs
  log.init({
    appName: 'chain-cast',
    version: appConfig.version,
    hostname: os.hostname(),
    ...appConfig.logs,
  });
  log.i('Starting Chain Cast 🎧 ...');
  const yoga = createYoga({
    schema,
    context: createContext,
    maskedErrors: false,
    graphqlEndpoint: '/api/graphql',
    cors: {
      credentials: true,
      origin: appConfig.cors.enabled ? (appConfig.cors.origins as string[]) : undefined,
    },
    plugins: [   
      ...(process.env.NODE_ENV === 'production'
      ? [
          useMaskedErrors({
            errorMessage: 'Something went wrong!',
            maskError: errorHandlingFunction,
          }),
        ]
      : []),  
    ],
    
  });
  app.use(yoga.graphqlEndpoint, yoga);
  log.i('Starting Chain Cast 🎧 Whisperer Service...');
  ctx.whisperer.registerProcessor("logger", LoggerChainCastEventProcessor);
  await ctx.whisperer.start();



  /** Start the GraphQL Server */
  app.listen(appConfig.port, () => {
    log.i(`Running a GraphQL API server at http://localhost:${appConfig.port}/graphql`);
  });
  log.i('Started Event Chain Cast GraphQL Server');
  
  process.on('SIGTERM', () => {
    log.i('Gracefully Shutting Down BEPRO Chain Cast 🎧 Whisperer Service 🥱');
    ctx.whisperer.stop();
    process.exit(0);
  });
}

run()  
  .catch((e) => {
    log.e(e);
    process.exit(1);
  });
