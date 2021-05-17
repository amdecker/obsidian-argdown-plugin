import {exec} from "child_process";
const isWin = process.platform === "win32";

export const doArgdownProcessing = async (fileContents:string, nameFile: string) => {
	let out = await createTempFile(fileContents, nameFile);
	if (out === "making directory") {
		out = await createTempFile(fileContents, nameFile);
	}
	if (out)
	{
		let command = `argdown web-component  "./argmaps/${nameFile}.md" ./argmaps`
		if (isWin) {
			command = `argdown web-component "%CD%\\argmaps\\${nameFile}.md" %CD%\\argmaps`
		}

		await runCmd(command);
		return await getWebComponent(nameFile);
	}
};

const createTempFile = (fileContent:string, nameFile: string) => {
	return new Promise(resolve => {
		var fs = require('fs');
		let path = `./argmaps/${nameFile}.md`;
		fs.writeFile(path, fileContent, async (err: any) => {
			if (err) {
				console.log(err.toString());
				if(err.toString().contains("ENOENT: no such file or directory, open")) {
					let command = `mkdir ./argmaps/`
					if (isWin) {
						command = `mkdir %CD%\\argmaps`
					}
					await runCmd(command);
					resolve("making directory");
				}
				else {
					throw err;
				}

			}
			console.log("The file was succesfully saved!");
			resolve(true);
		});
	})

};

export const getWebComponent = async (nameFile: string) => {
	let command = `cat "./argmaps/${nameFile}.component.html"`;
	if (isWin) {
		command = `type "%CD%\\argmaps\\${nameFile}.component.html"`;
	}
	await runCmd(command);
	return `argmaps\\${nameFile}.component.html`;

};

const runCmd = (command:string) => {
	return new Promise(resolve => {
		const ls = exec(command);
		const chunks:String[] = [];
		ls.stdout.on('data', (data) => {
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