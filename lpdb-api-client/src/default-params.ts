import { condition } from "./types"

// some param conditions are nearly always used with same properties so defaults exist for ease of use

export const defaultNamespace: condition = {
    name: "namespace",
    operator: "=",
    value: "0",
}

export const defaultDateexact: condition = {
    name: "dateexact",
    operator: "=",
    value: "1",
}

export const defaultFinished: condition = {
    name: "finished",
    operator: "=",
    value: "1",
}
