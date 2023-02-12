import { appendChild } from './utils'

const createChoice = (text: string, selectable: boolean, value: number) => {
  return <button aria-disabled={!selectable} data-value={value}>{text}</button>;
}

const createDialog = () => {
  let name!: HTMLSpanElement, text!: HTMLParagraphElement, person!: HTMLDivElement;

  const dialog = (
    <div class="novely-dialog">
      <span ref={name} class="novely-dialog__name" />
      <p ref={text} class="novely-dialog__text" />
      <div ref={person} class="novely-dialog__person" />
    </div>
  ) as HTMLDivElement;

  return [dialog, text, name, person] as const;
}

const createInput = () => {
  let input!: HTMLInputElement, text!: HTMLSpanElement, error!: HTMLSpanElement, button!: HTMLButtonElement;

  const container = (
    <div class="novely-input" style={{ display: 'none' }}>
      <label for="novely-input">
        <span ref={text} />
        <input type="text" name="novely-input" required ref={input} />
        <span class="error" aria-live="polite" ref={error} />
      </label>
      <button ref={button}>
        Подтвердить
      </button>
    </div>
  ) as HTMLDivElement;

  return [container, input, text, error, button] as const;
}

const createLayout = (parent: HTMLElement) => {
  const dialog = createDialog();
  const input = createInput();
  const characters = <div class="novely-characters" />;
  const choices = <div class="novely-choices" style={{ display: 'none' }} />;

  appendChild(parent, dialog[0]);
  appendChild(parent, input[0]);
  appendChild(parent, characters)
  appendChild(parent, choices)

  return [characters, choices, dialog, input] as const
}

export { createChoice, createDialog, createLayout }