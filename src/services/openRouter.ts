import { Table } from '../types';

export async function getSQLFromNaturalLanguage(
  prompt: string, 
  apiKey: string,
  schema?: { tables: Table[] }
): Promise<string> {
  const styleInstruction = 'Use HolyWells style: SQL keywords in UPPERCASE, table and column names in lowercase, use aliases where helpful, format as a single-line SQL query with clear spacing.';

  const systemMessage = schema 
    ? `You are a SQL expert. Convert this natural language request into a clean, one-line SQL query in HolyWells style for the following schema: ${JSON.stringify(schema)}. ${styleInstruction}`
    : `You are a SQL expert. Convert this natural language request into a clean, one-line SQL query in HolyWells style. ${styleInstruction}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistralai/devstral-small:free',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: `Convert this to SQL (return only the SQL query, no explanations):\n\n${prompt}`
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to generate SQL');
  }

  let rawOutput = data.choices?.[0]?.message?.content || '';
  // Clean up the output
  rawOutput = rawOutput
    .replace(/```sql|```/g, '')  // Remove code blocks
    .replace(/--.*$/gm, '')      // Remove comments
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim();
    
  return rawOutput;
}
