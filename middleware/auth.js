// ============================================================================
// TASK 2: AUTHENTICATION MIDDLEWARE
// ============================================================================

// in real apps the API would be stored in an environment variable, not hardcoded
const API_KEY = "mctaba-2026-secret-key";

// This is the authentication middleware function
// It checks the 'x-api-key' header on incoming requests
const auth = (req, res, next) => {
  
  // req.headers is an object containing ALL headers the client sent
  // Headers are metadata sent with every HTTP request
  // We look for the custom 'x-api-key' header (lowercase in Express)
  const apiKey = req.headers["x-api-key"];
  
  // Check if the API key header is MISSING
  // '!' means "not" — so '!apiKey' means "if apiKey is undefined, null, or empty"
  if (!apiKey) {
    // 401 = Unauthorized (you didn't provide credentials)
    // We send a JSON error and RETURN to stop the function here
    // We do NOT call next() because we want to BLOCK this request
    return res.status(401).json({
      error: "API key required. Include x-api-key header."
    });
  }
  
  // Check if the provided API key is WRONG
  // We compare what the client sent against our secret key
  if (apiKey !== API_KEY) {
    // 401 again — they provided a key, but it's not the right one
    return res.status(401).json({
      error: "Invalid API key"
    });
  }
  
  // If we get here, the API key is correct!
  // Call next() to allow the request to proceed to the route handler
  next();
};

// Export the auth middleware
export default auth;