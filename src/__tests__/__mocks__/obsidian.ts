// Minimal Obsidian API stubs for testing

export const Platform = {
	isMacOS: true,
	isLinux: false,
	isWin: false,
};

export class Plugin {
	app: any = {};
	manifest: any = { id: "claude-shell" };
	addCommand() {}
	addRibbonIcon() {}
	addSettingTab() {}
	registerView() {}
	registerEvent() {}
	loadData() { return Promise.resolve({}); }
	saveData() { return Promise.resolve(); }
}

export class ItemView {
	app: any = {};
	leaf: any;
	containerEl: any = {
		children: [
			document.createElement("div"),
			document.createElement("div"),
		],
	};
	contentEl: any = document.createElement("div");

	constructor(leaf: any) {
		this.leaf = leaf;
		this.app = leaf?.app || {};
	}

	getViewType() { return ""; }
	getDisplayText() { return ""; }
	getIcon() { return ""; }
}

export class WorkspaceLeaf {
	app: any;
	view: any;
	constructor(app?: any) {
		this.app = app || {};
	}
	setViewState() { return Promise.resolve(); }
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	containerEl: any = document.createElement("div");
	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
}

export class Setting {
	constructor(_el: any) {}
	setName() { return this; }
	setDesc() { return this; }
	addText() { return this; }
	addToggle() { return this; }
	addSlider() { return this; }
}

export class TFile {
	path: string;
	constructor(path: string) { this.path = path; }
}

export class MarkdownView extends ItemView {
	file: TFile | null = null;
	editor: any = null;
}

export class Menu {
	addItem(cb: any) { cb({ setTitle: () => ({ setIcon: () => ({ onClick: () => {} }) }) }); return this; }
}

export type Editor = any;
