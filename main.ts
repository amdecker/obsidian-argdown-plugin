import {
	App, Component,
	ItemView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	Vault,
	Workspace,
	WorkspaceLeaf
} from 'obsidian';
import {doArgdownProcessing, getSVG} from './util';
// import "./mode/argdown"
//
// import "./lib/codemirror";
// import "./lib/argdown-codemirror-mode"
// import "./mode/codemirror-argdown.css"

import './lib/codemirror';
import './lib/simple';
import "./mode/argdown";
import "./mode/codemirror-argdown.css";

// import "@argdown/codemirror-mode";
// // import "codemirror";
// import "codemirror/addon/mode/simple.js"
// import "./node_modules/@argdown/codemirror-mode/codemirror-argdown.css";
// import CodeMirror from "codemirror";
// import "./lib/codemirror"
// import * as CodeMirror from "codemirror";


// var mode = require("argdown-codemirror-mode");
// var CodeMirror = require("codemirror");
// // Activate the simple mode addon
// require("codemirror/addon/mode/simple.js");

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.addRibbonIcon('dice', 'Sample Plugin', () => {
			new Notice('This is a notice!');
		});

		this.addStatusBarItem().setText('Status Bar Text');

		// this.addCommand({
		// 	id: 'open-sample-modal',
		// 	name: 'Open Sample Modal',
		// 	// callback: () => {
		// 	// 	console.log('Simple Callback');
		// 	// },
		// 	checkCallback: (checking: boolean) => {
		// 		let leaf = this.app.workspace.activeLeaf;
		// 		if (leaf) {
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}
		// 			return true;
		// 		}
		// 		return false;
		// 	}
		// });

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		});

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
			console.log(document);

		});
		// this.registerDomEvent(, 'click', callback);
		console.log("hi");
		this.app.workspace.iterateCodeMirrors(cm => cm.setOption("mode", cm.getOption("mode")))

		// console.log(document.getElementsByClassName('svg'))
		// console.log(CodeMirror.modes);
		// var mode = require("argdown-codemirror-mode");
		// var CodeMirror = require("codemirror");
		// // Activate the simple mode addon
		// require("codemirror/addon/mode/simple.js");
		// Define the mode
		// CodeMirror.defineSimpleMode("argdown", mode);
		//
		// this.app.workspace.iterateCodeMirrors(cm => cm.setOption("mode", cm.getOption("mode")))



		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		// this.registerView("test", (leaf: WorkspaceLeaf) => new SampleView(leaf, fileInfo));


		this.addCommand({
			id: 'app:obsidian-sample-plugin', //todo change id
			name: 'Preview the current note as an Argument Map',
			callback: () => this.showPreview(),
			hotkeys: []
		});


	}


	async showPreview() {
		const fileInfo = this.app.workspace.activeLeaf.view.getState().file;
		console.log(fileInfo);

			// activeLeafPath(this.workspace), basename: this.activeLeafName(this.workspace)};
		let md = await this.app.vault.adapter.read(fileInfo);
		const regex = /^```argdown$(.*\s*)*(^```$)/gm;
		const argdownBlockMatch = md.match(regex);
		if(!argdownBlockMatch) {
			return;
		}

		console.log("argdown match");
		console.log(argdownBlockMatch);
		// console.log("md: " + md);
		const argdownBlockContents = argdownBlockMatch[0].substring("```argdown\n".length, argdownBlockMatch[0].length - '```\n'.length);
		const svg = await doArgdownProcessing(argdownBlockContents);
		// this.app.workspace.activeLeaf.getRoot().
		const preview = this.app.workspace.splitActiveLeaf("vertical");
		const mmPreview = new SampleView(preview, svg);
		preview.open(mmPreview);


		//
		// doArgdownProcessing("")
		// console.log(await getSVG());
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}
class SampleView extends ItemView {
	vault: Vault;
	workspace: Workspace;
	getDisplayText(): string {
		return "test";
	}
	getViewType(): string {
		return "test";
	}
	constructor(leaf: WorkspaceLeaf, svg:any){
		super(leaf);
		this.vault = this.app.vault;
		this.workspace = this.app.workspace;

		const c = this.containerEl.children[1];
		const t = document.createElement("div");
		t.innerHTML = svg;
		c.appendChild(t);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}

}
