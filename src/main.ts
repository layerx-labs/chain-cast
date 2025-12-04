// Bun automatically loads .env files
import log from '@/services/log';
import { appConfig } from './config';
import os from 'os';
import { createContext } from './context';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import express from 'express';
import { useMaskedErrors } from '@envelop/core';
import { errorHandlingFunction } from './middleware/errors';

// Import all instruction classes to be registered with the manager
import { WebHook } from 'src/instructions/webhook';
import { Debug } from './instructions/debug';
import { Condition } from './instructions/condition';
import { BullMQProducer } from './instructions/bullmq';
import { ElasticSearch } from './instructions/elastic-search';
import { TransformObject } from './instructions/transform-object';
import { Set } from './instructions/set';
import { FilterEvents } from './instructions/filter-events';
import { SpreadSheet } from './instructions/spreadsheet';
import { TransformString } from './instructions/transform-string';
import { TransformNumber } from './instructions/transform-number';
import { TransformArray } from './instructions/transform-array';
import { TransformTemplate } from './instructions/transform-template';

// Import Node.js file system and HTTP/HTTPS modules
import fs from 'fs';
import http from 'http';
import https from 'https';

// ASCII banner for ChainCast startup
const chainCastBanner = `
██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗     ██████╗ █████╗ ███████╗████████╗
██╔════╝██║  ██║██╔══██╗██║████╗  ██║    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝
██║     ███████║███████║██║██╔██╗ ██║    ██║     ███████║███████╗   ██║
██║     ██╔══██║██╔══██║██║██║╚██╗██║    ██║     ██╔══██║╚════██║   ██║
╚██████╗██║  ██║██║  ██║██║██║ ╚████║    ╚██████╗██║  ██║███████║   ██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝
`;

// Friendly shutdown message
const byeMessage = 'Bye, Bye See you Soon on your favorite cast 📻';

/**
 * Main application entry point.
 * Initializes logging, context, GraphQL server, registers instructions,
 * starts the manager, and handles graceful shutdown.
 */
async function run() {
  // Print startup banner
  console.log(chainCastBanner);

  // Create application context (includes db, log, manager, etc.)
  const ctx = createContext();

  // Initialize Express server
  const app = express();

  // Initialize logging with app name, version, hostname, and log config
  log.init({
    appName: 'chain-cast',
    version: appConfig.version,
    hostname: os.hostname(),
    ...appConfig.logs,
  });

  log.i(`Starting Chain Cast ${process.pid}...`);

  // Create GraphQL Yoga server with schema, context, endpoint, CORS, and plugins
  const yoga = createYoga({
    schema,
    context: createContext,
    maskedErrors: false, // Deprecated, handled by plugin below
    graphqlEndpoint: '/api/graphql',
    cors: {
      credentials: true,
      origin: appConfig.cors.enabled ? (appConfig.cors.origins as string[]) : undefined,
    },
    plugins: [
      // In production, mask errors with a generic message and custom handler
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

  // Mount GraphQL endpoint on Express app
  app.use(yoga.graphqlEndpoint, yoga);

  log.i('Starting Chain Cast Manager Service...');

  // Register all supported instructions with the manager
  ctx.manager.registerInstruction('debug', Debug);
  ctx.manager.registerInstruction('elasticsearch', ElasticSearch);
  ctx.manager.registerInstruction('webhook', WebHook);
  ctx.manager.registerInstruction('condition', Condition);
  ctx.manager.registerInstruction('bullmq-producer', BullMQProducer);
  ctx.manager.registerInstruction('transform-string', TransformString);
  ctx.manager.registerInstruction('transform-number', TransformNumber);
  ctx.manager.registerInstruction('transform-array', TransformArray);
  ctx.manager.registerInstruction('transform-object', TransformObject);
  ctx.manager.registerInstruction('transform-template', TransformTemplate);
  ctx.manager.registerInstruction('filter-events', FilterEvents);
  ctx.manager.registerInstruction('set', Set);
  ctx.manager.registerInstruction('spreadsheet', SpreadSheet);

  // Start the manager (e.g., background jobs, listeners, etc.)
  await ctx.manager.start();

  // Server instance (HTTP or HTTPS)
  let server = null;

  // If SSL is enabled, create HTTPS server with provided certificates
  if (appConfig.ssl.enabled) {
    log.i('Enabling ChainCast HTTPS GraphQL Server');
    server = https.createServer(
      {
        key: fs.readFileSync(appConfig.ssl.sslPrivateKeyPath),
        cert: fs.readFileSync(appConfig.ssl.sslCertPath),
        passphrase: appConfig.ssl.sslPrivateKeyPassphrase,
      },
      app
    );
  } else {
    // Otherwise, create standard HTTP server
    log.i('Enabling ChainCast HTTP GraphQL Server');
    server = http.createServer(app);
  }

  /**
   * Start the GraphQL server and listen on the configured port.
   * Logs the server URL on startup.
   */
  server.listen(appConfig.port, () => {
    log.i(`Running Chain Cast API server at http://localhost:${appConfig.port}/graphql`);
  });

  log.i('Started Chain Cast GraphQL Server');

  // Handle graceful shutdown on SIGTERM (e.g., Docker stop)
  process.on('SIGTERM', () => {
    log.d('SIGTERM Received Shutting Down Chain Cast Manager...');
    ctx.manager.stop().then(() => {
      log.d(byeMessage);
      process.exit(0);
    });
  });

  // Handle graceful shutdown on SIGINT (e.g., Ctrl+C)
  process.on('SIGINT', () => {
    log.d('SIGINT Received Shutting Down Chain Cast Manager...');
    ctx.manager.stop().then(() => {
      log.d(byeMessage);
      process.exit(0);
    });
  });

  // Handle uncaught exceptions: log, stop manager, and exit with error
  process.on('uncaughtException', (err) => {
    log.e(`Uncaught Exception: ${err.message} ${err.stack}`);
    ctx.manager.stop().then(() => {
      log.d(byeMessage);
      process.exit(1);
    });
  });
}

// Run the main function and handle any startup errors
run().catch((e) => {
  log.e(e);
  process.exit(1);
});
