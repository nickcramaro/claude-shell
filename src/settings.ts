import { App, PluginSettingTab, Setting } from "obsidian";
import type ClaudeTerminalPlugin from "./main";

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
	let timer: ReturnType<typeof setTimeout>;
	return ((...args: any[]) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	}) as any;
}

export class ClaudeTerminalSettingTab extends PluginSettingTab {
	plugin: ClaudeTerminalPlugin;

	constructor(app: App, plugin: ClaudeTerminalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const debouncedSave = debounce(() => this.plugin.saveSettings(), 500);

		new Setting(containerEl)
			.setName("Claude flags")
			.setDesc("Extra flags passed to claude CLI (e.g. --model opus --allowedTools)")
			.addText((text) =>
				text
					.setPlaceholder("--model opus")
					.setValue(this.plugin.settings.claudeFlags)
					.onChange((value) => {
						this.plugin.settings.claudeFlags = value;
						debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Shell path")
			.setDesc("Override shell (leave blank for auto-detect: zsh on macOS, bash on Linux)")
			.addText((text) =>
				text
					.setPlaceholder("/bin/zsh")
					.setValue(this.plugin.settings.shellPath)
					.onChange((value) => {
						this.plugin.settings.shellPath = value;
						debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Font size")
			.setDesc("Terminal font size in pixels")
			.addSlider((slider) =>
				slider
					.setLimits(10, 24, 1)
					.setValue(this.plugin.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.fontSize = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto-launch Claude")
			.setDesc("Automatically run the claude CLI when the terminal opens")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoLaunch)
					.onChange(async (value) => {
						this.plugin.settings.autoLaunch = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Focus terminal on context")
			.setDesc("Bring focus to the terminal when sending files or selections to Claude")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.focusTerminalOnContext)
					.onChange(async (value) => {
						this.plugin.settings.focusTerminalOnContext = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Theme" });
		containerEl.createEl("p", {
			text: "Leave blank to auto-detect from Obsidian theme.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Background color")
			.addText((text) =>
				text
					.setPlaceholder("#1e1e2e")
					.setValue(this.plugin.settings.theme.background)
					.onChange((value) => {
						this.plugin.settings.theme.background = value;
						debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Foreground color")
			.addText((text) =>
				text
					.setPlaceholder("#cdd6f4")
					.setValue(this.plugin.settings.theme.foreground)
					.onChange((value) => {
						this.plugin.settings.theme.foreground = value;
						debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Cursor color")
			.addText((text) =>
				text
					.setPlaceholder("#f5e0dc")
					.setValue(this.plugin.settings.theme.cursor)
					.onChange((value) => {
						this.plugin.settings.theme.cursor = value;
						debouncedSave();
					})
			);
	}
}
