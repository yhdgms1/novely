import { styleText } from 'node:util';
import { writeFile } from 'node:fs/promises';

const URL = "https://raw.githubusercontent.com/yhdgms1/novely/main/packages/vscode-highlight/syntaxes/novely.tmLanguage.json";
const tmLanguage = await fetch(URL).then(response => response.json());

await writeFile('./docs/.vitepress/novely.tmLanguage.json', JSON.stringify(tmLanguage, null, 2));

console.log(`${styleText(["magentaBright"], "Highlight")}: novely.tmLanguage.json is downloaded successfully`)