import {
	MarkdownPostProcessorContext,
	Plugin,
	PluginSettingTab,
	Setting,
	App
} from 'obsidian';

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
	ExplodeArgumentsPlugin
} from "@argdown/core";
import {SyncDotToSvgExportPlugin } from "@argdown/core/dist/plugins/SyncDotToSvgExportPlugin";
interface ArgdownPluginSettings {
	initialView: string;
}

const DEFAULT_SETTINGS: ArgdownPluginSettings = {
	initialView: 'map'
}

const WEB_COMPONENT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@argdown/web-components@2.0.1/dist/argdown-map.js";

export default class ArgdownPlugin extends Plugin {
	settings: ArgdownPluginSettings = { ...DEFAULT_SETTINGS };

	onload(): void {
		void this.loadSettings();
		void import(WEB_COMPONENT_SCRIPT_URL).catch(err => 
			console.error("Argdown plugin: Failed to load web component library:", err)
		);
		this.addSettingTab(new ArgdownSettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("argdown", this.codeBlockProcessor);
		this.registerMarkdownCodeBlockProcessor("argdown-map", this.codeBlockProcessor);
	}

	async loadSettings() {
		const savedSettings = (await this.loadData()) as Partial<ArgdownPluginSettings> | undefined;
		this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	onunload() {
	}

	/**
	 * updates the preview pane, replaces the codeblock preview with the argument map
	 */
	codeBlockProcessor = (source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
		// eslint-disable-next-line no-unsanitized/method -- Argdown returns trusted HTML generated from its own renderer.
		const fragment = el.ownerDocument.createRange().createContextualFragment(argdownInputToComponent(source));
		el.replaceChildren(fragment);
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
		initialView: DEFAULT_SETTINGS.initialView,
		addWebComponentScript: false,
		addWebComponentPolyfill: false,
		addGlobalStyles: false
	});
	app.addPlugin(webComponentExportPlugin, "export-web-component");

	const request: IArgdownRequest = {
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
	const { webComponent } = app.run(request) as { webComponent?: string };
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
	plugin: ArgdownPlugin;

	constructor(app: App, plugin: ArgdownPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Argdown')
			.setHeading();

		const firstOption = this.plugin.settings.initialView;
		const secondOption = this.plugin.settings.initialView === "map" ? "source" : "map";

		new Setting(containerEl)
			.setName('Initial view')
			.setDesc('What should display by default when you edit your argdown.')
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

