import type { Project } from '../projector/types'
import { getSshConfig } from './ssh-config-manager'

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

  const { host, user, port, remotePath, sshConfigName, savedConfigId } = project.remoteConfig

  let sshTarget: string

  if (savedConfigId) {
    const savedConfig = getSshConfig(savedConfigId)
    if (savedConfig) {
      if (savedConfig.sshConfigName) {
        sshTarget = savedConfig.sshConfigName
      } else {
        const configUser = savedConfig.user || user
        const configPort = savedConfig.port
        if (configPort && configPort !== 22) {
          sshTarget = configUser
            ? `${configUser}@${savedConfig.host}:${configPort}`
            : `${savedConfig.host}:${configPort}`
        } else {
          sshTarget = configUser ? `${configUser}@${savedConfig.host}` : savedConfig.host
        }
      }
    } else {
      sshTarget = sshConfigName || (user ? `${user}@${host}` : host)
      if (port && port !== 22 && !sshConfigName) {
        sshTarget = user ? `${user}@${host}:${port}` : `${host}:${port}`
      }
    }
  } else if (sshConfigName) {
    sshTarget = sshConfigName
  } else {
    sshTarget = user ? `${user}@${host}` : host
    if (port && port !== 22) {
      sshTarget = user ? `${user}@${host}:${port}` : `${host}:${port}`
    }
  }

  const remoteArg = `ssh-remote+${sshTarget}`
  const args = ['--remote', remoteArg, remotePath]
  return { cmd: command, args }
}
