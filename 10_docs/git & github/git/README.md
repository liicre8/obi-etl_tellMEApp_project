# Git Quick Start Guide

Version control is essential for any developer. This guide introduces basic Git commands to help you get started with tracking, sharing, and managing your code efficiently.

---

## 1. Install Git

Download Git from the official website:  
👉 [https://git-scm.com](https://git-scm.com)

### Configure Git (only once)

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## 2. Initialize or Clone a Repository

### Initialize a new repository in your current folder:

```bash
git init
```

### Clone an existing remote repository:

```bash
git clone <repository_url>
```

---

## 3. Stage and Commit Changes

### Stage a specific file:

```bash
git add <file_name>
```

### Stage all files:

```bash
git add .
```

### Commit staged changes:

```bash
git commit -m "Your commit message"
```

---

## 4. Branching

Work on features or fixes in isolation without affecting the `main` codebase.

### Create a new branch:

```bash
git branch <branch_name>
```

### Switch to a branch:

```bash
git checkout <branch_name>
```

### Create and switch to a branch in one command:

```bash
git checkout -b <new_branch>
```

### List all local branches:

```bash
git branch
```

---

## 5. Check Status

### View changes in the working directory and staging area:

```bash
git status
```

---

## 6. Push and Pull

### Push local commits to a remote repository:

```bash
git push <remote> <branch>
# Example: git push origin main
```

### Pull updates from a remote repository:

```bash
git pull <remote> <branch>
# Example: git pull origin main
```

---

## Final Note

> Start with Git — because real devs don’t email code.
