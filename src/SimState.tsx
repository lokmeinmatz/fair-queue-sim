import { Accessor, Component, For } from "solid-js";
import { Packet, ParsedData } from "./sim/parser";
import { Simulator } from "./sim/sim";


const SimState: Component<{ parsed: ParsedData, sim: Simulator }> = (props) => {

    return <div class="sim-state">
        <table id="basic-state">
            <tbody>
                <tr>
                    <td>Flows</td>
                    <td>{props.parsed.numberOfFlows}</td>
                </tr>
                <tr>
                    <td>Curr. time (μs)</td>
                    <td>{props.sim.currentTime()}</td>
                </tr>
                <tr>
                    <td>Packets</td>
                    <td>{props.sim.nextArrivingPacketIdx()}/{props.parsed.packets.length}</td>
                </tr>
            </tbody>
        </table>
        <table id="parsed">
            <thead>
                <tr>
                    <td>Flow ID</td>
                    <td>Size (bits)</td>
                    <td>time (μs)</td>
                </tr>
            </thead>
            <tbody>
                <For each={props.parsed.packets}>{(p, idx) => <tr classList={{ current: idx() === props.sim.nextArrivingPacketIdx() }}>
                        <td>{p.flowId}</td>
                        <td>{p.size}</td>
                        <td>{p.arrivalTime}</td>
                    </tr>
                }</For>
            </tbody>
        </table>
        <div id="strategy">
            <div id="queue"></div>
            <div id="output">
                <p>Output of Strategy {props.sim.strategy.name}</p>
                <pre>
                    <For each={props.sim.output()}>{l => <code>{l}</code>}</For>
                </pre>
            </div>
        </div>
    </div>
}


export default SimState