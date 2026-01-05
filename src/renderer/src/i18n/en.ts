export default {
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    search: 'Search',
    back: 'Back',
    unknown: 'Unknown Error',
    select: 'Select',
    close: 'Close',
    copy: 'Copy',
    clear: 'Clear',
    loading: 'Loading...'
  },
  project: {
    new: 'New Project',
    searchPlaceholder: 'Search projects...',
    noProjects: 'No projects found',
    failedToOpen: 'Failed to open project',
    action: {
      open: 'Open',
      selectIde: 'Select Editor',
      remove: 'Remove Record'
    },
    error: {
      open: 'Failed to open project: {error}',
      openGeneric: 'Failed to open project',
      setIde: 'Failed to set default editor',
      removeNotFound: 'Remove failed: Record not found (maybe already removed)',
      removeGeneric: 'Remove failed'
    },
    confirm: {
      remove: 'Remove project record?\n\n{name}\n{path}\n\n(Only removes from app, not from disk)'
    }
  },
  recent: {
    title: 'Recent',
    empty: 'No recent projects'
  },
  sidebar: {
    collapse: 'Collapse Sidebar'
  },
  batch: {
    manage: 'Batch Manage',
    exit: 'Exit Batch Mode',
    selectAll: 'Select All',
    selected: 'Selected {count} items',
    deleteSelected: 'Delete Selected'
  },
  theme: {
    toggle: 'Toggle Theme',
    language: 'Change Language'
  },
  modal: {
    addProject: {
      title: 'Add Project',
      subtitle: 'Choose how to add',
      local: 'Select Local Directory',
      scanLocal: 'Scan Local Directory',
      github: 'Clone from GitHub',
      remote: 'Remote Server',
      error: {
        noConfig: 'Cannot add project: Directory does not contain editor config or .git',
        failed: 'Failed to add project: {error}',
        cloneFail: 'Clone failed: {error}',
        cloneSuccessButAddFail: 'Clone successful but failed to add to list',
        cloneFailGeneric: 'Clone failed'
      },
      scan: {
        scanning: 'Scanning directory...',
        success: 'Found {count} projects',
        none: 'No projects found in this directory'
      }
    },
    github: {
      title: 'Clone from GitHub',
      subtitle: 'Only supports public HTTPS repositories',
      repoUrl: 'Repository URL',
      repoPlaceholder: 'https://github.com/owner/repo',
      parentDir: 'Parent Directory',
      selectDirPlaceholder: 'Select Parent Directory',
      start: 'Start Clone',
      cloning: 'Cloning...',
      alert: {
        noUrl: 'Please enter GitHub repository URL',
        noDir: 'Please select parent directory',
        selectDirFail: 'Failed to choose parent dir'
      }
    },
    log: {
      title: 'Clone Logs',
      subtitle: {
        running: 'Cloning in progress, window can be closed',
        finished: 'Cloning finished'
      },
      empty: 'No output',
      alert: {
        copyFail: 'Copy failed (permission denied?)'
      }
    },
    remote: {
      title: {
        add: 'Add Remote Project',
        browse: 'Browse Remote Directory'
      },
      subtitle: {
        add: 'Connect via SSH',
        browse: 'Select project directory'
      },
      scanning: 'Scanning: {path}',
      up: 'Up',
      emptyDir: 'Empty Directory',
      selectThis: 'Select this directory',
      connectionType: 'Connection Type',
      useSaved: 'Use saved SSH config',
      selectConfig: 'Select Config',
      host: 'Host',
      user: 'User',
      port: 'Port (Optional, default 22)',
      sshConfigHost: 'SSH Config Host (Optional)',
      saveConfig: 'Save this config',
      configName: 'Config Name',
      remotePath: 'Remote Project Path',
      browse: 'Browse',
      scanAndAdd: 'Scan and Add',
      scanningBtn: 'Scanning...',
      directAdd: 'Add Directly',
      adding: 'Adding...',
      alert: {
        noHost: 'Enter host',
        noUser: 'Enter user',
        noConfigName: 'Enter config name',
        noPath: 'Enter remote path',
        noProjects: 'No projects found',
        addFail: 'Failed to add remote project',
        sshConfigNotFound: 'SSH config not found'
      }
    }
  }
}
