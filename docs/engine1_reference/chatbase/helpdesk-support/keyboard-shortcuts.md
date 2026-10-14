> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Keyboard shortcuts

> Move between tickets, reply, and triage from the keyboard.

The helpdesk has single-key shortcuts for the work you repeat on every ticket: moving to the next one, opening the composer, changing status, assigning, tagging, and inserting a macro. They are on by default for every agent.

Press <kbd>?</kbd> anywhere in the helpdesk to open the **Keyboard shortcuts** dialog. You can also open it from your profile menu at the bottom of the sidebar.

The first time you open a ticket, a notice above the conversation lists the basics. Close it with the **X**, and it won't come back.

***

## Shortcuts

Shortcuts work on the ticket page, except <kbd>/</kbd> and <kbd>?</kbd>, which work on every helpdesk page. On a Mac, **Cmd** is the Command key. On Windows and Linux, use **Ctrl**.

### Navigation

| Shortcut | Action |
| - | - |
| <kbd>J</kbd> | Next ticket |
| <kbd>K</kbd> | Previous ticket |
| <kbd>Shift</kbd> + <kbd>J</kbd> | Next message |
| <kbd>Shift</kbd> + <kbd>K</kbd> | Previous message |
| <kbd>/</kbd> | Search |
| <kbd>Esc</kbd> | Back to ticket list |
| <kbd>?</kbd> | Keyboard shortcuts |

<kbd>J</kbd> and <kbd>K</kbd> follow the order of the list you opened the ticket from. <kbd>Esc</kbd> returns you to that list with its filters intact.

<kbd>Shift</kbd> + <kbd>J</kbd> and <kbd>Shift</kbd> + <kbd>K</kbd> step through the messages in the conversation and skip event rows. The first press selects the newest message, and the selected message gets a highlighted border.

### Ticket

| Shortcut | Action |
| - | - |
| <kbd>R</kbd> | Reply |
| <kbd>N</kbd> | Write a note |
| <kbd>S</kbd> | Change status |
| <kbd>A</kbd> | Assign |
| <kbd>T</kbd> | Add tags |
| <kbd>P</kbd> | Change priority |
| <kbd>M</kbd> | Insert a macro |

<kbd>R</kbd> and <kbd>N</kbd> switch the composer to Reply or Note and put the cursor at the end of your draft. They do nothing while an AI draft is generating.

<kbd>A</kbd>, <kbd>T</kbd>, and <kbd>P</kbd> open pickers in the ticket details panel, so they only work while the panel is expanded. <kbd>T</kbd> also stops working once the ticket has 20 tags, the [per-ticket limit](/docs/user-guides/chatbot/help-desk/tags).

### Composer

| Shortcut | Action |
| - | - |
| <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Send reply or save note |
| <kbd>Esc</kbd> | Leave the composer, keep the draft |

Press <kbd>Esc</kbd> once to leave the composer, and again to go back to the ticket list.

***

## Picking with number keys

When you open the status, assignee, tag, priority, or macro picker with its shortcut, each row shows a number. Press the number to pick the row without touching the mouse. Numbers go up to 9, and they disappear once you type in the picker's search box.

| Picker | Numbers |
| - | - |
| Status | <kbd>1</kbd> and up, in list order |
| Assignee | <kbd>0</kbd> unassigns. <kbd>1</kbd> is you, then your teammates |
| Priority | <kbd>0</kbd> No priority, <kbd>1</kbd> Low, <kbd>2</kbd> Normal, <kbd>3</kbd> High, <kbd>4</kbd> Urgent |
| Tags | <kbd>1</kbd> and up |
| Macros | <kbd>1</kbd> and up |

<Tip>
  Press <kbd>A</kbd> then <kbd>1</kbd> to assign the open ticket to yourself.
</Tip>

The tag picker stays open after a pick, so you can add several tags in a row. Press <kbd>Esc</kbd> to close it.

***

## Turning shortcuts off

Click your avatar at the bottom of the sidebar and switch off **Single-key shortcuts**. This removes the letter and number shortcuts and the key hints next to buttons. <kbd>Cmd</kbd> + <kbd>Enter</kbd> still sends, and you can still open the shortcuts list from the profile menu.

With shortcuts off, typing anywhere on a ticket page starts typing in the composer, as the helpdesk did before shortcuts existed.

The setting is yours alone and applies to one AI agent. If you work in the helpdesk of several AI agents, turn it off in each one.

There is no way to change which key does what.

***

## Good to know

* Shortcuts don't fire while you're typing in a text field, the composer, or a search box, or while a dialog or menu is open. Press <kbd>Esc</kbd> to leave the field first.
* Shortcuts ignore keys pressed with **Cmd**, **Ctrl**, or **Alt**, so browser shortcuts like **Cmd+R** keep working.
* Caps Lock has no effect. <kbd>J</kbd> moves to the next ticket whether Caps Lock is on or off.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.