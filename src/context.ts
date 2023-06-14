import prisma from '@/services/prisma';
import { AppContext } from './types';
import log from '@/services/log';

export function createContext(): AppContext {
  return {
    db: prisma,
    log,
  };
}
