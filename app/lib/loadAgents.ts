import { Agent } from '../types/agent';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'app', 'data');

/**
 * Load all agent JSON files from the data directory
 * In dev mode (DEV_MODE=true), loads from example-agents.json
 * In production mode, loads individual agent JSON files (excluding example-agents.json)
 */
export function loadAgentsSync(): Agent[] {
  const isDevMode = process.env.DEV_MODE === 'true';
  
  if (isDevMode) {
    // Load example agents for development/testing
    const examplePath = path.join(DATA_DIR, 'example-agents.json');
    if (fs.existsSync(examplePath)) {
      const data = fs.readFileSync(examplePath, 'utf-8');
      return normalizeAgents(JSON.parse(data));
    }
    return [];
  }
  
  // Production mode: load individual agent files
  const agents: Agent[] = [];
  
  try {
    const files = fs.readdirSync(DATA_DIR);
    
    for (const file of files) {
      // Skip example-agents.json and non-JSON files
      if (file === 'example-agents.json' || !file.endsWith('.json')) {
        continue;
      }
      
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        const agent = JSON.parse(data);
        
        // Normalize the agent data (handle missing status/lastChecked)
        const normalizedAgent = normalizeAgent(agent);
        agents.push(normalizedAgent);
      } catch (error) {
        console.error(`Error loading agent from ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error reading data directory:', error);
  }
  
  return agents;
}

/**
 * Async version for API routes
 */
export async function loadAgents(): Promise<Agent[]> {
  const fsPromises = await import('fs/promises');
  const isDevMode = process.env.DEV_MODE === 'true';
  
  if (isDevMode) {
    // Load example agents for development/testing
    const examplePath = path.join(DATA_DIR, 'example-agents.json');
    try {
      const data = await fsPromises.readFile(examplePath, 'utf-8');
      return normalizeAgents(JSON.parse(data));
    } catch {
      return [];
    }
  }
  
  // Production mode: load individual agent files
  const agents: Agent[] = [];
  
  try {
    const files = await fsPromises.readdir(DATA_DIR);
    
    for (const file of files) {
      // Skip example-agents.json and non-JSON files
      if (file === 'example-agents.json' || !file.endsWith('.json')) {
        continue;
      }
      
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = await fsPromises.readFile(filePath, 'utf-8');
        const agent = JSON.parse(data);
        
        // Normalize the agent data (handle missing status/lastChecked)
        const normalizedAgent = normalizeAgent(agent);
        agents.push(normalizedAgent);
      } catch (error) {
        console.error(`Error loading agent from ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error reading data directory:', error);
  }
  
  return agents;
}

/**
 * Normalize agent data - set defaults for optional status fields
 * Agent developers can leave status and lastChecked blank
 */
function normalizeAgent(agent: Partial<Agent>): Agent {
  return {
    ...agent,
    status: agent.status || 'unknown',
    lastChecked: agent.lastChecked || '',
  } as Agent;
}

/**
 * Normalize an array of agents
 */
function normalizeAgents(agents: Partial<Agent>[]): Agent[] {
  return agents.map(normalizeAgent);
}

/**
 * Save an agent back to its individual JSON file
 */
export async function saveAgent(agent: Agent): Promise<void> {
  const fsPromises = await import('fs/promises');
  
  // Generate filename from agent name (slugify)
  const filename = agent.agentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.json';
  
  const filePath = path.join(DATA_DIR, filename);
  
  await fsPromises.writeFile(filePath, JSON.stringify(agent, null, 2), 'utf-8');
}

/**
 * Get the file path for an agent by address
 */
export async function findAgentFile(agentAddress: string): Promise<string | null> {
  const fsPromises = await import('fs/promises');
  
  try {
    const files = await fsPromises.readdir(DATA_DIR);
    
    for (const file of files) {
      if (file === 'example-agents.json' || !file.endsWith('.json')) {
        continue;
      }
      
      const filePath = path.join(DATA_DIR, file);
      const data = await fsPromises.readFile(filePath, 'utf-8');
      const agent = JSON.parse(data);
      
      if (agent.agentAddress?.toLowerCase() === agentAddress.toLowerCase()) {
        return filePath;
      }
    }
  } catch (error) {
    console.error('Error finding agent file:', error);
  }
  
  return null;
}
