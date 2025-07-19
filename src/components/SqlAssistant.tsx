import React from 'react';
import { Sparkles, Copy, RotateCcw, PlayCircle, Download } from 'lucide-react';

// Props interface for the SqlAssistant component
interface SqlAssistantProps {
  naturalLanguageQuery: string;
  onQueryChange: (query: string) => void;
  generatedSql: string;
  onGeneratedSqlChange: (sql: string) => void;
  onGenerate: (query: string) => void;
  onExecute: () => void;
  onReset?: () => void; // Optional prop for full session reset, not used for query reset
  resultRows?: any[];
  isDatabaseLoaded: boolean;
  isLoading?: boolean;
}

// Component to handle natural language query input, SQL generation, and query execution
const SqlAssistant: React.FC<SqlAssistantProps> = ({
  naturalLanguageQuery,
  onQueryChange,
  generatedSql,
  onGeneratedSqlChange,
  onGenerate,
  onExecute,
  onReset, // Keep this prop, even if not used
  resultRows = [],
  isDatabaseLoaded,
  isLoading = false,
}) => {
  // Function to trigger SQL generation from natural language query
  const handleGenerateSql = () => {
    if (naturalLanguageQuery.trim()) {
      onGenerate(naturalLanguageQuery);
    }
  };

  // Function to copy generated SQL to clipboard
  const handleCopyToClipboard = () => {
    if (generatedSql) {
      navigator.clipboard.writeText(generatedSql);
    }
  };

  // Function to reset only the natural language query and generated SQL
  const handleReset = () => {
    onQueryChange('');
    onGeneratedSqlChange('');
  };

  // Function to export query results in various formats (CSV, JSON, SQL)
  const handleExport = (format: string) => {
    if (resultRows.length === 0) return;

    let content = '';
    const headers = Object.keys(resultRows[0]);
    const filename = `query_result.${format}`;

    switch (format) {
      case 'csv':
        // Generate CSV content
        content = headers.join(',') + '\n';
        content += resultRows.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const str = value.toString();
            return `"${str.replace(/"/g, '""')}"`;
          }).join(',')
        ).join('\n');
        break;

      case 'json':
        //
        break;

      case 'sql':
        // Generate SQL insert statements
        const tableName = 'query_results';
        content = `CREATE TABLE ${tableName} (\n`;
        content += headers.map(header => `  ${header} TEXT`).join(',\n');
        content += '\n);\n\n';
        content += resultRows.map(row => {
          const values = headers.map(header => {
            const value = row[header];
            return value !== null && value !== undefined 
              ? `'${value.toString().replace(/'/g, "''")}'` 
              : 'NULL';
          }).join(', ');
          return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values});`;
        }).join('\n');
        break;

      default:
        return;
    }

    // Create and trigger download of the exported file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render the SQL assistant panel
  return (
    <div className="flex-1 flex flex-col p-6 gradient-bg overflow-y-auto">
      {/* Warning message when no database is loaded */}
      {!isDatabaseLoaded && (
        <div className="mb-6 p-4 bg-yellow-100/80 backdrop-blur text-yellow-800 rounded-xl text-sm animate-fade-in">
          Please upload at least one database to enable SQL generation and execution.
        </div>
      )}

      {/* Natural language query input section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Natural Language Query</h3>
        <div className="relative animate-fade-in">
          <textarea
            value={naturalLanguageQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Example: Show all employees in the Sales department ordered by hire date"
            className="w-full bg-white/80 backdrop-blur text-gray-900 p-4 rounded-xl border border-gray-200/50 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm text-sm resize-none"
          />
          <button
            onClick={handleGenerateSql}
            disabled={!naturalLanguageQuery.trim() || !isDatabaseLoaded || isLoading}
            className={`absolute bottom-3 right-3 px-4 py-2 rounded-lg flex items-center text-sm transition-all shadow-md hover:shadow-lg ${
              !naturalLanguageQuery.trim() || !isDatabaseLoaded || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="10"
                    cy="10"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate SQL
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Generated SQL display section */}
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Generated SQL</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyToClipboard}
              disabled={!generatedSql}
              className={`p-2 rounded transition-colors ${
                !generatedSql ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Copy SQL"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset} // Use local handleReset to clear only queries, not the full session
              className="text-gray-600 hover:text-gray-900 p-2 rounded transition-colors hover:bg-gray-100"
              title="Reset Query and SQL"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="code-area mb-4 shadow-lg">
          <pre className="text-sm font-mono">
            {generatedSql || '-- SQL query will appear here'}
          </pre>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onExecute}
            disabled={!generatedSql || !isDatabaseLoaded || isLoading}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
              !generatedSql || !isDatabaseLoaded || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Execute
          </button>
        </div>
      </div>
      
      {/* Query results table and export options */}
      {resultRows.length > 0 && (
        <div className="mt-6 glass-effect rounded-xl overflow-hidden shadow-lg animate-fade-in">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Query Result</h3>
              <div className="relative group">
                <button
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  onClick={() => document.getElementById('export-dropdown')?.classList.toggle('hidden')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
                <div
                  id="export-dropdown"
                  className="hidden absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 group-hover:block hover:block border border-gray-200"
                  onMouseLeave={() => document.getElementById('export-dropdown')?.classList.add('hidden')}
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 flex items-center"
                    >
                      <span className="font-medium">CSV File</span>
                      <span className="text-xs text-gray-500 ml-2">(.csv)</span>
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 flex items-center"
                    >
                      <span className="font-medium">JSON File</span>
                      <span className="text-xs text-gray-500 ml-2">(.json)</span>
                    </button>
                    <button
                      onClick={() => handleExport('sql')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 flex items-center"
                    >
                      <span className="font-medium">SQL File</span>
                      <span className="text-xs text-gray-500 ml-2">(.sql)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead>
                  <tr className="bg-gray-50/50">
                    {Object.keys(resultRows[0]).map((column, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {resultRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                      {Object.values(row).map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {cell !== null && cell !== undefined ? cell.toString() : 'NULL'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqlAssistant;