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

const createLayout = (parent: HTMLElement) => {
  const dialog = createDialog();
  const characters = <div class="novely-characters" />;
  const choices = <div class="novely-choices" />;

  appendChild(parent, dialog[0]);
  appendChild(parent, characters)
  appendChild(parent, choices)

  return [characters, choices, dialog] as const
}

export { createChoice, createDialog, createLayout }