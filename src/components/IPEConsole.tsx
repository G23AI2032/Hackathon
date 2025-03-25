"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, Activity, Database, PlugZap, Bell, Bug, Send, RefreshCw, Plus, AlertCircle, Search, Clock, Users, Shield, Network, Zap, FileText, ChevronRight, Server, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { incidentData, type Incident, type IncidentPriority } from '../data/incidentData';
import { recommendations, type Recommendation } from '../data/recommendationsData';
import { MCPQuery } from './MCPQuery';

interface Notification {
  message: string;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority: { name: string };
    assignee: { displayName: string };
    created: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ServiceDependency {
  name: string;
  type: 'upstream' | 'downstream';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

interface HealthCheckItem {
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

interface RCAReport {
  issueId: string;
  summary: string;
  impact: string;
  rootCause: string;
  timeline: string;
  resolution: string;
  preventiveMeasures: string[];
}

export default function IPEConsole() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>(incidentData);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    { message: "New critical incident reported" },
    { message: "System health check completed" },
    { message: "Backup process successful" }
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [jiraQuery, setJiraQuery] = useState("");
  const [jiraError, setJiraError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>(incidentData);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [dependencies] = useState<ServiceDependency[]>([
    { name: "API Gateway", type: "upstream", status: "healthy", latency: 45 },
    { name: "Database", type: "downstream", status: "degraded", latency: 150 },
    { name: "Cache", type: "downstream", status: "healthy", latency: 5 }
  ]);
  const [activeTab, setActiveTab] = useState('incidents');
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckItem[]>([
    {
      category: 'Authentication Service',
      status: 'healthy',
      details: {
        podCount: 3,
        readyPods: 3,
        cpuUsage: 45,
        memoryUsage: 62,
        restarts: 0,
        uptime: '15d 7h',
        nodeStatus: 'Running on nodes: worker-1, worker-2, worker-3'
      },
      namespace: 'auth-system',
      timestamp: '2025-03-25 23:05:00'
    },
    {
      category: 'Payment Processing Pods',
      status: 'warning',
      details: {
        podCount: 5,
        readyPods: 4,
        cpuUsage: 78,
        memoryUsage: 85,
        restarts: 2,
        uptime: '7d 12h',
        nodeStatus: 'Pod payment-proc-3 pending on worker-2'
      },
      namespace: 'payment-system',
      timestamp: '2025-03-25 23:06:00'
    },
    {
      category: 'Order Management Service',
      status: 'critical',
      details: {
        podCount: 4,
        readyPods: 2,
        cpuUsage: 92,
        memoryUsage: 95,
        restarts: 5,
        uptime: '2d 4h',
        nodeStatus: 'CrashLoopBackOff on worker-1'
      },
      namespace: 'order-system',
      timestamp: '2025-03-25 23:07:00'
    },
    {
      category: 'API Gateway Pods',
      status: 'healthy',
      details: {
        podCount: 6,
        readyPods: 6,
        cpuUsage: 55,
        memoryUsage: 60,
        restarts: 0,
        uptime: '30d 2h',
        nodeStatus: 'Running on all nodes'
      },
      namespace: 'gateway',
      timestamp: '2025-03-25 23:08:00'
    },
    {
      category: 'Database Cluster',
      status: 'warning',
      details: {
        podCount: 3,
        readyPods: 3,
        cpuUsage: 82,
        memoryUsage: 88,
        restarts: 1,
        uptime: '45d 3h',
        nodeStatus: 'High load on primary node'
      },
      namespace: 'database',
      timestamp: '2025-03-25 23:09:00'
    },
    {
      category: 'Cache Service',
      status: 'healthy',
      details: {
        podCount: 4,
        readyPods: 4,
        cpuUsage: 40,
        memoryUsage: 55,
        restarts: 0,
        uptime: '20d 15h',
        nodeStatus: 'Running on nodes: worker-1, worker-4'
      },
      namespace: 'cache-system',
      timestamp: '2025-03-25 23:10:00'
    }
  ]);
  const [showRCA, setShowRCA] = useState(false);
  const [rcaReports, setRcaReports] = useState<RCAReport[]>([
    {
      issueId: 'DEVOPS-123',
      summary: 'Production Pipeline Failure',
      impact: 'Critical - Delayed deployment of payment service updates affecting 15% of transactions',
      rootCause: 'Jenkins agent disconnection during crucial deployment step caused by network partition. The backup agent failed to take over due to misconfigured failover settings.',
      timeline: '2025-03-25 21:30:00 - Issue detected\n2025-03-25 21:35:00 - Alert triggered\n2025-03-25 21:45:00 - DevOps team engaged\n2025-03-25 22:15:00 - Root cause identified\n2025-03-25 22:30:00 - Fix implemented',
      resolution: 'Restored network connectivity and updated Jenkins agent failover configuration. Implemented proper health checks for agent availability.',
      preventiveMeasures: [
        'Implement redundant network paths for Jenkins agents',
        'Add automated failover testing in pre-production',
        'Enhance monitoring for agent health metrics',
        'Update runbook with failover procedures'
      ]
    },
    {
      issueId: 'DEVOPS-124',
      summary: 'SonarQube Code Quality Gate Failure',
      impact: 'Medium - Blocked merge of feature branch affecting team velocity',
      rootCause: 'Recent migration to new SonarQube version changed default quality profiles. Legacy code patterns now trigger new security hotspots and code smells.',
      timeline: '2025-03-25 22:15:00 - Quality gate failure detected\n2025-03-25 22:20:00 - Development team notified\n2025-03-25 22:45:00 - Analysis completed',
      resolution: 'Updated quality profiles to match organization standards. Created technical debt backlog for addressing legacy code issues.',
      preventiveMeasures: [
        'Create automated quality profile backup',
        'Implement test runs for major SonarQube updates',
        'Document quality gate configuration changes',
        'Set up regular code quality review meetings'
      ]
    },
    {
      issueId: 'DEVOPS-125',
      summary: 'ArgoCD Sync Failure',
      impact: 'High - Prevented automatic deployment of critical security patches',
      rootCause: 'Helm chart version mismatch between environments and invalid RBAC permissions for ArgoCD service account in target namespace.',
      timeline: '2025-03-25 22:30:00 - Sync failure detected\n2025-03-25 22:35:00 - Platform team alerted\n2025-03-25 22:50:00 - RBAC issues identified\n2025-03-25 23:05:00 - Resolution implemented',
      resolution: 'Standardized Helm chart versions across environments and corrected RBAC permissions for ArgoCD service account.',
      preventiveMeasures: [
        'Implement version control for Helm charts',
        'Add automated RBAC validation tests',
        'Create environment parity checker',
        'Set up automated drift detection'
      ]
    }
  ]);

  const [incidentQuery, setIncidentQuery] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const [llmQuery, setLlmQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const [showMCPQuery, setShowMCPQuery] = useState(false);
  const [mcpQuery, setMcpQuery] = useState('');
  const [mcpResult, setMcpResult] = useState<any>(null);
  const [mcpLoading, setMcpLoading] = useState(false);

  const mcpCategories = [
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

  const processLLMQuery = (query: string) => {
    const queryLower = query.toLowerCase();
    
    // Helper function to format duration
    const getTimeDiff = (timestamp: string) => {
      const incidentTime = new Date(timestamp);
      const now = new Date('2025-03-25T23:28:10+05:30');
      const diffMinutes = Math.floor((now.getTime() - incidentTime.getTime()) / (1000 * 60));
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} hours ${minutes} minutes ago`;
    };

    // Process natural language queries
    if (queryLower.includes('critical') || queryLower.includes('high priority') || queryLower.includes('urgent')) {
      setFilteredIncidents(activeIncidents.filter(inc => inc.priority === ('High' as IncidentPriority)));
    }
    else if (queryLower.includes('recent') || queryLower.includes('latest') || queryLower.includes('new')) {
      const sorted = [...activeIncidents].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setFilteredIncidents(sorted.slice(0, 3));
    }
    else if (queryLower.includes('resolved') || queryLower.includes('fixed') || queryLower.includes('completed')) {
      setFilteredIncidents(activeIncidents.filter(inc => inc.status === 'Resolved'));
    }
    else if (queryLower.includes('pending') || queryLower.includes('open') || queryLower.includes('active')) {
      setFilteredIncidents(activeIncidents.filter(inc => inc.status === 'Active' || inc.status === 'Investigating'));
    }
    else if (queryLower.includes('team') || queryLower.includes('assigned')) {
      const team = queryLower.includes('devops') ? 'DevOps' :
                queryLower.includes('platform') ? 'Platform' :
                queryLower.includes('security') ? 'Security' :
                queryLower.includes('database') ? 'Database' : null;
      
      if (team) {
        setFilteredIncidents(activeIncidents.filter(inc => inc.assignedTeam === team));
      }
    }
    else if (queryLower.includes('service') || queryLower.includes('affecting')) {
      const service = activeIncidents.reduce((acc, inc) => {
        inc.affectedServices.forEach(s => {
          const sLower = s.toLowerCase();
          if (queryLower.includes(sLower)) acc.push(inc);
        });
        return acc;
      }, [] as Incident[]);
      
      if (service.length > 0) {
        setFilteredIncidents(service);
      }
    }
    else if (queryLower.includes('memory') || queryLower.includes('cpu') || queryLower.includes('performance')) {
      const highUsage = activeIncidents.filter(inc => 
        inc.telemetry.cpu > 80 || inc.telemetry.memory > 80
      );
      setFilteredIncidents(highUsage);
    }
    else {
      // Default to basic text search
      setFilteredIncidents(activeIncidents.filter(inc => 
        inc.title.toLowerCase().includes(queryLower) ||
        inc.status.toLowerCase().includes(queryLower) ||
        (inc.priority as IncidentPriority).toLowerCase().includes(queryLower) ||
        inc.assignedTeam.toLowerCase().includes(queryLower) ||
        inc.affectedServices.some(s => s.toLowerCase().includes(queryLower))
      ));
    }
  };

  const handleLLMQuery = () => {
    setQueryLoading(true);
    // Simulate LLM processing delay
    setTimeout(() => {
      processLLMQuery(llmQuery);
      setQueryLoading(false);
    }, 500);
  };

  const handleIncidentQuery = async () => {
    setIsQuerying(true);
    setQueryResult(null);
    
    // Simulate LLM processing of the query against our incident data
    const processQuery = (query: string) => {
      const queryLower = query.toLowerCase();
      
      // Helper function to format time difference
      const getTimeDiff = (timestamp: string) => {
        const incidentTime = new Date(timestamp);
        const now = new Date('2025-03-25T23:16:08+05:30');
        const diff = Math.floor((now.getTime() - incidentTime.getTime()) / 1000 / 60);
        return diff < 60 ? `${diff} minutes ago` : `${Math.floor(diff/60)} hours ${diff%60} minutes ago`;
      };

      // Process different types of queries
      if (queryLower.includes('high priority') || queryLower.includes('critical')) {
        const highPriority = activeIncidents.filter(inc => inc.priority === 'High');
        return highPriority.map(inc => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span>🔴</span>
                <span class="text-blue-400 font-medium">${inc.id}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>${inc.status}</span>
                <span>${inc.priority}</span>
              </div>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">${inc.title}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <span>🕒</span> ${inc.timestamp}
              </div>
              <div>Team: ${inc.assignedTeam}</div>
            </div>
          </div>`
        )).join('') || 'No high priority incidents found';
      }

      if (queryLower.includes('recent') || queryLower.includes('latest')) {
        const sorted = [...activeIncidents].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return sorted.slice(0, 3).map(inc => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span>🔴</span>
                <span class="text-blue-400 font-medium">${inc.id}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>${inc.status}</span>
                <span>${inc.priority}</span>
              </div>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">${inc.title}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <span>🕒</span> ${inc.timestamp}
              </div>
              <div>Team: ${inc.assignedTeam}</div>
            </div>
          </div>`
        )).join('');
      }

      if (queryLower.includes('service') || queryLower.includes('affecting')) {
        const serviceIncidents = activeIncidents.reduce((acc, inc) => {
          inc.affectedServices.forEach(service => {
            if (!acc[service]) acc[service] = [];
            acc[service].push(inc);
          });
          return acc;
        }, {} as Record<string, typeof activeIncidents>);

        return Object.entries(serviceIncidents).map(([service, incidents]) => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 class="text-lg font-medium text-white mb-4">${service}</h3>
            ${incidents.map(inc => (
              `<div class="border-t border-gray-600 pt-3 mt-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-blue-400 font-medium">${inc.id}</span>
                  <div class="flex items-center gap-2">
                    <span>${inc.status}</span>
                    <span>${inc.priority}</span>
                  </div>
                </div>
                <div class="text-white">${inc.title}</div>
              </div>`
            )).join('')}
          </div>`
        )).join('');
      }

      if (queryLower.includes('team') || queryLower.includes('assigned')) {
        const teamIncidents = activeIncidents.reduce((acc, inc) => {
          if (!acc[inc.assignedTeam]) acc[inc.assignedTeam] = [];
          acc[inc.assignedTeam].push(inc);
          return acc;
        }, {} as Record<string, typeof activeIncidents>);

        return Object.entries(teamIncidents).map(([team, incidents]) => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 class="text-lg font-medium text-white mb-4">${team} (${incidents.length})</h3>
            ${incidents.map(inc => (
              `<div class="border-t border-gray-600 pt-3 mt-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-blue-400 font-medium">${inc.id}</span>
                  <div class="flex items-center gap-2">
                    <span>${inc.status}</span>
                    <span>${inc.priority}</span>
                  </div>
                </div>
                <div class="text-white">${inc.title}</div>
              </div>`
            )).join('')}
          </div>`
        )).join('');
      }

      if (queryLower.includes('resolved') || queryLower.includes('fixed')) {
        const resolved = activeIncidents.filter(inc => inc.rca && inc.rca !== 'Pending');
        return resolved.map(inc => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span>✅</span>
                <span class="text-blue-400 font-medium">${inc.id}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>${inc.status}</span>
                <span>${inc.priority}</span>
              </div>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">${inc.title}</h3>
            <div class="text-sm text-gray-400 mb-2">RCA: ${inc.rca}</div>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <span>🕒</span> ${inc.timestamp}
              </div>
              <div>Team: ${inc.assignedTeam}</div>
            </div>
          </div>`
        )).join('') || 'No resolved incidents found';
      }

      if (queryLower.includes('pending') || queryLower.includes('unresolved')) {
        const pending = activeIncidents.filter(inc => !inc.rca || inc.rca === 'Pending');
        return pending.map(inc => (
          `<div class="bg-gray-700 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span>⚠️</span>
                <span class="text-blue-400 font-medium">${inc.id}</span>
              </div>
              <div class="flex items-center gap-2">
                <span>${inc.status}</span>
                <span>${inc.priority}</span>
              </div>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">${inc.title}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <div class="flex items-center gap-1">
                <span>🕒</span> ${inc.timestamp}
              </div>
              <div>Team: ${inc.assignedTeam}</div>
            </div>
          </div>`
        )).join('') || 'No pending incidents found';
      }

      return '';
    };

