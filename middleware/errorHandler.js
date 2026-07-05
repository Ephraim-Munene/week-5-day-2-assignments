// ============================================================================
// TASK 3: CENTRALIZED ERROR HANDLING
// ============================================================================
// This file does TWO things:
// 1. Defines a custom error class (AppError) for predictable errors we throw
// 2. Defines an error-handling middleware that catches ALL errors in one place


// PART 1: Custom Error Class

// JavaScript has a built-in Error class. We EXTEND it to create our own
// 'class' is like a blueprint for creating objects
// 'extends Error' means "our AppError is a special type of Error"
class AppError extends Error {
  
  // The constructor runs when we create a new AppError
  // 'message' = the human-readable error message
  // 'statusCode' = the HTTP status code (404, 400, 500, etc.)
  constructor(message, statusCode) {
    
    // 'super(message)' calls the parent Error class constructor
    // This sets the error message and creates the stack trace
    super(message);
    
    // Store the status code on the error object
    // This lets our error handler know which HTTP status to send
    this.statusCode = statusCode;
    
    // 'isOperational' marks errors we EXPECT (like "city not found")
    // vs unexpected errors (like a database crash)
    // Operational errors = we know they might happen and handle them gracefully
    this.isOperational = true;
  }
}

// ==========================================================================
// PART 2: Error Handling Middleware
// ==========================================================================
// Error handling middleware is SPECIAL in Express.
// It MUST have exactly 4 parameters: (err, req, res, next)
// Express recognizes it as an error handler BECAUSE it has 4 parameters!
// If it had 3 parameters, Express would think it's a normal middleware.
const errorHandler = (err, req, res, next) => {
  
  // Default status code: 500 (Internal Server Error)
  // 500 means "something went wrong on OUR server, not the client's fault"
  let statusCode = err.statusCode || 500;
  
  // Default message for unknown errors
  // We don't expose internal error details to the client for security
  let message = err.message || "Something went wrong";
  
  // Check if this is one of OUR AppErrors (operational/predictable errors)
  // If it's an AppError, we trust the message and use its status code
  // If it's a random unexpected error, we use generic 500 message
  if (!err.isOperational) {
    statusCode = 500;
    message = "Something went wrong";
  }
  
  // Build the response object
  const response = {
    success: false,
    error: {
      message: message,
      statusCode: statusCode
    }
  };
  
  // In DEVELOPMENT mode, also include the stack trace for debugging
  // process.env.NODE_ENV checks what environment we're in
  // 'development' = we're coding locally, so show extra debug info
  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }
  
  // Send the error response back to the client
  res.status(statusCode).json(response);
};

// Export BOTH the class and the middleware
// Named exports (in curly braces) let us export multiple things from one file
export { AppError, errorHandler };