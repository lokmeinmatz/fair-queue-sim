import { Packet } from "../parser";

export interface IStrategy {
    readonly name: string;
    nextPacketIdx(queue: Packet[]): number ;
}