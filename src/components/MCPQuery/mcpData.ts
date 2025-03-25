export interface MCPCategory {
  name: string;
  queries: string[];
}

export const mcpCategories: MCPCategory[] = [
  {
    name: 'System Health',
    queries: [
      'CHECK system.metrics',
      'MONITOR resource.utilization',
      'STATUS service.health'
    ]
  },
  {
    name: 'Performance',
    queries: [
      'ANALYZE cpu.usage',
      'MEASURE memory.consumption',
      'TEST network.latency',
      'TRACK response.times'
    ]
  },
  {
    name: 'Configuration',
    queries: [
      'GET service.config',
      'LIST env.variables',
      'SHOW deployment.state'
    ]
  },
  {
    name: 'Diagnostics',
    queries: [
      'DEBUG system.errors',
      'ANALYZE error.logs',
      'TRACE request.flow',
      'FIND bottlenecks'
    ]
  },
  {
    name: 'Security',
    queries: [
      'CHECK access.controls',
      'VERIFY auth.status',
      'AUDIT security.policies'
    ]
  }
];
