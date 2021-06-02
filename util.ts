import {exec} from "child_process";
import ErrnoException = NodeJS.ErrnoException;

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWin = process.platform === "win32";

let pathToTmpDir = "";


export const doArgdownProcessing = async (fileContents:string, nameFile: string) => {
	await createTempMarkdownFile(fileContents, nameFile);
	// console.log(await runCmd(`type "${pathToTmpDir}${nameFile}.md"`));

	// I add the slash in at createTmpDir because its easier to take it out than to add it in everywhere
	const pathWithoutTrailingSlash = pathToTmpDir.substring(0, pathToTmpDir.length - 1);

	let command = `export PATH="$PATH:"/usr/local/bin/; argdown web-component "${pathToTmpDir}${nameFile}.md" "${pathWithoutTrailingSlash}"`
	if(isWin) {
		command = `argdown web-component "${pathToTmpDir}${nameFile}.md" "${pathWithoutTrailingSlash}"`
	}
	await runCmd(command);
	return `${pathToTmpDir}${nameFile}.component.html`;
};

const createTempMarkdownFile = async (fileContent:string, nameFile: string) => {
	let path = pathToTmpDir + nameFile + ".md";
	return fs.promises.writeFile(path, fileContent);
};

const runCmd = (command:string) => {
	return new Promise(resolve => {
		const ls = exec(command);
		const chunks:String[] = [];
		ls.stdout.on('data', (data) => {
			// console.log(data);
			chunks.push(data);
		});

		ls.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});

		ls.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
			resolve(chunks.join(''));

		});
	});
};

export const createTmpDir = () => {
	fs.mkdtemp(path.join(os.tmpdir(), 'tmp-'), (err:ErrnoException, folder:string) => {
		if (err) throw err;
		console.log(folder);
		pathToTmpDir = folder;
		if(isWin) {
			pathToTmpDir += '\\';
		}
		else {
			pathToTmpDir += '/';
		}
	});
};

export const deleteTmpDir = () => {
	fs.rmdir(pathToTmpDir, {recursive: true}, (err:ErrnoException) => {
		if (err) throw err;
	});
};