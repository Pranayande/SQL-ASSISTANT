import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Database } from 'lucide-react';
import { Table } from '../types';

// Props interface for the SchemaExplorer component
interface SchemaExplorerProps {
  tables: Table[];
}

// Component to display the database schema with expandable tables
const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ tables: incomingTables }) => {
  // State to manage the list of tables and their expanded state
  const [tables, setTables] = useState<Table[]>(incomingTables);

  // Effect to sync local state with incoming tables prop
  useEffect(() => {
    setTables(incomingTables);
  }, [incomingTables]);

  // Function to toggle the expanded state of a table
  const toggleTable = (id: string) => {
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, expanded: !table.expanded } : table
      )
    );
  };

  // Render the schema explorer panel
  return (
    <div className="w-64 glass-effect border-r border-gray-200/50 overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {/* Section title */}
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-500">Database Schema</h2>
        </div>
        {/* Placeholder when no tables are available */}
        {tables.length === 0 && (
          <div className="text-sm text-gray-400">No tables found in uploaded database.</div>
        )}
        {/* List of tables with expandable column details */}
        {tables.map(table => (
          <div key={table.id} className="mb-2">
            {/* Table name with toggle button */}
            <div 
              className="flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100/50 text-gray-700 transition-colors"
              onClick={() => toggleTable(table.id)}
            >
              <span className="mr-1">
                {table.expanded ? 
                  <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                }
              </span>
              <Database className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium">{table.name}</span>
            </div>
            
            {/* Column details displayed when table is expanded */}
            {table.expanded && (
              <div className="ml-9 border-l border-gray-200/50 pl-3 mt-1 animate-fade-in">
                {table.columns.map((column, idx) => (
                  <div key={idx} className="flex items-center py-1.5 text-xs">
                    <span className="text-gray-700 font-medium mr-2">{column.name}</span>
                    <span className="text-gray-400 italic">{column.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaExplorer;