import {exec} from "child_process";
const isWin = process.platform === "win32";

export const doArgdownProcessing = async (fileContents:string) => {
	console.log("FC " + fileContents);
	if (await createTempFile(fileContents))
	{
		let command = "argdown map ./argmaps/test.md ./argmaps --format svg";
		if (isWin) {
			command = 'argdown map %CD%\\argmaps\\test.md %CD%\\argmaps --format svg';
		}
		await runCmd(command);
		return await getSVG()
	}

};

const createTempFile = (fileContent:string) => {
	return new Promise(resolve => {
		var fs = require('fs');

		// Change the content of the file as you want
		// or either set fileContent to null to create an empty file

		// The absolute path of the new file with its name
		let path = "./argmaps/test.md";

		fs.writeFile(path, fileContent, (err: any) => {
			if (err) {
				throw err;
				resolve(false);
			}

			console.log("The file was succesfully saved!");
			resolve(true);
		});
	})

};

export const getSVG = () => {
	let command = "cat ./argmaps/test.svg";
	if (isWin) {
		command = 'type %CD%\\argmaps\\test.svg';
	}
	return runCmd(command);

};

const runCmd = (command:string) => {
	return new Promise(resolve => {
		const ls = exec(command);
		// sampleView.load();
		const chunks:String[] = [];
		ls.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
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