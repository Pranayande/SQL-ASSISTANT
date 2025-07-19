import React from 'react';
import { Clock, ExternalLink, Check } from 'lucide-react';
import { Query } from '../types';

// Props interface for the QueryHistory component
interface QueryHistoryProps {
  queries: Query[];
  onClearHistory: () => void;
}

// Component to display the history of executed SQL queries
const QueryHistory: React.FC<QueryHistoryProps> = ({ queries, onClearHistory }) => {
  // Render the query history panel
  return (
    <div className="w-72 glass-effect border-l border-gray-200/50 overflow-y-auto flex-shrink-0">
      {/* Header section with title and clear history button */}
      <div className="p-4 border-b border-gray-200/50 flex justify-between items-center">
        <div className="flex items-center">
          <Clock className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-700">Query History</h3>
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100/80 text-gray-600 rounded-full">
            {queries.length}
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100/50"
        >
          Clear History
        </button>
      </div>
      
      {/* List of executed queries */}
      <div className="divide-y divide-gray-100/50">
        {queries.map((query) => (
          <div key={query.id} className="p-4 hover:bg-gray-50/50 transition-colors animate-fade-in">
            {/* Query metadata (timestamp, row count, execution time) */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">{query.timestamp}</span>
              <div className="flex items-center text-xs text-gray-600">
                <Check className="w-3 h-3 text-emerald-500 mr-1" />
                <span className="mr-2">{query.rows} rows</span>
                <span>{query.executionTime}</span>
              </div>
            </div>
            {/* Display the SQL query */}
            <div className="code-area">
              <pre className="text-xs whitespace-pre-wrap font-mono">{query.sql}</pre>
            </div>
          </div>
        ))}
        
        {/* Placeholder when no queries exist */}
        {queries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ExternalLink className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm">No queries executed yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryHistory;