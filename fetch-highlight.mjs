import { writeFile } from 'fs/promises';

const URL = "https://raw.githubusercontent.com/yhdgms1/novely/main/packages/vscode-highlight/syntaxes/nvly.tmLanguage.json";
const tmLanguage = await fetch(URL).then(response => response.json());

await writeFile('./docs/.vitepress/novely.tmLanguage.json', JSON.stringify(tmLanguage, null, 2));

const pink = (str) => `\x1b[48;5;128;38;5;15m${str}\x1b[0m` 

console.log(`${pink("Highlight")}: novely.tmLanguage.json is downloaded successfully`)