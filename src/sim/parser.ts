
export interface Packet<Meta = undefined> {
    id: number;
    flowId: number;
    /**
     * in bits
     */
    size: number;
    originalSize: number;
    /**
     * in microsecs
     */
    arrivalTime: number;
    fullySentTime?: number;
    meta: Meta;
}

export function getLatency(p: Packet): number {
    return (p.fullySentTime === undefined) ? 0 : p.fullySentTime - p.arrivalTime
}

export interface ParsedData {
    numberOfFlows: number;
    packets: Packet[];
}

export function parseInput(inp: string): ParsedData {
    const res = {
        numberOfFlows: 0,
        packets: [] as Packet[]
    };

    const lines = inp.split('\n').map(l => l.trim()).filter(l => !!l && !l.startsWith('#'))
    if (!lines.length) throw new Error('Expected at least one line with data from input')

    res.numberOfFlows = parseInt(lines[0])

    for(let i = 1; i < lines.length; i++) {
        const match = /^(\d+)\s(\d+)\s(\d+)$/.exec(lines[i])?.slice(1)
        if (match?.length !== 3) throw new Error(`Failed to parse line ${i}: "${lines[i]}"`)
        let [fi, si, ti] = match.map(s => parseInt(s))
        if (fi < 0 || fi >= res.numberOfFlows) throw new Error(`Line ${i}: Found flow identifier ${fi} >= number of flows ${res.numberOfFlows}`)
        res.packets.push({
            id: i,
            flowId: fi,
            size: si,
            originalSize: si,
            arrivalTime: ti,
            meta: undefined
        })
    }

    res.packets.sort((a, b) => a.arrivalTime - b.arrivalTime)

    return res
}