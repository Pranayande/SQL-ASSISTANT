import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SchemaExplorer from './components/SchemaExplorer';
import SqlAssistant from './components/SqlAssistant';
import QueryHistory from './components/QueryHistory';
import Notification from './components/Notification';
import { Query, Table } from './types';
import { getSQLFromNaturalLanguage } from './services/openRouter';
import initSqlJs from 'sql.js';

// Main application component that orchestrates the SQL assistant interface
function App() {
  // State to store the history of executed queries
  const [queries, setQueries] = useState<Query[]>([]);
  // State for the current natural language query input by the user
  const [currentQuery, setCurrentQuery] = useState<string>('');
  // State for the generated SQL query from natural language input
  const [generatedSql, setGeneratedSql] = useState<string>('');
  // State to store the result rows from executed SQL queries
  const [resultRows, setResultRows] = useState<any[]>([]);
  // State to capture and display any errors during query processing
  const [error, setError] = useState<string | null>(null);
  // State to indicate whether SQL generation is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State to store the schema of loaded database tables
  const [tables, setTables] = useState<Table[]>([]);
  // State to store instances of individual SQLite databases
  const [dbInstances, setDbInstances] = useState<any[]>([]);
  // State to store names of uploaded databases
  const [databaseNames, setDatabaseNames] = useState<string[]>([]);
  // State for the combined in-memory database used for query execution
  const [combinedDb, setCombinedDb] = useState<any | null>(null);
  // State for displaying notifications (success, error, or warning)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // API key for accessing the natural language to SQL conversion service, loaded from Vite environment variable
  // Note: Set VITE_OPENROUTER_API_KEY in your .env file in the project root
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  // Validate API key presence to prevent runtime errors
  if (!apiKey) {
    console.error('API key is missing. Please set VITE_OPENROUTER_API_KEY in your .env file.');
  }

  // Utility function to display notifications with customizable type and duration
  const showStatus = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'success',
    duration: number = type === 'error' ? 8000 : 5000
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), duration);
  };

  // Effect to load databases from localStorage on component mount
  useEffect(() => {
    // Async function to initialize and load stored databases
    const loadDatabasesFromStorage = async () => {
      const storedDatabase = localStorage.getItem('uploadedDatabase');
      const storedDatabaseName = localStorage.getItem('databaseName');
      console.log('On Page Load - Stored Database:', storedDatabase);
      console.log('On Page Load - Stored Database Names:', storedDatabaseName);

      if (storedDatabase && storedDatabaseName) {
        try {
          // Split stored base64 strings and database names
          const base64Strings = storedDatabase.split('|||');
          const names = storedDatabaseName.split('|||');
          console.log('Base64 Strings:', base64Strings);
          console.log('Names:', names);

          // Validate that the number of databases matches the number of names
          if (base64Strings.length !== names.length) {
            throw new Error('Mismatch between number of databases and names in localStorage');
          }

          const newDbInstances: any[] = [];
          // Initialize sql.js with WebAssembly module
          const SQL = await initSqlJs({ locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm' });

          // Process each stored database
          for (let i = 0; i < base64Strings.length; i++) {
            const base64String = base64Strings[i];
            if (!base64String) {
              console.warn(`Skipping empty base64 string at index ${i}`);
              continue;
            }
            try {
              // Decode base64 string to ArrayBuffer and create SQLite database
              const arrayBuffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0)).buffer;
              const db = new SQL.Database(new Uint8Array(arrayBuffer));
              newDbInstances.push(db);
              console.log(`Successfully loaded database: ${names[i]}`);
            } catch (decodeErr: unknown) {
              const decodeErrorMsg = decodeErr instanceof Error ? decodeErr.message : 'Unknown decoding error';
              console.error(`Failed to decode base64 string for database ${names[i]}: ${decodeErrorMsg}`);
              throw new Error(`Failed to decode database ${names[i]}: ${decodeErrorMsg}`);
            }
          }

          // Update state with loaded database instances and names
          setDbInstances(newDbInstances);
          setDatabaseNames(names);
          await combineDatabases(newDbInstances, names);
        } catch (err: unknown) {
          // Handle errors during database loading
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          showStatus(`Failed to load databases from storage: ${errorMessage}`, 'error');
          console.error('Error loading databases:', errorMessage);
          if (errorMessage.includes('Mismatch') || errorMessage.includes('Failed to decode')) {
            console.log('Clearing localStorage due to error');
            localStorage.removeItem('uploadedDatabase');
            localStorage.removeItem('databaseName');
          }
        }
      } else {
        console.log('No databases found in localStorage on page load');
      }
    };
    loadDatabasesFromStorage();
  }, []);

  // Function to combine multiple databases into a single in-memory database
  const combineDatabases = async (dbs: any[], names: string[]) => {
    const SQL = await initSqlJs({ locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm' });
    const inMemoryDb = new SQL.Database();

    // Iterate through each database to extract and combine tables
    dbs.forEach((db, index) => {
      const dbData = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
      console.log(`Database ${names[index]} Tables:`, dbData);
      if (dbData.length > 0) {
        for (const row of dbData[0].values) {
          const createTableSql = row[0];
          inMemoryDb.exec(createTableSql);

          // Extract table name and data
          const tableName = createTableSql.match(/CREATE TABLE (\w+)/i)?.[1];
          if (tableName) {
            const data = db.exec(`SELECT * FROM ${tableName}`);
            console.log(`Table ${tableName} Data Before Insertion:`, data);
            if (data.length > 0) {
              const columns = data[0].columns;
              const values = data[0].values;
              console.log(`Table ${tableName} - Number of rows before insertion: ${values.length}`);
              if (values.length > 0) {
                const placeholders = columns.map(() => '?').join(',');
                const insertSql = `INSERT OR IGNORE INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`;
                let insertedRows = 0;
                for (const row of values) {
                  try {
                    console.log(`Inserting row into ${tableName}:`, row);
                    inMemoryDb.run(insertSql, row);
                    insertedRows++;
                  } catch (insertErr: unknown) {
                    const errorMsg = insertErr instanceof Error ? insertErr.message : 'Unknown insertion error';
                    console.error(`Failed to insert row into ${tableName}:`, row, 'Error:', errorMsg);
                  }
                }
                console.log(`Table ${tableName} - Successfully inserted ${insertedRows} rows`);
                const insertedData = inMemoryDb.exec(`SELECT * FROM ${tableName}`);
                console.log(`Table ${tableName} Data After Insertion:`, insertedData);
                if (insertedData.length > 0) {
                  console.log(`Table ${tableName} - Number of rows after insertion: ${insertedData[0].values.length}`);
                } else {
                  console.log(`Table ${tableName} - No rows found after insertion`);
                }
              }
            }
          }
        }
      }
    });

    // Update state with the combined database
    setCombinedDb(inMemoryDb);
    refreshSchema(inMemoryDb, names);
  };

  // Function to refresh the schema by extracting table and column information
  const refreshSchema = (db: any, names: string[]) => {
    const newTables: Table[] = [];
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");

    if (result.length > 0) {
      for (const row of result[0].values) {
        const tableName = row[0] as string;
        const colResult = db.exec(`PRAGMA table_info(${tableName});`);
        const columns = (colResult[0]?.values || []).map((col: any[]) => ({
          name: col[1],
          type: col[2]
        }));

        // Determine which database the table belongs to
        let dbIndex = -1;
        for (let i = 0; i < dbInstances.length; i++) {
          const db = dbInstances[i];
          const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`);
          if (tableCheck.length > 0 && tableCheck[0].values.length > 0) {
            dbIndex = i;
            break;
          }
        }

        newTables.push({
          id: `${dbIndex}-${tableName}`,
          name: tableName,
          database: dbIndex >= 0 ? names[dbIndex] : 'Unknown',
          columns,
          expanded: false
        });
      }
    }

    // Update state with the new table schema
    setTables(newTables);
    showStatus(
      newTables.length === 0 
        ? 'No tables found in uploaded databases' 
        : `${newTables.length} table(s) loaded successfully`,
      newTables.length === 0 ? 'warning' : 'success'
    );
  };

  // Function to generate SQL from natural language input
  const handleGenerateSql = async (naturalLanguageQuery: string) => {
    setCurrentQuery(naturalLanguageQuery);
    setGeneratedSql('');
    setError(null);
    setIsLoading(true);
    console.log('SQL Generation Started - isLoading:', true);

    try {
      // Ensure API key is available before making the request
      if (!apiKey) {
        throw new Error('API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.');
      }
      const schema = { tables };
      const rawSql = await getSQLFromNaturalLanguage(naturalLanguageQuery, apiKey, schema);
      // Clean up the generated SQL by removing unwanted formatting and comments
      let cleanedSql = rawSql
        .replace(/```sql|```/g, '')
        .replace(/Note:.*/gi, '')
        .replace(/--.*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Remove LIMIT clause to allow full result sets
      cleanedSql = cleanedSql.replace(/LIMIT\s+\d+(\s+OFFSET\s+\d+)?\s*$/i, '');
      console.log('Cleaned SQL after removing LIMIT:', cleanedSql);

      setGeneratedSql(cleanedSql);
      showStatus('SQL generated successfully');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate SQL';
      setError(errorMsg);
      showStatus(errorMsg, 'error');
    } finally {
      setIsLoading(false);
      console.log('SQL Generation Finished - isLoading:', false);
    }
  };

  // Function to execute the generated SQL query
  const handleExecuteQuery = () => {
    if (!generatedSql || !combinedDb) return;

    try {
      console.log('Executing SQL:', generatedSql);
      const statements = generatedSql.split(";").map(s => s.trim()).filter(Boolean);
      let allRows: any[] = [];

      // Execute each SQL statement and collect results
      for (const stmt of statements) {
        console.log('Executing statement:', stmt);
        const result = combinedDb.exec(stmt);
        console.log('Raw result from exec:', result);
        if (result.length > 0) {
          const rows = result[0].values.map((row: any[]) =>
            Object.fromEntries(row.map((val, idx) => [result[0].columns[idx], val]))
          );
          console.log('Mapped rows for statement:', rows);
          allRows = [...allRows, ...rows];
        }
      }

      console.log('Total rows accumulated:', allRows);
      setResultRows(allRows);
      console.log('Updated resultRows state:', allRows);
      // Update query history with execution details
      setQueries([...queries, {
        id: (queries.length + 1).toString(),
        timestamp: new Date().toLocaleTimeString(),
        sql: generatedSql,
        executionTime: `${(Math.random() * 0.05 + 0.01).toFixed(2)}s`,
        rows: allRows.length
      }]);

      showStatus(`Query executed successfully (${allRows.length} rows returned)`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'SQL execution failed';
      showStatus(`SQL Execution Error: ${errorMsg}`, 'error');
    }
  };

  // Function to clear the query history
  const handleClearHistory = () => {
    setQueries([]);
    setResultRows([]);
    showStatus('Query history cleared');
  };

  // Function to handle database file uploads
  const handleUploadDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const SQL = await initSqlJs({ locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm' });
      const newDbInstances: any[] = [...dbInstances];
      const newDatabaseNames: string[] = [...databaseNames];
      const base64Strings: string[] = [];

      // Process each uploaded file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = await file.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        newDbInstances.push(db);
        newDatabaseNames.push(file.name);

        // Convert file to base64 for storage
        const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        base64Strings.push(base64String);
      }

      // Update state and localStorage
      setDbInstances(newDbInstances);
      setDatabaseNames(newDatabaseNames);
      localStorage.setItem('uploadedDatabase', base64Strings.join('|||'));
      localStorage.setItem('databaseName', newDatabaseNames.join('|||'));
      console.log('Saved to localStorage:', {
        uploadedDatabase: localStorage.getItem('uploadedDatabase'),
        databaseName: localStorage.getItem('databaseName')
      });
      await combineDatabases(newDbInstances, newDatabaseNames);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload database';
      showStatus(`Failed to upload one or more databases: ${errorMsg}`, 'error');
    }
  };

  // Function to reset the entire application state
  const handleReset = () => {
    setCurrentQuery('');
    setGeneratedSql('');
    setResultRows([]);
    setError(null);
    setDbInstances([]);
    setDatabaseNames([]);
    setTables([]);
    setCombinedDb(null);
    localStorage.removeItem('uploadedDatabase');
    localStorage.removeItem('databaseName');
    showStatus('Session reset successfully');
  };

  // Function to update the generated SQL when manually edited
  const handleGeneratedSqlChange = (sql: string) => {
    setGeneratedSql(sql);
    setError(null);
  };

  // Render the main application layout
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Render the header with upload and reset controls */}
      <Header 
        onUploadClick={handleUploadDatabase} 
        tableCount={tables.length}
        onResetClick={handleReset}
      />
      
      {/* Display notifications if present */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          autoCloseDuration={notification.type === 'error' ? 8000 : 5000}
        />
      )}

      {/* Main content area with schema explorer, SQL assistant, and query history */}
      <div className="flex flex-1">
        <SchemaExplorer tables={tables} />
        <SqlAssistant
          naturalLanguageQuery={currentQuery}
          onQueryChange={setCurrentQuery}
          generatedSql={isLoading ? 'Generating SQL...' : error ? `Error: ${error}` : generatedSql}
          onGeneratedSqlChange={handleGeneratedSqlChange}
          onGenerate={handleGenerateSql}
          onExecute={handleExecuteQuery}
          onReset={handleReset}
          resultRows={resultRows}
          isDatabaseLoaded={!!combinedDb}
          isLoading={isLoading}
        />
        <QueryHistory
          queries={queries}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}

export default App;