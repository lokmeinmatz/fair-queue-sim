import { Accessor, Setter, createSignal } from "solid-js";
import { Packet, ParsedData } from "./parser";
import { IStrategy } from "./strategies/IStrategy";


export class Simulator {
    parsed: ParsedData;
    currentTime: Accessor<number>;
    private setCurrentTime: Setter<number>;

    nextArrivingPacketIdx: Accessor<number>;
    private setNextArrivingPacketIdx: Setter<number>;

    queue: Accessor<Packet[]>;
    private setQueue: Setter<Packet[]>;

    output: Accessor<string[]>;
    private setOutput: Setter<string[]>;

    strategy: IStrategy;

    constructor(parsed: ParsedData, strategy: IStrategy) {
        this.parsed = parsed;
        this.strategy = strategy;
        
        const [currentTime, setCurrentTime] = createSignal(0);
        this.currentTime = currentTime;
        this.setCurrentTime = setCurrentTime;
        
        const [queue, setQueue] = createSignal([]);
        this.queue = queue;
        this.setQueue = setQueue;

        const [packetIdx, setPacketIdx] = createSignal(0);
        this.nextArrivingPacketIdx = packetIdx;
        this.setNextArrivingPacketIdx = setPacketIdx;

        const [output, setOutput] = createSignal([]);
        this.output = output
        this.setOutput = setOutput
    }
}