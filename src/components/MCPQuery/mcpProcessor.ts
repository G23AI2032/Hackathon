export interface MCPQueryResult {
  type: 'metrics' | 'health' | 'performance' | 'deployment' | 'security' | 'error';
  data?: {
    cpu?: {
      usage: string;
      cores: number;
      temperature: string;
    };
    memory?: {
      used: string;
      available: string;
      swap: string;
    };
    disk?: {
      read: string;
      write: string;
      iops: number;
    };
    services?: Array<{
      name: string;
      status: string;
      uptime: string;
      version?: string;
      replicas?: string;
    }>;
    endpoints?: Array<{
      path: string;
      p95: string;
      p99: string;
    }>;
    status?: string;
    lastScan?: string;
    findings?: Array<{
      severity: string;
      description: string;
    }>;
  };
  message?: string;
}

export function processMCPQuery(query: string): MCPQueryResult {
  const queryLower = query.toLowerCase();
  let result: MCPQueryResult;

  if (queryLower.includes('system.metrics') || queryLower.includes('resource.utilization')) {
    result = {
      type: 'metrics',
      data: {
        cpu: {
          usage: '78%',
          cores: 16,
          temperature: '45°C'
        },
        memory: {
          used: '24.5GB',
          available: '32GB',
          swap: '2GB'
        },
        disk: {
          read: '250MB/s',
          write: '180MB/s',
          iops: 3500
        }
      }
    };
  }
  else if (queryLower.includes('service.health')) {
    result = {
      type: 'health',
      data: {
        services: [
          { name: 'API Gateway', status: 'healthy', uptime: '99.99%' },
          { name: 'Auth Service', status: 'healthy', uptime: '99.95%' },
          { name: 'Database', status: 'degraded', uptime: '99.80%' },
          { name: 'Cache', status: 'healthy', uptime: '99.99%' }
        ]
      }
    };
  }
  else if (queryLower.includes('network.latency') || queryLower.includes('response.times')) {
    result = {
      type: 'performance',
      data: {
        endpoints: [
          { path: '/api/v1/users', p95: '120ms', p99: '250ms' },
          { path: '/api/v1/orders', p95: '180ms', p99: '350ms' },
          { path: '/api/v1/products', p95: '90ms', p99: '180ms' }
        ]
      }
    };
  }
  else if (queryLower.includes('deployment.state')) {
    result = {
      type: 'deployment',
      data: {
        services: [
          { name: 'Frontend', version: 'v2.1.0', replicas: '3/3', status: 'deployed', uptime: '100%' },
          { name: 'Backend API', version: 'v1.9.2', replicas: '5/5', status: 'deployed', uptime: '100%' },
          { name: 'Worker', version: 'v1.5.0', replicas: '2/2', status: 'deployed', uptime: '100%' }
        ]
      }
    };
  }
  else if (queryLower.includes('security') || queryLower.includes('auth')) {
    result = {
      type: 'security',
      data: {
        status: 'secure',
        lastScan: '2025-03-25 22:00:00',
        findings: [
          { severity: 'medium', description: 'TLS 1.2 in use, upgrade to 1.3 recommended' },
          { severity: 'low', description: 'Non-critical headers missing' }
        ]
      }
    };
  }
  else {
    result = {
      type: 'error',
      message: 'Query not recognized. Please use one of the suggested queries.'
    };
  }

  return result;
}
