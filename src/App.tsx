import { Component, Show, createSignal } from 'solid-js';
import SimInput from './SimInput';
import './App.scss';
import { ParsedData, parseInput } from './sim/parser';
import SimulatorComponent from './SimulatorComponent';
import { StrategyName } from './sim/strategies';

const App: Component = () => {

  const [parsedData, setParsedData] = createSignal<ParsedData | undefined>()
  const [strategy, setStrategy] = createSignal<StrategyName | undefined>()
  const [inpOpen, setInpOpen] = createSignal(true)

  const newSim = (input: string, strategyName: StrategyName) => {
    try {
      console.log('Starting new sim with strategy ' + strategyName)
      setInpOpen(true)
      const parsed = parseInput(input)
      setParsedData(parsed)
      setStrategy(strategyName)
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
      <Show when={parsedData() && strategy()}>
        <aside>
          <SimulatorComponent
            parsed={parsedData()!}
            strategy={strategy()!}
          ></SimulatorComponent>
        </aside>
      </Show>
    </div>
  );
};

export default App;
