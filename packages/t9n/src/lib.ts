const split = (input: string, delimeters: string[]) => {
  const output: (string | undefined)[] = [];

  for (const delimeter of delimeters) {
    if (!input) break;

    const [start, end] = input.split(delimeter, 2);

    output.push(start); input = end;
  }

  output.push(input);

  return output;
}

export { split }