import { VIEW_TYPE_TERMINAL, DEFAULT_SETTINGS } from "../constants";

describe("smoke", () => {
	it("exports VIEW_TYPE_TERMINAL", () => {
		expect(VIEW_TYPE_TERMINAL).toBe("claude-shell-view");
	});

	it("exports DEFAULT_SETTINGS with expected shape", () => {
		expect(DEFAULT_SETTINGS).toMatchObject({
			claudeFlags: "",
			shellPath: "",
			fontSize: 14,
			autoLaunch: true,
			focusTerminalOnContext: true,
			theme: {
				background: "",
				foreground: "",
				cursor: "",
			},
		});
	});
});
