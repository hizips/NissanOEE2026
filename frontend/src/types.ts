export interface Machine {
  id: string;
  name: string;
  idealCycleTime: number; 
  status: 'running' | 'idle' | 'maintenance' | 'breakdown';
}

export interface ProductionRecord {
  id: string;
  machineId: string;
  machineName: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  plannedProductionTime: number; 
  downtime: number; 
  downtimeReason?: DowntimeReason;
  totalCount: number;
  goodCount: number;
  defectCount: number;
  operatorName: string;
  notes?: string;
  timestamp: number;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface DowntimeReason {
  category: string;
  subcategory: string;
  description?: string;
}
