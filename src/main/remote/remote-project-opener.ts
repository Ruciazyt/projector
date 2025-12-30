import type { Project } from '../projector/types'
import { buildSshTarget } from './ssh-utils'

/**
 * 构建远程项目打开命令
 */
export function buildRemoteCommand(
  project: Project,
  command: string
): { cmd: string; args: string[] } {
  if (project.type !== 'remote' || !project.remoteConfig) {
    throw new Error('Project is not a remote project')
  }

  const { remotePath } = project.remoteConfig
  const sshTarget = buildSshTarget(project.remoteConfig)

  const remoteArg = `ssh-remote+${sshTarget}`
  const args = ['--remote', remoteArg, remotePath]
  return { cmd: command, args }
}
