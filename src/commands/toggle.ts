import * as vscode from 'vscode';
import { Command } from "./command";

export class ToggleCommand implements Command {
    readonly id = 'hyogaiKanjiChecker.toggle';

    execute(): void {
        const config = vscode.workspace.getConfiguration('hyogaiKanjiChecker');
        config.update('enabled', !config.get<boolean>('enabled'), true);
    }
}