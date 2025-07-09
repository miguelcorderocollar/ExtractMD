# Commit Renaming Plan

This document outlines a plan to update commit messages in the repository to conform to the project's commit naming conventions as described in `rules.mdc`.

## Why Rename Commits?

Consistent commit messages improve project readability, make it easier to track changes, and help automate changelogs and releases. The new convention is:

- Format: `<category>: <statement(s)>`
- Categories: `feat`, `fix`, `refactor`, `chore`
- Statements: Short, imperative verbs, separated by semicolons

## Commit Renaming Table

| Commit ID | Current Message | Proposed Message |
|-----------|----------------|-----------------|
| 6f064fe   | chore: update and clarify project rules formatting; add reminders for README and commit suggestions | chore: update project rules formatting; add README and commit reminders |
| b7dd7fb   | bug/ fix bug with timestamps with hours | fix: handle timestamps with hours |
| eb75349   | plan for 2.0 documented | chore: document plan for 2.0 |
| d98248e   | added option to disable individual integrations | feat: add option to disable individual integrations |
| d03d104   | added setting to download instead of copy | feat: add setting to download instead of copy |
| 00a4fd4   | refactor button state management by consolidating button status functions into utils; update article, Hacker News, and YouTube scripts to utilize new utility functions for loading, success, error, and normal states | refactor: consolidate button state management; update scripts to use new utility functions |
| 7097753   | add setting to include item text in Hacker News exports with corresponding UI and logic updates | feat: add setting to include item text in Hacker News exports; update UI and logic |
| 48aaeda   | enhance README and UI to include new settings for including page URLs in article and Hacker News exports | feat: add settings for including page URLs in exports; update README and UI |
| 4480d12   | removed the not working keybinding | fix: remove non-working keybinding |
| e967528   | implement "Close Tab After Extraction" feature with corresponding settings in UI and background logic | feat: add "Close Tab After Extraction" feature; update UI and background logic |
| 9479bb2   | update readme instructions for installing | chore: update README install instructions |
| c9b8c55   | added usage KPI tracking feature and setting | feat: add usage KPI tracking feature and setting |
| 73a80ad   | added general settings for jumping to a specified domain after copying content | feat: add general settings for jumping to domain after copying |
| c1b1fd4   | readme updated | chore: update README |
| 8c15061   | added option to display articles found | feat: add option to display articles found |
| b93a9f0   | added setting to copy only largest article | feat: add setting to copy only largest article |
| 9adcd50   | added number of articles copied | feat: add number of articles copied |
| be12e30   | UI popup improvements | feat: improve UI popup |
| 13d00c1   | modulize content.js and added building | refactor: modularize content.js; add build process |
| 7b760eb   | added import and export of settings | feat: add import and export of settings |
| c0545bb   | articles are up to date when you clik the button | fix: update articles when button is clicked |
| d213df2   | added support for articles apearing after DOM loads | feat: support articles appearing after DOM loads |
| 9b9b54e   | added support for html articles and updated README | feat: support HTML articles; update README |
| 86bf9ba   | added support for HN | feat: add support for Hacker News |
| bc28c6a   | added more optional features (open new tab, title, url, channel) | feat: add optional features: open new tab, title, url, channel |
| 137535b   | add floaring button | feat: add floating button |
| 6a3be72   | initial_version | chore: initial version |

## How to Rename Commits

### For All Commits (Rewrite History)
1. Run: `git rebase -i <commit-id>^` (replace `<commit-id>` with the hash before the first commit you want to rename)
2. In the editor, change `pick` to `reword` for each commit you want to rename.
3. Save and follow prompts to edit each message.

### For the Most Recent Commit
- Run: `git commit --amend -m "new message"`

### For a Specific Commit (Not the Latest)
- Use interactive rebase as above, or
- Use a tool like `git rebase -i` and mark the commit for rewording.

**Warning:** Renaming old commits rewrites history. Only do this on branches that are not shared with others, or coordinate with your team. 