import { Component, For, Match, Switch, createSignal } from "solid-js";
import { IStrategy } from "./sim/strategies/IStrategy";

const EXAMPLE_TEXT = `
# numberOfFlows
2
# f1 s1 t1
1 2 3
0 4 5
`

const STRATEGIES: { name: string, strategy: new () => IStrategy }[] = [
    {
        name: 'GPS',
        strategy: null as unknown as any
    }
]

const SimInput: Component<{ onNewInput: (inpt: string) => any, open: boolean }> = (props) => {

    const [inputMode, setInputMode] = createSignal('text');

    const fieldSetChanged = (evt: Event) => setInputMode((evt.target as HTMLInputElement).value)
    const onSubmit = async (e: SubmitEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement);
        let textInput = formData.get('text-input') as string | undefined;
        const fileInput = formData.get('file-input') as File | undefined;

        if (fileInput) {
            textInput = await fileInput.text()
        }
        if (!textInput) return alert('No text input found');

        
        props.onNewInput(textInput)
    }

    return <details open={props.open}>
        <summary>Load Input & Start new Simulation</summary>
        <div class="sim-input">
            <form onSubmit={onSubmit}>
                <fieldset onChange={fieldSetChanged}>
                    <legend>Input from</legend>
                    <div>
                        <input type="radio" id="text" name="inputSrc" value="text"
                            checked />
                        <label for="huey">Text</label>
                    </div>
                    <div>
                        <input type="radio" id="file" name="inputSrc" value="file" />
                        <label for="dewey">File</label>
                    </div>
                </fieldset>
                <label for="strategy">Strategy</label>
                <select>
                    <For each={STRATEGIES}>{s => <option>{s.name}</option>}</For>
                </select>
                <Switch>
                    <Match when={inputMode() === 'text'}>
                        <textarea name="text-input" rows="10" cols="50">{EXAMPLE_TEXT}</textarea>
                    </Match>
                    <Match when={inputMode() === 'file'}>
                        <input name="file-input" type="file"></input>
                    </Match>
                </Switch>
                <button type="submit">Load data into simulation</button>
            </form>
        </div>
    </details>
};

export default SimInput;