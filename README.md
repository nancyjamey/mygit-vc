# MyGit - A Simple Version Control System in Node.js

**MyGit** is a simplified, custom version control system (VCS) built using Node.js. It mimics the basic functionality of Git with commands like `init`, `add`,  `branch`,`commit`, `log`, and `history`, allowing users to initialize a repository, add files, commit changes, and view logs and diffs.

This project was created to demonstrate how a simple VCS can be implemented in Node.js, using native libraries such as `fs`, `crypto`, and `path` for file system operations and hashing.

---

## Features

- **Initialize a Git-like repository** using `init`.
- **Add files to the repository** with `add <file>`.
- **Commit changes** with a custom commit message using `commit <message>`.
- **View commit history** using `history`.
- **checkout to a new branch** using `checkouts`.
- **Show the diff of a specific commit** with `show <commitHash>`.

---

## Project Setup

To run this project, follow these steps:

### Prerequisites

- Node.js (version 14 or higher) must be installed on your machine.
- `npm` or `yarn` for managing dependencies.

### 1. Clone the Repository

Clone this repository to your local machine:

git clone <repository-url>
cd <repository-directory>

 How It Works
The MyGit class is the core of this implementation. It contains the following main methods:

1. init()
Initializes a new repository. It creates the .mygit folder with the following structure:

objects/: Where object data (like files and commits) will be stored.
ref/heads/: Stores branch information.
index: A JSON file to track added files.
HEAD: Points to the current branch.
2. add(file)
Adds a file to the repository. It computes a SHA-1 hash of the file’s contents and stores it in the objects/ directory with the hash as the filename. The file is also added to the index file.

3. commit (message)
Commits changes to the repository. It generates a tree structure of added files and creates a commit object with the following data:

timestamp: The current timestamp.
message: The commit message.
rootHash: The hash of the tree structure representing the committed files.
The commit object is stored in the objects/ directory, and the HEAD file is updated to point to the new commit.

4. History()
Displays the commit history for the current branch. It reads the commit hashes from the HEAD and traverses the history, showing each commit's data and message.

5. show(commitHash)
Shows the diff for a specific commit hash. This method compares the current file state to the previous commit (if any) and outputs a diff of the changes.

