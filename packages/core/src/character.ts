type Emotions<Keys extends string = string> = Record<Keys, string | { body: Record<'left' | 'right', string>, head: string }>;

type Character = {
  name: string;
  color: string;
  emotions: Emotions;
}

export type { Emotions, Character }
