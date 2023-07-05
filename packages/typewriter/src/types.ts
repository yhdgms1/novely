interface TypewriterOptions {
  /**
   * The node where the typewriter effect will be ran
   */
  node: HTMLElement,
  /**
   * Text to be written by typewriter effect
   */
  text: string,
  /**
   * Time for letter to be written
   */
  speed?: () => number;
  /**
   * Writed did it work itself
   */
  ended?: () => void;
}

export type { TypewriterOptions }