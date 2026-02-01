import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/__tests__/**/*.test.ts"],
		alias: {
			obsidian: path.resolve(__dirname, "src/__tests__/__mocks__/obsidian.ts"),
			"@xterm/xterm": path.resolve(__dirname, "src/__tests__/__mocks__/xterm.ts"),
			"@xterm/addon-fit": path.resolve(__dirname, "src/__tests__/__mocks__/xterm-addon-fit.ts"),
			"@xterm/addon-unicode11": path.resolve(__dirname, "src/__tests__/__mocks__/xterm-addon-stub.ts"),
			"@xterm/addon-web-links": path.resolve(__dirname, "src/__tests__/__mocks__/xterm-addon-stub.ts"),
		},
	},
});
