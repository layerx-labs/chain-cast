import { builder } from './builder';
import './query';
import './mutation';
import './types/ChainCast';
export const schema = builder.toSchema();
