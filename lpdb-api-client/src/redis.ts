import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "./config"

const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
}

export default connection
