import dotenv from './dotenv.js'
const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  // Allow credentials like cookies
  //  credentials: true,
  origin: [dotenv('ORIGIN_CORS'), 'http://localhost:5173'],
  // Allow specific headers
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}

export default corsOptions
// default configuration de cors
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
// }
