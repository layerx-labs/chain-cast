import { builder } from './builder';
import './types/index';
import './types/contract-cast';
import './query';
import './mutation';
export const schema = builder.toSchema();
