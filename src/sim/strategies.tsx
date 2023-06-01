import { Packet } from "./parser";


export abstract class IStrategy {
    static readonly strategyName: string

    constructor(protected numFlows: number) {}

    abstract sendPacketId(queued: Map<number, Packet>): number | undefined

    abstract getStrategyDisplayData(): Record<string ,any>
}

export function createStrategy(name: StrategyName, numFlows: number): IStrategy {
    return new (STRATEGIES.find(s => s.strategyName === name)!)(numFlows)
}

export class GPSStrategy extends IStrategy {

    currFlow = 0
    static readonly strategyName = 'Generalized Processor Sharing' as const

    sendPacketId(queue: Map<number, Packet>) {
        if (!queue.size) return undefined

        let pOfFlow: Packet | undefined
        while(!pOfFlow) {
            pOfFlow = [...queue.values()].find(p => p.flowId == this.currFlow)
            this.currFlow = (this.currFlow + 1) % this.numFlows
        }
        return pOfFlow.id
    }

    getStrategyDisplayData(): Record<string, any> {
        return {
            'Current Flow': this.currFlow
        }
    }

}

export class RoundRobinStrategy extends IStrategy {

    currFlow = 0
    currId = 0
    static readonly strategyName = 'Round Robin' as const

    sendPacketId(queue: Map<number, Packet>) {
        if (!queue.size) return undefined

        if (queue.has(this.currId)) return this.currId

        let pOfFlow: Packet | undefined
        while(!pOfFlow) {
            pOfFlow = [...queue.values()].find(p => p.flowId == this.currFlow)
            this.currFlow = (this.currFlow + 1) % this.numFlows
        }
        this.currId = pOfFlow.id
        return pOfFlow.id
    }


    getStrategyDisplayData(): Record<string, any> {
        return {
            'Current Flow': this.currFlow,
            'Current ID': this.currId
        }
    }
}

/**
 * Assuming Qi = 1 for every flow -> balanced utilization
 */
export class DeficitRoundRobinStrategy extends IStrategy {

    currFlow = 0
    currId = 0

    deficit: number[]

    constructor(numFlows: number) {
        super(numFlows)
        this.deficit = new Array(numFlows).fill(0, 0, numFlows)
    }

    static readonly strategyName = 'Deficit Round Robin' as const

    sendPacketId(queue: Map<number, Packet>) {
        if (!queue.size) return undefined

        // continue sending
        if (queue.has(this.currId)) return this.currId

        let pOfFlow: Packet | undefined
        while(!pOfFlow) {
            pOfFlow = [...queue.values()].find(p => p.flowId == this.currFlow)
            if (pOfFlow) {
                this.deficit[this.currFlow]++
            } else {
                this.deficit[this.currFlow] = 0
            }
            if (pOfFlow && pOfFlow.size <= this.deficit[this.currFlow]) {
                // send head of currFlow queue
                this.deficit[this.currFlow] -= pOfFlow.size
            } else {
                pOfFlow = undefined
                this.currFlow = (this.currFlow + 1) % this.numFlows
            }

        }
        this.currId = pOfFlow.id
        return pOfFlow.id
    }

    getStrategyDisplayData(): Record<string, any> {
        return {
            'Current Flow': this.currFlow,
            'Current ID': this.currId,
            'deficits': this.deficit.map((q, i) => `flow ${i}: ${q}`).join(', ')
        }
    }
}

export class FIFOStrategy extends IStrategy {

    static readonly strategyName = 'FIFO' as const

    sendPacketId(queue: Map<number, Packet>) {
        // console.log('FIFO nextPacketIdx', queue)
        if (queue.size) return queue.values().next().value.id
        return undefined
    }

    getStrategyDisplayData(): Record<string, any> {
        return {}
    }
}

export const STRATEGIES = [
    GPSStrategy,
    FIFOStrategy,
    RoundRobinStrategy,
    DeficitRoundRobinStrategy
] as const

export type StrategyName = (typeof STRATEGIES)[number]['strategyName']