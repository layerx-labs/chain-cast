import prisma from '@/services/prisma';
import { AppContext } from './types';
import log from '@/services/log';
import {EventWhisperer} from '@/services/whisperer';

const whisperer = new EventWhisperer(prisma);

export function createContext(): AppContext {
  return {
    db: prisma,
    log,
    whisperer,
  };
}
