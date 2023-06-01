import { Component, Ref, createSignal } from "solid-js";
import { Packet } from "./parser";


export abstract class IStrategy {
    static readonly strategyName: string

    constructor(protected numFlows: number) {}

    abstract sendPacketId(queued: Map<number, Packet>): number | undefined
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
}

export class FIFOStrategy extends IStrategy {

    static readonly strategyName = 'FIFO' as const

    sendPacketId(queue: Map<number, Packet>) {
        // console.log('FIFO nextPacketIdx', queue)
        if (queue.size) return queue.values().next().value.id
        return undefined
    }
}

export const STRATEGIES = [
    GPSStrategy,
    FIFOStrategy
] as const

export type StrategyName = (typeof STRATEGIES)[number]['strategyName']