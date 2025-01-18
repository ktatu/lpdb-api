import "dotenv/config"

export let LPDB_API_KEY: string
export let LPDB_API_URL: string
export let MONGODB_URI: string
export let MONGODB_USERNAME: string
export let MONGODB_PASSWORD: string
export let REDIS_CONNECTION_URL: string

let SUPPORTED_WIKIS_STR = ""

if (process.env.ENV === "development") {
    MONGODB_URI = process.env.MONGODB_URI_DEV as string
    LPDB_API_URL = process.env.LPDB_API_URL_DEV as string
    MONGODB_URI = process.env.MONGODB_URI_DEV as string
    MONGODB_USERNAME = process.env.MONGODB_USERNAME_DEV as string
    MONGODB_PASSWORD = process.env.MONGODB_PASSWORD_DEV as string
    REDIS_CONNECTION_URL = process.env.REDIS_CONNECTION_URL_DEV as string

    SUPPORTED_WIKIS_STR = process.env.SUPPORTED_WIKIS_DEV as string
} else if (process.env.ENV === "production") {
    MONGODB_URI = process.env.MONGODB_URI_PROD as string
    LPDB_API_URL = process.env.LPDB_API_URL_PROD as string
    MONGODB_URI = process.env.MONGODB_URI_PROD as string
    MONGODB_USERNAME = process.env.MONGODB_USERNAME_PROD as string
    MONGODB_PASSWORD = process.env.MONGODB_PASSWORD_PROD as string
    REDIS_CONNECTION_URL = process.env.REDIS_CONNECTION_URL_PROD as string

    SUPPORTED_WIKIS_STR = process.env.SUPPORTED_WIKIS_PROD as string
}

if (!SUPPORTED_WIKIS_STR) {
    throw new Error("Supported wikis must be set as env variable")
}

export const SUPPORTED_WIKIS = SUPPORTED_WIKIS_STR.split(",")
