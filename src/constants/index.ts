/**
 * Enumeration of HTTP status codes and custom error codes used throughout the application.
 * Includes standard HTTP codes and custom application-specific error codes.
 */
export const ErrorsEnum = {
  // Standard HTTP success codes
  success: 200, // Operation completed successfully
  created: 201, // Resource created successfully

  // Authentication and authorization errors
  invalidUserInput: 401, // Invalid user input or malformed request
  protectedEndpoint: 400, // Access to protected endpoint without proper authentication
  invalidToken: 402, // Invalid or expired authentication token
  permissionsRequired: 404, // Insufficient permissions for operation

  // Resource errors
  objectNotFound: 403, // Requested resource not found
  alreadyExists: 609, // Resource already exists (custom code)
  accessDenied: 406, // Access denied to resource

  // File operation errors
  maxFilesReached: 407, // Maximum number of files exceeded
  fileTooLarge: 501, // File size exceeds maximum allowed

  // Operation errors
  maxRetriesReached: 410, // Maximum retry attempts exceeded
  tooManyRequests: 429, // Rate limit exceeded (standard HTTP code)
};
