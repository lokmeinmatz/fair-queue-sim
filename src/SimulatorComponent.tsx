import { Accessor, Component, For, Show, batch, createEffect, createMemo, createSignal, onMount } from "solid-js";
import { Packet, ParsedData, getLatency } from "./sim/parser";
import { Simulator } from "./sim/Simulator";
import { VirtualContainer, VirtualItemProps } from "@minht11/solid-virtual-container"
import { IStrategy, StrategyName, createStrategy } from "./sim/strategies";
import { Chart, Title, Legend, Colors, ChartOptions, ChartDataset, ChartData, Tooltip } from 'chart.js'
import { Bar } from 'solid-chartjs'

const Arrow = () => {
    return <svg class="arrow-right" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M 80,0 L 80,100 L 0,100 L100,200 L200,100 L120,100 L120,0"></path>
    </svg>
}

const ListItem = (showLatency?: boolean) => (props: VirtualItemProps<Packet>) => (
    <div
        // Required for items to switch places.
        style={props.style}
        // Use CSS to set width to 100% or any other value.
        class='width-full'
        // Used for keyboard navigation and accessibility.
        tabIndex={props.tabIndex}
        role="listitem"
    >
        <p>{props.item.flowId}</p>
        <p>{props.item.size} ({props.item.originalSize})</p>
        <p>{props.item.arrivalTime}</p>
        <Show when={showLatency}>{getLatency(props.item)}</Show>
    </div>
)

const PacketList: Component<{ title: string, packets: Packet[], id?: string, showLatencies?: boolean }> = (props) => {
    let scrollTargetElement!: HTMLDivElement

    return <div class="packet-list" classList={{ 'show-latencies': props.showLatencies }} id={props.id}>
        <p style={{ width: '100%' }}>{props.title}</p>
        <div class="packet-list__head">
            <p>Flow</p>
            <p>Size (orig)</p>
            <p>time μs</p>
            <Show when={props.showLatencies}><p>Latency</p></Show>
        </div>
        <div class="packet-list__body scrollable" ref={scrollTargetElement}>
            <VirtualContainer
                items={props.packets}
                scrollTarget={scrollTargetElement}
                itemSize={{ height: 30 }}
            >
                {ListItem(props.showLatencies)}
            </VirtualContainer>
        </div>
    </div>
}


const LatencyGraph: Component<{ packets: Packet[], numFlows: number}> = (props) => {

    onMount(() => {
        Chart.register(Title, Legend, Colors, Tooltip)
    })

    const chartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                //type: 'linear',
                position: 'bottom',
                beginAtZero: true,
                stacked: true,
                ticks: {
                    autoSkip: true
                }
            },
            y: {
                type: 'linear',
                beginAtZero: true,
                stacked: true
            }
        }
    }

    const [bucketSize, setBucketSize] = createSignal(1)

    const data = createMemo<ChartData>(() => {
        let maxLatency = 0
        const flowPackets = props.packets.reduce((acc, p) => {
            acc[p.flowId] ??= []
            acc[p.flowId].push(p)
            maxLatency = Math.max(maxLatency, getLatency(p))
            return acc
        }, [] as Packet[][])

        maxLatency++

        // todo buckets?
        const bucketSize = Math.ceil(maxLatency / 100)
        const numBuckets = Math.ceil(maxLatency / bucketSize)

        setBucketSize(bucketSize)

        const ds = {
            //labels: new Array(numBuckets).fill(0, 0, numBuckets).map((_, i) => bucketSize === 1 ? i : `${i*bucketSize}-${(i+1)*bucketSize-1}`),
            labels: new Array(numBuckets).fill(0, 0, numBuckets).map((_, i) => i * bucketSize),
            datasets: flowPackets.map((pkgs, flowId) => {
                const latencies = pkgs.map(p => getLatency(p) as number)

                return {
                    label: `Flow ${flowId}`,
                    data: latencies.reduce((acc, latency) => {
                        acc[Math.floor(latency / bucketSize)]++
                        return acc
                    }, new Array<number>(numBuckets).fill(0, 0, numBuckets))
                }
            }).filter(ds => !!ds?.data.length)
        }
        return ds
    }, { datasets: [] }, { equals(prev, next) {
        return JSON.stringify(prev) == JSON.stringify(next)
    }, }) 

    
    return <>
        <p>latency bucket size: {bucketSize()}</p>
        <div>
            <Bar data={data()} options={chartOptions}></Bar>
        </div>
    </>
}

