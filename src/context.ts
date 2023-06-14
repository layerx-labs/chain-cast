import prisma from '@/services/prisma';
import { AppContext } from './types';
import log from '@/services/log';
import {EventWhisperer} from '@/services/whisperer';

export function createContext(): AppContext {
  return {
    db: prisma,
    log,
    whisperer: new EventWhisperer(prisma)
  };
}
