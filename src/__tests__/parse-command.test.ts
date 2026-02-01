import { parseCommand } from "../parse-command";

describe("parseCommand", () => {
	it("parses a simple command", () => {
		expect(parseCommand("claude")).toEqual(["claude"]);
	});

	it("parses command with flags", () => {
		expect(parseCommand("claude --model opus")).toEqual(["claude", "--model", "opus"]);
	});

	it("handles double-quoted values", () => {
		expect(parseCommand('claude --allowedTools "Edit,Bash"')).toEqual([
			"claude", "--allowedTools", "Edit,Bash",
		]);
	});

	it("handles single-quoted values", () => {
		expect(parseCommand("claude --allowedTools 'Edit,Bash'")).toEqual([
			"claude", "--allowedTools", "Edit,Bash",
		]);
	});

	it("handles multiple quoted args", () => {
		expect(parseCommand('claude --a "one two" --b \'three four\'')).toEqual([
			"claude", "--a", "one two", "--b", "three four",
		]);
	});

	it("handles extra whitespace", () => {
		expect(parseCommand("  claude   --model   opus  ")).toEqual(["claude", "--model", "opus"]);
	});

	it("returns empty array for empty string", () => {
		expect(parseCommand("")).toEqual([]);
	});

	it("returns empty array for whitespace-only string", () => {
		expect(parseCommand("   ")).toEqual([]);
	});

	it("handles quoted empty string", () => {
		expect(parseCommand('claude ""')).toEqual(["claude"]);
	});

	it("handles mixed quoted and unquoted", () => {
		expect(parseCommand('claude --model "claude-3-opus" --verbose')).toEqual([
			"claude", "--model", "claude-3-opus", "--verbose",
		]);
	});
});
