import {
	MarkdownPostProcessorContext,
	Plugin,
} from 'obsidian';
import {doArgdownProcessing} from './util';

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

export default class MyPlugin extends Plugin {
	async onload() {
		this.app.workspace.iterateCodeMirrors(cm => cm.setOption("mode", cm.getOption("mode")))

		this.registerMarkdownCodeBlockProcessor("argdown", codeBlockProcessor);
		this.registerMarkdownCodeBlockProcessor("argdown-map", codeBlockProcessor);
	}

	onunload() {
		console.log('unloading plugin');
	}
}

let rerender: NodeJS.Timeout;
async function codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
	const nameFile = ctx.sourcePath.substring(0, ctx.sourcePath.length - 3);

	clearTimeout(rerender);
	rerender = setTimeout(async () => {
		el.innerHTML = `<iframe src="app://local/${await doArgdownProcessing(source, nameFile)}" style="height: 80vh; border: none;" scrolling="no" width="100%"></iframe>`;

	}, 350)

	el.innerText = source;
}
