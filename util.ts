import {exec} from "child_process";
const isWin = process.platform === "win32";
const pathToAppDir = __dirname.substring(0, __dirname.length - "electron.asar\\renderer".length);


export const doArgdownProcessing = async (fileContents:string, nameFile: string) => {
	if (await createTempFile(fileContents, nameFile))
	{
		let command = `export PATH="$PATH:"/usr/local/bin/; argdown web-component "${pathToAppDir}${nameFile}.md" ${pathToAppDir}`
		if(isWin) {
			command = `argdown web-component  "${pathToAppDir}${nameFile}.md" ${pathToAppDir}`
		}

		await runCmd(command);
		return await getWebComponent(nameFile);
	}
};

const createTempFile = (fileContent:string, nameFile: string) => {
	return new Promise(resolve => {
		var fs = require('fs');
		let path = pathToAppDir + nameFile + ".md";

		fs.writeFile(path, fileContent, async (err: any) => {
			if (err) {
				throw err;

			}
			console.log("The file was succesfully saved!");
			resolve(true);
		});
	})

};

export const getWebComponent = async (nameFile: string) => {
	let command = `cat "${pathToAppDir}${nameFile}.component.html"`;
	if (isWin) {
		command = `type "${pathToAppDir}${nameFile}.component.html"`;
	}
	await runCmd(command);
	if(isWin) {
		return `resources\\${nameFile}.component.html`;
	}

	return `${pathToAppDir}${nameFile}.component.html`;


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