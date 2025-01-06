import express from "express"
import { connect } from "mongoose"
import { MONGODB_PASSWORD, MONGODB_URI, MONGODB_USERNAME } from "./config"
import JobQueue from "./jobs/queue"

const app = express()

const PORT = process.env.PORT || 3003

app.listen(PORT, async () => {
    console.log(`Running on port ${PORT}`)

    try {
        await connect(MONGODB_URI, { user: MONGODB_USERNAME, pass: MONGODB_PASSWORD })
        console.log("Connected to mongodb")
    } catch (err: unknown) {
        console.log("Failed connecting to mongodb")
    }

    JobQueue.initialize()
})
