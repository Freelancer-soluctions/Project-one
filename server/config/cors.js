import dotenv from './dotenv'
const corsOptions = {
  // origin: ['http://example1.com', 'http://example2.com'],
  // methods: ['GET', 'POST'],
  // Allow credentials like cookies
  //  credentials: true,
  origin: dotenv('ORIGIN_CORS'),
  // Allow specific headers
  allowedHeaders: ['Content-Type', 'Authorization']
}

export default corsOptions
// default configuration
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
// }
