import {
	MarkdownPostProcessorContext,
	Plugin,
} from 'obsidian';
import {createTmpDir, deleteTmpDir, deleteTmpFiles, doArgdownProcessing} from './util';

import './lib/codemirror';
import './lib/simple';
import "./mode/argdown";
import "./mode/codemirror-argdown.css";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

let addTimeoutBeforeRerender = true;

export default class MyPlugin extends Plugin {
	async onload() {
		createTmpDir();
		this.registerMarkdownCodeBlockProcessor("argdown", codeBlockProcessor);
		this.registerMarkdownCodeBlockProcessor("argdown-map", codeBlockProcessor);

		this.app.workspace.on("layout-change", () => {
			addTimeoutBeforeRerender = false;
			console.log('layout changed')
		});

		this.app.workspace.on("quit", () => deleteTmpDir());
	}


	onunload() {
		deleteTmpDir();
		console.log('unloading plugin & deleting tmp argdown files');
	}
}

let rerender: number;

const waitAfterLastKeypress = 350; // rerenders this many millis after the last keypress

let didStartResetTimeout = false;
// time to wait before using the timeout for the rerenders.
// 15 secs is way more time than it takes to allow all the automatic renders to happen
const numMillisUseTimeout = 15000;

async function codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
	el.innerText = source;

	if(!didStartResetTimeout) {
		didStartResetTimeout = true;
		window.setTimeout(() => {
			addTimeoutBeforeRerender = true;
			didStartResetTimeout = false;
		}, numMillisUseTimeout)
	}

	// don't use the timeout when the layout changes (like when the app or a file opens) so that all the blocks can
	// be rendered
	if(addTimeoutBeforeRerender) {
		// rerender only when the user has stopped typing that way it doesn't slow down doing the argdown processing
		clearTimeout(rerender);
		rerender = window.setTimeout(async () => {
			const nameFile = Math.floor(Math.random()*10000000000000).toString();
			const pathToHtml = await doArgdownProcessing(source, nameFile);
			el.innerHTML = `<iframe src="app://local/${pathToHtml}" style="height: 80vh; border: none;" scrolling="no" width="100%"></iframe>`;
			await deleteTmpFiles(nameFile);
		}, waitAfterLastKeypress);
	}
	else {
		const nameFile = Math.floor(Math.random()*10000000000000).toString();
		const pathToHtml = await doArgdownProcessing(source, nameFile);
		el.innerHTML = `<iframe src="app://local/${pathToHtml}" style="height: 80vh; border: none;" scrolling="no" width="100%"></iframe>`;
		await deleteTmpFiles(nameFile);
	}
}