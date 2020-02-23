// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { KanjiDecorator } from './features/kanji-decorator';
import * as commands from './commands/index';
import { Command } from './commands/command';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(new KanjiDecorator(context));

    context.subscriptions.push(registerCommand(new commands.ToggleCommand()));
}

// this method is called when your extension is deactivated
export function deactivate() {}

function registerCommand<T extends Command>(command: T): vscode.Disposable {
    return vscode.commands.registerCommand(command.id, command.execute, command);
}