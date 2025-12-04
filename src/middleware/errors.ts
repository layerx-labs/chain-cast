import { appConfig } from '@/config/index';
import log from '@/services/log';
import { GraphQLError } from 'graphql';
import { maskError } from 'graphql-yoga';

/**
 * Custom error class for user input validation errors in GraphQL operations.
 * Extends GraphQLError to provide structured error responses with error codes
 * and additional context information.
 */
export class UserInputError extends GraphQLError {
  code: number; // HTTP-style error code for the validation error

  constructor(message: string, code: number, extensions?: { [key: string]: unknown }) {
    super(message, {
      extensions: extensions, // Additional error context and field-specific validation messages
    });
    this.code = code;
    Error.captureStackTrace(this, this.constructor); // Capture stack trace for debugging
  }
}

/**
 * Error handling function for GraphQL Yoga error masking and logging.
 * Implements different error handling strategies for development vs production:
 *
 * - UserInputError: Passed through without masking for client validation feedback
 * - Other errors: Masked in production, logged with full details for debugging
 *
 * @param err - The error that occurred during GraphQL execution
 * @param message - Generic error message to display to clients in production
 * @returns Processed error appropriate for the current environment
 */
export function errorHandlingFunction(err: unknown, message: string): Error {
  const originalError = (err as GraphQLError).originalError;

  // User Input Error is not masked - these are validation errors that clients need to see
  if (err instanceof UserInputError) {
    const detailsString = JSON.stringify(err.extensions);
    log.d(`Validation Error Reason={${err.message}} details={${detailsString}}`);
    return err;

    // In development or production we mask the error and print a log
  } else {
    // Log the full error details for debugging purposes
    log.e(
      `Server Error on Name={${originalError?.name}} ` +
        `Message={${originalError?.message}} ` +
        `StackTrace={\n${originalError?.stack}}`
    );

    // Mask the error for clients, showing different levels of detail based on environment
    return maskError(maskError, message, (appConfig.environment === 'development') as boolean);
  }
}
