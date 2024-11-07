import { config } from 'dotenv'

config()
export default (key) => process.env[key]
