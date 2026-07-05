# 🔐 Express Middleware — Logging, Auth & Error Handling

> Week 5, Day 2 — Node.js & Express Backend Assignment  
> A REST API demonstrating custom middleware for request logging, API key authentication, and centralized error handling.

---

## 📑 Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Middleware Explained](#middleware-explained)
- [API Endpoints](#api-endpoints)
- [Testing with cURL](#testing-with-curl)
- [What I Learned](#what-i-learned)
- [Author](#author)

---

## 🎯 About

This project extends the Kenyan Cities API from Day 1 by adding **three layers of middleware**:

1. **Custom Logger** — records every request with timestamp, method, URL, status code, and response time
2. **API Key Authentication** — protects sensitive routes using a secret key header
3. **Centralized Error Handler** — catches all errors in one place and returns consistent JSON responses

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **ES Modules** | Modern `import/export` syntax |

---

## ✨ Features

- ✅ **Custom Logging Middleware** — logs every request with timing and masked passwords
- ✅ **API Key Authentication** — protects `POST` and `DELETE` routes selectively
- ✅ **Public Health Check** — `GET /api/health` accessible without authentication
- ✅ **Centralized Error Handling** — custom `AppError` class + 500 fallback for unknown errors
- ✅ **Bonus Rate Limiter** — limits requests to 10 per minute per IP (optional)

---

## 📁 Project Structure
week-5-day-2-assignment/
├── middleware/
│   ├── logger.js          # Logs every request (timestamp, method, status, duration)
│   ├── auth.js            # API key authentication middleware
│   └── errorHandler.js    # Custom AppError class + global error handler
├── node_modules/          # Dependencies
├── package.json           # Project config
├── package-lock.json      # Locked dependency versions
├── server.js              # Main application entry point
└── README.md              # This file
plain

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed (v14+ recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/week-5-day-2-assignment.git
cd week-5-day-2-assignment

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
You should see:
plain
Server is running on http://localhost:3000
🧠 Middleware Explained
1. Logger (middleware/logger.js)
Records every request in the terminal:
plain
[2026-07-05T14:30:00.000Z] GET /api/cities 200 - 12ms
[2026-07-05T14:30:01.000Z] POST /api/cities 201 - 8ms {"name":"Nanyuki","county":"Laikipia"}
[2026-07-05T14:30:02.000Z] POST /api/auth/login 200 - 15ms {"email":"user@test.com","password":"***"}
Key technique: Uses res.on("finish", ...) to capture the final status code and calculate response time after the response is fully sent.
2. Authentication (middleware/auth.js)
Acts like a bouncer — checks the x-api-key header:
Missing key → 401 Unauthorized
Wrong key → 401 Invalid API key
Correct key → allows the request to proceed
Hardcoded API key: mctaba-2026-secret-key
3. Error Handler (middleware/errorHandler.js)
AppError — a custom error class for predictable errors (404, 400) with isOperational: true
Error middleware — catches ALL errors and returns consistent JSON:
AppErrors → return their specific status code and message
Unknown errors → return 500 with a generic message (no internal details leaked)
📡 API Endpoints
Base URL
plain
http://localhost:3000
Public Routes (No API Key Required)
Table
Method	Endpoint	Description	Status
GET	/api/health	Health check	200
GET	/api/cities	Get all cities	200
GET	/api/cities/:id	Get single city	200, 404
Protected Routes (API Key Required)
Table
Method	Endpoint	Description	Status
POST	/api/cities	Create a new city	201, 400, 401
DELETE	/api/cities/:id	Delete a city	200, 400, 401, 404
Error Test Route
Table
Method	Endpoint	Description	Status
GET	/api/broken-route	Triggers a 500 error	500
🧪 Testing with cURL
Task 1: Logger (Watch Your Terminal!)
Request:
bash
curl http://localhost:3000/api/cities
Expected Response:
JSON
{
  "success": true,
  "count": 8,
  "data": [
    { "id": 1, "name": "Nairobi", "county": "Nairobi", "population": 4397073 },
    { "id": 2, "name": "Mombasa", "county": "Mombasa", "population": 1208333 },
    { "id": 3, "name": "Kisumu", "county": "Kisumu", "population": 610082 },
    { "id": 4, "name": "Nakuru", "county": "Nakuru", "population": 570674 },
    { "id": 5, "name": "Eldoret", "county": "Uasin Gishu", "population": 475716 },
    { "id": 6, "name": "Thika", "county": "Kiambu", "population": 279429 },
    { "id": 7, "name": "Malindi", "county": "Kilifi", "population": 207253 },
    { "id": 8, "name": "Kitale", "county": "Trans-Nzoia", "population": 220111 }
  ]
}
Expected Terminal Log:
plain
[2026-07-05T14:30:00.000Z] GET /api/cities 200 - 12ms
Request:
bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -H "x-api-key: mctaba-2026-secret-key" \
  -d '{"name":"Nanyuki","county":"Laikipia","population":63792}'
Expected Response:
JSON
{
  "success": true,
  "data": {
    "id": 9,
    "name": "Nanyuki",
    "county": "Laikipia",
    "population": 63792
  }
}
Expected Terminal Log:
plain
[2026-07-05T14:30:01.000Z] POST /api/cities 201 - 8ms {"name":"Nanyuki","county":"Laikipia","population":63792}
Task 2: Authentication
Public Route (No Key Required)
Request:
bash
curl http://localhost:3000/api/health
Expected Response:
JSON
{
  "status": "ok"
}
Request:
bash
curl http://localhost:3000/api/cities
Expected Response:
JSON
{
  "success": true,
  "count": 8,
  "data": [...]
}
Protected Route — Missing API Key
Request:
bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -d '{"name":"Nanyuki","county":"Laikipia","population":63792}'
Expected Response:
JSON
{
  "error": "API key required. Include x-api-key header."
}
Status: 401 Unauthorized
Protected Route — Wrong API Key
Request:
bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{"name":"Nanyuki","county":"Laikipia","population":63792}'
Expected Response:
JSON
{
  "error": "Invalid API key"
}
Status: 401 Unauthorized
Protected Route — Valid API Key
Request:
bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -H "x-api-key: mctaba-2026-secret-key" \
  -d '{"name":"Nanyuki","county":"Laikipia","population":63792}'
Expected Response:
JSON
{
  "success": true,
  "data": {
    "id": 9,
    "name": "Nanyuki",
    "county": "Laikipia",
    "population": 63792
  }
}
Status: 201 Created
DELETE Without Key
Request:
bash
curl -X DELETE http://localhost:3000/api/cities/1
Expected Response:
JSON
{
  "error": "API key required. Include x-api-key header."
}
Status: 401 Unauthorized
DELETE With Valid Key
Request:
bash
curl -X DELETE http://localhost:3000/api/cities/1 \
  -H "x-api-key: mctaba-2026-secret-key"
Expected Response:
JSON
{
  "success": true,
  "message": "City deleted",
  "data": {
    "id": 1,
    "name": "Nairobi",
    "county": "Nairobi",
    "population": 4397073
  }
}
Status: 200 OK
Task 3: Error Handling
Operational Error (404 — City Not Found)
Request:
bash
curl http://localhost:3000/api/cities/999
Expected Response:
JSON
{
  "success": false,
  "error": {
    "message": "City not found",
    "statusCode": 404
  }
}
Status: 404 Not Found
Unknown Error (500 — Server Crash)
Request:
bash
curl http://localhost:3000/api/broken-route
Expected Response:
JSON
{
  "success": false,
  "error": {
    "message": "Something went wrong",
    "statusCode": 500
  }
}
Status: 500 Internal Server Error
Note: In development mode (NODE_ENV=development), the response also includes a stack trace for debugging.
Bonus: Rate Limiter (If Enabled)
Request:
bash
# Run this 11 times quickly to trigger rate limiting
for i in {1..11}; do curl http://localhost:3000/api/cities; done
Expected Response (after 10 requests):
JSON
{
  "error": "Too many requests. Try again in 45 seconds.",
  "retryAfter": 45
}
Status: 429 Too Many Requests
Header: Retry-After: 45
🧠 What I Learned
Middleware Flow: Express runs middleware top-to-bottom. Order matters! express.json() must come before logger if the logger needs to see req.body.
next(): The critical function that passes control to the next middleware. Without it, requests hang forever.
res.on("finish"): The only reliable way to capture the final status code and calculate response time after the response is fully sent.
Selective Authentication: Passing auth as a second argument to specific routes (app.post('/api/cities', auth, handler)) protects only those routes while leaving others public.
Custom Error Classes: Extending the built-in Error class with AppError allows us to distinguish between expected operational errors (404) and unexpected programming errors (500).
4-Parameter Error Handlers: Express recognizes (err, req, res, next) as an error-handling middleware because of the 4 parameters. It must be registered AFTER all other routes.
Security: Never log passwords, never expose internal error details or stack traces to clients in production.
👤 Author
Your Name
Course: Backend Development (Week 5)
GitHub: @yourusername
💡 This project was built for educational purposes as part of a Node.js & Express backend development curriculum.
