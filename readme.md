# Git & GitHub Mastery Guide

A comprehensive learning guide for developers to master Git version control and GitHub collaboration. Perfect for teams, beginners, and anyone preparing for professional development work.

## Table of Contents

- [Overview](#overview)
- [Topics Covered](#topics-covered)
- [Learning Path](#learning-path)
- [Getting Started](#getting-started)
- [Best Practices](#best-practices)
- [Files in This Repository](#files-in-this-repository)
- [How to Use This Guide](#how-to-use-this-guide)
- [FAQ](#faq)
- [Learning Resources](#learning-resources)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Git and GitHub are essential tools for modern software development. This guide covers everything from basic concepts to advanced workflows in a structured, easy-to-follow format.

**Why Git & GitHub?**

- **Track Changes** — See who changed what, when, and why
- **Collaborate** — Multiple developers work simultaneously without conflicts
- **Undo Mistakes** — Roll back to any previous version instantly
- **Branching** — Work on features in isolation without touching main code
- **Accountability** — Complete audit trail for compliance and security

---

## Topics Covered

### Phase 1: Fundamentals
- **What is Git and Version Control** — Understand the core concepts of VCS
- **What is GitHub** — Learn how GitHub extends Git with cloud collaboration
- **Repository** — Create and manage local and remote repositories

### Phase 2: Daily Operations
- **Clone** — Download repositories from GitHub to your machine
- **Commit** — Create snapshots of your code with meaningful messages
- **Push / Pull** — Sync your work with GitHub

### Phase 3: Branching & Isolation
- **Branch** — Create isolated copies of code for feature development
- **Merge** — Combine work from different branches
- **Pull Request** — Propose changes and enable code review

### Phase 4: Collaboration
- **Merge Conflicts** — Understand and resolve conflicts when Git can't auto-merge
- **Code Review** — Best practices for reviewing teammates' code
- **Team Workflows** — Git Flow, trunk-based development, and feature branches

### Phase 5: Advanced Techniques
- **Rebase** — Reapply commits linearly for cleaner history
- **Cherry-pick** — Copy specific commits between branches
- **Stash** — Temporarily save work without committing
- **Git Hooks** — Automate tasks on commit/push events
- **Reflog & Bisect** — Find lost commits and debug with binary search

---

## Learning Path

### 2-Day Intensive Sprint (For Teams)

**Day 1: Fundamentals & Daily Workflow**
- **Morning** — Git basics, version control concepts, repositories
- **Afternoon** — Clone, commit, push/pull workflows
- **Practice** — Create a repo, make commits, push to GitHub

**Day 2: Branching & Collaboration**
- **Morning** — Branching, merging, conflict resolution
- **Afternoon** — Pull requests, code review, best practices
- **Practice** — Create branches, open PRs, resolve conflicts

---

## Getting Started

### Prerequisites

- **Git installed** — Download from https://git-scm.com/
- **GitHub account** — Create a free account at https://github.com/
- **Basic command line** — Comfortable with terminal/PowerShell
- **Text editor** — VSCode, Sublime, or any editor

### First-Time Setup

```bash
# Configure your identity (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### Your First Repository

```bash
mkdir my-first-repo
cd my-first-repo

git init
echo "# My First Repo" > README.md

git add README.md
git commit -m "Initial commit: Add README"

# Connect to GitHub (create the repo on GitHub first)
git remote add origin https://github.com/YOUR-USERNAME/my-first-repo.git
git branch -M main
git push -u origin main
```

---

## Best Practices

### Commit Messages

Write messages in imperative mood, 50 chars max on the first line. Explain *why*, not *what*.

```
# Good
Add user authentication with JWT tokens

Implement JWT-based auth to secure API endpoints.
Includes token generation, validation, and refresh logic.
Fixes #42

# Bad
fix stuff / updated code / changes
```

### Branch Naming

Use consistent, descriptive prefixes:

```
feature/user-authentication
bugfix/login-validation
hotfix/database-crash
docs/api-documentation
```

### Daily Habits

- **Pull before you push** — always sync with the remote first
- **Commit often** — small, focused commits are easier to review and revert
- **Make small PRs** — easier to review, faster to merge
- **Use .gitignore** — exclude `.env`, `node_modules/`, build artifacts, and IDE files

---

## Files in This Repository

```
├── README.md               # This file — overview and guide
├── COMMANDS-REFERENCE.md   # Quick command lookup (all commands)
├── TROUBLESHOOTING.md      # Common issues & solutions
└── examples/
    ├── basic-workflow.sh               # Simple commit/push/pull
    ├── feature-branch-workflow.sh      # Feature branch example
    └── conflict-resolution.md          # Resolving conflicts example
```

---

## How to Use This Guide

### Beginners
1. Read this README for an overview
2. Practice locally — create dummy repos, make commits
3. Work through the examples in the `examples/` folder

### Teams (2-Day Sprint)
1. Day 1 morning — discuss Git concepts, set up identities
2. Day 1 afternoon — hands-on commits and GitHub setup
3. Day 2 morning — branching, merging, conflict resolution
4. Day 2 afternoon — pull requests, code review, workflows

### Experienced Developers
- [COMMANDS-REFERENCE.md](COMMANDS-REFERENCE.md) — quick command lookup
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — solutions to common and complex problems

---

## FAQ

**Q: Is Git the same as GitHub?**
No. Git is the version control software that runs locally. GitHub is a web platform that hosts Git repositories online.

**Q: How often should I commit?**
Commit whenever you finish a logical unit of work — this could be multiple times per hour.

**Q: What should I put in .gitignore?**
Secrets (`.env`), dependencies (`node_modules/`), build artifacts (`dist/`, `build/`), IDE settings (`.vscode/`, `.idea/`), and OS files (`.DS_Store`, `Thumbs.db`).

**Q: Can I change a commit message after pushing?**
Yes, with `git commit --amend`, but only before the branch is merged. You'll need to force-push (`-f`). Avoid this on shared branches.

**Q: How do I recover a deleted branch?**
Use `git reflog` to find the last commit on that branch, then `git checkout -b recovered <hash>`.

**Q: Should I use rebase or merge?**
Use `merge` on shared branches (main/develop). Use `rebase` on your own feature branches before opening a PR to keep history linear.

---

## Learning Resources

- **Official Git Docs** — https://git-scm.com/doc
- **Pro Git Book** — https://git-scm.com/book/en/v2 (free, online)
- **Interactive Git Learning** — https://learngitbranching.js.org/
- **Git Visualization** — https://git-school.github.io/visualizing-git/
- **GitHub Guides** — https://guides.github.com/

---

## Contributing

Found an error or have a better explanation?

1. Fork this repository
2. Create a branch: `git checkout -b feature/improvement`
3. Commit your changes: `git commit -m "Improve explanation of branching"`
4. Push and open a Pull Request

---

## License

Open educational material. Free to use for learning, training, team documentation, or modification. Attribution appreciated but not required.

---

**Happy Git-ing! May your commits be atomic and your merges be conflict-free.**
