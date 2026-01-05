export default {
  common: {
    cancel: '取消',
    delete: '删除',
    search: '搜索',
    back: '返回',
    unknown: '未知错误',
    select: '选择',
    close: '关闭',
    copy: '复制',
    clear: '清空',
    loading: '加载中...'
  },
  project: {
    new: '新建项目',
    searchPlaceholder: '搜索项目...',
    noProjects: '没有找到项目',
    failedToOpen: '打开项目失败',
    action: {
      open: '打开',
      selectIde: '选择编辑器',
      remove: '删除记录'
    },
    error: {
      open: '无法打开项目: {error}',
      openGeneric: '打开项目失败',
      setIde: '设置默认编辑器失败',
      removeNotFound: '删除失败：未找到该记录（可能已被删除）',
      removeGeneric: '删除失败'
    },
    confirm: {
      remove: '删除项目记录？\n\n{name}\n{path}\n\n（仅删除应用内记录，不会删除磁盘目录）'
    }
  },
  recent: {
    title: '最近使用',
    empty: '暂无最近使用的项目'
  },
  sidebar: {
    collapse: '收起侧边栏'
  },
  batch: {
    manage: '批量管理',
    exit: '退出批量模式',
    selectAll: '全选',
    selected: '已选择 {count} 项',
    deleteSelected: '删除选中'
  },
  theme: {
    toggle: '切换主题',
    language: '切换语言'
  },
  modal: {
    addProject: {
      title: '添加项目',
      subtitle: '请选择添加方式',
      local: '选择本地目录',
      scanLocal: '扫描本地目录',
      github: '从 GitHub 添加',
      remote: '远程服务器',
      error: {
        noConfig: '无法添加项目：该目录不包含编辑器配置文件或 .git',
        failed: '添加项目失败: {error}',
        cloneFail: '拉取失败: {error}',
        cloneSuccessButAddFail: '拉取成功，但无法添加到列表（该目录不被识别为项目）',
        cloneFailGeneric: '拉取失败'
      },
      scan: {
        scanning: '正在扫描目录...',
        success: '发现了 {count} 个项目',
        none: '该目录下未发现项目'
      }
    },
    github: {
      title: '从 GitHub 添加',
      subtitle: '仅支持公开仓库 HTTPS 地址',
      repoUrl: '仓库地址',
      repoPlaceholder: 'https://github.com/owner/repo',
      parentDir: '父目录',
      selectDirPlaceholder: '请选择父目录',
      start: '开始拉取',
      cloning: '拉取中...',
      alert: {
        noUrl: '请输入 GitHub 仓库地址',
        noDir: '请选择父目录',
        selectDirFail: '选择父目录失败'
      }
    },
    log: {
      title: '拉取日志',
      subtitle: {
        running: '正在拉取中，窗口可关闭，拉取会继续',
        finished: '拉取已结束'
      },
      empty: '暂无输出',
      alert: {
        copyFail: '复制失败（可能缺少权限）'
      }
    },
    remote: {
      title: {
        add: '添加远程项目',
        browse: '选择远程目录'
      },
      subtitle: {
        add: '通过 SSH 连接远程服务器上的项目',
        browse: '浏览并选择项目所在目录'
      },
      scanning: '正在扫描: {path}',
      up: '⬆️ 上一级',
      emptyDir: '空目录',
      selectThis: '选择此目录',
      connectionType: '连接方式',
      useSaved: '使用已保存的 SSH 配置',
      selectConfig: '请选择配置',
      host: '主机地址',
      user: '用户名',
      port: '端口（可选，默认 22）',
      sshConfigHost: 'SSH Config Host（可选）',
      saveConfig: '保存此配置以便下次使用',
      configName: '配置名称，如：生产服务器',
      remotePath: '远程项目路径',
      browse: '浏览',
      scanAndAdd: '扫描并添加',
      scanningBtn: '扫描中...',
      directAdd: '直接添加',
      adding: '添加中...',
      alert: {
        noHost: '请输入主机地址',
        noUser: '请输入用户名',
        noConfigName: '请输入配置名称',
        noPath: '请输入远程项目路径',
        noProjects: '未发现任何项目',
        addFail: '添加远程项目失败',
        sshConfigNotFound: '选择的 SSH 配置不存在'
      }
    }
  }
}
