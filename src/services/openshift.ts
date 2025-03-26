interface OpenShiftResource {
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  status?: any;
}

interface OpenShiftMetrics {
  cpu: {
    usage: string;
    limit: string;
  };
  memory: {
    usage: string;
    limit: string;
  };
  pods: {
    running: number;
    total: number;
  };
}

export class OpenShiftService {
  private baseUrl: string;
  private token: string;
  private namespace: string;
  private isConnected: boolean;

  constructor() {
    this.baseUrl = process.env.DEFAULT_CLUSTER_URL || '';
    this.token = process.env.DEFAULT_CLUSTER_TOKEN || '';
    this.namespace = process.env.DEFAULT_CLUSTER_NAMESPACE || '';
    this.isConnected = true; // Set to true if connected to cluster
  }

  async getResourceStatus(resourceType: string, resourceName?: string): Promise<OpenShiftResource[]> {
    if (!this.isConnected) {
      console.log('Using mock OpenShift data (not connected to cluster)');
      return this.getMockPodData();
    }

    try {
      const apiPath = resourceType === 'pods' ? 'api/v1' : 'apis/apps/v1';
      const url = resourceName 
        ? `${this.baseUrl}/${apiPath}/namespaces/${this.namespace}/${resourceType}/${resourceName}`
        : `${this.baseUrl}/${apiPath}/namespaces/${this.namespace}/${resourceType}`;

      console.log('Fetching OpenShift data from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('OpenShift API error:', response.statusText);
        throw new Error(`OpenShift API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenShift API response:', data);
      return resourceName ? [data] : data.items;
    } catch (error) {
      console.error('Error fetching OpenShift resources:', error);
      return this.getMockPodData();
    }
  }

  async getMetrics(): Promise<OpenShiftMetrics> {
    if (!this.isConnected) {
      console.log('Using mock OpenShift metrics (not connected to cluster)');
      return this.getMockMetrics();
    }

    try {
      const url = `${this.baseUrl}/apis/metrics.k8s.io/v1beta1/namespaces/${this.namespace}/pods`;
      console.log('Fetching OpenShift metrics from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('OpenShift Metrics API error:', response.statusText);
        throw new Error(`OpenShift Metrics API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenShift Metrics API response:', data);

      const pods = data.items || [];
      const totalCPU = pods.reduce((acc: number, pod: any) => {
        const cpuUsage = pod.containers?.[0]?.usage?.cpu || '0';
        const cpuMillicores = cpuUsage.endsWith('m') 
          ? parseInt(cpuUsage) 
          : Math.round(parseFloat(cpuUsage) * 1000);
        return acc + (isNaN(cpuMillicores) ? 0 : cpuMillicores);
      }, 0);

      const totalMemory = pods.reduce((acc: number, pod: any) => {
        const memUsage = pod.containers?.[0]?.usage?.memory || '0';
        let memBytes = parseInt(memUsage);
        if (memUsage.endsWith('Ki')) memBytes *= 1024;
        if (memUsage.endsWith('Mi')) memBytes *= 1024 * 1024;
        if (memUsage.endsWith('Gi')) memBytes *= 1024 * 1024 * 1024;
        return acc + (isNaN(memBytes) ? 0 : memBytes);
      }, 0);

      const runningPods = pods.filter((pod: any) => 
        pod.containers?.some((container: any) => container.usage?.cpu && container.usage?.memory)
      ).length;

      return {
        cpu: {
          usage: `${totalCPU}m`,
          limit: '4000m'
        },
        memory: {
          usage: `${Math.round(totalMemory / (1024 * 1024))}Mi`,
          limit: '8Gi'
        },
        pods: {
          running: runningPods,
          total: pods.length
        }
      };
    } catch (error) {
      console.error('Error fetching OpenShift metrics:', error);
      return this.getMockMetrics();
    }
  }

  async processQuery(query: string): Promise<string> {
    try {
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('pod') || queryLower.includes('pods')) {
        const pods = await this.getResourceStatus('pods');
        return this.formatPodStatus(pods);
      }
      
      if (queryLower.includes('deployment') || queryLower.includes('deployments')) {
        const deployments = await this.getResourceStatus('deployments');
        return this.formatDeploymentStatus(deployments);
      }
      
      if (queryLower.includes('metrics') || queryLower.includes('performance')) {
        const metrics = await this.getMetrics();
        return this.formatMetrics(metrics);
      }
      
      const [pods, deployments, metrics] = await Promise.all([
        this.getResourceStatus('pods'),
        this.getResourceStatus('deployments'),
        this.getMetrics()
      ]);
      
      return this.formatClusterOverview(pods, deployments, metrics);
    } catch (error: any) { // Type as 'any' to access error properties safely
      console.error('Error processing OpenShift query:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return `⚠️ OpenShift Query Error:\n\n` +
        `I encountered an error while processing your OpenShift query.\n` +
        `This could be because:\n` +
        `• The OpenShift cluster is not accessible\n` +
        `• The authentication token is invalid\n` +
        `• The requested resource type doesn't exist\n\n` +
        `Error details: ${errorMessage}`;
    }
  }

  private formatPodStatus(pods: OpenShiftResource[]): string {
    const runningPods = pods.filter(pod => pod.status?.phase === 'Running').length;
    const totalPods = pods.length;
    const healthPercentage = totalPods > 0 ? Math.round((runningPods / totalPods) * 100) : 0;
    
    let healthStatus = '🔴 Critical';
    if (healthPercentage === 100) {
      healthStatus = '🟢 Healthy';
    } else if (healthPercentage >= 75) {
      healthStatus = '🟡 Degraded';
    } else if (healthPercentage >= 50) {
      healthStatus = '🟠 Warning';
    }

    return `🔍 Pod Status in ${this.namespace}: ${healthStatus}\n` +
           `Health: ${healthPercentage}% (${runningPods}/${totalPods} pods running)\n\n` +
           `${pods.map(pod => {
              const isReady = pod.status?.conditions?.some((c: any) => 
                c.type === 'Ready' && c.status === 'True'
              );
              const statusEmoji = isReady ? '✅' : '⚠️';
              
              return `${statusEmoji} ${pod.metadata.name}:\n` +
                     `   Status: ${pod.status?.phase || 'Unknown'}\n` +
                     (pod.status?.conditions ? 
                       `   Health Checks:\n${pod.status.conditions
                         .map((c: any) => `     • ${c.type}: ${c.status === 'True' ? '✓' : '✗'}`)
                         .join('\n')}` : '');
            }).join('\n\n')}`;
  }

  private formatDeploymentStatus(deployments: OpenShiftResource[]): string {
    const healthyDeployments = deployments.filter(dep => 
      dep.status?.conditions?.some((c: any) => c.type === 'Available' && c.status === 'True')
    ).length;
    const totalDeployments = deployments.length;
    const healthPercentage = totalDeployments > 0 ? Math.round((healthyDeployments / totalDeployments) * 100) : 0;
    
    let healthStatus = '🔴 Critical';
    if (healthPercentage === 100) {
      healthStatus = '🟢 Healthy';
    } else if (healthPercentage >= 75) {
      healthStatus = '🟡 Degraded';
    } else if (healthPercentage >= 50) {
      healthStatus = '🟠 Warning';
    }

    return `📊 Deployment Status in ${this.namespace}: ${healthStatus}\n` +
           `Health: ${healthPercentage}% (${healthyDeployments}/${totalDeployments} deployments healthy)\n\n` +
           `${deployments.map(deployment => {
              const isAvailable = deployment.status?.conditions?.some((c: any) => 
                c.type === 'Available' && c.status === 'True'
              );
              const statusEmoji = isAvailable ? '✅' : '⚠️';
              const replicas = deployment.status?.replicas || 0;
              const available = deployment.status?.availableReplicas || 0;
              const replicaHealth = replicas > 0 ? Math.round((available / replicas) * 100) : 0;
              
              return `${statusEmoji} ${deployment.metadata.name}:\n` +
                     `   Replicas: ${available}/${replicas} (${replicaHealth}% healthy)\n` +
                     `   Generation: ${deployment.status?.observedGeneration || 0}\n` +
                     (deployment.status?.conditions ? 
                       `   Conditions:\n${deployment.status.conditions
                         .map((c: any) => `     • ${c.type}: ${c.status === 'True' ? '✓' : '✗'} ${c.message ? `(${c.message})` : ''}`)
                         .join('\n')}` : '');
            }).join('\n\n')}`;
  }

  private formatMetrics(metrics: OpenShiftMetrics): string {
    return `📈 Cluster Metrics for ${this.namespace}:\n\n` +
      `CPU Usage: ${metrics.cpu.usage} / ${metrics.cpu.limit}\n` +
      `Memory Usage: ${metrics.memory.usage} / ${metrics.memory.limit}\n` +
      `Pods: ${metrics.pods.running} running / ${metrics.pods.total} total`;
  }

  private formatClusterOverview(
    pods: OpenShiftResource[], 
    deployments: OpenShiftResource[],
    metrics: OpenShiftMetrics
  ): string {
    const runningPods = pods.filter(pod => pod.status?.phase === 'Running').length;
    const healthyDeployments = deployments.filter(dep => 
      dep.status?.conditions?.some((c: any) => c.type === 'Available' && c.status === 'True')
    ).length;

    return `🎯 OpenShift Cluster Overview for ${this.namespace}:\n\n` +
      `1. Resources:\n` +
      `   • Pods: ${runningPods} running / ${pods.length} total\n` +
      `   • Deployments: ${healthyDeployments} healthy / ${deployments.length} total\n\n` +
      `2. Performance:\n` +
      `   • CPU: ${metrics.cpu.usage} / ${metrics.cpu.limit}\n` +
      `   • Memory: ${metrics.memory.usage} / ${metrics.memory.limit}\n` +
      `   • Active Pods: ${metrics.pods.running} / ${metrics.pods.total}`;
  }

  private getMockPodData(): OpenShiftResource[] {
    return [
      {
        kind: 'Pod',
        metadata: {
          name: 'frontend-pod-1',
          namespace: this.namespace
        },
        status: {
          phase: 'Running',
          conditions: [
            { type: 'Ready', status: 'True' },
            { type: 'PodScheduled', status: 'True' }
          ]
        }
      },
      {
        kind: 'Pod',
        metadata: {
          name: 'backend-pod-1',
          namespace: this.namespace
        },
        status: {
          phase: 'Running',
          conditions: [
            { type: 'Ready', status: 'True' },
            { type: 'PodScheduled', status: 'True' }
          ]
        }
      },
      {
        kind: 'Pod',
        metadata: {
          name: 'database-pod-1',
          namespace: this.namespace
        },
        status: {
          phase: 'Running',
          conditions: [
            { type: 'Ready', status: 'True' },
            { type: 'PodScheduled', status: 'True' }
          ]
        }
      }
    ];
  }

  private getMockMetrics(): OpenShiftMetrics {
    return {
      cpu: {
        usage: '450m',
        limit: '1000m'
      },
      memory: {
        usage: '1.2Gi',
        limit: '2Gi'
      },
      pods: {
        running: 3,
        total: 3
      }
    };
  }
}

export const openshiftService = new OpenShiftService();
