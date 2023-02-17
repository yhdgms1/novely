type Emotions<Keys extends string | number | symbol = string> = Record<Keys, string | { body: Record<'left' | 'right', string>, head: string }>;

interface CharacterDefinition {
  name: string;
  color: string;
  emotions: Emotions;
}

interface DefinedCharacter<N extends string, E extends Emotions> {
  name: N;
  color: string;
  emotions: E;
  emotion: (name: keyof E) => E[keyof E];
}

type DefaultDefinedCharacter = DefinedCharacter<string, Emotions<string>>;

const defineCharacter = <D extends CharacterDefinition>(c: D): DefinedCharacter<D['name'], Emotions<keyof D['emotions']>> => {
  const emotions = c.emotions as Emotions<keyof D['emotions']>;

  return {
    name: c.name,
    color: c.color,
    emotions: emotions,
    emotion: (name) => {
      return emotions[name];
    }
  }
}

export type { Emotions, CharacterDefinition, DefinedCharacter, DefaultDefinedCharacter }
export { defineCharacter }