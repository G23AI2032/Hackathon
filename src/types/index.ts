export interface Notification {
  message: string;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority: { name: string };
    assignee: { displayName: string };
    created: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Recommendation {
  type: 'health' | 'security' | 'performance' | 'incident' | 'devops';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

export interface ServiceDependency {
  name: string;
  type: 'upstream' | 'downstream';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

export interface HealthCheckItem {
  category: string;
  status: 'healthy' | 'warning' | 'critical';
  details: {
    podCount: number;
    readyPods: number;
    cpuUsage: number;
    memoryUsage: number;
    restarts: number;
    uptime: string;
    nodeStatus: string;
  };
  namespace: string;
  timestamp: string;
}

export interface RCAReport {
  issueId: string;
  summary: string;
  impact: string;
  rootCause: string;
  timeline: string;
  resolution: string;
  preventiveMeasures: string[];
}
