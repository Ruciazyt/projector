export type CloneLogStream = 'stdout' | 'stderr'

export interface CloneGithubRepoLogEvent {
  requestId: string
  stream: CloneLogStream
  line: string
}

export interface CloneGithubRepoRequest {
  requestId: string
  repoUrl: string
  parentDir: string
}

export interface CloneGithubRepoResult {
  success: boolean
  repoPath?: string
  error?: string
}


