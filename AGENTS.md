# Expense Tracker instructions

Use the selected ultra-minimalist product direction when evaluating improvements: prioritize effortless expense entry, few decisions and a quiet overview. Treat brainstorming ideas as proposals until selected by the user.

Keep product changes private and offline by default. The user approved optional Google Drive sync using their own account and encryption on the device with a user-held key. Keep expense entry available offline and never send readable expense data to Drive. No other cloud services, accounts, analytics, financial integrations or optional online services unless the user explicitly reconsiders this constraint. Favor fast expense entry, minimal UI, maintainability and reusable logic for a future desktop app. Treat supplied product specifications as unverified until implementation is inspected or tested. During product brainstorming, discuss trade-offs and obtain direction before moving to implementation.

At the start of an Expense Tracker task, read the [shared AI OS rules](C:/Users/Andri/Documents/AI%20OS/AGENTS.md) and [shared AI OS memory](C:/Users/Andri/Documents/AI%20OS/memory.md), then read [Expense Tracker memory](memory.md). The shared links use the Windows vault path. On another device, use the corresponding files in the local AI OS vault if available. Expense Tracker instructions take precedence over shared defaults within this repository.

Trigger automatic Drive sync from saved local changes when two-way sync is enabled. Keep manual Sync now available and avoid periodic polling.

Preserve expenses and recurring schedules when deleting a category. Keep category deletion markers in backups and Drive sync so offline records can retain their original category.

When work reveals a decision, preference, or constraint worth carrying forward, update `memory.md` during the task. If it should guide future work, also update this file. Keep Expense Tracker details in this repository. Use the AI OS vault for context and rules that apply across projects.
