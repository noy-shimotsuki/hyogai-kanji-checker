import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';

export class KanjiDecorator {
    _activeEditor: vscode.TextEditor | undefined;
    readonly _hyogaiKanji: RegExp;
    readonly _jinmeiyoKanji: RegExp;
    readonly _disposables: vscode.Disposable[] = [];

    _decorationStyle: vscode.TextEditorDecorationType | null = null;
    _jinmeiyoDecorationStyle: vscode.TextEditorDecorationType | null = null;

    public constructor(private context: vscode.ExtensionContext) {
        const joyoKanji = fs.readFileSync(path.join(context.extensionPath, 'resources', 'joyo-kanji.txt'), 'utf8').trim();
        const jinmeiyoKanji = fs.readFileSync(path.join(context.extensionPath, 'resources', 'jinmeiyo-kanji.txt'), 'utf8').trim();
        this._hyogaiKanji = new RegExp(`(?:(?![々〇${joyoKanji}${jinmeiyoKanji}])\\p{sc=Han})+`, 'gu');
        this._jinmeiyoKanji = new RegExp(`[${jinmeiyoKanji}]+`, 'gu');

        this._activeEditor = vscode.window.activeTextEditor;
        
        vscode.window.onDidChangeVisibleTextEditors(editors => {
            for (const editor of editors) {
                this.refresh(editor);
            }
        }, null, this._disposables);

        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            this.refresh(event.textEditor);
        }, null, this._disposables);

        vscode.workspace.onDidChangeTextDocument(event => {
            for (const editor of vscode.window.visibleTextEditors.filter(x => x.document === event.document)) {
                this.refresh(editor);
            }
        }, null, this._disposables);

        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('hyogaiKanjiChecker.')) {
                this.updateConfiguration();
            }
        }, null, this._disposables);

        this.updateConfiguration();
    }

    public refresh(editor: vscode.TextEditor): void {
        if (this._decorationStyle) {
            this.setDecorations(editor, this._decorationStyle, this._hyogaiKanji);
        }

        if (this._jinmeiyoDecorationStyle) {
            this.setDecorations(editor, this._jinmeiyoDecorationStyle, this._jinmeiyoKanji);
        }
    }

    public updateConfiguration(): void {
        this._decorationStyle?.dispose();
        this._jinmeiyoDecorationStyle?.dispose();

        const config = vscode.workspace.getConfiguration('hyogaiKanjiChecker');
        if (config.get<boolean>('enabled')) {
            this._decorationStyle = vscode.window.createTextEditorDecorationType(
                this.parseStyle(config.get<string>('decorationStyle', 'text-decoration: #0080ff wavy underline')));
            this._jinmeiyoDecorationStyle = vscode.window.createTextEditorDecorationType(
                this.parseStyle(config.get<string>('jinmeiyoDecorationStyle', 'text-decoration: #808080 wavy underline')));

            for (const editor of vscode.window.visibleTextEditors) {
                this.refresh(editor);
            }
        } else {
            this._decorationStyle = null;
            this._jinmeiyoDecorationStyle = null;
        }
    }

    parseStyle(style: string): vscode.DecorationRenderOptions {
        const pattern = /\s*(?:([\w\d_\-]+)\s*:\s*((?:[^"';]+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')+)|[^;]+)\s*(?:;|$)/gu;
        let match;
        let result: {[key: string]: string} = {};
        while (match = pattern.exec(style)) {
            if (match[1] && match[2]) {
                result[match[1].replace(/-(.)/gu, (_, x: string) => x.toUpperCase())] = match[2];
            }
        }
        return result;
    }

    setDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType, pattern: RegExp): void {
        const decorations = [];
        let match;
        for (const range of editor.visibleRanges) {
            const text = editor.document.getText(range);
            const offset = editor.document.offsetAt(range.start);
            while (match = pattern.exec(text)) {
                const startPos = editor.document.positionAt(match.index + offset);
                const endPos = editor.document.positionAt(match.index + match[0].length + offset);
                decorations.push({ range: new vscode.Range(startPos, endPos) });
            }
        }
        editor.setDecorations(decorationType, decorations);
    }

    public dispose(): void {
        this._disposables.forEach(x => x.dispose());
        this._decorationStyle?.dispose();
        this._jinmeiyoDecorationStyle?.dispose();
    }
}