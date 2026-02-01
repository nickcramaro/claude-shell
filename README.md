# Claude Shell

An Obsidian plugin that embeds a real terminal in the sidebar, designed for running [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

The terminal auto-launches `claude` in your vault directory. No custom chat UI — Claude Code's native terminal interface is the UI.

## Features

### Terminal

- Full terminal emulator (xterm.js + node-pty) in the right sidebar
- Auto-launches Claude Code on open (configurable)
- Theme colors match your active Obsidian theme
- Multiple terminal tabs — open as many sessions as you need

### Context Passing

Send Obsidian content directly to Claude without copy-pasting.

**Commands** (available in the command palette):

| Command | Default Hotkey | Behavior |
|---------|---------------|----------|
| Add current note to Claude | `Cmd+Shift+L` | Sends the active note as an `@path` reference |
| Send selection to Claude | `Cmd+Shift+K` | Pastes selected text with source metadata, or adds the file if nothing is selected |
| Add all open notes to Claude | — | Sends every open markdown note |
| Open terminal | — | Opens or reveals the terminal |
| Open new terminal | — | Opens an additional terminal tab |
| Restart session | — | Kills the PTY and spawns a fresh session |

**Context menus:**

- **File explorer** — Right-click any file → "Add to Claude"
- **Editor** — Right-click → "Send selection to Claude" or "Add note to Claude"

**Drag and drop:**

Drag files from the file explorer onto the terminal to add them to Claude's context.

**Multi-terminal:**

Open multiple terminal tabs with the "Open new terminal" command. Context is sent to the last-focused terminal. Switch between tabs using Obsidian's native tab navigation.

### Settings

- **Claude flags** — Extra CLI flags (e.g. `--model opus`)
- **Shell path** — Override the default shell
- **Font size** — Terminal font size
- **Auto-launch Claude** — Run `claude` automatically when the terminal opens
- **Focus terminal on context** — Bring focus to the terminal when sending files or selections
- **Theme colors** — Override background, foreground, and cursor colors (defaults to Obsidian theme)

## Installation

This plugin requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to be installed and available on your PATH.

### From source

```bash
git clone https://github.com/nickcramaro/claude-shell.git
cd claude-shell
npm install
npm run build
```

Then symlink or copy the plugin folder into your vault:

```bash
ln -s /path/to/claude-shell /path/to/vault/.obsidian/plugins/claude-shell
```

Enable "Claude Shell" in Obsidian → Settings → Community Plugins.

### node-pty

This plugin uses `node-pty`, a native module that must be compiled for Obsidian's Electron version. The `postinstall` script handles this automatically via `electron-rebuild`. If you run into issues, check that your system has the build tools needed for native Node modules (Xcode CLI tools on macOS, build-essential on Linux).

## License

MIT
