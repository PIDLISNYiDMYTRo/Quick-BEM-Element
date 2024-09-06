const vscode = require('vscode');

function activate(context) {
   console.log('Extension "quick-bem-element" is now active!'); // Log message indicating activation

   // Register the command for inserting a BEM element
   let insertElement = vscode.commands.registerCommand('quick-bem-element.insertElement', () => {
      insertBEMElement('__'); // Call function to insert BEM element with '__' suffix
   });

   context.subscriptions.push(insertElement); // Add the command to subscriptions for proper cleanup
}

function findParentBlock(editor, position) {
   const document = editor.document;
   const lines = document.getText().split('\n'); // Get all lines of the document
   let currentIndentLevel = getIndentLevel(lines[position.line]); // Get indentation level of the current line

   // Iterate through lines above the current line to find the parent block
   for (let i = position.line - 1; i >= 0; i--) {
      const lineText = lines[i];
      const lineIndentLevel = getIndentLevel(lineText); // Get indentation level of the current line

      // Skip lines with indentation level greater than or equal to the current level
      if (lineIndentLevel >= currentIndentLevel) continue;

      const classMatches = lineText.match(/class=["']([^"']+)["']/); // Match class attribute
      if (classMatches) {
         const classNames = classMatches[1].split(/\s+/); // Split class names

         // Check if any class name matches the criteria
         for (const className of classNames) {
            if (!className.includes('__') && !className.startsWith('_icon-')) {
               return className; // Return the first valid class name
            }
         }
      }

      // Update the current indentation level for the next line
      currentIndentLevel = lineIndentLevel;
   }

   return null; // Return null if no parent block is found
}

function getIndentLevel(lineText) {
   return lineText.match(/^\s*/)[0].length; // Get the number of leading whitespace characters
}

async function insertBEMElement(suffix) {
   const editor = vscode.window.activeTextEditor;
   if (!editor) {
      vscode.window.showInformationMessage('No editor is active.'); // Show message if no editor is active
      return;
   }

   const position = editor.selection.active; // Get the current cursor position
   const parentBlock = findParentBlock(editor, position); // Find the parent block

   if (!parentBlock) {
      vscode.window.showInformationMessage('No parent BEM block found.'); // Show message if no parent block is found
      return;
   }

   const className = `${parentBlock}${suffix}`; // Construct the BEM class name
   const beforeCursor = `<div class="${className}">`; // HTML to insert before the cursor
   const afterCursor = `</div>`; // HTML to insert after the cursor

   const cursorPositionOffset = beforeCursor.length - 2; // Calculate cursor position offset

   const newPosition = new vscode.Position(position.line, position.character + cursorPositionOffset); // New cursor position

   const success = await editor.edit(editBuilder => {
      editBuilder.insert(position, beforeCursor + afterCursor); // Insert the BEM element
   });

   if (!success) {
      vscode.window.showErrorMessage('Failed to insert BEM element.'); // Show error message if insertion fails
      return;
   }

   editor.selection = new vscode.Selection(newPosition, newPosition); // Set the cursor to the new position
   editor.revealRange(new vscode.Range(newPosition, newPosition)); // Reveal the range to ensure the cursor is visible
}

function deactivate() { }

module.exports = {
   activate,
   deactivate
};


