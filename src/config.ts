import "dotenv/config"

export const LPDB_API_KEY = process.env.LPDB_API_KEY as string
export const LPDB_API_URL = process.env.LPDB_API_URL as string
export const MONGODB_URI = process.env.MONGODB_URI as string
export const MONGODB_USERNAME = process.env.MONGODB_USERNAME as string
export const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD as string
export const REDIS_PORT = parseInt(process.env.REDIS_PORT as string) as number
export const REDIS_HOST = process.env.REDIS_HOST as string
export const REDIS_USERNAME = process.env.REDIS_USERNAME as string
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD as string