    // Simulate API delay
    setTimeout(() => {
      const result = processQuery(incidentQuery);
      setQueryResult(result);
      setIsQuerying(false);
      addNotification("Incident query processed");
    }, 1000);
  };

  const addNotification = (message: string) => {
    console.log("New notification:", message);
    setNotifications([...notifications, { message }]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [incidentsRes, notificationsRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch("/api/notifications")
      ]);
      const [incidentsData, notificationsData] = await Promise.all([
        incidentsRes.json(),
        notificationsRes.json()
      ]);
      setIncidents(incidentsData);
      addNotification("Notifications fetched");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJiraIssues = async () => {
    if (!jiraQuery) return;
    setIsLoading(true);
    setJiraError(null);
    try {
      console.log('Fetching Jira issues with query:', jiraQuery);
      const response = await fetch(`/api/jira?action=search&query=${encodeURIComponent(jiraQuery)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Jira issues');
      }

      if (Array.isArray(data)) {
        setJiraIssues(data);
        if (data.length === 0) {
          setJiraError('No issues found matching your search');
        }
      } else {
        setJiraIssues([]);
        setJiraError('Invalid response format from Jira API');
      }
    } catch (error) {
      console.error("Error fetching Jira issues:", error);
      setJiraIssues([]);
      setJiraError(error instanceof Error ? error.message : 'Failed to fetch Jira issues');
    } finally {
      setIsLoading(false);
    }
  };

  const createJiraIssue = async (summary: string, description: string) => {
    try {
      const response = await fetch("/api/jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          data: {
            project: { key: "IPE" },
            summary,
            description,
            issuetype: { name: "Task" },
          },
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating Jira issue:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      // Create a Jira issue from the message
      await createJiraIssue("New Incident Report", message);
    setMessage("");
      // Refresh Jira issues
      fetchJiraIssues();
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          context: selectedIncident ? {
            incidentId: selectedIncident.id,
            title: selectedIncident.title,
            status: selectedIncident.status
          } : null
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredIncidents(activeIncidents);
      return;
    }

    const searchLower = term.toLowerCase();
    const filtered = activeIncidents.filter(incident => {
      const priority = getPriority(incident.priority);
      return incident.title.toLowerCase().includes(searchLower) ||
        incident.id.toLowerCase().includes(searchLower) ||
        incident.status.toLowerCase().includes(searchLower) ||
        priority.toLowerCase().includes(searchLower) ||
        incident.assignedTeam.toLowerCase().includes(searchLower) ||
        incident.affectedServices.some(service => 
          service.toLowerCase().includes(searchLower)
        );
    });
    setFilteredIncidents(filtered);
  };

  const getPriority = (priority: string): IncidentPriority => {
    if (priority === 'High' || priority === 'Medium' || priority === 'Low') {
      return priority as IncidentPriority;
    }
    return 'Medium' as IncidentPriority;
  };

  const handleMCPQuery = () => {
    setMcpLoading(true);
    // Simulate query processing
    setTimeout(() => {
      const queryLower = mcpQuery.toLowerCase();
      let result;

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
              { name: 'Frontend', version: 'v2.1.0', replicas: '3/3' },
              { name: 'Backend API', version: 'v1.9.2', replicas: '5/5' },
              { name: 'Worker', version: 'v1.5.0', replicas: '2/2' }
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

      setMcpResult(result);
      setMcpLoading(false);
    }, 1000);
  };

  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Integrated Platform Environment</h1>
          <p className="text-gray-400">Unified Incident Management & Platform Support</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <Tabs defaultValue="incidents" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 bg-gray-800 p-1 rounded-lg border border-gray-700">
                <TabsTrigger value="incidents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <AlertCircle className="w-4 h-4 mr-2" /> Incidents
                </TabsTrigger>
                <TabsTrigger value="jira" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Database className="w-4 h-4 mr-2" /> Jira
                </TabsTrigger>
                <TabsTrigger value="telemetry" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Activity className="w-4 h-4 mr-2" /> Telemetry
                </TabsTrigger>
                <TabsTrigger value="dependencies" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Network className="w-4 h-4 mr-2" /> Dependencies
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Zap className="w-4 h-4 mr-2" /> Recommendations
                </TabsTrigger>
              </TabsList>

              {/* Incidents Tab */}
              <TabsContent value="incidents" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Active Incidents
                    </h2>
                    
                    {/* Natural Language Query */}
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Ask about incidents (e.g., 'Show high priority incidents', 'What's affecting the API service?')"
                        value={llmQuery}
                        onChange={(e) => setLlmQuery(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleLLMQuery();
                          }
                        }}
                      />
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleLLMQuery}
                        disabled={queryLoading || !llmQuery.trim()}
                      >
                        {queryLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Incidents List */}
                    <div className="space-y-4">
                      {filteredIncidents.length > 0 ? (
                        filteredIncidents.map((incident) => (
                          <div
                            key={incident.id} 
                            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${
                                  (incident.priority as IncidentPriority) === 'High' ? 'bg-red-400' :
                                  (incident.priority as IncidentPriority) === 'Medium' ? 'bg-yellow-400' :
                                  'bg-blue-400'
                                }`} />
                                <span className="text-blue-400 font-medium">{incident.id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  incident.status === 'Resolved' ? 'bg-green-900 text-green-400' :
                                  incident.status === 'Active' ? 'bg-green-900 text-green-400' :
                                  'bg-yellow-900 text-yellow-400'
                                }`}>
                                  {incident.status}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  (incident.priority as IncidentPriority) === 'High' ? 'bg-red-900 text-red-400' :
                                  (incident.priority as IncidentPriority) === 'Medium' ? 'bg-yellow-900 text-yellow-400' :
                                  'bg-blue-900 text-blue-400'
                                }`}>
                                  {incident.priority}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{incident.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {incident.timestamp}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {incident.assignedTeam}
                              </div>
                              <div className="flex items-center gap-1">
                                <Server className="w-4 h-4" />
                                {incident.affectedServices.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No incidents found matching your search
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Jira Tab */}
              <TabsContent value="jira" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <div className="p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-400" />
                      Jira Integration
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search Jira issues..."
                          value={jiraQuery}
                          onChange={(e) => setJiraQuery(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              fetchJiraIssues();
                            }
                          }}
                        />
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={fetchJiraIssues}
                          disabled={isLoading || !jiraQuery.trim()}
                        >
                          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                      </div>
                      {jiraError && (
                        <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-800 rounded-lg">
                          {jiraError}
                        </div>
                      )}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {Array.isArray(jiraIssues) && jiraIssues.length > 0 ? (
                          jiraIssues.map((issue) => (
                            <div 
                              key={issue.key} 
                              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                              onClick={() => {
                                // Create an incident from the Jira issue
                                const incident: Incident = {
                                  id: issue.key,
                                  title: issue.fields.summary,
                                  status: issue.fields.status.name,
                                  priority: getPriority(issue.fields.priority.name) as IncidentPriority,
                                  timestamp: new Date(issue.fields.created).toLocaleString(),
                                  affectedServices: [],
                                  assignedTeam: issue.fields.assignee?.displayName || 'Unassigned',
                                  telemetry: { cpu: 0, memory: 0, latency: 0 },
                                  relatedIncidents: [],
                                  rca: ''
                                };
                                setSelectedIncident(incident);
                                setActiveTab('incidents');
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                  <span className="text-blue-400 font-medium">{issue.key}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm px-2 py-1 rounded-full bg-gray-600 text-gray-300">
                                    {issue.fields.status.name}
                                  </span>
                                  <span className="text-sm px-2 py-1 rounded-full bg-gray-600 text-gray-300">
                                    {issue.fields.priority.name}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-300">
                                {issue.fields.summary}
                              </div>
                              <div className="mt-2 text-xs text-gray-400">
                                Assigned to: {issue.fields.assignee?.displayName || 'Unassigned'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-center py-8">
                            {isLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Loading issues...</span>
                              </div>
                            ) : (
                              'Enter a search query to find Jira issues'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Telemetry Tab */}
              <TabsContent value="telemetry" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white mb-4">System Telemetry</h2>
                  
                  {/* Production Environment */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Production Environment
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">CPU Usage</h3>
                        <div className="text-2xl font-bold text-white">78%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">High load due to batch processing</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Memory Usage</h3>
                        <div className="text-2xl font-bold text-white">85%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <div className="text-xs text-yellow-400 mt-2">Warning: Approaching threshold</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Network Latency</h3>
                        <div className="text-2xl font-bold text-white">45ms</div>
                        <div className="text-sm text-green-400">Optimal performance</div>
                      </div>
                    </div>
                  </div>

                  {/* QA Environment */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      QA Environment
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">CPU Usage</h3>
                        <div className="text-2xl font-bold text-white">45%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">Load testing in progress</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Memory Usage</h3>
                        <div className="text-2xl font-bold text-white">92%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <div className="text-xs text-red-400 mt-2">Critical: Memory leak detected</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Network Latency</h3>
                        <div className="text-2xl font-bold text-white">120ms</div>
                        <div className="text-sm text-yellow-400">Network congestion</div>
                      </div>
                    </div>
                  </div>

                  {/* Dev Environment */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      Development Environment
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">CPU Usage</h3>
                        <div className="text-2xl font-bold text-white">32%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">Normal development activity</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Memory Usage</h3>
                        <div className="text-2xl font-bold text-white">54%</div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '54%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">Within normal range</div>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">Network Latency</h3>
                        <div className="text-2xl font-bold text-white">89ms</div>
                        <div className="text-sm text-gray-400">Average response time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Dependencies Tab */}
              <TabsContent value="dependencies" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Tool Health Check</h2>
                  <div className="space-y-4">
                    {dependencies.map((dep, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Network className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">{dep.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            dep.status === 'healthy' ? 'bg-green-900 text-green-400' :
                            dep.status === 'degraded' ? 'bg-yellow-900 text-yellow-400' :
                            'bg-red-900 text-red-400'
                          }`}>
                            {dep.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          <div>Type: {dep.type}</div>
                          <div>Latency: {dep.latency}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Proactive Recommendations</h2>
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="text-white font-medium">{rec.title}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            rec.severity === 'high' ? 'bg-red-900 text-red-400' :
                            rec.severity === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                            'bg-blue-900 text-blue-400'
                          }`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{rec.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400">{rec.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - AI Assistant & Quick Actions */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  AI Assistant
                </h2>
              </div>
              <div className="h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about incidents or platform status..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleSubmit}
                      disabled={isLoading || !input.trim()}
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Agentic Tools</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() => setShowHealthCheck(true)}
                >
                  <Activity className="w-4 h-4 mr-2" /> Health Check
                </Button>
                <Button 
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() => setShowRCA(true)}
                >
                  <FileText className="w-4 h-4 mr-2" /> Generate RCA
                </Button>
                <Button 
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={() => setIsMCPModalOpen(true)}
                >
                  <Database className="w-4 h-4 mr-2" /> MCP Query
                </Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                  <Network className="w-4 h-4 mr-2" /> Dependency Map
                </Button>
              </div>
            </div>

            {/* Health Check Modal */}
            {showHealthCheck && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white flex items-center">
                      <Activity className="w-6 h-6 mr-2 text-blue-400" />
                      Kubernetes Pod Health Status
                    </h2>
                    <Button 
                      variant="ghost" 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowHealthCheck(false)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {healthCheckResults.map((item, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              item.status === 'healthy' ? 'bg-green-500' :
                              item.status === 'warning' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <div>
                              <span className="text-lg font-medium text-white">{item.category}</span>
                              <span className="text-sm text-gray-400 ml-2">({item.namespace})</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            item.status === 'healthy' ? 'bg-green-900 text-green-400' :
                            item.status === 'warning' ? 'bg-yellow-900 text-yellow-400' :
                            'bg-red-900 text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Pod Status</div>
                            <div className="text-white">
                              {item.details.readyPods}/{item.details.podCount} Ready
                              {item.details.restarts > 0 && 
                                <span className="text-yellow-400 ml-2">
                                  ({item.details.restarts} restarts)
                                </span>
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Uptime</div>
                            <div className="text-white">{item.details.uptime}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">CPU Usage</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-grow bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    item.details.cpuUsage > 80 ? 'bg-red-500' :
                                    item.details.cpuUsage > 60 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${item.details.cpuUsage}%` }}
                                ></div>
                              </div>
                              <span className="text-white text-sm">{item.details.cpuUsage}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Memory Usage</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-grow bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    item.details.memoryUsage > 80 ? 'bg-red-500' :
                                    item.details.memoryUsage > 60 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${item.details.memoryUsage}%` }}
                                ></div>
                              </div>
                              <span className="text-white text-sm">{item.details.memoryUsage}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-400">Node Status</div>
                        <div className="text-white text-sm mt-1 bg-gray-800 p-2 rounded-lg whitespace-pre-wrap">
                          {item.details.nodeStatus}
                        </div>

                        <div className="text-xs text-gray-500 mt-2">
                          Last updated: {item.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => setShowHealthCheck(false)}
                    >
                      Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* RCA Modal */}
            {showRCA && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white flex items-center">
                      <FileText className="w-6 h-6 mr-2 text-blue-400" />
                      Root Cause Analysis Reports
                    </h2>
                    <Button 
                      variant="ghost" 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowRCA(false)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {rcaReports.map((report, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-blue-400 font-mono">{report.issueId}</span>
                            <h3 className="text-xl font-semibold text-white mt-1">{report.summary}</h3>
                          </div>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                            Export Report
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Impact</h4>
                            <p className="text-white">{report.impact}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Root Cause</h4>
                            <p className="text-white">{report.rootCause}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Timeline</h4>
                            <pre className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg whitespace-pre-wrap">
                              {report.timeline}
                            </pre>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Resolution</h4>
                            <p className="text-white">{report.resolution}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Preventive Measures</h4>
                            <ul className="list-disc list-inside text-white space-y-1">
                              {report.preventiveMeasures.map((measure, idx) => (
                                <li key={idx} className="text-gray-300">{measure}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Button 
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={() => setShowRCA(false)}
                    >
                      Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      New RCA Report
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* MCP Query Modal */}
            {isMCPModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <MCPQuery isOpen={isMCPModalOpen} onClose={() => setIsMCPModalOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}