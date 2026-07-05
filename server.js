// ============================================================================
// WEEK 5 DAY 2: Express Middleware Assignment
// ============================================================================

import express from 'express';
// Import our custom middleware from the middleware/ folder
import logger from './middleware/logger.js';
import auth from './middleware/auth.js';

// Named imports use curly braces and must match the export names
import { AppError, errorHandler } from './middleware/errorHandler.js';

// CREATE THE EXPRESS APP
const app = express();

// MIDDLEWARE: Parse JSON request bodies
// This MUST come BEFORE our logger if we want the logger to see req.body
app.use(express.json());

// APPLY GLOBAL MIDDLEWARE
// 'app.use(logger)' means: "Run the logger for EVERY request"
// Order matters! Logger should be early so it captures everything
app.use(logger);


// DATA: In-memory cities array (carried over from Day 1)

let cities = [
  { id: 1, name: "Nairobi", county: "Nairobi", population: 4397073 },
  { id: 2, name: "Mombasa", county: "Mombasa", population: 1208333 },
  { id: 3, name: "Kisumu", county: "Kisumu", population: 610082 },
  { id: 4, name: "Nakuru", county: "Nakuru", population: 570674 },
  { id: 5, name: "Eldoret", county: "Uasin Gishu", population: 475716 },
  { id: 6, name: "Thika", county: "Kiambu", population: 279429 },
  { id: 7, name: "Malindi", county: "Kilifi", population: 207253 },
  { id: 8, name: "Kitale", county: "Trans-Nzoia", population: 220111 }
];

// ==========================================================================
// PUBLIC ROUTES (No authentication required)
// ==========================================================================

// Health check — always accessible, tells us the server is alive
// This is useful for monitoring tools to check if your server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// GET all cities — public, anyone can view the list
app.get('/api/cities', (req, res) => {
  const { county, minPopulation } = req.query;
  let result = [...cities];
  
  if (county) {
    result = result.filter(city => 
      city.county.toLowerCase() === county.toLowerCase()
    );
  }
  
  if (minPopulation) {
    const minPop = Number(minPopulation);
    result = result.filter(city => city.population >= minPop);
  }
  
  res.status(200).json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET single city by ID — public
// We use 'next' here so we can pass errors to our error handler
app.get('/api/cities/:id', (req, res, next) => {
  // parseInt converts the string "3" into the number 3
  const city = cities.find(c => c.id === parseInt(req.params.id));
  
  // If city not found, create an AppError and pass it to next()
  // Express will then skip to the error handling middleware
  if (!city) {
    // 'new AppError(message, statusCode)' creates our custom error
    // 'return next(err)' passes the error down the middleware chain
    return next(new AppError("City not found", 404));
  }
  
  res.json({ success: true, data: city });
});

// ==========================================================================
// PROTECTED ROUTES (Authentication required)
// ==========================================================================
// We pass 'auth' as the SECOND argument to these routes
// Express will run auth FIRST, and only if it calls next() will the route handler run
// If auth fails, it sends a 401 and the route handler never executes!

// POST create city — PROTECTED
// The middleware chain: logger → express.json → auth → route handler
app.post('/api/cities', auth, (req, res) => {
  const { name, county, population } = req.body;
  
  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '' ||
      !county || typeof county !== 'string' || county.trim() === '') {
    // We can also throw AppErrors in async code, but for sync code
    // we can use next() or throw. Here we use next() to be consistent.
    return res.status(400).json({
      success: false,
      error: "Name and county are required"
    });
  }
  
  if (typeof population !== 'number' || population <= 0) {
    return res.status(400).json({
      success: false,
      error: "Population must be a positive number"
    });
  }
  
  const newId = cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 1;
  
  const newCity = {
    id: newId,
    name: name.trim(),
    county: county.trim(),
    population: population
  };
  
  cities.push(newCity);
  
  res.status(201).json({
    success: true,
    data: newCity
  });
});

// DELETE city — PROTECTED
app.delete('/api/cities/:id', auth, (req, res, next) => {
  const id = parseInt(req.params.id);
  const index = cities.findIndex(city => city.id === id);
  
  if (index === -1) {
    return next(new AppError(`City with ID ${id} not found`, 404));
  }
  
  const deletedCity = cities.splice(index, 1)[0];
  
  res.status(200).json({
    success: true,
    message: "City deleted",
    data: deletedCity
  });
});


// BONUS: RATE LIMITER MIDDLEWARE

// A Map is like an object but better for tracking data with keys
// We store each IP address and their request count + timestamp
const requestStore = new Map();

const rateLimiter = (req, res, next) => {
  // req.ip gives us the client's IP address
  const ip = req.ip;
  
  // Get the current time
  const now = Date.now();
  
  // Check if we've seen this IP before
  const record = requestStore.get(ip);
  
  if (record) {
    // Check if 60 seconds (60000 ms) have passed since their first request
    // If yes, reset their count (they get a fresh minute)
    if (now - record.firstRequest > 60000) {
      requestStore.set(ip, { count: 1, firstRequest: now });
      return next();
    }
    
    // If they haven't exceeded 10 requests, increment and allow
    if (record.count < 10) {
      record.count += 1;
      requestStore.set(ip, record);
      return next();
    }
    
    // They've exceeded 10 requests! Block them.
    // Calculate how many seconds until they can try again
    const retryAfter = Math.ceil((record.firstRequest + 60000 - now) / 1000);
    
    // 429 = Too Many Requests
    // 'Retry-After' header tells the client when to try again
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: `Too many requests. Try again in ${retryAfter} seconds.`,
      retryAfter: retryAfter
    });
  } else {
    // First time seeing this IP — create a new record
    requestStore.set(ip, { count: 1, firstRequest: now });
    next();
  }
};

// Apply rate limiter to ALL routes (place it before routes)

app.use(rateLimiter);

// ==========================================================================
// TEST ROUTE: Broken route to test 500 error handling
// ==========================================================================
app.get('/api/broken-route', (req, res, next) => {
  // Throw a regular Error (not AppError) to test our 500 handling
  throw new Error("This is a random server crash!");
});

// ==========================================================================
// ERROR HANDLING MIDDLEWARE — MUST BE LAST!
// ==========================================================================
// This MUST be registered AFTER all other routes and middleware
// Express knows it's an error handler because it has 4 parameters
// If an error happens anywhere above, Express skips to this middleware
app.use(errorHandler);

// ==========================================================================
// START THE SERVER
// ==========================================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});