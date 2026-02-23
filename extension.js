
const vscode = require('vscode');

let autoAcceptInterval = null;
let enabled = true;
let statusBarItem;

/**
 * All known accept/approve commands in Antigravity IDE.
 * Covers both the legacy agent panel and the new Cascade agent system.
 */
const ACCEPT_COMMANDS = [
    // === Agent Panel (legacy + current) ===
    'antigravity.agent.acceptAgentStep',          // Main agent step accept (alt+enter when !editorTextFocus)

    // === Interactive Cascade (new agent system) ===
    'antigravity.interactiveCascade.acceptSuggestedAction',  // Cascade agent suggested action accept
    'antigravity.executeCascadeAction',            // Execute cascade action directly

    // === Terminal Commands ===
    'antigravity.terminalCommand.accept',          // Terminal command approval (alt+enter in terminal)
    'antigravity.terminalCommand.run',             // Terminal command run

    // === Editor / Inline Command Mode ===
    'antigravity.command.accept',                  // Editor command mode accept (ctrl+enter)

    // === Agent Diff/Hunk Acceptance ===
    'antigravity.prioritized.agentAcceptFocusedHunk',       // Accept focused diff hunk
    'antigravity.prioritized.agentAcceptAllInFile',         // Accept all agent edits in file
];

function activate(context) {
    // Register toggle command
    let disposable = vscode.commands.registerCommand('unlimited.toggle', function () {
        enabled = !enabled;
        updateStatusBar();
        if (enabled) {
            vscode.window.showInformationMessage('Auto-Accept: ON ✅');
        } else {
            vscode.window.showInformationMessage('Auto-Accept: OFF 🛑');
        }
    });
    context.subscriptions.push(disposable);

    try {
        // Create Right Item (High Priority)
        // Alignment Right, Priority 10000 ensures it is the first/left-most item in the Right block
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
        statusBarItem.command = 'unlimited.toggle';
        context.subscriptions.push(statusBarItem);

        updateStatusBar();
        statusBarItem.show();
    } catch (e) {
        // Silent failure in production to avoid harassing user
    }

    // Start the loop
    startLoop();
}

function updateStatusBar() {
    if (!statusBarItem) return;

    if (enabled) {
        statusBarItem.text = "✅ Auto-Accept: ON";
        statusBarItem.tooltip = "Unlimited Auto-Accept is Executing (Click to Pause)";
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = "🛑 Auto-Accept: OFF";
        statusBarItem.tooltip = "Unlimited Auto-Accept is Paused (Click to Resume)";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

function startLoop() {
    autoAcceptInterval = setInterval(async () => {
        if (!enabled) return;

        // Execute all accept commands, silently ignoring errors for inactive/unavailable ones
        for (const cmd of ACCEPT_COMMANDS) {
            try {
                await vscode.commands.executeCommand(cmd);
            } catch (e) {
                // Command not available or not applicable — silently skip
            }
        }
    }, 500);
}

function deactivate() {
    if (autoAcceptInterval) {
        clearInterval(autoAcceptInterval);
    }
}

module.exports = {
    activate,
    deactivate
}
