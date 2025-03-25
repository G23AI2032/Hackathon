export type IncidentPriority = 'High' | 'Medium' | 'Low';

export interface Incident {
  id: string;
  title: string;
  status: string;
  priority: IncidentPriority;
  timestamp: string;
  affectedServices: string[];
  assignedTeam: string;
  telemetry: {
    cpu: number;
    memory: number;
    latency: number;
  };
  relatedIncidents: string[];
  rca: string;
}

export const incidentData: Incident[] = [
  {
    id: "INC-001",
    title: "Jenkins Pipeline Failure",
    status: "Active",
    priority: 'High',
    timestamp: "2025-03-25 22:45:00",
    affectedServices: ["CI/CD", "Deployment", "Build System"],
    assignedTeam: "DevOps",
    telemetry: {
      cpu: 85,
      memory: 92,
      latency: 1200
    },
    relatedIncidents: ["INC-003"],
    rca: "Pending"
  },
  {
    id: "INC-002",
    title: "Database Connection Timeout",
    status: "Investigating",
    priority: 'High',
    timestamp: "2025-03-25 23:00:00",
    affectedServices: ["Database", "API Gateway", "User Service"],
    assignedTeam: "Database",
    telemetry: {
      cpu: 95,
      memory: 88,
      latency: 5000
    },
    relatedIncidents: [],
    rca: "High connection pool exhaustion due to connection leaks"
  },
  {
    id: "INC-003",
    title: "SonarQube Quality Gate Failure",
    status: "Active",
    priority: 'Medium',
    timestamp: "2025-03-25 22:30:00",
    affectedServices: ["Code Quality", "CI/CD"],
    assignedTeam: "DevOps",
    telemetry: {
      cpu: 45,
      memory: 60,
      latency: 800
    },
    relatedIncidents: ["INC-001"],
    rca: "Pending"
  },
  {
    id: "INC-004",
    title: "Kubernetes Pod OOM",
    status: "Resolved",
    priority: 'High',
    timestamp: "2025-03-25 21:15:00",
    affectedServices: ["Order Service", "Payment Service"],
    assignedTeam: "Platform",
    telemetry: {
      cpu: 100,
      memory: 98,
      latency: 3000
    },
    relatedIncidents: [],
    rca: "Memory limit misconfiguration in deployment yaml"
  },
  {
    id: "INC-005",
    title: "API Gateway Latency Spike",
    status: "Active",
    priority: 'Medium',
    timestamp: "2025-03-25 23:10:00",
    affectedServices: ["API Gateway", "All Services"],
    assignedTeam: "Platform",
    telemetry: {
      cpu: 75,
      memory: 82,
      latency: 2500
    },
    relatedIncidents: [],
    rca: "Pending"
  },
  {
    id: "INC-006",
    title: "SSL Certificate Expiry Warning",
    status: "Investigating",
    priority: 'Low',
    timestamp: "2025-03-25 22:00:00",
    affectedServices: ["Security", "API Gateway"],
    assignedTeam: "Security",
    telemetry: {
      cpu: 30,
      memory: 45,
      latency: 500
    },
    relatedIncidents: [],
    rca: "Certificate renewal process delayed"
  }
];
