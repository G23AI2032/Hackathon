import axios from 'axios';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee: {
      displayName: string;
    } | null;
    created: string;
  };
}

export class JiraService {
  private config: JiraConfig;
  private auth: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }

  private getHeaders() {
    return {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async searchIssues(query: string): Promise<JiraIssue[]> {
    try {
      // Convert natural language to JQL
      let jql = query.toLowerCase();
      
      // Handle common natural language patterns with more precise matching
      if (jql.includes('not assigned') || jql.includes('unassigned') || jql.includes('no assignee')) {
        jql = 'project = KAN AND assignee is EMPTY ORDER BY created DESC';
      } else if (jql.includes('assigned')) {
        jql = 'project = KAN AND assignee is not EMPTY ORDER BY created DESC';
      } else if (jql.includes('my issues') || jql.includes('assigned to me') || jql.includes('my tasks')) {
        jql = 'project = KAN AND assignee = currentUser() ORDER BY created DESC';
      } else if (jql.includes('high priority') || jql.includes('urgent')) {
        jql = 'project = KAN AND priority = High ORDER BY created DESC';
      } else if (jql.includes('in progress') || jql.includes('working on')) {
        jql = 'project = KAN AND status = "In Progress" ORDER BY created DESC';
      } else if (jql.includes('all issues') || jql.includes('all jira') || jql.includes('show all') || jql.includes('list all')) {
        jql = 'project = KAN ORDER BY created DESC';
      } else if (jql.includes('jira stories') || jql.includes('show stories') || jql.includes('list stories')) {
        jql = 'project = KAN AND issuetype = Story ORDER BY created DESC';
      } else if (jql.includes('bugs') || jql.includes('show bugs') || jql.includes('list bugs') || jql.includes('issues')) {
        jql = 'project = KAN AND issuetype = Bug ORDER BY created DESC';
      } else if (jql.includes('tasks') || jql.includes('show tasks') || jql.includes('list tasks')) {
        jql = 'project = KAN AND issuetype = Task ORDER BY created DESC';
      } else if (jql.includes('recent') || jql.includes('latest')) {
        jql = 'project = KAN ORDER BY created DESC';
      } else if (jql.includes('open') || jql.includes('active')) {
        jql = 'project = KAN AND status not in (Closed, Resolved) ORDER BY created DESC';
      } else if (jql.includes('closed') || jql.includes('resolved')) {
        jql = 'project = KAN AND status in (Closed, Resolved) ORDER BY created DESC';
      } else if (jql.includes('blocked')) {
        jql = 'project = KAN AND status = Blocked ORDER BY created DESC';
      } else if (jql.includes('blocker')) {
        jql = 'project = KAN AND priority = Highest ORDER BY created DESC';
      } else {
        // For any other query, search in summary and description with exact matching
        const searchTerms = query.split(' ').filter(term => term.length > 2);
        if (searchTerms.length > 0) {
          const searchQuery = searchTerms.map(term => `"${term}"`).join(' ');
          jql = `project = KAN AND (summary ~ "${searchQuery}" OR description ~ "${searchQuery}") ORDER BY created DESC`;
        } else {
          // If query is too short, return all issues
          jql = 'project = KAN ORDER BY created DESC';
        }
      }

      console.log('Converted query to JQL:', jql);

      const response = await axios.get(
        `${this.config.baseUrl}/rest/api/3/search`,
        {
          headers: this.getHeaders(),
          params: {
            jql: jql,
            maxResults: 50,
            fields: 'summary,status,priority,assignee,created,issuetype,description'
          }
        }
      );

      console.log('Jira API Response:', response.data);
      
      if (!response.data.issues || !Array.isArray(response.data.issues)) {
        console.error('Invalid response format:', response.data);
        return [];
      }

      // Log the number of issues found
      console.log(`Found ${response.data.issues.length} issues`);
      
      return response.data.issues;
    } catch (error: any) {
      console.error('Jira API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to fetch Jira issues');
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/rest/api/3/issue/${issueKey}`,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Jira API Error:', error.response?.data);
      throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to fetch Jira issue');
    }
  }

  async createIssue(data: any): Promise<JiraIssue> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/rest/api/3/issue`,
        data,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Jira API Error:', error.response?.data);
      throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to create Jira issue');
    }
  }

  async updateIssue(issueKey: string, data: any): Promise<JiraIssue> {
    try {
      const response = await axios.put(
        `${this.config.baseUrl}/rest/api/3/issue/${issueKey}`,
        data,
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Jira API Error:', error.response?.data);
      throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to update Jira issue');
    }
  }
}

// Create a singleton instance
const jiraService = new JiraService({
  baseUrl: process.env.NEXT_PUBLIC_JIRA_BASE_URL || '',
  email: process.env.JIRA_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
});

export default jiraService; 