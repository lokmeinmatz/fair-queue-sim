import { Component, Show, createSignal } from 'solid-js';
import SimInput from './SimInput';
import './App.scss';
import { ParsedData, parseInput } from './sim/parser';
import SimState from './SimState';
import { Simulator } from './sim/sim';

const App: Component = () => {

  const [parsedData, setParsedData] = createSignal<ParsedData | undefined>()
  const [sim, setSim] = createSignal<Simulator>()
  const [inpOpen, setInpOpen] = createSignal(true)

  const newSim = (input: string) => {
    try {
      setInpOpen(true)
      const parsed = parseInput(input)
      setParsedData(parsed)
      setSim(new Simulator(parsed))
      setInpOpen(false)
    } catch (error) {
      alert((error as Error).message)
      console.error(error)
    }
  } 

  return (
    <div>
      <header>
        <SimInput onNewInput={newSim} open={inpOpen()} />
      </header>
      <hr/>
      <Show when={parsedData() && sim()}>
        <aside>
          <SimState 
            parsed={parsedData()!}
            sim={sim()!}
          ></SimState>
        </aside>
      </Show>
    </div>
  );
};

export default App;
