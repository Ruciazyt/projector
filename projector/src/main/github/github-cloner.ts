import { existsSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import type { WebContents } from 'electron'
import type { CloneGithubRepoLogEvent, CloneGithubRepoRequest, CloneGithubRepoResult, CloneLogStream } from './types'

function extractRepoNameFromGithubUrl(repoUrl: string): { ok: true; repoName: string } | { ok: false; error: string } {
  let url: URL
  try {
    url = new URL(repoUrl)
  } catch {
    return { ok: false, error: '无效的 URL' }
  }

  if (url.protocol !== 'https:') {
    return { ok: false, error: '仅支持 https GitHub 地址' }
  }
  if (url.hostname !== 'github.com') {
    return { ok: false, error: '仅支持 github.com 的公开仓库' }
  }

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) {
    return { ok: false, error: 'URL 格式应为 https://github.com/owner/repo' }
  }

  const repo = parts[1].replace(/\.git$/i, '')
  if (!repo) {
    return { ok: false, error: '无法解析仓库名' }
  }

  return { ok: true, repoName: repo }
}

function pushLine(webContents: WebContents, requestId: string, stream: CloneLogStream, line: string): void {
  const payload: CloneGithubRepoLogEvent = { requestId, stream, line }
  webContents.send('cloneGithubRepo:log', payload)
}

function attachLineStream(
  webContents: WebContents,
  requestId: string,
  stream: CloneLogStream,
  chunk: Buffer | string,
  state: { buf: string; tail: string[] }
): void {
  const text = String(chunk).replace(/\r/g, '\n')
  state.buf += text

  const lines = state.buf.split('\n')
  state.buf = lines.pop() ?? ''
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line) continue
    state.tail.push(`[${stream}] ${line}`)
    if (state.tail.length > 200) state.tail.shift()
    pushLine(webContents, requestId, stream, line)
  }
}

function flushLineBuffer(
  webContents: WebContents,
  requestId: string,
  stream: CloneLogStream,
  state: { buf: string; tail: string[] }
): void {
  const line = state.buf.trimEnd()
  if (!line) return
  state.tail.push(`[${stream}] ${line}`)
  if (state.tail.length > 200) state.tail.shift()
  pushLine(webContents, requestId, stream, line)
}

function runGitCloneWithLogs(
  webContents: WebContents,
  requestId: string,
  repoUrl: string,
  parentDir: string,
  targetDir: string
): Promise<CloneGithubRepoResult> {
  return new Promise<CloneGithubRepoResult>((resolve) => {
    const tail: string[] = []
    const outState = { buf: '', tail }
    const errState = { buf: '', tail }

    let settled = false
    const finish = (result: CloneGithubRepoResult): void => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const child = spawn('git', ['clone', '--progress', repoUrl, targetDir], {
      cwd: parentDir,
      windowsHide: true
    })

    child.on('error', (err) => {
      const msg =
        (err as NodeJS.ErrnoException).code === 'ENOENT' ? '未检测到 git（请安装并加入 PATH）' : err.message
      pushLine(webContents, requestId, 'stderr', msg)
      finish({ success: false, error: msg })
    })

    child.stdout.on('data', (chunk) => attachLineStream(webContents, requestId, 'stdout', chunk, outState))
    child.stderr.on('data', (chunk) => attachLineStream(webContents, requestId, 'stderr', chunk, errState))

    child.on('close', (code) => {
      flushLineBuffer(webContents, requestId, 'stdout', outState)
      flushLineBuffer(webContents, requestId, 'stderr', errState)

      if (code === 0) {
        pushLine(webContents, requestId, 'stdout', 'Clone completed.')
        finish({ success: true, repoPath: targetDir })
        return
      }

      const summary = tail.slice(-20).join('\n')
      finish({ success: false, error: `git clone 失败（exit code ${code ?? 'unknown'}）\n${summary}` })
    })
  })
}

export async function cloneGithubRepo(webContents: WebContents, req: CloneGithubRepoRequest): Promise<CloneGithubRepoResult> {
  const { requestId, repoUrl, parentDir } = req

  if (!existsSync(parentDir)) {
    return { success: false, error: '父目录不存在' }
  }

  const parsed = extractRepoNameFromGithubUrl(repoUrl)
  if (!parsed.ok) {
    return { success: false, error: parsed.error }
  }

  const targetDir = join(parentDir, parsed.repoName)
  if (existsSync(targetDir)) {
    return { success: false, error: `目标目录已存在：${targetDir}` }
  }

  pushLine(webContents, requestId, 'stdout', `Cloning into '${targetDir}' ...`)

  return await runGitCloneWithLogs(webContents, requestId, repoUrl, parentDir, targetDir)
}


