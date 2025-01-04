import express from "express"
import { fetch } from "./database.js"
import { parse as parseQuery } from "./queryParser.js"

const app = express()

const PORT = 3005
const RATE_LIMIT_DURATION = 60000
const FAKE_API_KEY = "apikey123"

const args = process.argv.slice(2)
let ratelimitMsg = ""
let rateLimitEnabled = false
let latestQueryTimestamp = 0

if (args[0] && args[0] === "ratelimit") {
    rateLimitEnabled = true
    ratelimitMsg = "Rate limit of 1 query per minute enabled."
}

app.get("/healthcheck", (req, res) => {
    res.sendStatus(200)
})

app.get("/match", (req, res) => {
    if (rateLimitEnabled && rateLimitIsReached()) {
        console.log("too many requests")
        return res.status(429).json({ error: ["Rate limit exceeded"] })
    }

    if (apikeyIsInvalid(req.get("Authorization"))) {
        return res
            .status(403)
            .json({ error: [`API key ${FAKE_API_KEY} is not valid.`], result: [] })
    }

    const queryParams = parseQuery(req.query)
    const matches = fetch(queryParams)

    res.json(matches)
})

const rateLimitIsReached = () => {
    const timestampNow = Date.now()
    let reached = false

    if (timestampNow - latestQueryTimestamp < RATE_LIMIT_DURATION) {
        reached = true
    }

    latestQueryTimestamp = timestampNow
    return reached
}

const apikeyIsInvalid = (authHeader) => {
    return authHeader !== FAKE_API_KEY
}

app.listen(PORT, () => {
    console.log(`LPDB mock running on ${PORT}. ${ratelimitMsg}`)
})
