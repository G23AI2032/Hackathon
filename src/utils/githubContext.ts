import { Octokit } from '@octokit/rest';
import type { GitHubContext } from '@/types/llm';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export { GitHubContext };

export async function fetchGitHubContext(query: string): Promise<GitHubContext> {
  try {
    // Get repository info from environment
    const repo = process.env.GITHUB_REPOSITORY || '';
    const [owner, repoName] = repo.split('/');
    
    // Get current branch and commit
    const { data: branchData } = await octokit.repos.getBranch({
      owner,
      repo: repoName,
      branch: 'main'
    });

    // Search code based on query
    const { data: codeResults } = await octokit.search.code({
      q: `${query} repo:${repo}`,
      per_page: 1
    });

    // Get code content if available
    let codeContext = '';
    if (codeResults.items.length > 0) {
      const { data: fileContent } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: codeResults.items[0].path,
        ref: branchData.commit.sha
      });

      if ('content' in fileContent) {
        codeContext = Buffer.from(fileContent.content, 'base64').toString();
      }
    }

    // Search for related issues
    const { data: issues } = await octokit.search.issuesAndPullRequests({
      q: `${query} repo:${repo} state:open`,
      per_page: 3
    });

    return {
      repository: repo,
      branch: branchData.name,
      commitHash: branchData.commit.sha,
      codeContext,
      relatedIssues: issues.items.map((issue: { number: number }) => issue.number.toString())
    };

  } catch (error) {
    console.error('Error fetching GitHub context:', error);
    return {
      repository: '',
      branch: '',
      commitHash: '',
      codeContext: '',
      relatedIssues: []
    };
  }
}
