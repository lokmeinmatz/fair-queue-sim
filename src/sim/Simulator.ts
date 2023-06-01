import { Packet, ParsedData } from "./parser";
import { IStrategy } from "./strategies";

export interface SimState {
    inputQueue: Packet[]
    queued: Map<number, Packet>
    sent: Packet[]

    currentTime: number
    // strategy: IStrategy
    numFlows: number
    finished: boolean
    strategyInfos: Record<string, any>
}

const MICRO_FAC = 1_000_000

export class Simulator implements SimState {
    inputQueue: Packet[]
    queued: Map<number, Packet> = new Map()
    sent: Packet[] = []

    currentTime: number = 0
    strategy: IStrategy
    numFlows: number

    
    constructor(parsed: ParsedData, strategy: IStrategy) {
        this.inputQueue = parsed.packets
        this.numFlows = parsed.numberOfFlows
        this.strategy = strategy
    }

    getSimState(): SimState {
        return {
            currentTime: this.currentTime,
            numFlows: this.numFlows,
            inputQueue: structuredClone(this.inputQueue),
            queued: structuredClone(this.queued),
            sent: structuredClone(this.sent),
            finished: this.finished,
            strategyInfos: this.strategyInfos
        }
    }

    get finished(): boolean {
        return !this.inputQueue.length && !this.queued.size
    }

    get strategyInfos() {
        return this.strategy.getStrategyDisplayData()
    }

    step() {
        if (this.finished) {
            console.warn('Tried to step but simulation finished')
            return
        }
        // console.log('Simulating time ' + this.currentTime)
        let toQueueEndIdx = 0
        while(this.inputQueue.length > toQueueEndIdx && this.inputQueue[toQueueEndIdx].arrivalTime === this.currentTime) {
            toQueueEndIdx++
        }

        const toAdd = this.inputQueue.splice(0, toQueueEndIdx)
        toAdd.forEach(p => this.queued.set(p.id, p))

        // console.log(this.queued)

        const idToSend = this.strategy.sendPacketId(this.queued)
        if (idToSend !== undefined) {
            const p = this.queued.get(idToSend)
            if (!p) {
                console.error(`Tried to send packet ${idToSend} which is not in queue`)
                this.currentTime++
                return
            }
            p.size--
            if (p.size < 1) {
                // console.log(`Packet ${p.id} is finished sending, removing from queue`)
                this.queued.delete(p.id); // remove packet fro queue
                p.fullySentTime = this.currentTime
                this.sent.push(p)
            }
        }
        this.currentTime++
    }

    getThroughputs(): { total: number, perFlow: number[] } {
        const sentBitsPerFlow = this.sent.reduce((acc, p) => {
            acc[p.flowId] ??= 0
            acc[p.flowId] += p.originalSize
            return acc
        }, [] as number[]);

        const sentBitsTotal = sentBitsPerFlow.reduce((acc, v) => acc + v, 0)

        if (!sentBitsTotal || !this.currentTime) {
            return {
                total: 0,
                perFlow: []
            }
        }

        return {
            total: (sentBitsTotal / this.currentTime),
            perFlow: sentBitsPerFlow.map(b => (b / this.currentTime))
        }
    }

    getLatencyStats(): { total: LatencyStats, perFlow: LatencyStats[] } {

        if (!this.sent.length) return { total: { mean: 0, variance: 0 }, perFlow: [] };

        const packetsPerFlow: number[] = []
        let totalLatency = 0
        const meanPerFlow = this.sent.reduce((acc, p) => {
            acc[p.flowId] ??= 0
            const latency = p.fullySentTime! - p.arrivalTime 
            acc[p.flowId] += latency
            totalLatency += latency
            packetsPerFlow[p.flowId] ??= 0
            packetsPerFlow[p.flowId]++
            return acc
        }, [] as number[]);

        for (let i = 0; i < this.numFlows; i++) {
            if (packetsPerFlow[i]) meanPerFlow[i] /= packetsPerFlow[i]
        }

        const meanTotal = totalLatency / this.sent.length
        
        let varianceTotal = 0
        let variancePerFlow = new Array<number>(this.numFlows).fill(0, 0, this.numFlows)

        for(const p of this.sent) {
            const latency = p.fullySentTime! - p.arrivalTime
            varianceTotal += Math.pow(latency - meanTotal, 2)
            variancePerFlow[p.flowId] += Math.pow(latency - meanPerFlow[p.flowId], 2)
        }

        varianceTotal /= this.sent.length
        for (let i = 0; i < this.numFlows; i++) {
            if (packetsPerFlow[i]) variancePerFlow[i] /= packetsPerFlow[i]
        }

        return {
            total: { mean: meanTotal, variance: varianceTotal },
            perFlow: meanPerFlow.map((mpf, i) => ({ mean: mpf, variance: variancePerFlow[i] }))
        }
    }
}

interface LatencyStats {
    mean: number;
    variance: number;
}


