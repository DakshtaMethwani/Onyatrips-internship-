# Advanced Git Techniques

Optimization strategies and power-user workflows for experienced developers.

---

## 1. Interactive Rebase

Interactive rebase lets you rewrite, reorder, squash, and edit commits before pushing.

```bash
git rebase -i HEAD~4    # Edit last 4 commits
```

You'll see an editor with options per commit:

```
pick a1b2c3d Add login feature
pick b2c3d4e Fix typo in login
pick c3d4e5f Add tests for login
pick d4e5f6a Update README
```

**Commands:**

| Command | What it does |
|---------|-------------|
| `pick` | Keep commit as-is |
| `reword` | Keep commit, edit message |
| `edit` | Pause to amend the commit |
| `squash` | Merge into previous commit |
| `fixup` | Like squash, but discard this commit's message |
| `drop` | Remove the commit entirely |

**Example — squash fix commits into their parent:**

```
pick a1b2c3d Add login feature
fixup b2c3d4e Fix typo in login
pick c3d4e5f Add tests for login
```

Result: two clean commits instead of three.

> **Rule:** Only rebase commits that haven't been pushed to shared branches.

---

## 2. Rebase vs Merge

### Merge (preserves history)

```bash
git checkout main
git merge feature/auth
```

Creates a merge commit. History shows exactly when branches diverged and rejoined.

```
A---B---C---M  (main)
     \     /
      D---E  (feature/auth)
```

### Rebase (linear history)

```bash
git checkout feature/auth
git rebase main
git checkout main
git merge feature/auth   # Fast-forward
```

Replays commits on top of main. History is clean and linear.

```
A---B---C---D'---E'  (main)
```

**When to use each:**

| Situation | Use |
|-----------|-----|
| Shared branch (main/develop) | `merge` |
| Your feature branch before PR | `rebase` |
| Preserving exact history matters | `merge` |
| Clean linear history matters | `rebase` |

---

## 3. Cherry-pick

Copy specific commits from one branch to another without merging everything.

```bash
# Copy a single commit
git cherry-pick a1b2c3d

# Copy a range of commits
git cherry-pick a1b2c3d..f6g7h8i

# Apply changes without committing (stage only)
git cherry-pick --no-commit a1b2c3d

# Cherry-pick and edit the commit message
git cherry-pick -e a1b2c3d
```

**Use case:** A bug was fixed on a feature branch. Backport it to the release branch without merging the entire feature.

```bash
git checkout release/1.2
git cherry-pick fix/critical-bug-hash
```

---

## 4. Stash Advanced Usage

Basic stash covers saving work. Here's the full power:

```bash
# Stash with a descriptive name
git stash push -m "WIP: payment form validation"

# Include untracked files in stash
git stash push -u

# Include ignored files too
git stash push -a

# Apply a specific stash by index
git stash apply stash@{2}

# Create a branch from a stash (avoids conflicts)
git stash branch feature/stashed-work stash@{0}
```

**List and inspect:**

```bash
git stash list
git stash show stash@{1}       # Summary of changes
git stash show -p stash@{1}    # Full diff
```

---

## 5. Git Hooks

Hooks are scripts that run automatically at key Git events. Stored in `.git/hooks/`.

### Common hook types:

| Hook | When it runs | Common use |
|------|-------------|------------|
| `pre-commit` | Before a commit is created | Lint, format, run tests |
| `commit-msg` | After commit message is written | Enforce message format |
| `pre-push` | Before `git push` | Run test suite |
| `post-merge` | After a successful merge | Install dependencies |

### Example: pre-commit lint hook

Create `.git/hooks/pre-commit` (no extension):

```bash
#!/bin/sh

echo "Running linter..."
npm run lint

if [ $? -ne 0 ]; then
  echo "Lint failed. Commit aborted."
  exit 1
fi
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### Shareable hooks with Husky (Node.js projects)

`.git/hooks/` is not committed to the repo. Use [Husky](https://typicode.github.io/husky/) to share hooks with your team:

```bash
npm install --save-dev husky
npx husky init
```

Then add hooks in `.husky/pre-commit`:

```bash
npm test
npm run lint
```

---

## 6. Reflog — Recovering Lost Work

Reflog records every position HEAD has been at, even after resets and rebases.

```bash
git reflog                  # Show all recent HEAD positions
git reflog show feature/x   # Reflog for a specific branch
```

**Recover a deleted branch:**

```bash
git reflog
# Find the last commit hash of the deleted branch
git checkout -b recovered-branch a1b2c3d
```

**Recover after a bad reset --hard:**

```bash
git reflog
# Find the commit you were at before the reset
git reset --hard a1b2c3d
```

Reflog entries expire after 90 days by default.

---

## 7. Git Bisect

Binary search through commit history to find which commit introduced a bug.

```bash
# Start bisect
git bisect start

