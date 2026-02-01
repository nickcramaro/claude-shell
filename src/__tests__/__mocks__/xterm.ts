// Minimal xterm.js stub for testing

export class Terminal {
	cols = 80;
	rows = 24;
	unicode = { activeVersion: "11" };

	private _dataCallbacks: ((data: string) => void)[] = [];
	private _resizeCallbacks: ((size: { cols: number; rows: number }) => void)[] = [];

	loadAddon() {}
	open() {}
	dispose() {}
	clear() {}
	reset() {}
	focus() {}
	write() {}
	writeln() {}

	onData(cb: (data: string) => void): IDisposable {
		this._dataCallbacks.push(cb);
		return { dispose: () => { this._dataCallbacks = this._dataCallbacks.filter((c) => c !== cb); } };
	}

	onResize(cb: (size: { cols: number; rows: number }) => void): IDisposable {
		this._resizeCallbacks.push(cb);
		return { dispose: () => { this._resizeCallbacks = this._resizeCallbacks.filter((c) => c !== cb); } };
	}

	// Test helpers
	simulateInput(data: string) {
		for (const cb of this._dataCallbacks) cb(data);
	}

	simulateResize(cols: number, rows: number) {
		for (const cb of this._resizeCallbacks) cb({ cols, rows });
	}
}

export interface IDisposable {
	dispose(): void;
}
