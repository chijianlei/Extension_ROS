import * as vscode from 'vscode'; 

import CppLintingProvider from './codeActionProvider';

export function activate(context: vscode.ExtensionContext) {
	let linter = new CppLintingProvider();	
	linter.activate(context.subscriptions);
	vscode.languages.registerCodeActionsProvider('cpp', linter);
}