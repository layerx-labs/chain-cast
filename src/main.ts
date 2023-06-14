import log from '@/services/log';
import { appConfig } from './config';
import os from 'os';
import { createContext } from './context';
import { AppContext } from './types';
import { EventWhisperer } from '@/services/whisperer';


async function run() {
  const ctx: AppContext = createContext();
  // Initialize logs
  log.init({
    appName: 'bepro-event-indexer',
    version: appConfig.version,
    hostname: os.hostname(),
    ...appConfig.logs,
  });
  const whisperer = new EventWhisperer(ctx);
  await whisperer.start();
}

run()
  .then(() => {
    log.i('Started BEPRO Event Indexer');
  })
  .catch((e) => {
    log.e(e);
    process.exit(1);
  });
