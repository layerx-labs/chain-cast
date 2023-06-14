import { appConfig } from '@/config/index';
import log from '@/services/log';
import { GraphQLError } from 'graphql';
import { maskError } from 'graphql-yoga';

export class UserInputError extends GraphQLError {
  code: number;

  constructor(message: string, code: number, extensions?: { [key: string]: unknown }) {
    super(message, {
      extensions: extensions,
    });
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandlingFunction(err: unknown, message: string): Error {
  const originalError = (err as GraphQLError).originalError;
  // User Input Error is not masked
  if (err instanceof UserInputError) {
    const detailsString = JSON.stringify(err.extensions);
    log.d(`Validation Error Reason={${err.message}} details={${detailsString}}`);
    return err;
    // In development or production we mask the error and print a log
  } else {
    log.e(
      `Server Error on Name={${originalError?.name}} ` +
        `Message={${originalError?.message}} ` +
        `StackTrace={\n${originalError?.stack}}`
    );
    return maskError(maskError, message, (appConfig.environment === 'development') as boolean);
  }
}
