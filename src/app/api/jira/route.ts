import { NextResponse } from 'next/server';
import { JiraService } from '@/services/jiraService';

const jiraService = new JiraService({
  baseUrl: process.env.NEXT_PUBLIC_JIRA_BASE_URL || '',
  email: process.env.JIRA_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || ''
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search action' },
            { status: 400 }
          );
        }
        try {
          const issues = await jiraService.searchIssues(query);
          return NextResponse.json(issues);
        } catch (error: any) {
          console.error('Jira search error:', error);
          return NextResponse.json(
            { error: error.message || 'Failed to search Jira issues' },
            { status: 500 }
          );
        }

      case 'issue':
        const issueKey = searchParams.get('issueKey');
        if (!issueKey) {
          return NextResponse.json(
            { error: 'Issue key is required for issue action' },
            { status: 400 }
          );
        }
        try {
          const issue = await jiraService.getIssue(issueKey);
          return NextResponse.json(issue);
        } catch (error: any) {
          console.error('Jira get issue error:', error);
          return NextResponse.json(
            { error: error.message || 'Failed to fetch Jira issue' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Jira API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        if (!data) {
          return NextResponse.json(
            { error: 'Data is required for create action' },
            { status: 400 }
          );
        }
        try {
          const issue = await jiraService.createIssue(data);
          return NextResponse.json(issue);
        } catch (error: any) {
          console.error('Jira create error:', error);
          return NextResponse.json(
            { error: error.message || 'Failed to create Jira issue' },
            { status: 500 }
          );
        }

      case 'update':
        const { issueKey, updateData } = data;
        if (!issueKey || !updateData) {
          return NextResponse.json(
            { error: 'Issue key and update data are required for update action' },
            { status: 400 }
          );
        }
        try {
          const issue = await jiraService.updateIssue(issueKey, updateData);
          return NextResponse.json(issue);
        } catch (error: any) {
          console.error('Jira update error:', error);
          return NextResponse.json(
            { error: error.message || 'Failed to update Jira issue' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Jira API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 