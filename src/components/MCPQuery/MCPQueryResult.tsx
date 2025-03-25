import React from 'react';
import { MCPQueryResult as MCPQueryResultType } from './mcpProcessor';

interface MCPQueryResultProps {
  result: MCPQueryResultType;
}

export function MCPQueryResult({ result }: MCPQueryResultProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      {result.type === 'metrics' && result.data?.cpu && result.data?.memory && result.data?.disk ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white mb-2">System Metrics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">CPU</div>
              <div className="space-y-1">
                <div className="text-white">Usage: {result.data.cpu.usage}</div>
                <div className="text-white">Cores: {result.data.cpu.cores}</div>
                <div className="text-white">Temp: {result.data.cpu.temperature}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Memory</div>
              <div className="space-y-1">
                <div className="text-white">Used: {result.data.memory.used}</div>
                <div className="text-white">Available: {result.data.memory.available}</div>
                <div className="text-white">Swap: {result.data.memory.swap}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Disk I/O</div>
              <div className="space-y-1">
                <div className="text-white">Read: {result.data.disk.read}</div>
                <div className="text-white">Write: {result.data.disk.write}</div>
                <div className="text-white">IOPS: {result.data.disk.iops}</div>
              </div>
            </div>
          </div>
        </div>
      ) : result.type === 'health' && result.data?.services ? (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Service Health Status</h3>
          <div className="space-y-3">
            {result.data.services.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-400' :
                    service.status === 'degraded' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-white">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">{service.uptime}</span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    service.status === 'healthy' ? 'bg-green-900 text-green-400' :
                    service.status === 'degraded' ? 'bg-yellow-900 text-yellow-400' :
                    'bg-red-900 text-red-400'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : result.type === 'performance' && result.data?.endpoints ? (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            {result.data.endpoints.map((endpoint, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3">
                <div className="text-white font-medium mb-2">{endpoint.path}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">P95 Latency</div>
                    <div className="text-white">{endpoint.p95}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">P99 Latency</div>
                    <div className="text-white">{endpoint.p99}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : result.type === 'deployment' && result.data?.services ? (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Deployment Status</h3>
          <div className="space-y-3">
            {result.data.services.map((service, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{service.name}</span>
                  <span className="text-blue-400">{service.version}</span>
                </div>
                <div className="text-gray-400 mt-1">Replicas: {service.replicas}</div>
              </div>
            ))}
          </div>
        </div>
      ) : result.type === 'security' && result.data?.findings ? (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Security Status</h3>
          <div className="bg-gray-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400">✓ {result.data.status}</span>
            </div>
            <div className="text-gray-400">Last Scan: {result.data.lastScan}</div>
          </div>
          <div className="space-y-3">
            {result.data.findings.map((finding, idx) => (
              <div key={idx} className="bg-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    finding.severity === 'high' ? 'bg-red-900 text-red-400' :
                    finding.severity === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                    'bg-blue-900 text-blue-400'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <div className="text-gray-300">{finding.description}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-yellow-400">{result.message}</div>
      )}
    </div>
  );
}
