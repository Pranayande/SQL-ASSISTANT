export interface Table {
  name: string;
  id: string;
  columns: Column[];
  expanded?: boolean;
  database?: string;
}

export interface Column {
  name: string;
  type: string;
}

export interface Query {
  id: string;
  timestamp: string;
  sql: string;
  executionTime: string;
  rows: number;
}

export interface Schema {
  tables: Table[];
}