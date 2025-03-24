"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, Activity, Database, PlugZap, Bell, Bug, Send, RefreshCw, Plus, AlertCircle, Search, Clock, Users, Shield, Network, Zap, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  status: string;
  priority: string;
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

interface Recommendation {
  type: 'health' | 'security' | 'performance' | 'incident';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  action: string;
}

interface ServiceDependency {
  name: string;
  type: 'upstream' | 'downstream';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

export default function IPEConsole() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [jiraQuery, setJiraQuery] = useState("");
  const [jiraError, setJiraError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dependencies, setDependencies] = useState<ServiceDependency[]>([]);
  const [activeTab, setActiveTab] = useState('incidents');

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
      setNotifications(notificationsData);
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

  const filteredIncidents = incidents.filter((inc) =>
    inc.title.toLowerCase().includes(filter.toLowerCase())
  );

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
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Active Incidents
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 mb-4">
                  <Input
                        placeholder="Search incidents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Search className="w-4 h-4 mr-2" /> Search
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {activeIncidents.length > 0 ? (
                        activeIncidents.map((incident) => (
                          <div
                        key={incident.id} 
                            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                            onClick={() => setSelectedIncident(incident)}
                      >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                <span className="text-blue-400 font-medium">{incident.id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm px-2 py-1 rounded-full bg-gray-600 text-gray-300">
                                  {incident.status}
                                </span>
                                <span className="text-sm px-2 py-1 rounded-full bg-gray-600 text-gray-300">
                                  {incident.priority}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{incident.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {incident.timestamp}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {incident.assignedTeam}
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-4 h-4" />
                                {incident.affectedServices.length} services affected
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                          <p>No active incidents</p>
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
                                  priority: issue.fields.priority.name,
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">CPU Usage</h3>
                      <div className="text-2xl font-bold text-white">45%</div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Memory Usage</h3>
                      <div className="text-2xl font-bold text-white">62%</div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Network Latency</h3>
                      <div className="text-2xl font-bold text-white">120ms</div>
                      <div className="text-sm text-gray-400">Average response time</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Dependencies Tab */}
              <TabsContent value="dependencies" className="mt-4">
                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Service Dependencies</h2>
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
                            'bg-green-900 text-green-400'
                          }`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-gray-400 mb-2">{rec.description}</p>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          {rec.action}
                  </Button>
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
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                  <Activity className="w-4 h-4 mr-2" /> Health Check
                </Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                  <FileText className="w-4 h-4 mr-2" /> Generate RCA
                </Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                  <Database className="w-4 h-4 mr-2" /> MCP Query
                </Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                  <Network className="w-4 h-4 mr-2" /> Dependency Map
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 