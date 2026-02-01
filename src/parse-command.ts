/**
 * Split a command string into tokens, respecting single and double quotes.
 *
 * "claude --allowedTools \"Edit,Bash\" --model opus"
 *   => ["claude", "--allowedTools", "Edit,Bash", "--model", "opus"]
 */
export function parseCommand(input: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let inQuote: string | null = null;

	for (const ch of input) {
		if (inQuote) {
			if (ch === inQuote) {
				inQuote = null;
			} else {
				current += ch;
			}
		} else if (ch === '"' || ch === "'") {
			inQuote = ch;
		} else if (/\s/.test(ch)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
		} else {
			current += ch;
		}
	}
	if (current) tokens.push(current);
	return tokens;
}
