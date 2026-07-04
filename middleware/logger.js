// ============================================================================
// TASK 1: CUSTOM LOGGING MIDDLEWARE
// ============================================================================


// This is the main middleware function. Express will call it for every request.
// 'req' = the incoming request object 
// 'res' = the response object
// 'next' = a function that says "I'm done, pass control to the next middleware"
const logger = (req, res, next) => {
  
  // Record the START time of the request
  // Date.now() returns the number of milliseconds since January 1, 1970
  // We save this so we can calculate how long the request took later
  const startTime = Date.now();
  
  // Create a timestamp in ISO format
  // new Date() creates a date object for RIGHT NOW
  // .toISOString() converts it to a standard string like "2026-07-04T15:35:00.000Z"
  const timestamp = new Date().toISOString();
  
  // Capture the HTTP method (GET, POST, DELETE, etc.)
  // req.method is a property Express gives us automatically
  const method = req.method;
  
  // Capture the URL path (like /api/cities or /api/cities/3)
  // req.url is the full URL path the client requested
  const url = req.url;
  

  // MASKING PASSWORDS: We want to log the request body, but NEVER log passwords
  
  // 'req.body' might be undefined if there's no body (like in GET requests)
  // We use the spread operator '...' to make a COPY of the body so we don't
  // accidentally modify the original request data
  let bodyToLog = req.body ? { ...req.body } : undefined;
  
  // If there's a body AND it has a 'password' field, replace it with "***"
  // This protects sensitive information in our logs
  if (bodyToLog && bodyToLog.password) {
    bodyToLog.password = "***";
  }
  

  // res.on("finish", ...) — This is the MAGIC part!
 
  // 'res' is an EventEmitter (it can emit events). When Express finishes
  // sending the response back to the client, it fires the "finish" event.
  // We attach a listener to that event so we can run code AFTER the response
  // is sent — this is the ONLY way to know the final status code!
  res.on("finish", () => {
    
    // Calculate how long the request took
    // Date.now() (now) minus startTime (then) = milliseconds elapsed
    const duration = Date.now() - startTime;
    
    // res.statusCode is the HTTP status code that was sent (200, 404, 500, etc.)
    const statusCode = res.statusCode;
    
    // Build the log message
    
    let logMessage = `[${timestamp}] ${method} ${url} ${statusCode} - ${duration}ms`;
    
    // If there was a body to log, append it to the message
    // JSON.stringify converts a JavaScript object into a JSON string
    if (bodyToLog) {
      logMessage += ` ${JSON.stringify(bodyToLog)}`;
    }
    
    // Print the log to the terminal (console)
    console.log(logMessage);
  });
  

  // when done with middleware work, move on to the next middleware or route handler"

  next();
};

// Export the logger so we can import it in server.js
// 'export default' means this is the main thing this file provides
export default logger;