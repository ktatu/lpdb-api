import { Queue } from "bullmq"

class PlayerStreamsJob {
    static NAME = "player_streams"
    private static queue: Queue

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
    }

    static execute() {
        console.log("player streams job execute")
    }
}

export default PlayerStreamsJob
