import {exec} from "child_process";
import ErrnoException = NodeJS.ErrnoException;
import {Notice} from "obsidian";

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWin = process.platform === "win32";

let pathToTmpDir = "";


export const doArgdownProcessing = async (fileContents:string, nameFile: string) => {
	await createTempMarkdownFile(fileContents, nameFile);

	// I add the slash in at createTmpDir because its easier to take it out than to add it in everywhere
	const pathWithoutTrailingSlash = pathToTmpDir.substring(0, pathToTmpDir.length - 1);

	let command = `export PATH="$PATH:"/usr/local/bin/; argdown web-component '${sanitize(pathToTmpDir + nameFile)}.md' '${sanitize(pathWithoutTrailingSlash)}'`;
	if(isWin) {
		command = `argdown web-component "${sanitize(pathToTmpDir + nameFile)}.md" "${sanitize(pathWithoutTrailingSlash)}"`
	}
	await runCmd(command);
	return `${pathToTmpDir}${nameFile}.component.html`.replaceAll('"', "%22");
};

export const createTempMarkdownFile = async (fileContent:string, nameFile: string) => {
	let path = pathToTmpDir + nameFile + ".md";
	return fs.promises.writeFile(path, fileContent);
};

const runCmd = (command:string) => {
	return new Promise(resolve => {
		const ls = exec(command);
		const chunks:String[] = [];
		ls.stdout.on('data', (data) => {
			chunks.push(data);
		});

		ls.stderr.on('data', (data) => {
			if(data.toString().contains("Argdown syntax error")) {
				new Notice("Argdown syntax error");
			}
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

export const deleteTmpFiles = async (nameFile: string) => {
	let command = `rm "${sanitize(pathToTmpDir + nameFile)}.md"`;
	if(isWin) {
		command = `del "${sanitize(pathToTmpDir + nameFile)}.md"`;
	}
	await runCmd(command);

	command = `rm "${sanitize(pathToTmpDir + nameFile)}.component.html"`;
	if(isWin) {
		command = `del "${sanitize(pathToTmpDir + nameFile)}.component.html"`;
	}
	await runCmd(command);
};


const sanitize = (command:string) => {
	return command.replaceAll(/[ !"#$&'()*;<>?\[\\`{|~\t\n]/g, (match:string) => {
		if(match === "'") {
			return "\'\"\'\"\'";
		}
		return "\\" + match;
	})
};