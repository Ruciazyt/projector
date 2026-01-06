# Projector

An elegant Electron project launcher and management tool that helps you quickly manage and open development projects.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

[中文文档](./README.md)

## 🤔 What problem does it solve?

As a developer, do you often encounter these frustrations?

- **Tedious Project Switching**: Handling multiple projects simultaneously and switching between them frequently requires repetitive steps: Open IDE -> Open Folder -> Find Path.
- **Forgetting Project Locations**: Source code is scattered across different corners of the disk (`~/work`, `~/personal`, `D:\github`...), making it easy to forget where specific projects are located over time.
- **Fragmented Environment**: Some projects are suitable for VS Code, others for Cursor; some are local, others are on remote servers (SSH), lacking a unified entry point for management.
- **Efficiency Loss**: Every day before starting work, you have to reopen a bunch of windows from yesterday based on memory.

**Projector** was born for this. It provides an elegant, unified "command center" to help you aggregate and manage all local and remote projects. No matter where they are, you can **launch them instantly**, getting your development environment ready in seconds.

## ✨ Features

### 🎯 Core Functions

- **Project Management**: Easily add, manage, and delete project records.
- **Smart Detection**: Automatically identify project types and match corresponding IDEs (Cursor / VS Code).
- **Quick Open**: One-click to open projects, supporting custom default editors.
- **Recent Projects**: Sidebar displays recently opened projects for quick access.
- **Batch Scan**: Scan entire directories to automatically discover all projects.
- **GitHub Integration**: Clone public repositories directly from GitHub.
- **SSH Remote Support**: Configure SSH remote hosts to easily connect and manage remote projects.

### 🎨 User Experience

- **Light/Dark Theme**: Supports switching between light and dark themes to protect your eyes.
- **Multi-language Support**: Built-in English and Chinese switching to meet different language needs.
- **Batch Operations**: Support batch selection and deletion of projects for more efficient management.
- **Elegant Animations**: Smooth interface animations execution to improve user experience.
- **Responsive Design**: Adapts to different screen sizes.
- **Search Function**: Quickly search by project name, path, and description.
- **Collapsible Sidebar**: Customize interface layout to save space.

### 🛠️ Technical Features

- **Cross-Platform**: Supports Windows, macOS, and Linux.
- **Modern UI**: Designed with Vue 3 and modern CSS.
- **Type Safety**: Full TypeScript support.
- **High Performance**: Built on Electron and Vite.

## 📸 Screenshots

### Main Interface (Light Theme)
<div align="center">
  <img src="./docs/images/screen_short.png" alt="Main Interface - Light Theme" width="800" />
</div>

### Add Project
<div align="center">
  <img src="./docs/images/add_project.png" alt="Add Project" width="800" />
</div>

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd projector

# Install dependencies
yarn install
# OR
npm install
```

### Development

```bash
# Start development server
yarn dev
# OR
npm run dev
```

### Build

```bash
# Build application (without packaging)
yarn build

# Build for Windows
yarn build:win

# Build for macOS
yarn build:mac

# Build for Linux
yarn build:linux
```

## 📖 User Guide

### Adding Projects

1. **Add Local Project**
   - Click the "Add Project" button on the toolbar.
   - Select the project directory.
   - The application will automatically detect the project type and set the default IDE.

2. **Add SSH Remote Project**
   - Click "Add Project" → "SSH Remote Connection".
   - Enter SSH connection information (host, port, user, etc.) or select an existing SSH configuration.
   - After a successful connection, browse and select the remote directory to add as a project.

3. **Add from GitHub**
   - Click "Add Project" → "Add from GitHub".
   - Enter the HTTPS URL of the GitHub repository.
   - Select the parent directory to clone into.
   - Click "Start Pulling" and wait for cloning to complete.

4. **Batch Scan**
   - Click the "Scan Directory" button on the toolbar.
   - Select a parent directory containing multiple projects.
   - The application will automatically discover all projects and add them to the list.

### Opening Projects

- **Quick Open**: Click the "Open" button on the project card to open with the default IDE.
- **Select IDE**: Click the dropdown arrow next to the "Open" button to select other IDEs.
- **Recent Projects**: Click recently opened projects in the left sidebar for quick access.

### Managing Projects

- **Search Projects**: Enter keywords in the top search box to filter the project list in real-time.
- **Batch Operations**: Click the "Batch Operation" button to enter selection mode, allowing you to delete multiple projects at once.
- **Delete Project**: Click the delete button on the project card (only deletes the record in the app, does not delete files from disk).
- **Set Default IDE**: Select an IDE from the dropdown menu, and it will be used next time.

### Theme Switching

Click the theme switch button on the right side of the toolbar to switch between light and dark themes. Theme preferences are automatically saved.

## 🏗️ Tech Stack

- **Framework**: Electron 39.2.6
- **Frontend**: Vue 3.5.25 (Composition API)
- **Build Tool**: electron-vite 5.0.0
- **Language**: TypeScript 5.9.3
- **Styles**: CSS3 (CSS Variables)
- **Icons**: vue-icons-plus
- **Packaging**: electron-builder 26.0.12

## 📁 Project Structure

```
projector/
├── src/
│   ├── main/              # Main process code
│   │   ├── core/          # Core functions (storage, IPC handling)
│   │   ├── projector/     # Project-related logic
│   │   ├── remote/        # Remote development support (SSH)
│   │   └── github/        # GitHub integration
│   ├── renderer/          # Renderer process code
│   │   └── src/
│   │       ├── components/ # Vue components
│   │       ├── composables/# Composables
│   │       ├── i18n/       # Internationalization resources
│   │       └── assets/     # Static assets
│   ├── preload/           # Preload scripts
│   └── shared/            # Shared code
├── build/                 # Build resources
├── resources/             # application resources
├── out/                   # Compile output
└── dist/                  # Packaging output
```

## 🔧 Configuration

### Supported IDEs

Currently supports the following IDEs:

- **Cursor**: Automatically detects `.cursor` directory.
- **VS Code**: Automatically detects `.vscode` directory.

> Easily expandable to support more IDEs in the future.

### Data Storage

- **Project Data**: `%APPDATA%/projector/projects.json` (Windows)
- **User Settings**: `%APPDATA%/projector/settings.json` (Windows)

## 🛠️ Development

### Code Consistency

```bash
# Type check
yarn typecheck

# Code formatting
yarn format

# Linting
yarn lint
```

### TypeScript Configuration

The project uses TypeScript's composite mode, containing the following configuration files:

- `tsconfig.json`: Root configuration
- `tsconfig.node.json`: Main process and preload scripts
- `tsconfig.web.json`: Renderer process
- `tsconfig.shared.json`: Shared code

## 🤝 Contribution

Issues and Pull Requests are welcome!

## 📝 License

MIT License

## 🙏 Acknowledgements

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [electron-vite](https://github.com/alex8088/electron-vite)
- [vue-icons-plus](https://www.npmjs.com/package/vue-icons-plus)

---

**Enjoy an efficient development experience!** 🚀
