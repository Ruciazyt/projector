/**
 * 生成项目ID
 */
export function generateProjectId(path: string): string {
  return `${Date.now()}-${Buffer.from(path).toString('base64').slice(0, 8)}`
}

/**
 * 从路径生成项目名称
 */
export function generateProjectName(path: string): string {
  const pathParts = path.split(/[/\\]/)
  return pathParts[pathParts.length - 1] || 'Untitled Project'
}


