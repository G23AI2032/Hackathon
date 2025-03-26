export interface LLMResponse {
  content: string;
  confidence: number;
  suggestedActions: string[];
  githubContext?: GitHubContext;
}

export interface GitHubContext {
  repository: string;
  branch: string;
  commitHash: string;
  codeContext: string;
  relatedIssues: string[];
}
