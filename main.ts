import {
	MarkdownPostProcessorContext,
	Plugin,
	PluginSettingTab,
	Setting,
	App
} from 'obsidian';

import './lib/codemirror';
import './lib/simple';
import "./mode/codemirror-argdown";
import "./mode/codemirror-argdown.css";

import {
	ArgdownApplication,
	IArgdownRequest,
	ParserPlugin,
	DataPlugin,
	ModelPlugin,
	ColorPlugin,
	HighlightSourcePlugin,
	WebComponentExportPlugin,
	MapPlugin,
	GroupPlugin,
	ClosedGroupPlugin,
	DotExportPlugin,
	PreselectionPlugin,
	StatementSelectionPlugin,
	ArgumentSelectionPlugin,
	HtmlExportPlugin,
	ExplodeArgumentsPlugin
} from "@argdown/core";
import {SyncDotToSvgExportPlugin } from "@argdown/core/dist/plugins/SyncDotToSvgExportPlugin";

interface MyPluginSettings {
	initialView: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	initialView: 'map'
}

let pluginSettings = {};

const WEB_COMPONENT_SCRIPT_ID = "argdown-web-component-script";
const WEB_COMPONENT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@argdown/web-components@2.0.1/dist/argdown-map.js";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log("loading Argdown Plugin");
		setupScripts();

		await this.loadSettings()
		this.addSettingTab(new ArgdownSettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("argdown", this.codeBlockProcessor);
		this.registerMarkdownCodeBlockProcessor("argdown-map", this.codeBlockProcessor);

	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		pluginSettings = this.settings;
	}

	async saveSettings() {
		pluginSettings = this.settings;
		await this.saveData(this.settings);
	}
	onunload() {
		console.log('unloading Argdown plugin');
	}

	/**
	 * updates the preview pane, replaces the codeblock preview with the argument map
	 */
	codeBlockProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		el.innerHTML = `${argdownInputToComponent(source)}`;
	}
}

/**
 *  Takes in argdown syntax and returns a web component with the map
 * @param input: argdown text (without the ```argdown``` or ```argdown-map```)
 */
function argdownInputToComponent(input: string) {
	const app = new ArgdownApplication();

	const parserPlugin = new ParserPlugin();
	app.addPlugin(parserPlugin, "parse-input");

	const dataPlugin = new DataPlugin();
	app.addPlugin(dataPlugin, "data");

	const modelPlugin = new ModelPlugin();
	app.addPlugin(modelPlugin, "build-model");

	const explodeArgumentsPlugin = new ExplodeArgumentsPlugin();
	app.addPlugin(explodeArgumentsPlugin, "explode-arguments");

	const preSelectionPlugin = new PreselectionPlugin();
	app.addPlugin(preSelectionPlugin, "pre");

	const statementSelection = new StatementSelectionPlugin();
	app.addPlugin(statementSelection, "statement");

	const argumentSelectionPlugin = new ArgumentSelectionPlugin();
	app.addPlugin(argumentSelectionPlugin, "argument");

	const mapPlugin = new MapPlugin();
	app.addPlugin(mapPlugin, "build-map");

	const groupPlugin = new GroupPlugin();
	app.addPlugin(groupPlugin, "groups");

	const closedGroupPlugin = new ClosedGroupPlugin();
	app.addPlugin(closedGroupPlugin, "transform-closed-groups");

	const colorPlugin = new ColorPlugin();
	app.addPlugin(colorPlugin, "colorize");

	const dotExportPlugin = new DotExportPlugin();
	app.addPlugin(dotExportPlugin, "export-dot");

	const dotToSvgPlugin = new SyncDotToSvgExportPlugin();
	app.addPlugin(dotToSvgPlugin, "export-svg")

	const highlightSourcePlugin = new HighlightSourcePlugin();
	app.addPlugin(highlightSourcePlugin, "highlight-source");

	const webComponentExportPlugin = new WebComponentExportPlugin({
		initialView: pluginSettings.initialView,
		addWebComponentScript: false,
		addWebComponentPolyfill: false,
		addGlobalStyles: false
	});
	app.addPlugin(webComponentExportPlugin, "export-web-component");

	const request:IArgdownRequest = {
		input,
		process: [
			"parse-input",
			"data",
			"build-model",
			"explode-arguments",
			"pre",
			"statement",
			"argument",
			"build-map",
			"groups",
			"transform-closed-groups",
			"colorize",
			"export-dot",
			"export-svg",
			"highlight-source",
			"export-web-component"
		],
		// logLevel: "verbose"
	}
	const webComponent = app.run(request).webComponent;
	return normalizeWebComponentAttributes(webComponent);
}

const normalizeWebComponentAttributes = (webComponent?: string) => {
	if (!webComponent) {
		return "";
	}
	return webComponent
		.replace(/initial-view=/g, "initialView=")
		.replace(/without-zoom=/g, "withoutZoom=")
		.replace(/without-maximize=/g, "withoutMaximize=")
		.replace(/without-logo=/g, "withoutLogo=")
		.replace(/without-header=/g, "withoutHeader=");
}

class ArgdownSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Argdown Plugin Settings'});

		const firstOption = pluginSettings.initialView;
		const secondOption = pluginSettings.initialView === "map" ? "source" : "map";

		new Setting(containerEl)
			.setName('Initial View')
			.setDesc('What should display by default when you edit your Argdown')
			.addDropdown(dropdown => dropdown
				.addOption(firstOption, firstOption)
					.onChange(async (value) => {
					this.plugin.settings.initialView = value;
					await this.plugin.saveSettings();
				})
				.addOption(secondOption, secondOption)
					.onChange(async (value) => {
						this.plugin.settings.initialView = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

/**
 * loads the web component assets so argdown-map renders in the preview
 */
const setupScripts = () => {
	const head = document.head ?? document.getElementsByTagName("head")[0];
	if (!head) {
		console.warn("Argdown plugin: document head not available for web component assets");
		return;
	}

	if (!document.getElementById(WEB_COMPONENT_SCRIPT_ID)) {
		const webComponentScript = document.createElement("script");
		webComponentScript.id = WEB_COMPONENT_SCRIPT_ID;
		webComponentScript.src = WEB_COMPONENT_SCRIPT_URL;
		webComponentScript.type = "module";
		head.appendChild(webComponentScript);
	}
}
