import log from '@/services/log';
import { appConfig } from './config';
import os from 'os';
import { createContext } from './context';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import express from 'express';
import { useMaskedErrors } from '@envelop/core';
import { errorHandlingFunction } from './middleware/errors';
import { WebHook } from 'src/instructions/webhook';
import { Debug } from './instructions/debug';
import { Condition } from './instructions/condition';
import { BullMQProducer } from './instructions/bullmq';
import { ElasticSearch } from './instructions/elastic-search';
import { Transform } from './instructions/transform';
import { Set } from './instructions/set';
import { FilterEvents } from './instructions/filter-events';


const chainCastBanner=`
██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗     ██████╗ █████╗ ███████╗████████╗
██╔════╝██║  ██║██╔══██╗██║████╗  ██║    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝
██║     ███████║███████║██║██╔██╗ ██║    ██║     ███████║███████╗   ██║   
██║     ██╔══██║██╔══██║██║██║╚██╗██║    ██║     ██╔══██║╚════██║   ██║   
╚██████╗██║  ██║██║  ██║██║██║ ╚████║    ╚██████╗██║  ██║███████║   ██║   
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   
`                                                                     
const byeMessage = 'Bye, Bye See you Soon on your favorite cast 📻';

async function run() {
  console.log(chainCastBanner)
  const ctx = createContext();
  // Initialize Express Server
  const app = express();
  // Initialize logs
  log.init({
    appName: 'chain-cast',
    version: appConfig.version,
    hostname: os.hostname(),
    ...appConfig.logs,
  });
  log.i('Starting Chain Cast ...');
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
  log.i('Starting Chain Cast Manager Service...');

  ctx.manager.registerInstruction('debug', Debug);
  ctx.manager.registerInstruction('elasticsearch',ElasticSearch)
  ctx.manager.registerInstruction('webhook', WebHook);
  ctx.manager.registerInstruction('condition', Condition);
  ctx.manager.registerInstruction('bullmq-producer', BullMQProducer);
  ctx.manager.registerInstruction('transform', Transform);
  ctx.manager.registerInstruction('filter-events', FilterEvents);
  ctx.manager.registerInstruction('set', Set);
  
  await ctx.manager.start();

  /** Start the GraphQL Server */
  app.listen(appConfig.port, () => {
    log.i(`Running Chain Cast API server at http://localhost:${appConfig.port}/graphql`);
  });
  
  log.i('Started Chain Cast GraphQL Server');
  
  process.on('SIGINT', () => {
    log.d('SIGINT Received Shutting Down Chain Cast Manager...');
    ctx.manager.stop().then(()=> {
      log.d(byeMessage);
      process.exit(0);
    });    
  });
  process.on('SIGTERM', () => {
    log.d('SIGTERM Received Shutting Down Chain Cast Manager...');
    ctx.manager.stop().then(()=> {
      log.d(byeMessage);
      process.exit(0);
    });    
  });

  process.on('uncaughtException', err => {
    log.e(`Uncaught Exception: ${err.message} ${err.stack}`)
    ctx.manager.stop().then(()=> {
      log.d(byeMessage);
      process.exit(1);
    }); 
  });
}



run()  
  .catch((e) => {
    log.e(e);
    process.exit(1);
  });
