// Mock node-pty for testing

export interface MockPty {
	onData: (cb: (data: string) => void) => void;
	onExit: (cb: (e: { exitCode: number; signal?: number }) => void) => void;
	write: (data: string) => void;
	resize: (cols: number, rows: number) => void;
	kill: () => void;
	// Test helpers
	_simulateData: (data: string) => void;
	_simulateExit: (exitCode: number, signal?: number) => void;
	_written: string[];
	_resizes: { cols: number; rows: number }[];
	_killed: boolean;
}

export function createMockPty(): MockPty {
	let dataCallback: ((data: string) => void) | null = null;
	let exitCallback: ((e: { exitCode: number; signal?: number }) => void) | null = null;

	const pty: MockPty = {
		onData: (cb) => { dataCallback = cb; },
		onExit: (cb) => { exitCallback = cb; },
		write: (data) => { pty._written.push(data); },
		resize: (cols, rows) => { pty._resizes.push({ cols, rows }); },
		kill: () => { pty._killed = true; },
		_simulateData: (data) => dataCallback?.(data),
		_simulateExit: (exitCode, signal) => exitCallback?.({ exitCode, signal }),
		_written: [],
		_resizes: [],
		_killed: false,
	};

	return pty;
}

export function createMockNodePty() {
	let lastPty: MockPty | null = null;

	return {
		spawn: (_bin: string, _args: string[], _opts: any) => {
			lastPty = createMockPty();
			return lastPty;
		},
		getLastPty: () => lastPty,
	};
}
