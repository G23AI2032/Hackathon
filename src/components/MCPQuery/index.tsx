import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, RefreshCw } from "lucide-react";
import { mcpCategories, MCPCategory } from './mcpData';
import { processMCPQuery, MCPQueryResult } from './mcpProcessor';
import { MCPQueryResult as MCPQueryResultComponent } from './MCPQueryResult';

interface MCPQueryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MCPQuery({ isOpen, onClose }: MCPQueryProps) {
  const [mcpQuery, setMcpQuery] = useState('');
  const [mcpResult, setMcpResult] = useState<MCPQueryResult | null>(null);
  const [mcpLoading, setMcpLoading] = useState(false);

  const handleMCPQuery = () => {
    setMcpLoading(true);
    // Simulate query processing
    setTimeout(() => {
      const result = processMCPQuery(mcpQuery);
      setMcpResult(result);
      setMcpLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <Database className="w-6 h-6 mr-2 text-blue-400" />
            Mission Control Protocol Query
          </h2>
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white"
            onClick={() => {
              onClose();
              setMcpResult(null);
              setMcpQuery('');
            }}
          >
            ✕
          </Button>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Available Query Categories:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {mcpCategories.map((category: MCPCategory, idx: number) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-3">
                <div className="text-white font-medium mb-2">{category.name}</div>
                <div className="space-y-1">
                  {category.queries.map((q: string, qIdx: number) => (
                    <div
                      key={qIdx}
                      className="text-sm text-blue-400 cursor-pointer hover:text-blue-300"
                      onClick={() => setMcpQuery(q)}
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Enter MCP query..."
            value={mcpQuery}
            onChange={(e) => setMcpQuery(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleMCPQuery();
              }
            }}
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleMCPQuery}
            disabled={mcpLoading || !mcpQuery.trim()}
          >
            {mcpLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Execute'
            )}
          </Button>
        </div>

        {mcpResult && <MCPQueryResultComponent result={mcpResult} />}
      </div>
    </div>
  );
}