# Tell Git the current state is broken
git bisect bad

# Tell Git a known-good state (e.g., a version tag)
git bisect good v1.2.0

# Git checks out a commit halfway between — test it
# If the bug exists:
git bisect bad
# If the bug doesn't exist:
git bisect good

# Git keeps narrowing until it pinpoints the culprit

# End the session
git bisect reset
```

**Automate bisect with a test script:**

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.2.0
git bisect run npm test
# Git runs the script automatically and finds the breaking commit
```

---

## 8. Worktrees

Check out multiple branches simultaneously in separate directories — no stashing needed.

```bash
# Create a new worktree for a branch
git worktree add ../hotfix-work hotfix/critical-bug

# Work in that directory independently
cd ../hotfix-work
# ... make changes, commit ...

# List all worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../hotfix-work
```

**Use case:** You're mid-feature but need to fix a critical bug immediately. Instead of stashing, create a worktree and fix it in isolation.

---

## 9. Partial Staging with `git add -p`

Stage specific lines/hunks from a file instead of the entire file. Essential for clean, atomic commits.

```bash
git add -p <file>       # Interactive staging
git add -p              # All files interactively
```

You'll be asked for each hunk:

| Key | Action |
|-----|--------|
| `y` | Stage this hunk |
| `n` | Skip this hunk |
| `s` | Split hunk into smaller pieces |
| `e` | Manually edit the hunk |
| `q` | Quit |
| `?` | Show help |

---

## 10. Commit Message Conventions

### Conventional Commits format

Adopted by many open-source projects. Enables automatic changelogs and semantic versioning.

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change, not fix or feature |
| `test` | Adding or fixing tests |
| `chore` | Build process, tooling |
| `perf` | Performance improvement |

**Examples:**

```
feat(auth): add JWT token refresh logic

fix(api): handle null response from payment gateway

docs(README): update installation steps for Windows

refactor(user): extract email validation into helper

BREAKING CHANGE: rename `getUserById` to `findUser`
```

---

## 11. `.git/config` and Repository-Level Settings

```bash
# Set an alias just for this repo
git config alias.deploy "push origin main"

# Override global identity for a specific repo
git config user.email "work@company.com"

# Set a default remote and branch
git config branch.main.remote origin
git config branch.main.merge refs/heads/main
```

---

## 12. Optimizing Large Repositories

```bash
# Shallow clone — only most recent history
git clone --depth 1 <url>

# Partial clone — skip large blobs until needed
git clone --filter=blob:none <url>

# Reduce repo size (garbage collect + compress)
git gc --aggressive

# Clean up stale remote-tracking branches
git remote prune origin

# Show large objects in history
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -rn | head -20
```

---

## 13. Signing Commits with GPG

Verify your commits are authentically from you.

```bash
# List GPG keys
gpg --list-secret-keys --keyid-format=long

# Configure Git to use your key
git config --global user.signingkey <KEY-ID>
git config --global commit.gpgsign true

# Sign a single commit manually
git commit -S -m "Signed commit"

# Verify a commit's signature
git verify-commit <commit-hash>
```

---

## Summary

| Technique | Best for |
|-----------|---------|
| Interactive rebase | Cleaning up commits before PR |
| Cherry-pick | Backporting specific fixes |
| Stash advanced | Context-switching mid-work |
| Git hooks | Enforcing standards automatically |
| Reflog | Recovering from mistakes |
| Bisect | Locating the commit that broke something |
| Worktrees | Parallel branch work without stashing |
| `add -p` | Crafting focused, atomic commits |

---

*Back to [COMMANDS-REFERENCE.md](COMMANDS-REFERENCE.md) for quick lookups*
*See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for when things go wrong*
