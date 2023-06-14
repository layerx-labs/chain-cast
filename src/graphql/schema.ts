import { builder } from './builder';
import './types/index';
import './types/ChainCast';
import './query';
import './mutation';
export const schema = builder.toSchema();
