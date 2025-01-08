import { Queue } from "bullmq"

class UpdateMatchJob {
    private static queue: Queue

    private constructor() {}

    static initialize(queue: Queue) {
        this.queue = queue
    }

    static async execute() {}
}

export default UpdateMatchJob
