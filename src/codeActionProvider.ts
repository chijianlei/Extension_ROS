'use strict';

import * as vscode from 'vscode';

export default class CppLintingProvider implements vscode.CodeActionProvider {

	private static commandId: string = 'cpp.runCodeAction';
	private command: vscode.Disposable;
	private diagnosticCollection: vscode.DiagnosticCollection;

	public activate(subscriptions: vscode.Disposable[]) {
		this.command = vscode.commands.registerCommand(CppLintingProvider.commandId, this.runCodeAction, this);
		subscriptions.push(this);
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
		

		vscode.workspace.onDidOpenTextDocument(textDocument=>{						
			this.predict(textDocument);
			console.log(textDocument.lineCount);					
			console.log(textDocument.lineAt(0).text);
			console.log(textDocument.positionAt(0));
        });
		vscode.workspace.onDidCloseTextDocument((textDocument)=> {
			this.diagnosticCollection.delete(textDocument.uri);
		}, null, subscriptions);

		// vscode.workspace.onDidSaveTextDocument(this.predict, this);

		// vscode.workspace.textDocuments.forEach(this.predict, this);
	}

	public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
		this.command.dispose();
	}

	private async predict(textDocument: vscode.TextDocument) {
		if (textDocument.languageId !== 'cpp') {
			return;
		}
		
		let diagnostics: vscode.Diagnostic[] = [];
		let path = textDocument.uri.fsPath;
		console.log('rootpath:' + path);

		let modelpath:string = '/OpenNMT-py/';
	    const { spawn } = require('child_process');
		const child = spawn('python', [modelpath+'autoTrans.py', path]);
		// for await (const data of child.stdout) {
		// 	console.log(`stdout from the child: ${data}`);
		// }
		
		const fs = require("fs");
		var data = fs.readFileSync(modelpath+'tmp/pred.txt');//syn, asyn is not work
		var preds = [];
		let tmp:string = data.toString();
		for(let i=0;i<tmp.split("\n").length;i++){
			preds.push(tmp.split("\n")[i]);
		}		
		var data1 = fs.readFileSync(modelpath+'tmp/lineNum.txt');//syn, asyn is not work
		var nums = [];
		tmp = data1.toString();
		for(let i=0;i<tmp.split("\n").length;i++){
			nums.push(tmp.split("\n")[i]);			
		}
		var data2 = fs.readFileSync(modelpath+'tmp/src-test.txt');//syn, asyn is not work
		var srcs = [];
		tmp = data2.toString();
		for(let i=0;i<tmp.split("\n").length;i++){
			srcs.push(tmp.split("\n")[i]);
		}	
		console.log("fromPreds:"+preds[0]);
		console.log("fromNums:"+nums[0]);
		console.log("fromSrcs:"+srcs[0]);
				
		for(let i=0;i<preds.length;i++){
			var pred:string = preds[i];
			var src:string = srcs[i];
			if(pred!==src){
				let severity = vscode.DiagnosticSeverity.Warning;
				let message = pred+";";
				let range = textDocument.lineAt(Number(nums[i])-1).range;
				let diagnostic = new vscode.Diagnostic(range, message, severity);
				console.log("locationAt:"+nums[i]+","+textDocument.lineAt(Number(nums[i])-1).text);
				console.log("testing:"+src+","+pred+","+nums[i]);
				diagnostics.push(diagnostic);			
			}
		}		
		this.diagnosticCollection.set(textDocument.uri, diagnostics);	
		
	}
	
	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[] {
		let diagnostic:vscode.Diagnostic = context.diagnostics[0];
		return [{
			title: "Accept migration suggestion",
			command: CppLintingProvider.commandId,
			arguments: [document, diagnostic.range, diagnostic.message]
		}];
	}
	
	private runCodeAction(document: vscode.TextDocument, range: vscode.Range, message:string): any {
		// let fromRegex:RegExp = /.*Replace:(.*)==>.*/g
		// let fromMatch:RegExpExecArray = fromRegex.exec(message.replace(/\s/g, ''));
		// let from = fromMatch[1];
		// let to:string = document.getText(range).replace(/\s/g, '')
		// if (from === to) {
		// 	let newText = /.*==>\s(.*)/g.exec(message)[1]
		// 	let edit = new vscode.WorkspaceEdit();
		// 	edit.replace(document.uri, range, newText);
		// 	return vscode.workspace.applyEdit(edit);
		// } else {
		// 	vscode.window.showErrorMessage("The suggestion was not applied because it is out of date. You might have tried to apply the same edit twice.");
		// }
		let newText = message;
		let edit = new vscode.WorkspaceEdit();
		edit.replace(document.uri, range, newText);
		console.log("range:"+range.start.line+","+range.start.character+","+range.end.line+","+range.end.character);
		console.log(document.getText(range)+"->"+message);
		console.log("action testing!");
		return vscode.workspace.applyEdit(edit);		
	}
}