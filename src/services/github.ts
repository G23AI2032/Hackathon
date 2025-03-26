import axios from 'axios';

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

export class GitHubService {
  async searchGitHub(query: string): Promise<GitHubCommit[]> {
    try {
      const response = await fetch('/api/github/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to process GitHub search');
      }

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error in GitHub search:', error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();
