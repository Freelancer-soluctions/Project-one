import dotenv from './dotenv.js'
const corsOptions = {
  // methods: ['GET', 'POST', 'PUT', 'DELETE'],

  origin: [dotenv('ORIGIN_CORS'), 'http://localhost:5173'],
  // Allow credentials like cookies
  credentials: true,
  // Allow specific headers
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'refresh']
}

export default corsOptions
// default configuration de cors
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
// }
