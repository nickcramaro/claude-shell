import { stripUnsupportedSequences } from "../pty-manager";

describe("stripUnsupportedSequences", () => {
	it("passes through normal text unchanged", () => {
		expect(stripUnsupportedSequences("hello world")).toBe("hello world");
	});

	it("passes through standard ANSI color codes", () => {
		const colored = "\x1b[32mgreen\x1b[0m";
		expect(stripUnsupportedSequences(colored)).toBe(colored);
	});

	it("strips Kitty keyboard protocol sequences (CSI > Ps u)", () => {
		expect(stripUnsupportedSequences("\x1b[>1u")).toBe("");
		expect(stripUnsupportedSequences("\x1b[>0;1u")).toBe("");
	});

	it("strips Kitty keyboard protocol sequences (CSI < u)", () => {
		expect(stripUnsupportedSequences("\x1b[<u")).toBe("");
	});

	it("strips Kitty keyboard protocol sequences (CSI ? u)", () => {
		expect(stripUnsupportedSequences("\x1b[?u")).toBe("");
	});

	it("strips synchronized output enable/disable", () => {
		expect(stripUnsupportedSequences("\x1b[?2026h")).toBe("");
		expect(stripUnsupportedSequences("\x1b[?2026l")).toBe("");
	});

	it("strips focus event reporting enable/disable", () => {
		expect(stripUnsupportedSequences("\x1b[?1004h")).toBe("");
		expect(stripUnsupportedSequences("\x1b[?1004l")).toBe("");
	});

	it("strips bracketed paste mode enable/disable", () => {
		expect(stripUnsupportedSequences("\x1b[?2004h")).toBe("");
		expect(stripUnsupportedSequences("\x1b[?2004l")).toBe("");
	});

	it("strips ConEmu progress sequences", () => {
		expect(stripUnsupportedSequences("\x1b]9;4;0;\x07")).toBe("");
		expect(stripUnsupportedSequences("\x1b]9;4;0;")).toBe("");
	});

	it("preserves text around stripped sequences", () => {
		expect(stripUnsupportedSequences("before\x1b[?2026hafter")).toBe("beforeafter");
	});

	it("strips multiple sequences in one string", () => {
		const input = "\x1b[?1004h\x1b[?2004hHello\x1b[?2026l";
		expect(stripUnsupportedSequences(input)).toBe("Hello");
	});

	it("returns empty string when input is only sequences", () => {
		expect(stripUnsupportedSequences("\x1b[?2026h\x1b[?1004h")).toBe("");
	});
});
