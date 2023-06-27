import { builder } from './builder';
import './types/index';
import './types/contract-cast';
import './types/secret';
import './query';
import './mutation';
export const schema = builder.toSchema();
