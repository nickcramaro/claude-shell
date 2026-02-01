import { Plugin, WorkspaceLeaf, TFile, MarkdownView, Editor, Menu } from "obsidian";
import { VIEW_TYPE_TERMINAL, DEFAULT_SETTINGS, ClaudeTerminalSettings } from "./constants";
import { TerminalView } from "./terminal-view";
import { ClaudeTerminalSettingTab } from "./settings";
import { resolveUserPath } from "./pty-manager";

const MAX_PASTE_LENGTH = 4000;

export default class ClaudeTerminalPlugin extends Plugin {
	settings: ClaudeTerminalSettings = DEFAULT_SETTINGS;
	private lastFocusedTerminal: TerminalView | null = null;
	resolvedPath: string = "";

	/** Absolute path to this plugin's install directory */
	get pluginDir(): string {
		return (this.app.vault.adapter as any).basePath + "/.obsidian/plugins/" + this.manifest.id;
	}

	/** Called by TerminalView when it receives focus/input */
	setLastFocusedTerminal(view: TerminalView) {
		this.lastFocusedTerminal = view;
	}

	async onload() {
		await this.loadSettings();

		// Resolve user PATH asynchronously once at startup (cached for all terminals)
		this.resolvedPath = await resolveUserPath(this.settings.shellPath || undefined);

		this.registerView(VIEW_TYPE_TERMINAL, (leaf) => new TerminalView(leaf, this));

		// --- Commands ---

		this.addCommand({
			id: "open-terminal",
			name: "Open terminal",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "new-terminal",
			name: "Open new terminal",
			callback: () => this.openNewTerminal(),
		});


		this.addCommand({
			id: "add-current-note",
			name: "Add current note to Claude",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "l" }],
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file) this.addFiles([file.path]);
			},
		});

		this.addCommand({
			id: "send-selection",
			name: "Send selection to Claude",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "k" }],
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					const file = view.file;
					const from = editor.getCursor("from").line + 1;
					const to = editor.getCursor("to").line + 1;
					this.sendSelection(
						selection,
						file?.path,
						from !== to ? [from, to] : undefined,
					);
				} else if (view.file) {
					this.addFiles([view.file.path]);
				}
			},
		});

		this.addCommand({
			id: "add-all-open-notes",
			name: "Add all open notes to Claude",
			callback: () => {
				const paths: string[] = [];
				this.app.workspace.iterateAllLeaves((leaf) => {
					if (leaf.view instanceof MarkdownView && leaf.view.file) {
						paths.push(leaf.view.file.path);
					}
				});
				if (paths.length > 0) this.addFiles(paths);
			},
		});

		this.addCommand({
			id: "restart-session",
			name: "Restart session",
			callback: () => this.restartSession(),
		});

		// --- Context menus ---

		// File explorer context menu
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (!(file instanceof TFile)) return;
				menu.addItem((item) => {
					item.setTitle("Add to Claude")
						.setIcon("sparkles")
						.onClick(() => this.addFiles([file.path]));
				});
			}),
		);

		// Editor context menu
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					menu.addItem((item) => {
						item.setTitle("Send selection to Claude")
							.setIcon("sparkles")
							.onClick(() => {
								const from = editor.getCursor("from").line + 1;
								const to = editor.getCursor("to").line + 1;
								this.sendSelection(
									selection,
									view.file?.path,
									from !== to ? [from, to] : undefined,
								);
							});
					});
				}
				if (view.file) {
					menu.addItem((item) => {
						item.setTitle("Add note to Claude")
							.setIcon("sparkles")
							.onClick(() => this.addFiles([view.file!.path]));
					});
				}
			}),
		);

		// --- Ribbon ---

		this.addRibbonIcon("sparkles", "Claude Shell", () => this.activateView());

		this.addSettingTab(new ClaudeTerminalSettingTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TERMINAL);
	}

	// --- Core context methods ---

	/**
	 * Add files to Claude's context by sending @path references.
	 * Claude Code uses @ mentions for file context, not /add.
	 */
	addFiles(paths: string[]) {
		this.ensureTerminal((view) => {
			const message = paths.length === 1
				? `Read @${paths[0]}`
				: `Read these files: ${paths.map((p) => `@${p}`).join(" ")}`;
			view.sendToTerminal(message);
		});
	}

	/**
	 * Paste selected text into the terminal as a message.
	 * Large selections reference the file instead of pasting inline.
	 */
	sendSelection(text: string, sourcePath?: string, lineRange?: [number, number]) {
		if (text.length > MAX_PASTE_LENGTH && sourcePath) {
			// Too large to paste — reference the file instead
			const loc = lineRange ? ` lines ${lineRange[0]}-${lineRange[1]}` : "";
			this.ensureTerminal((view) => {
				view.sendToTerminal(`Read @${sourcePath}${loc}`);
			});
			return;
		}

		let message = "";
		if (sourcePath) {
			const loc = lineRange ? ` (lines ${lineRange[0]}-${lineRange[1]})` : "";
			message = `From ${sourcePath}${loc}:\n\n${text}`;
		} else {
			message = text;
		}

		this.ensureTerminal((view) => {
			view.sendToTerminal(message);
		});
	}

	// --- Helpers ---

	/**
	 * Ensure the terminal view is open and ready, then call the callback.
	 */
	private ensureTerminal(cb: (view: TerminalView) => void) {
		const view = this.getTerminalView();
		if (view) {
			view.ready.then(() => {
				cb(view);
				if (this.settings.focusTerminalOnContext) {
					this.activateView();
					view.focusTerminal();
				}
			});
			return;
		}
		this.activateView().then(() => {
			const v = this.getTerminalView();
			if (v) {
				v.ready.then(() => {
					cb(v);
					if (this.settings.focusTerminalOnContext) v.focusTerminal();
				});
			}
		});
	}

	async activateView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TERMINAL);

		if (leaves.length > 0) {
			// Reveal the last-focused terminal, or fall back to the first one
			const target = this.lastFocusedTerminal
				? leaves.find((l) => l.view === this.lastFocusedTerminal) ?? leaves[0]
				: leaves[0];
			workspace.revealLeaf(target);
		} else {
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_TERMINAL, active: true });
				workspace.revealLeaf(leaf);
			}
		}
	}

	async openNewTerminal() {
		const { workspace } = this.app;
		const leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_TERMINAL, active: true });
			workspace.revealLeaf(leaf);
		}
	}

	getTerminalView(): TerminalView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TERMINAL);
		if (leaves.length === 0) return null;

		// Return last-focused terminal if it's still alive
		if (this.lastFocusedTerminal) {
			const match = leaves.find((l) => l.view === this.lastFocusedTerminal);
			if (match) return this.lastFocusedTerminal;
			this.lastFocusedTerminal = null;
		}

		return leaves[0].view as TerminalView;
	}

	restartSession() {
		const view = this.getTerminalView();
		if (view) {
			view.restart();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
