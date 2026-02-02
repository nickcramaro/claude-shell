import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
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
	let mockExecFileSync: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		clearPathCache();
		mockExecFileSync = vi.fn();
		const childProcess = require("child_process");
		childProcess.execFileSync = mockExecFileSync;
	});

	it("queries the shell and returns result", () => {
		mockExecFileSync.mockReturnValue("/resolved/path:/usr/bin\n");

		const result = resolveUserPath("/bin/zsh");
		expect(result).toBe("/resolved/path:/usr/bin");
	});

	it("caches and returns same result on second call", () => {
		let callCount = 0;
		mockExecFileSync.mockImplementation(() => {
			callCount++;
			return "/cached/path";
		});

		const first = resolveUserPath("/bin/zsh");
		const second = resolveUserPath("/bin/zsh");
		expect(first).toBe("/cached/path");
		expect(second).toBe("/cached/path");
		expect(callCount).toBe(1);
	});

	it("prefers interactive login shell", () => {
		mockExecFileSync.mockReturnValue("/some/path");

		resolveUserPath("/bin/zsh");
		expect(mockExecFileSync).toHaveBeenCalledWith(
			"/bin/zsh",
			["-l", "-i", "-c", "echo $PATH"],
			expect.objectContaining({ timeout: 2000, encoding: "utf8" }),
		);
	});

	it("falls back to non-interactive login on interactive failure", () => {
		mockExecFileSync
			.mockImplementationOnce(() => {
				throw new Error("timeout");
			})
			.mockReturnValueOnce("/fallback/path");

		const result = resolveUserPath("/bin/zsh");
		expect(result).toBe("/fallback/path");
		expect(mockExecFileSync).toHaveBeenNthCalledWith(
			2,
			"/bin/zsh",
			["-l", "-c", "echo $PATH"],
			expect.objectContaining({ timeout: 2000, encoding: "utf8" }),
		);
	});

	it("falls back to buildFallbackPath when both shell queries fail", () => {
		mockExecFileSync.mockImplementation(() => {
			throw new Error("timeout");
		});

		const result = resolveUserPath("/bin/zsh");
		expect(result).toContain("/usr/local/bin");
	});

	it("falls back when interactive returns empty stdout", () => {
		mockExecFileSync.mockReturnValue("  \n");

		const result = resolveUserPath("/bin/zsh");
		expect(result).toContain("/usr/local/bin");
	});

	it("clearPathCache allows re-resolution", () => {
		mockExecFileSync.mockReturnValue("/first/path");
		const first = resolveUserPath("/bin/zsh");
		expect(first).toBe("/first/path");

		clearPathCache();
		mockExecFileSync.mockReturnValue("/second/path");
		const second = resolveUserPath("/bin/zsh");
		expect(second).toBe("/second/path");
	});
});
