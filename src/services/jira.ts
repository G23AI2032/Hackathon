export type JiraIssue = {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
  };
};

class JiraService {
  private baseUrl: string;
  private token: string;
  private project: string;

  constructor() {
    this.baseUrl = process.env.JIRA_API_URL || '';
    this.token = process.env.JIRA_API_TOKEN || '';
    this.project = process.env.JIRA_PROJECT_KEY || '';
  }

  async processQuery(query: string): Promise<string> {
    try {
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('issue') || queryLower.includes('ticket')) {
        const issues = await this.searchIssues(query);
        return this.formatIssues(issues);
      }
      
      if (queryLower.includes('status') || queryLower.includes('progress')) {
        const issues = await this.getProjectStatus();
        return this.formatProjectStatus(issues);
      }

      // Default to recent issues
      const issues = await this.getRecentIssues();
      return this.formatIssues(issues);
    } catch (error: any) {
      console.error('Error processing JIRA query:', error);
      return `⚠️ JIRA Query Error:\n\n` +
        `I encountered an error while processing your JIRA query.\n` +
        `This could be because:\n` +
        `• The JIRA instance is not accessible\n` +
        `• The authentication token is invalid\n` +
        `• The project key is incorrect\n\n` +
        `Error details: ${error.message}`;
    }
  }

  public async searchIssues(query: string): Promise<JiraIssue[]> {
    try {
      // Mock data for testing
      const mockIssues: JiraIssue[] = [
        {
          key: 'KAN-4',
          fields: {
            summary: 'High CPU usage in production environment',
            status: { name: 'In Progress', statusCategory: { name: 'In Progress', colorName: 'blue' } },
            priority: { name: 'High', iconUrl: '' },
            assignee: { displayName: 'pavani Racham', emailAddress: 'm24de3059@iitj.ac.in' },
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        {
          key: 'KAN-5',
          fields: {
            summary: 'Memory leak in worker nodes',
            status: { name: 'Open', statusCategory: { name: 'To Do', colorName: 'blue' } },
            priority: { name: 'Medium', iconUrl: '' },
            assignee: { displayName: 'pavani Racham', emailAddress: 'm24de3059@iitj.ac.in'},
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        {
          key: 'KAN-3',
          fields: {
            summary: 'Database connection timeout',
            status: { name: 'Done', statusCategory: { name: 'Done', colorName: 'green' } },
            priority: { name: 'Low', iconUrl: '' },
            assignee: { displayName: 'naresh vemuri', emailAddress: 'm24de3052@iitj.ac.in'},
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        {
          key: 'KAN-1',
          fields: {
            summary: 'Database connection timeout',
            status: { name: 'Done', statusCategory: { name: 'Done', colorName: 'green' } },
            priority: { name: 'Low', iconUrl: '' },
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        }
      ];

      // If query is empty or contains just "jira"/"ticket"/"issue", return all issues
      if (!query.trim() || 
          query.toLowerCase() === 'jira' || 
          query.toLowerCase() === 'ticket' || 
          query.toLowerCase() === 'issue' ||
          query.toLowerCase().includes('show') || 
          query.toLowerCase().includes('find') || 
          query.toLowerCase().includes('get')) {
        return mockIssues;
      }

      // Filter issues based on specific criteria
      const queryLower = query.toLowerCase();
      return mockIssues.filter(issue => {
        const matchSummary = issue.fields.summary.toLowerCase().includes(queryLower);
        const matchStatus = issue.fields.status.name.toLowerCase().includes(queryLower);
        const matchPriority = issue.fields.priority.name.toLowerCase().includes(queryLower);
        const matchAssignee = issue.fields.assignee?.displayName.toLowerCase().includes(queryLower) ?? false;
        const matchKey = issue.key.toLowerCase().includes(queryLower);

        // Match specific keywords
        const isHighPriority = queryLower.includes('high') && issue.fields.priority.name.toLowerCase().includes('high');
        const isOpen = queryLower.includes('open') && issue.fields.status.name.toLowerCase() === 'open';
        const isInProgress = (queryLower.includes('progress') || queryLower.includes('ongoing')) && 
                           issue.fields.status.name.toLowerCase() === 'in progress';
        const isDone = (queryLower.includes('done') || queryLower.includes('completed')) && 
                      issue.fields.status.name.toLowerCase() === 'done';

        return matchSummary || matchStatus || matchPriority || matchAssignee || matchKey ||
               isHighPriority || isOpen || isInProgress || isDone;
      });
    } catch (error) {
      console.error('Error searching JIRA issues:', error);
      throw error;
    }
  }

  private async getProjectStatus(): Promise<JiraIssue[]> {
    // For now, return mock data
    return this.getMockIssues();
  }

  private async getRecentIssues(): Promise<JiraIssue[]> {
    // For now, return mock data
    return this.getMockIssues();
  }

  private formatIssues(issues: JiraIssue[]): string {
    if (issues.length === 0) {
      return '🔍 No JIRA issues found matching your query.';
    }

    return `📋 JIRA Issues:\n\n${issues.map(issue => {
      const statusEmoji = this.getStatusEmoji(issue.fields.status.name);
      const priorityEmoji = this.getPriorityEmoji(issue.fields.priority.name);
      
      return `${statusEmoji} ${issue.key}: ${issue.fields.summary}\n` +
             `   Priority: ${priorityEmoji} ${issue.fields.priority.name}\n` +
             `   Status: ${issue.fields.status.name}\n` +
             `   Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}\n` +
             `   Updated: ${new Date(issue.fields.updated).toLocaleString()}`;
    }).join('\n\n')}`;
  }

  private formatProjectStatus(issues: JiraIssue[]): string {
    const totalIssues = issues.length;
    const openIssues = issues.filter(i => !['Done', 'Closed'].includes(i.fields.status.name)).length;
    const highPriority = issues.filter(i => ['High', 'Highest'].includes(i.fields.priority.name)).length;

    return `📊 JIRA Project Status:\n\n` +
           `Total Issues: ${totalIssues}\n` +
           `Open Issues: ${openIssues}\n` +
           `High Priority: ${highPriority}\n\n` +
           `Recent Updates:\n${this.formatIssues(issues.slice(0, 3))}`;
  }

  private getStatusEmoji(status: string): string {
    const statusMap: { [key: string]: string } = {
      'To Do': '📝',
      'In Progress': '🔄',
      'Done': '✅',
      'Closed': '✅',
      'Blocked': '🚫'
    };
    return statusMap[status] || '❓';
  }

  private getPriorityEmoji(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'Highest': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢',
      'Lowest': '⚪'
    };
    return priorityMap[priority] || '⚪';
  }

  private getMockIssues(): JiraIssue[] {
    return [
      {
        key: 'PROJ-123',
        fields: {
          summary: 'High CPU usage in production cluster',
          description: 'The production cluster is experiencing high CPU usage during peak hours.',
          status: {
            name: 'In Progress',
            statusCategory: {
              name: 'In Progress',
              colorName: 'yellow'
            }
          },
          priority: {
            name: 'High',
            iconUrl: '/high.svg'
          },
          assignee: {
            displayName: 'John Smith',
            emailAddress: 'john.smith@company.com'
          },
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      },
      {
        key: 'PROJ-124',
        fields: {
          summary: 'Memory leak in backend service',
          description: 'Memory usage is gradually increasing over time in the backend service.',
          status: {
            name: 'Open',
            statusCategory: {
              name: 'To Do',
              colorName: 'blue'
            }
          },
          priority: {
            name: 'Highest',
            iconUrl: '/highest.svg'
          },
          assignee: {
            displayName: 'Jane Doe',
            emailAddress: 'jane.doe@company.com'
          },
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      },
      {
        key: 'PROJ-125',
        fields: {
          summary: 'Update documentation for API v2',
          description: 'Documentation needs to be updated to reflect the changes in API v2.',
          status: {
            name: 'Done',
            statusCategory: {
              name: 'Done',
              colorName: 'green'
            }
          },
          priority: {
            name: 'Medium',
            iconUrl: '/medium.svg'
          },
          assignee: {
            displayName: 'Bob Wilson',
            emailAddress: 'bob.wilson@company.com'
          },
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      }
    ];
  }
}

export const jiraService = new JiraService();
