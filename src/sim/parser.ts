
export interface Packet {
    flowId: number;
    /**
     * in bits
     */
    size: number;
    /**
     * in microsecs
     */
    arrivalTime: number;
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
        let [fi, si, ti] = lines[i].split(' ').map(s => parseInt(s))
        if (fi < 0 || fi >= res.numberOfFlows) throw new Error(`Line ${i}: Found flow identifier ${fi} >= number of flows ${res.numberOfFlows}`)
        res.packets.push({
            flowId: fi,
            size: si,
            arrivalTime: ti
        })
    }

    res.packets.sort((a, b) => a.arrivalTime - b.arrivalTime)

    return res
}