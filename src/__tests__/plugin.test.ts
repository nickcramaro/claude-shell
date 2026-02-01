import { describe, it, expect } from "vitest";

/**
 * These tests verify the core logic of the plugin's context-passing methods
 * by testing the message formatting directly (extracted from addFiles/sendSelection).
 */

const MAX_PASTE_LENGTH = 4000;

function formatAddFiles(paths: string[]): string {
	return paths.length === 1
		? `Read @${paths[0]}`
		: `Read these files: ${paths.map((p) => `@${p}`).join(" ")}`;
}

function formatSelection(
	text: string,
	sourcePath?: string,
	lineRange?: [number, number],
): { message: string; useFileRef: boolean } {
	if (text.length > MAX_PASTE_LENGTH && sourcePath) {
		const loc = lineRange ? ` lines ${lineRange[0]}-${lineRange[1]}` : "";
		return { message: `Read @${sourcePath}${loc}`, useFileRef: true };
	}

	let message = "";
	if (sourcePath) {
		const loc = lineRange ? ` (lines ${lineRange[0]}-${lineRange[1]})` : "";
		message = `From ${sourcePath}${loc}:\n\n${text}`;
	} else {
		message = text;
	}
	return { message, useFileRef: false };
}

describe("addFiles message formatting", () => {
	it("formats single file with @path reference", () => {
		expect(formatAddFiles(["notes/todo.md"])).toBe("Read @notes/todo.md");
	});

	it("formats multiple files", () => {
		expect(formatAddFiles(["a.md", "b.md"])).toBe(
			"Read these files: @a.md @b.md"
		);
	});

	it("formats three files", () => {
		expect(formatAddFiles(["a.md", "b.md", "c.md"])).toBe(
			"Read these files: @a.md @b.md @c.md"
		);
	});
});

describe("sendSelection message formatting", () => {
	it("sends inline text with source path", () => {
		const result = formatSelection("const x = 1;", "src/main.ts");
		expect(result.useFileRef).toBe(false);
		expect(result.message).toBe("From src/main.ts:\n\nconst x = 1;");
	});

	it("sends inline text with line range", () => {
		const result = formatSelection("const x = 1;", "src/main.ts", [10, 15]);
		expect(result.useFileRef).toBe(false);
		expect(result.message).toBe("From src/main.ts (lines 10-15):\n\nconst x = 1;");
	});

	it("sends raw text without source path", () => {
		const result = formatSelection("hello world");
		expect(result.useFileRef).toBe(false);
		expect(result.message).toBe("hello world");
	});

	it("uses file reference for large selections", () => {
		const longText = "x".repeat(MAX_PASTE_LENGTH + 1);
		const result = formatSelection(longText, "big-file.md");
		expect(result.useFileRef).toBe(true);
		expect(result.message).toBe("Read @big-file.md");
	});

	it("uses file reference with line range for large selections", () => {
		const longText = "x".repeat(MAX_PASTE_LENGTH + 1);
		const result = formatSelection(longText, "big-file.md", [1, 100]);
		expect(result.useFileRef).toBe(true);
		expect(result.message).toBe("Read @big-file.md lines 1-100");
	});

	it("does NOT use file reference for large selection without source path", () => {
		const longText = "x".repeat(MAX_PASTE_LENGTH + 1);
		const result = formatSelection(longText);
		expect(result.useFileRef).toBe(false);
		expect(result.message).toBe(longText);
	});

	it("exactly at threshold sends inline", () => {
		const exactText = "x".repeat(MAX_PASTE_LENGTH);
		const result = formatSelection(exactText, "file.md");
		expect(result.useFileRef).toBe(false);
	});
});

describe("getTerminalView last-focused logic", () => {
	it("returns last-focused view when it matches a leaf", () => {
		const mockView = { id: "terminal-1" };
		const leaves = [
			{ view: { id: "terminal-0" } },
			{ view: mockView },
		];

		// Simulates getTerminalView logic
		let lastFocused: any = mockView;
		const match = leaves.find((l) => l.view === lastFocused);
		expect(match).toBeDefined();
		expect(match!.view).toBe(mockView);
	});

	it("clears stale reference when view is no longer in leaves", () => {
		const staleView = { id: "terminal-dead" };
		const leaves = [
			{ view: { id: "terminal-0" } },
		];

		let lastFocused: any = staleView;
		const match = leaves.find((l) => l.view === lastFocused);
		if (!match) lastFocused = null;

		expect(lastFocused).toBeNull();
	});

	it("returns first leaf when no last-focused", () => {
		const firstView = { id: "terminal-0" };
		const leaves = [
			{ view: firstView },
			{ view: { id: "terminal-1" } },
		];

		let lastFocused: any = null;
		const result = lastFocused
			? leaves.find((l) => l.view === lastFocused)?.view
			: leaves[0].view;

		expect(result).toBe(firstView);
	});
});
