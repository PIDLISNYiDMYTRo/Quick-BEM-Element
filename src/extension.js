const vscode = require('vscode');

function activate(context) {
   console.log('Extension "quick-bem-element" is now active!');

   let insertElement = vscode.commands.registerCommand('quick-bem-element.insertElement', () => {
      insertBEMElement('__');
   });

   context.subscriptions.push(insertElement);
}

function findParentBlock(editor, position) {
   const document = editor.document;
   let currentIndentLevel = getIndentLevel(document.lineAt(position.line).text);

   for (let i = position.line; i >= 0; i--) {
      const textLine = document.lineAt(i).text;
      const lineIndentLevel = getIndentLevel(textLine);
      const classMatches = textLine.match(/class=["']([^"']+)["']/);

      if (classMatches && lineIndentLevel < currentIndentLevel) {
         const classNames = classMatches[1].split(/\s+/);

         for (const className of classNames) {
            if (!className.includes('__') && !className.startsWith('_icon-')) {
               return className;
            }
         }
      }
   }

   return null;
}

function getIndentLevel(lineText) {
   return lineText.match(/^\s*/)[0].length;
}

async function insertBEMElement(suffix) {
   const editor = vscode.window.activeTextEditor;
   if (!editor) {
      vscode.window.showInformationMessage('No editor is active.');
      return;
   }

   const position = editor.selection.active;
   const parentBlock = findParentBlock(editor, position);

   if (!parentBlock) {
      vscode.window.showInformationMessage('No parent BEM block found.');
      return;
   }

   const className = `${parentBlock}${suffix}`;
   const beforeCursor = `<div class="${className}">`;
   const afterCursor = `</div>`;

   const cursorPositionOffset = beforeCursor.length - 2;

   const newPosition = new vscode.Position(position.line, position.character + cursorPositionOffset);

   const success = await editor.edit(editBuilder => {
      editBuilder.insert(position, beforeCursor + afterCursor);
   });

   if (!success) {
      vscode.window.showErrorMessage('Failed to insert BEM element.');
      return;
   }

   editor.selection = new vscode.Selection(newPosition, newPosition);
   editor.revealRange(new vscode.Range(newPosition, newPosition));
}

function deactivate() { }

module.exports = {
   activate,
   deactivate
};

