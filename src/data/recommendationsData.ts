export interface Recommendation {
  type: 'health' | 'security' | 'performance' | 'incident' | 'devops';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

export const recommendations: Recommendation[] = [
  {
    type: 'health',
    title: 'Database Connection Pool Optimization',
    description: 'Current connection pool size may be insufficient for peak loads',
    severity: 'medium',
    action: 'Increase max pool size to 50 connections'
  },
  {
    type: 'security',
    title: 'SSL Certificate Expiration',
    description: 'Production SSL certificate will expire in 30 days',
    severity: 'high',
    action: 'Renew SSL certificate'
  },
  {
    type: 'performance',
    title: 'API Response Time Degradation',
    description: 'P95 latency increased by 25% in last 24 hours',
    severity: 'medium',
    action: 'Investigate slow queries and optimize'
  },
  {
    type: 'incident',
    title: 'Error Rate Spike',
    description: 'Payment service showing 5% error rate increase',
    severity: 'high',
    action: 'Check payment gateway integration'
  },
  {
    type: 'devops',
    title: 'Container Resource Limits',
    description: 'Some containers running without resource limits',
    severity: 'low',
    action: 'Set CPU and memory limits'
  }
];
