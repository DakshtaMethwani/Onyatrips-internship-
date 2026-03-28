# Git Troubleshooting Guide

Solutions to common and complex Git problems.

---

## Table of Contents

- [Commit Mistakes](#commit-mistakes)
- [Branch Problems](#branch-problems)
- [Merge & Rebase Issues](#merge--rebase-issues)
- [Remote & Push Errors](#remote--push-errors)
- [Lost Work & Recovery](#lost-work--recovery)
- [Authentication Issues](#authentication-issues)
- [Repository Corruption](#repository-corruption)
- [Performance Problems](#performance-problems)
- [.gitignore Not Working](#gitignore-not-working)

---

## Commit Mistakes

### I committed to the wrong branch

```bash
# 1. Note the commit hash
git log --oneline -5

# 2. Switch to the correct branch
git checkout correct-branch

# 3. Cherry-pick the commit
git cherry-pick <commit-hash>

# 4. Go back and remove it from the wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

---

### I made a typo in my last commit message

```bash
# Only works if you haven't pushed yet
git commit --amend -m "Corrected commit message"

# If already pushed (rewrites history — notify teammates)
git commit --amend -m "Corrected commit message"
git push origin branch-name -f
```

---

### I forgot to include a file in my last commit

```bash
git add forgotten-file.txt
git commit --amend --no-edit     # Add to last commit, keep message
```

---

### I need to undo my last commit

```bash
# Undo commit, keep changes staged
git reset --soft HEAD~1

# Undo commit, keep changes unstaged (default)
git reset --mixed HEAD~1

# Undo commit and discard all changes (destructive)
git reset --hard HEAD~1
```

---

### I need to undo a commit that was already pushed and shared

Do **not** use `reset --hard` on shared history. Use `revert` instead — it creates a new commit that undoes the changes safely.

```bash
git revert <commit-hash>
git push origin branch-name
```

---

### I accidentally ran `git commit --amend` on a public commit

This rewrites history. If others have already pulled, you'll need to coordinate:

1. Force push: `git push origin branch -f`
2. Notify teammates to run: `git fetch && git reset --hard origin/branch`

Avoid amending public commits when possible.

---

## Branch Problems

### I accidentally deleted a branch

Branches are just pointers to commits. Use reflog to find it:

```bash
git reflog
# Find the last commit that was on the deleted branch
git checkout -b recovered-branch <commit-hash>
```

---

### I need to rename a branch

```bash
# Rename local branch
git branch -m old-name new-name

# If you're on the branch you want to rename
git branch -m new-name

# Update remote (delete old, push new)
git push origin --delete old-name
git push -u origin new-name
```

---

### My branch is out of sync with main

```bash
# Option 1: Merge main into your branch (preserves history)
git checkout feature/my-feature
git merge main

# Option 2: Rebase on top of main (cleaner, linear history)
git checkout feature/my-feature
git rebase main

# If rebase causes issues
git rebase --abort
```

---

### I created a branch from the wrong base

```bash
# Rebase onto the correct base
git rebase --onto <correct-base> <wrong-base> <your-branch>

# Example: move feature off develop onto main
git rebase --onto main develop feature/my-feature
```

---

## Merge & Rebase Issues

### I have merge conflicts — how do I resolve them?

Git marks conflicts like this in the file:

```
<<<<<<< HEAD
your version of the code
=======
their version of the code
>>>>>>> feature/other-branch
```

**Steps:**

```bash
# 1. Open the conflicted file(s) and edit them
#    Remove the conflict markers, keep what's correct

# 2. Stage the resolved file
git add <file>

# 3. Complete the merge
git commit

# To see all conflicted files
git diff --name-only --diff-filter=U
```

**Using a merge tool:**

```bash
git mergetool                     # Opens configured merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

---

### I want to abort a merge or rebase

```bash
git merge --abort       # Abort an in-progress merge
git rebase --abort      # Abort an in-progress rebase
git cherry-pick --abort # Abort a cherry-pick
```

---

### Rebase made a mess — how do I undo it?

```bash
# Find where you were before the rebase
git reflog

# Reset to that point
git reset --hard HEAD@{4}   # Replace 4 with the correct index
```

---

### I have "diverged" branches after a force push

```bash
# Your local branch and remote have diverged
# To overwrite local with remote (discard local changes)
git fetch origin
git reset --hard origin/branch-name

# To overwrite remote with local (discard remote changes)
git push origin branch-name -f
```

---

### Merge conflict in a binary file

Git can't merge binary files (images, PDFs, etc.). Choose one version:

```bash
# Keep your version
git checkout --ours <file>

# Keep their version
git checkout --theirs <file>

# Stage and continue
git add <file>
git commit
```

---

## Remote & Push Errors

### "rejected — non-fast-forward" when pushing

Your local branch is behind the remote.

```bash
# Option 1: Pull and merge, then push
git pull origin branch-name
git push origin branch-name

# Option 2: Pull and rebase, then push (cleaner)
git pull --rebase origin branch-name
git push origin branch-name

# Option 3: Force push (only if you know what you're doing)
git push origin branch-name -f
```

---

### "src refspec does not match any" when pushing

The branch name doesn't exist locally, or there's a typo.

```bash
git branch              # Confirm the branch name
git push origin HEAD    # Push current branch without naming it
```

---

### Remote URL is wrong

```bash
git remote -v                                   # View current remotes
git remote set-url origin <correct-url>         # Fix the URL
git remote set-url origin git@github.com:user/repo.git  # SSH example
```

---

### "Everything up to date" but changes aren't on GitHub

You may not be pushing the right branch.

```bash
git status              # Confirm which branch you're on
git push origin HEAD    # Push the current branch explicitly
git push -u origin $(git branch --show-current)  # Push and set upstream
```

---

### Large file rejected by GitHub

GitHub rejects files over 100MB.

```bash
# Remove the large file from the last commit
git rm --cached large-file.zip
echo "large-file.zip" >> .gitignore
git add .gitignore
git commit --amend --no-edit

# If the file is deep in history, use git-filter-repo
pip install git-filter-repo
git filter-repo --path large-file.zip --invert-paths
```

---

## Lost Work & Recovery

### I accidentally ran `git reset --hard`

Use reflog — nothing is truly gone until Git garbage collects it (90 days).

```bash
git reflog
# Find the commit you want to recover
git checkout -b recovered <commit-hash>
# Or reset back to it
git reset --hard <commit-hash>
```

---

### I accidentally deleted uncommitted changes

Uncommitted changes that weren't staged cannot be recovered with Git. Prevention:

```bash
# Stage frequently
git add -p

# Use stash before risky operations
git stash
```

If you used an IDE, check your editor's local history feature (VSCode has Local History).

---

### I lost commits after a rebase

```bash
git reflog
# Look for entries like "rebase (start)" and find the original commit
git checkout -b recovered <hash>
```

---

### I need to find a commit I can barely remember

```bash
# Search commit messages
git log --all --grep="payment"

# Search by author
git log --all --author="Alice"

# Search by date
git log --after="2024-01-01" --before="2024-03-01"

# Search for when a string appeared in code
git log -S "functionName" --all

# Search diff content with regex
git log -G "TODO.*auth" --all
```

---

## Authentication Issues

### SSH: "Permission denied (publickey)"

```bash
# Test SSH connection
ssh -T git@github.com

# Check if SSH key is loaded
ssh-add -l

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Regenerate key if needed
ssh-keygen -t ed25519 -C "you@example.com"
# Then add public key to GitHub: Settings → SSH keys
cat ~/.ssh/id_ed25519.pub
```

---

### HTTPS: Credential prompts on every push

```bash
# Cache credentials temporarily (15 minutes)
git config --global credential.helper cache

# Store credentials persistently
git config --global credential.helper store    # Plain text file
git config --global credential.helper osxkeychain  # macOS
git config --global credential.helper manager  # Windows (Git Credential Manager)
```

For GitHub: use a Personal Access Token (PAT) as your password. Generate one at GitHub → Settings → Developer settings → Personal access tokens.

---

### "remote: Support for password authentication was removed"

GitHub no longer accepts account passwords over HTTPS. Solutions:

1. **Switch to SSH:**
   ```bash
   git remote set-url origin git@github.com:user/repo.git
   ```

2. **Use a Personal Access Token (PAT) as the password** when prompted.

---

## Repository Corruption

### "object file is empty" or "loose object is corrupt"

```bash
# Check for corruption
git fsck

# Try to recover with reflog
git reflog

# As a last resort — clone fresh and apply recent changes manually
git clone <url> repo-fresh
```

---

### Index is corrupted

```bash
rm .git/index
git reset HEAD
# Git rebuilds the index from the tree
```

---

### "cannot lock ref" errors

```bash
# Remove stale lock files
find .git -name "*.lock" -delete

# Or specifically
rm .git/refs/heads/branch-name.lock
```

---

## Performance Problems

### `git status` or `git add` is very slow

```bash
# Rebuild the index
git rm -r --cached .
git add .

# Enable filesystem monitor (large repos)
git config core.fsmonitor true

# Check if .gitignore is excluding heavy directories
# e.g., node_modules, .venv, build/ should always be ignored
```

---

### Repo history takes too long to clone

```bash
# Shallow clone — only the latest snapshot
git clone --depth 1 <url>

# Deepen later if needed
git fetch --unshallow
```

---

### `git log` is slow on a large repo

```bash
# Limit output
git log -n 20 --oneline

# Avoid traversing all branches
git log main --oneline -20
```

---

## .gitignore Not Working

### Files are still being tracked after adding to .gitignore

`.gitignore` only affects untracked files. If a file is already tracked, you must untrack it:

```bash
# Untrack a specific file (keeps it locally)
git rm --cached <file>

# Untrack a directory
git rm -r --cached <directory>/

# Commit the change
git add .gitignore
git commit -m "Remove tracked files that should be ignored"
```

---

### Global .gitignore for OS/editor files

Create a global ignore file so you don't pollute every repo's `.gitignore`:

```bash
git config --global core.excludesfile ~/.gitignore_global
```

Then add to `~/.gitignore_global`:

```
# macOS
.DS_Store

# Windows
Thumbs.db
desktop.ini

# VSCode
.vscode/

# JetBrains IDEs
.idea/

# Vim
*.swp
*.swo
```

---

## Quick Diagnostic Commands

```bash
git status                      # Current state
git log --oneline -10           # Recent commits
git diff                        # Unstaged changes
git diff --staged               # Staged changes
git remote -v                   # Remote URLs
git branch -a                   # All branches
git stash list                  # All stashes
git reflog                      # Recent HEAD positions
git fsck                        # Check for corruption
```

---

*For command syntax see [COMMANDS-REFERENCE.md](COMMANDS-REFERENCE.md)*
*For advanced workflows see [06-advanced-techniques.md](06-advanced-techniques.md)*
