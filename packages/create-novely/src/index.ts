import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { red, blue, yellow, reset } from 'kolorist';

async function main() {
	let cancelled = false;

	const { projectName, framework } = await prompts(
		[
			{
				type: 'text',
				name: 'projectName',
				message: reset('Project name:'),
				initial: 'my-novely-project',
			},
			{
				type: 'select',
				name: 'framework',
				message: reset('Select a framework:'),
				choices: [
					{
						title: blue('SolidJS'),
						value: 'solid-js',
					},
					{
						title: `${blue('SolidJS')} + ${yellow('YandexGames')}`,
						value: 'solid-js-yagames',
					},
				],
				initial: 0,
			},
		],
		{
			onCancel: () => {
				cancelled = true;
				console.error(red('✖') + ' Operation cancelled');
			},
		},
	);

	if (cancelled) return;

	const root = path.resolve(__dirname, '../');
	const directory = formatTargetDir(projectName || '');

	if (!isEmpty(directory)) {
		const dir = directory === '.' ? 'Current directory' : `Target directory "${directory}"`;

		return console.error(`${dir} is 'not empty'. Operation cancelled.`);
	}

	fs.mkdirSync(directory, { recursive: true });

	copyDir(path.resolve(root, `./template-${framework}`), directory);
	editFile(path.join(directory, 'package.json'), (content) => {
		const parsed = JSON.parse(content);

		parsed.name = toValidPackageName(directory);

		return JSON.stringify(parsed, null, 2);
	});
}

main().catch((error) => console.error(error));

function copy(src: string, dest: string) {
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		copyDir(src, dest);
	} else {
		fs.copyFileSync(src, dest);
	}
}

function toValidPackageName(projectName: string) {
	return projectName
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]/, '')
		.replace(/[^a-z\d\-~]+/g, '-');
}

function copyDir(srcDir: string, destDir: string) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const file of fs.readdirSync(srcDir)) {
		const srcFile = path.resolve(srcDir, file);
		const destFile = path.resolve(destDir, file);
		copy(srcFile, destFile);
	}
}

function isEmpty(path: string) {
	if (!fs.existsSync(path)) return true;

	const files = fs.readdirSync(path);
	return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function editFile(file: string, callback: (content: string) => string) {
	const content = fs.readFileSync(file, 'utf-8');
	fs.writeFileSync(file, callback(content), 'utf-8');
}

function formatTargetDir(targetDir: string | undefined) {
	return targetDir?.trim().replace(/\/+$/g, '') || '';
}
