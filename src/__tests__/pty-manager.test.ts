import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	resolveUserPath,
	clearPathCache,
	buildFallbackPath,
	detectShell,
} from "../pty-manager";

describe("detectShell", () => {
	const originalShell = process.env.SHELL;

	afterEach(() => {
		if (originalShell !== undefined) {
			process.env.SHELL = originalShell;
		} else {
			delete process.env.SHELL;
		}
	});

	it("returns SHELL env var on macOS when set", () => {
		process.env.SHELL = "/bin/fish";
		expect(detectShell()).toBe("/bin/fish");
	});

	it("returns /bin/zsh on macOS when SHELL is unset", () => {
		delete process.env.SHELL;
		expect(detectShell()).toBe("/bin/zsh");
	});
});

describe("buildFallbackPath", () => {
	it("includes common binary directories", () => {
		const result = buildFallbackPath();
		expect(result).toContain("/usr/local/bin");
		expect(result).toContain("/opt/homebrew/bin");
		expect(result).toContain(".bun/bin");
		expect(result).toContain(".local/bin");
	});

	it("includes current PATH entries", () => {
		const original = process.env.PATH;
		process.env.PATH = "/custom/path:/another/path";
		const result = buildFallbackPath();
		expect(result).toContain("/custom/path");
		expect(result).toContain("/another/path");
		process.env.PATH = original;
	});

	it("deduplicates entries", () => {
		const result = buildFallbackPath();
		const parts = result.split(":");
		expect(parts.length).toBe(new Set(parts).size);
	});
});

describe("resolveUserPath", () => {
	let mockExecFile: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clearPathCache();
		// Mock the child_process module that resolveUserPath requires at runtime
		mockExecFile = vi.fn();
		const childProcess = require("child_process");
		childProcess.execFile = mockExecFile;
	});

	it("queries the shell and caches result", async () => {
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				cb(null, { stdout: "/resolved/path:/usr/bin\n" });
			}
		);

		const result = await resolveUserPath("/bin/zsh");
		expect(result).toBe("/resolved/path:/usr/bin");

		// Second call should use cache
		clearPathCache(); // clear so we can test fresh
	});

	it("caches and returns same result on second call", async () => {
		let callCount = 0;
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				callCount++;
				cb(null, { stdout: "/cached/path" });
			}
		);

		const first = await resolveUserPath("/bin/zsh");
		const second = await resolveUserPath("/bin/zsh");
		expect(first).toBe("/cached/path");
		expect(second).toBe("/cached/path");
		expect(callCount).toBe(1);
	});

	it("falls back to buildFallbackPath on exec failure", async () => {
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				cb(new Error("timeout"));
			}
		);

		const result = await resolveUserPath("/bin/zsh");
		expect(result).toContain("/usr/local/bin");
	});

	it("falls back when exec returns empty stdout", async () => {
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				cb(null, { stdout: "  \n" });
			}
		);

		const result = await resolveUserPath("/bin/zsh");
		expect(result).toContain("/usr/local/bin");
	});

	it("uses -l flag without -i", async () => {
		mockExecFile.mockImplementation(
			(_bin: string, args: string[], _opts: any, cb: Function) => {
				expect(args).toEqual(["-l", "-c", "echo $PATH"]);
				cb(null, { stdout: "/some/path" });
			}
		);

		await resolveUserPath("/bin/zsh");
	});

	it("clearPathCache allows re-resolution", async () => {
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				cb(null, { stdout: "/first/path" });
			}
		);

		const first = await resolveUserPath("/bin/zsh");
		expect(first).toBe("/first/path");

		clearPathCache();
		mockExecFile.mockImplementation(
			(_bin: string, _args: string[], _opts: any, cb: Function) => {
				cb(null, { stdout: "/second/path" });
			}
		);

		const second = await resolveUserPath("/bin/zsh");
		expect(second).toBe("/second/path");
	});
});
