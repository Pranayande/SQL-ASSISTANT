import { Database, Sparkles, Upload, RotateCcw, History } from 'lucide-react';

// Props interface for the Header component
interface HeaderProps {
  onUploadClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tableCount: number;
  onResetClick?: () => void;
  onHistoryClick?: () => void;
}

// Component to render the application header with controls
const Header: React.FC<HeaderProps> = ({ 
  onUploadClick, 
  tableCount,
  onResetClick,
  onHistoryClick
}) => {
  // Render the header with title, table count, and action buttons
  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left section with title and table count */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            <h1 className="text-gray-900 font-medium text-lg">Schema Explorer</h1>
            <span className="ml-2 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {tableCount} {tableCount === 1 ? 'table' : 'tables'}
            </span>
          </div>

          {/* SQL Assistant title */}
          <div className="flex items-center text-blue-600 border-l border-gray-200 pl-4">
            <Sparkles className="w-5 h-5 mr-2" />
            <h2 className="text-gray-900 font-medium text-lg">SequelFlow</h2>
          </div>
        </div>

        {/* Right section with action buttons */}
        <div className="flex space-x-2 items-center">
          {/* Database upload button */}
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-1" />
            Upload Database
            <input type="file" accept=".sqlite,.db" onChange={onUploadClick} className="hidden" multiple />
          </label>
          {/* Reset session button */}
          <button
            onClick={onResetClick}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset Session
          </button>
          {/* Query history button */}
          <button
            onClick={onHistoryClick}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded flex items-center text-sm transition-colors"
          >
            <History className="w-4 h-4 mr-1" />
            Query History
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;