const SimulatorComponent: Component<{ parsed: ParsedData, strategy: StrategyName }> = (props) => {
    if (!props.strategy) throw new Error('required: strategy')

    const sim = createMemo(() => {
        console.log('strategy or parsed changed, recreating sim')
        const strategy = createStrategy(props.strategy, props.parsed.numberOfFlows)
        return new Simulator(props.parsed, strategy)
    })

    const [simState, setSimState] = createSignal(sim().getSimState())
    const [throughput, setThroughput] = createSignal(sim().getThroughputs())
    const [latency, setLatency] = createSignal(sim().getLatencyStats())

    createEffect(() => setSimState(sim().getSimState()))

    const updateSimRenderData = () => {
        setSimState(sim().getSimState())
        setThroughput(sim().getThroughputs())
        setLatency(sim().getLatencyStats())
    }

    const stepSim = () => batch(() => {
        sim().step()
        updateSimRenderData()
    })

    const [playCancel, setPlayCancel] = createSignal<AbortController>()

    const startPlay = () => {
        if (playCancel()) playCancel()!.abort()
        const abortController = new AbortController()
        const abortSignal = abortController.signal
        setPlayCancel(abortController)
        const nextFrame = (frame: number) => {
            if (abortSignal.aborted || sim().finished) return updateSimRenderData()
            for(let i = 0; i < 1000; i++) {
                sim().step()
            }
            if (frame % 10 == 0) updateSimRenderData()
            requestAnimationFrame(() => nextFrame(frame + 1))
        }
        nextFrame(0)
    }

    const stopPlay = () => {
        playCancel()?.abort()
        setPlayCancel(undefined)
    }

    const [showQueues, setShowQueues] = createSignal(true)


    return <div class="sim-state">
        <div id="basic-state">
            <table>
                <tbody>
                    <tr>
                        <td>Flows</td>
                        <td>{props.parsed.numberOfFlows}</td>
                    </tr>
                    <tr>
                        <td>Curr. time (μs)</td>
                        <td>{simState().currentTime}</td>
                    </tr>
                    <tr>
                        <td>Packets out</td>
                        <td>{simState().sent.length}/{props.parsed.packets.length}</td>
                    </tr>
                    <tr>
                        <td>Strategy</td>
                        <td>{(sim().strategy.constructor as typeof IStrategy).strategyName}</td>
                    </tr>
                </tbody>
            </table>
            <fieldset>
                <button onClick={stepSim} disabled={simState().finished}>Step</button>
                <button 
                    onClick={() => playCancel() ? stopPlay() : startPlay()}
                >{playCancel() ? 'Stop' : 'Play'}</button>
            </fieldset>
            <div class="strategy-infos">
                <p>Strategy infos</p>
                <For each={Object.entries(simState().strategyInfos)}>{([key, val]) => <p>{key}: {val?.toString()}</p>}</For>
            </div>
        </div>
        <div id="queue-state">
            <button style={{"align-self": 'start'}} onclick={() => setShowQueues(!showQueues())}>{showQueues() ? 'hide queues' : 'show queues'}</button>
            <Show when={showQueues()}>
                <PacketList title="inputs" packets={simState().inputQueue}></PacketList>
                <Arrow />
                <PacketList title="queued" packets={[...simState().queued.values()]}></PacketList>
                <Arrow />
                <PacketList title="sent" packets={simState().sent} showLatencies></PacketList>
            </Show>
        </div>
        <div id="throughputs">
            <h3>Throughputs</h3>
            <table>
                <thead>
                    <tr><td></td><td>b/μs</td></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total</td>
                        <td>{throughput().total.toFixed(4)}</td>
                    </tr>
                    <For each={throughput().perFlow}>{(t, fId) => <Show when={t !== undefined}>
                        <tr>
                            <td>{fId}</td>
                            <td>{t.toFixed(4)}</td>
                        </tr>
                    </Show>}</For>
                </tbody>
            </table>
        </div>
        <div id="latencies">
            <h3>Latencies</h3>
            <table>
                <thead>
                    <tr><td></td><td>Mean</td><td>Variance</td></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total</td>
                        <td>{latency().total.mean.toFixed(2)}</td>
                        <td>{latency().total.variance.toFixed(2)}</td>
                    </tr>
                    <For each={latency().perFlow}>{(l, fId) => <Show when={l !== undefined}>
                        <tr>
                            <td>{fId}</td>
                            <td>{l.mean.toFixed(2)}</td>
                            <td>{l.variance.toFixed(2)}</td>
                        </tr>
                    </Show>}</For>
                </tbody>
            </table>
        </div>
        <div id="latency-graph">
            <LatencyGraph packets={simState().sent} numFlows={props.parsed.numberOfFlows}/>
        </div>
    </div>
}


export default SimulatorComponent