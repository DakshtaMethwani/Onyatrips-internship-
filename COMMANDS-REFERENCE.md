# Git Commands Quick Reference

A fast-lookup cheat sheet for all common Git operations.

---

## Setup & Configuration

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global core.editor "code --wait"   # Set VSCode as default editor
git config --global init.defaultBranch main      # Default branch name
git config --list                                # Show all settings
git config --global --edit                       # Edit global config file
```

---

## Creating Repositories

```bash
git init                            # Initialize repo in current directory
git init <directory>                # Initialize repo in new directory
git clone <url>                     # Clone remote repo
git clone <url> <directory>         # Clone into specific folder
git clone --depth 1 <url>           # Shallow clone (latest snapshot only)
```

---

## Staging & Committing

```bash
git status                          # Show working tree status
git status -s                       # Short/compact status

git add <file>                      # Stage a specific file
git add .                           # Stage all changes
git add -p                          # Stage changes interactively (hunk by hunk)

git commit -m "message"             # Commit with inline message
git commit                          # Open editor for commit message
git commit --amend                  # Edit last commit message (unpushed only)
git commit --amend --no-edit        # Add staged changes to last commit silently

git diff                            # Show unstaged changes
git diff --staged                   # Show staged changes
git diff <branch1>..<branch2>       # Compare two branches
```

---

## Branching

```bash
git branch                          # List local branches
git branch -a                       # List all branches (local + remote)
git branch <name>                   # Create a branch
git branch -d <name>                # Delete branch (safe)
git branch -D <name>                # Delete branch (force)
git branch -m <old> <new>           # Rename a branch

git checkout <branch>               # Switch to branch
git checkout -b <branch>            # Create and switch to branch
git switch <branch>                 # Switch to branch (modern syntax)
git switch -c <branch>              # Create and switch (modern syntax)
```

---

## Merging & Rebasing

```bash
git merge <branch>                  # Merge branch into current branch
git merge --no-ff <branch>          # Merge with a merge commit (no fast-forward)
git merge --squash <branch>         # Squash all commits into one before merging
git merge --abort                   # Abort an in-progress merge

git rebase <branch>                 # Reapply commits on top of branch
git rebase -i HEAD~3                # Interactive rebase last 3 commits
git rebase --onto <base> <old> <branch>  # Advanced: rebase onto a new base
git rebase --abort                  # Abort rebase
git rebase --continue               # Continue after resolving conflict
```

---

## Remote Operations

```bash
git remote -v                       # List remotes with URLs
git remote add origin <url>         # Add a remote named origin
git remote rename origin upstream   # Rename a remote
git remote remove <name>            # Remove a remote

git fetch origin                    # Download changes without merging
git fetch --all                     # Fetch from all remotes

git pull origin <branch>            # Fetch + merge
git pull --rebase origin <branch>   # Fetch + rebase (cleaner history)

git push origin <branch>            # Push branch to remote
git push -u origin <branch>         # Push and set upstream tracking
git push origin <branch> -f         # Force push (use with caution!)
git push origin --delete <branch>   # Delete a remote branch
```

---

## Stashing

```bash
git stash                           # Save current work temporarily
git stash push -m "description"     # Stash with a message
git stash list                      # List all stashes
git stash pop                       # Apply most recent stash and remove it
git stash apply stash@{2}           # Apply a specific stash (keep it)
git stash drop stash@{0}            # Delete a specific stash
git stash clear                     # Delete all stashes
git stash branch <branch>           # Create branch from stash
```

---

## Undoing Changes

```bash
git restore <file>                  # Discard unstaged changes to a file
git restore --staged <file>         # Unstage a file (keep changes)
git clean -fd                       # Delete untracked files and directories

git revert <commit>                 # Create new commit that undoes a commit (safe)
git revert HEAD                     # Undo most recent commit (safe)

git reset --soft HEAD~1             # Undo last commit, keep changes staged
git reset --mixed HEAD~1            # Undo last commit, keep changes unstaged (default)
git reset --hard HEAD~1             # Undo last commit, discard all changes
```

---

## Viewing History

```bash
git log                             # Full commit history
git log --oneline                   # Compact one-line format
git log --oneline --graph --all     # Visual branch graph
git log -n 5                        # Last 5 commits
git log --author="Name"             # Commits by specific author
git log --since="2 weeks ago"       # Commits from last 2 weeks
git log -- <file>                   # History for a specific file

git show <commit>                   # Show commit details and diff
git show HEAD                       # Show most recent commit

git blame <file>                    # Show who changed each line
git shortlog -sn                    # Commit count per author
```

---

## Cherry-pick

```bash
git cherry-pick <commit>            # Copy a commit to current branch
git cherry-pick <from>..<to>        # Copy a range of commits
git cherry-pick --no-commit <hash>  # Apply changes without committing
git cherry-pick --abort             # Abort cherry-pick
```

---

## Tags

```bash
git tag                             # List all tags
git tag v1.0.0                      # Create lightweight tag
git tag -a v1.0.0 -m "Release v1.0" # Create annotated tag
git push origin v1.0.0              # Push a tag to remote
git push origin --tags              # Push all tags
git tag -d v1.0.0                   # Delete local tag
git push origin --delete v1.0.0     # Delete remote tag
```

---

## Reflog & Recovery

```bash
git reflog                          # Show all recent HEAD positions
git reflog show <branch>            # Reflog for a specific branch
git checkout -b recovered <hash>    # Recover a deleted branch by commit hash
git fsck --lost-found               # Find dangling/unreachable objects
```

---

## Bisect (Debug with Binary Search)

```bash
git bisect start                    # Begin bisect session
git bisect bad                      # Mark current commit as broken
git bisect good <commit>            # Mark a known-good commit
# Git will checkout a commit halfway between — test it, then:
git bisect good                     # Mark as good → Git narrows the range
git bisect bad                      # Mark as bad → Git narrows the range
git bisect reset                    # End bisect session
```

---

## Submodules

```bash
git submodule add <url> <path>      # Add a submodule
git submodule init                  # Initialize submodules
git submodule update                # Update all submodules
git clone --recurse-submodules <url> # Clone with all submodules
```

---

## Useful Aliases (Add to ~/.gitconfig)

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.undo "reset --soft HEAD~1"
git config --global alias.unstage "restore --staged"
```

---

## Common Flags Reference

| Flag | Meaning |
|------|---------|
| `-v` | Verbose output |
| `-f` | Force |
| `-d` | Delete |
| `-a` | All |
| `-n` | Dry run (no actual changes) |
| `--no-ff` | No fast-forward |
| `--squash` | Squash commits |
| `--stat` | Show file change stats |
| `--oneline` | Compact log format |
| `--graph` | ASCII branch graph |
| `--all` | All branches/refs |

---

*For advanced topics see [06-advanced-techniques.md](06-advanced-techniques.md)*
*For troubleshooting see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)*
