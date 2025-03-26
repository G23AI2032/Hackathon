import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    // Use environment variables for GitHub configuration
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      throw new Error('Missing required GitHub configuration');
    }
    
    // Search commits by default
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', await response.text());
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error processing GitHub search:', error);
    return NextResponse.json(
      { error: 'Failed to process GitHub search' },
      { status: 500 }
    );
  }
}
