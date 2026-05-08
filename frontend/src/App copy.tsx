import type {
  Machine,
  ProductionRecord,
  Operator,
  Part,
  DefectReason,
  DowntimeReasonItem,
  ProcessReason,
  ScheduledDowntime,
  PartProductionHistory,
  DowntimeEventHistory
} from '@/types';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { DataEntry } from '@/components/DataEntry';
import { MachineManagement } from '@/components/MachineManagement';
import { HistoricalData } from '@/components/HistoricalData';
import { Login } from '@/components/Login';
import { OperatorSetup, type OperatorSetupData } from '@/components/OperatorSetup';
import { OperatorManagement } from '@/components/OperatorManagement';
import { PartManagement } from '@/components/PartManagement';
import { ReasonManagement } from '@/components/ReasonManagement';
import { ScheduledDowntimeManagement } from '@/components/ScheduledDowntimeManagement';
import { Toaster } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Factory, Clock, Calendar, LogOut, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';


// Generate realistic sample data
const generateSampleData = (): ProductionRecord[] => {
  const sampleRecords: ProductionRecord[] = [];
  const machines = [
    { id: '1', name: 'Casting Machine A1', idealCycleTime: 2.5 },
    { id: '2', name: 'Casting Machine A2', idealCycleTime: 2.5 },
    { id: '3', name: 'Die Cast Machine B1', idealCycleTime: 3.0 },
    { id: '4', name: 'CNC Machine B1', idealCycleTime: 1.8 },
  ];
  const operators = ['John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 'Michael Brown'];
  const shifts: ('morning' | 'afternoon' | 'night')[] = ['morning', 'afternoon', 'night'];

  const today = new Date();
  for (let day = 14; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    shifts.forEach(shift => {
      machines.forEach(machine => {
        if (Math.random() > 0.15) {
          const plannedTime = 480;
          const downtime = Math.floor(Math.random() * 80) + 10;
          const operatingTime = plannedTime - downtime;
          const idealCount = Math.floor(operatingTime / machine.idealCycleTime);
          const actualCount = Math.floor(idealCount * (0.75 + Math.random() * 0.2));
          const targetOutput = Math.floor(idealCount * (0.9 + Math.random() * 0.1));
          const defectRate = 0.02 + Math.random() * 0.08;
          const defects = Math.floor(actualCount * defectRate);
          const counterStart = Math.floor(Math.random() * 10000);
          const counterEnd = counterStart + actualCount;

          sampleRecords.push({
            id: crypto.randomUUID(),
            machineId: machine.id,
            machineName: machine.name,
            date: dateStr,
            shift,
            plannedProductionTime: plannedTime,
            counterStart,
            counterEnd,
            totalCount: actualCount,
            targetOutput,
            performance: (actualCount / targetOutput) * 100,
            downtime,
            downtimeReason: downtime > 60 ? { category: 'Material', subcategory: 'Shortage' } : undefined,
            goodCount: actualCount - defects,
            defectCount: defects,
              
            // --- ADD THESE THREE LINES TO FIX THE ERROR ---
            grossCount: actualCount,
            excludedShots: 0,
            netProduction: actualCount,
            // ----------------------------------------------
              
            operatorName: operators[Math.floor(Math.random() * operators.length)],
            notes: downtime > 60 ? 'Extended downtime due to material shortage' : '',
            timestamp: date.getTime() + (shift === 'morning' ? 8 : shift === 'afternoon' ? 16 : 0) * 3600000,
          });
        }
      });
    });
  }

  return sampleRecords.sort((a, b) => b.timestamp - a.timestamp);
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('oee-authenticated');
    return saved === 'true';
  });

  const [currentUser, setCurrentUser] = useState<{ employeeId: string; role: 'operator' | 'manager' } | null>(() => {
    const saved = sessionStorage.getItem('oee-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginTimestamp, setLoginTimestamp] = useState<Date>(() => {
    const saved = sessionStorage.getItem('oee-login-timestamp');
    return saved ? new Date(saved) : new Date();
  });

  const defaultOperators: Operator[] = [
    { id: '1', name: 'John Smith', employeeId: 'EMP001', role: 'Senior Operator', active: true },
    { id: '2', name: 'Maria Garcia', employeeId: 'EMP002', role: 'Operator', active: true },
    { id: '3', name: 'David Chen', employeeId: 'EMP003', role: 'Operator', active: true },
    { id: '4', name: 'Sarah Johnson', employeeId: 'EMP004', role: 'Senior Operator', active: true },
    { id: '5', name: 'Michael Brown', employeeId: 'EMP005', role: 'Operator', active: true },
    { id: '6', name: 'Emily Davis', employeeId: 'EMP006', role: 'Operator', active: true },
    { id: '7', name: 'Robert Wilson', employeeId: 'EMP007', role: 'Lead Operator', active: true },
    { id: '8', name: 'Jennifer Lee', employeeId: 'EMP008', role: 'Operator', active: true },
  ];

  const defaultParts: Part[] = [
    {
      id: '1',
      name: 'Cylinder Head',
      partNumber: 'CH-001',
      cycleTime: 2.5,
      active: true,
      dies: [
        { id: '1', name: 'Die #1', dieNumber: 'D001' },
        { id: '2', name: 'Die #2', dieNumber: 'D002' },
        { id: '3', name: 'Die #3', dieNumber: 'D003' },
      ]
    },
    {
      id: '2',
      name: 'Engine Block',
      partNumber: 'EB-001',
      cycleTime: 3.0,
      active: true,
      dies: [
        { id: '4', name: 'Die #5', dieNumber: 'D005' },
        { id: '5', name: 'Die #8', dieNumber: 'D008' },
      ]
    },
    {
      id: '3',
      name: 'Transmission Case',
      partNumber: 'TC-001',
      cycleTime: 2.8,
      active: true,
      dies: [
        { id: '6', name: 'Die #4', dieNumber: 'D004' },
        { id: '7', name: 'Die #6', dieNumber: 'D006' },
      ]
    },
    { id: '4', name: 'Brake Caliper', partNumber: 'BC-001', cycleTime: 1.8, active: true, dies: [] },
    { id: '5', name: 'Wheel Hub', partNumber: 'WH-001', cycleTime: 2.0, active: true, dies: [] },
    { id: '6', name: 'Oil Pan', partNumber: 'OP-001', cycleTime: 2.2, active: true, dies: [] },
    { id: '7', name: 'Valve Cover', partNumber: 'VC-001', cycleTime: 1.5, active: true, dies: [] },
    { id: '8', name: 'Manifold', partNumber: 'MF-001', cycleTime: 1.7, active: true, dies: [] },
  ];

  const defaultMachines: Machine[] = [
    { id: '1', name: 'Casting Machine A1', machineId: 'M-CAST-001', type: 'casting', idealCycleTime: 2.5, defaultShiftTime: 480, status: 'running', supportedParts: ['1', '2', '3'], active: true },
    { id: '2', name: 'Casting Machine A2', machineId: 'M-CAST-002', type: 'casting', idealCycleTime: 2.5, defaultShiftTime: 480, status: 'maintenance', supportedParts: ['1', '2'], active: true },
    { id: '3', name: 'Die Cast Machine B1', machineId: 'M-CAST-003', type: 'casting', idealCycleTime: 3.0, defaultShiftTime: 480, status: 'running', supportedParts: ['2', '3'], active: true },
    { id: '4', name: 'CNC Machine B1', machineId: 'M-MACH-001', type: 'machining', idealCycleTime: 1.8, defaultShiftTime: 480, status: 'running', supportedParts: ['4', '5'], active: true },
    { id: '5', name: 'CNC Machine B2', machineId: 'M-MACH-002', type: 'machining', idealCycleTime: 2.0, defaultShiftTime: 480, status: 'running', supportedParts: ['5', '6'], active: true },
    { id: '6', name: 'Milling Machine C1', machineId: 'M-MACH-003', type: 'machining', idealCycleTime: 2.2, defaultShiftTime: 480, status: 'idle', supportedParts: ['6', '7'], active: true },
    { id: '7', name: 'Drilling Machine D1', machineId: 'M-MACH-004', type: 'machining', idealCycleTime: 1.5, defaultShiftTime: 480, status: 'running', supportedParts: ['7', '8'], active: true },
    { id: '8', name: 'Finishing Machine E2', machineId: 'M-MACH-005', type: 'machining', idealCycleTime: 1.7, defaultShiftTime: 480, status: 'running', supportedParts: ['4', '8'], active: true },
  ];

  const defaultDefectReasons: DefectReason[] = [
    { id: '1', category: 'Casting Defect', subcategory: 'Porosity', specificReason: 'Surface Porosity', machineTypes: ['casting'], active: true },
    { id: '2', category: 'Casting Defect', subcategory: 'Porosity', specificReason: 'Internal Porosity', machineTypes: ['casting'], active: true },
    { id: '3', category: 'Casting Defect', subcategory: 'Surface Defect', specificReason: 'Cold Shut', machineTypes: ['casting'], active: true },
    { id: '4', category: 'Casting Defect', subcategory: 'Surface Defect', specificReason: 'Flash', machineTypes: ['casting'], active: true },
    { id: '5', category: 'Casting Defect', subcategory: 'Dimensional', specificReason: 'Warpage', machineTypes: ['casting'], active: true },
    { id: '6', category: 'Machining Defect', subcategory: 'Tool Related', specificReason: 'Tool Breakage Mark', machineTypes: ['machining'], active: true },
    { id: '7', category: 'Machining Defect', subcategory: 'Tool Related', specificReason: 'Worn Cutting Tool', machineTypes: ['machining'], active: true },
    { id: '8', category: 'Machining Defect', subcategory: 'Surface Finish', specificReason: 'Rough Surface', machineTypes: ['machining'], active: true },
    { id: '9', category: 'Machining Defect', subcategory: 'Dimensional', specificReason: 'Out of Tolerance', machineTypes: ['machining'], active: true },
    { id: '10', category: 'Material Defect', subcategory: 'Raw Material', specificReason: 'Material Contamination', active: true },
  ];

  const defaultDowntimeReasons: DowntimeReasonItem[] = [
    // Machine (Level 1)
    { id: 'dt1', level: 1, name: 'Machine', active: true },
    { id: 'dt1-1', level: 2, parentId: 'dt1', name: 'Die', active: true },
    { id: 'dt1-1-1', level: 3, parentId: 'dt1-1', name: 'Ejector', active: true },
    { id: 'dt1-1-1-1', level: 4, parentId: 'dt1-1-1', name: 'Ejector Pin Broken', active: true },
    { id: 'dt1-1-2', level: 3, parentId: 'dt1-1', name: 'Core', active: true },
    { id: 'dt1-1-2-1', level: 4, parentId: 'dt1-1-2', name: 'Core Stuck', active: true },
    { id: 'dt1-2', level: 2, parentId: 'dt1', name: 'Hydraulic System', active: true },
    { id: 'dt1-2-1', level: 3, parentId: 'dt1-2', name: 'Pump', active: true },
    { id: 'dt1-2-2', level: 3, parentId: 'dt1-2', name: 'Valve', active: true },

    // Material (Level 1)
    { id: 'dt2', level: 1, name: 'Material', active: true },
    { id: 'dt2-1', level: 2, parentId: 'dt2', name: 'Shortage', active: true },
    { id: 'dt2-2', level: 2, parentId: 'dt2', name: 'Quality Issue', active: true },

    // Setup (Level 1)
    { id: 'dt3', level: 1, name: 'Setup', active: true },
    { id: 'dt3-1', level: 2, parentId: 'dt3', name: 'Die Change', requiresExtraField: true, extraFieldLabel: 'New Die Number', active: true },
    { id: 'dt3-2', level: 2, parentId: 'dt3', name: 'Part Change', active: true },

    // Quality (Level 1)
    { id: 'dt4', level: 1, name: 'Quality', active: true },
    { id: 'dt4-1', level: 2, parentId: 'dt4', name: 'Inspection', active: true },
    { id: 'dt4-2', level: 2, parentId: 'dt4', name: 'Adjustment', active: true },
  ];

  const defaultProcessReasons: ProcessReason[] = [
    { id: 'pr1', name: 'Material Issue', description: 'Raw material quality or availability problem', active: true },
    { id: 'pr2', name: 'Operator Issue', description: 'Operator-related delay or mistake', active: true },
    { id: 'pr3', name: 'Quality Check Issue', description: 'Additional quality verification needed', active: true },
    { id: 'pr4', name: 'Setup Issue', description: 'Machine or tool setup problem', active: true },
    { id: 'pr5', name: 'Process Adjustment', description: 'Parameter adjustment or optimization', active: true },
    { id: 'pr6', name: 'Engineering Trial', description: 'Test run or experimental production', active: true },
    { id: 'pr7', name: 'Warm-up Shot', description: 'Initial test shots before production', active: true },
    { id: 'pr8', name: 'Die Change', description: 'Die replacement or maintenance', active: true },
  ];

  const defaultScheduledDowntimes: ScheduledDowntime[] = [];

  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem('oee-operators-v2');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultOperators;
  });

  const [parts, setParts] = useState<Part[]>(() => {
    const saved = localStorage.getItem('oee-parts-v2');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultParts;
  });

  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('oee-machines-v2');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultMachines;
  });

  const [defectReasons, setDefectReasons] = useState<DefectReason[]>(() => {
    const saved = localStorage.getItem('oee-defect-reasons');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultDefectReasons;
  });

  const [downtimeReasons, setDowntimeReasons] = useState<DowntimeReasonItem[]>(() => {
    const saved = localStorage.getItem('oee-downtime-reasons');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultDowntimeReasons;
  });

  const [processReasons, setProcessReasons] = useState<ProcessReason[]>(() => {
    const saved = localStorage.getItem('oee-process-reasons');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultProcessReasons;
  });

  const [scheduledDowntimes, setScheduledDowntimes] = useState<ScheduledDowntime[]>(() => {
    const saved = localStorage.getItem('oee-scheduled-downtimes');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultScheduledDowntimes;
  });

  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem('oee-production-records');
    if (saved) {
      return JSON.parse(saved);
    }
    const sampleData = generateSampleData();
    localStorage.setItem('oee-production-records', JSON.stringify(sampleData));
    return sampleData;
  });

  const [partProductionHistory, setPartProductionHistory] = useState<PartProductionHistory[]>(() => {
    const saved = localStorage.getItem('oee-part-production-history');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [downtimeEventHistory, setDowntimeEventHistory] = useState<DowntimeEventHistory[]>(() => {
    const saved = localStorage.getItem('oee-downtime-event-history');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });

  const [operatorSetup, setOperatorSetup] = useState<OperatorSetupData | null>(null);
  const [showOperatorSetup, setShowOperatorSetup] = useState(false);
  const [setupMode, setSetupMode] = useState<'new' | 'edit' | 'partcast-change'>('new');

  useEffect(() => {
    localStorage.setItem('oee-operators-v2', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('oee-parts-v2', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('oee-machines-v2', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('oee-production-records', JSON.stringify(productionRecords));
  }, [productionRecords]);

  useEffect(() => {
    localStorage.setItem('oee-defect-reasons', JSON.stringify(defectReasons));
  }, [defectReasons]);

  useEffect(() => {
    localStorage.setItem('oee-downtime-reasons', JSON.stringify(downtimeReasons));
  }, [downtimeReasons]);

  useEffect(() => {
    localStorage.setItem('oee-process-reasons', JSON.stringify(processReasons));
  }, [processReasons]);

  useEffect(() => {
    localStorage.setItem('oee-scheduled-downtimes', JSON.stringify(scheduledDowntimes));
  }, [scheduledDowntimes]);

  useEffect(() => {
    localStorage.setItem('oee-part-production-history', JSON.stringify(partProductionHistory));
  }, [partProductionHistory]);

  useEffect(() => {
    localStorage.setItem('oee-downtime-event-history', JSON.stringify(downtimeEventHistory));
  }, [downtimeEventHistory]);

  const addProductionRecord = (record: Omit<ProductionRecord, 'id' | 'timestamp'>) => {
    const newRecord: ProductionRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setProductionRecords([newRecord, ...productionRecords]);
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    setMachines(machines.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addMachine = (machine: Omit<Machine, 'id'>) => {
    setMachines([...machines, { ...machine, id: crypto.randomUUID() }]);
  };

  const deleteMachine = (id: string) => {
    setMachines(machines.filter(m => m.id !== id));
  };

  const addOperator = (operator: Omit<Operator, 'id'>) => {
    setOperators([...operators, { ...operator, id: crypto.randomUUID() }]);
  };

  const updateOperator = (id: string, updates: Partial<Operator>) => {
    setOperators(operators.map(op => op.id === id ? { ...op, ...updates } : op));
  };

  const deleteOperator = (id: string) => {
    setOperators(operators.filter(op => op.id !== id));
  };

  const addPart = (part: Omit<Part, 'id'>) => {
    setParts([...parts, { ...part, id: crypto.randomUUID() }]);
  };

  const updatePart = (id: string, updates: Partial<Part>) => {
    setParts(parts.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const deleteProductionRecord = (id: string) => {
    setProductionRecords(productionRecords.filter(r => r.id !== id));
  };

  // Defect Reason Management
  const addDefectReason = (reason: Omit<DefectReason, 'id'>) => {
    setDefectReasons([...defectReasons, { ...reason, id: crypto.randomUUID() }]);
  };

  const updateDefectReason = (id: string, updates: Partial<DefectReason>) => {
    setDefectReasons(defectReasons.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteDefectReason = (id: string) => {
    setDefectReasons(defectReasons.filter(r => r.id !== id));
  };

  // Downtime Reason Management
  const addDowntimeReason = (reason: Omit<DowntimeReasonItem, 'id'>) => {
    setDowntimeReasons([...downtimeReasons, { ...reason, id: crypto.randomUUID() }]);
  };

  const updateDowntimeReason = (id: string, updates: Partial<DowntimeReasonItem>) => {
    setDowntimeReasons(downtimeReasons.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteDowntimeReason = (id: string) => {
    setDowntimeReasons(downtimeReasons.filter(r => r.id !== id));
  };

  // Process Reason Management
  const addProcessReason = (reason: Omit<ProcessReason, 'id'>) => {
    setProcessReasons([...processReasons, { ...reason, id: crypto.randomUUID() }]);
  };

  const updateProcessReason = (id: string, updates: Partial<ProcessReason>) => {
    setProcessReasons(processReasons.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteProcessReason = (id: string) => {
    setProcessReasons(processReasons.filter(r => r.id !== id));
  };

  // Scheduled Downtime Management
  const addScheduledDowntime = (downtime: Omit<ScheduledDowntime, 'id'>) => {
    setScheduledDowntimes([...scheduledDowntimes, { ...downtime, id: crypto.randomUUID() }]);
  };

  const updateScheduledDowntime = (id: string, updates: Partial<ScheduledDowntime>) => {
    setScheduledDowntimes(scheduledDowntimes.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteScheduledDowntime = (id: string) => {
    setScheduledDowntimes(scheduledDowntimes.filter(d => d.id !== id));
  };

  // Part Production History Management
  const addPartProductionHistory = (record: Omit<PartProductionHistory, 'id' | 'timestamp'>) => {
    const newRecord: PartProductionHistory = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setPartProductionHistory([newRecord, ...partProductionHistory]);
  };

  const deletePartProductionHistory = (id: string) => {
    setPartProductionHistory(partProductionHistory.filter(r => r.id !== id));
  };

  // Downtime Event History Management
  const addDowntimeEventHistory = (event: Omit<DowntimeEventHistory, 'id' | 'timestamp'>) => {
    const newEvent: DowntimeEventHistory = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setDowntimeEventHistory([newEvent, ...downtimeEventHistory]);
  };

  const deleteDowntimeEventHistory = (id: string) => {
    setDowntimeEventHistory(downtimeEventHistory.filter(e => e.id !== id));
  };

  const handleLogin = (employeeId: string, role: 'operator' | 'manager') => {
    const user = { employeeId, role };
    const timestamp = new Date();
    setCurrentUser(user);
    setLoginTimestamp(timestamp);
    setIsAuthenticated(true);
    sessionStorage.setItem('oee-authenticated', 'true');
    sessionStorage.setItem('oee-current-user', JSON.stringify(user));
    sessionStorage.setItem('oee-login-timestamp', timestamp.toISOString());

    // For operators, show the setup screen after login
    if (role === 'operator') {
      setShowOperatorSetup(true);
    }
  };

  const handleStartWork = (setupData: OperatorSetupData) => {
    setOperatorSetup(setupData);
    setShowOperatorSetup(false);
    setSetupMode('new');
  };

  const handleEditSetup = () => {
    setSetupMode('edit');
    setShowOperatorSetup(true);
  };

  const handleCheckOff = () => {
    // Save current production record if needed
    toast.success('Checked off successfully. Ready for next operator.');

    // Reset everything
    setOperatorSetup(null);
    setShowOperatorSetup(true);
    setSetupMode('new');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setOperatorSetup(null);
    setShowOperatorSetup(false);
    sessionStorage.removeItem('oee-authenticated');
    sessionStorage.removeItem('oee-current-user');
    sessionStorage.removeItem('oee-login-timestamp');
    toast.success('Logged out successfully');
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentShift = (): { name: string; color: string } => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 14) return { name: 'Morning Shift', color: 'bg-blue-500' };
    if (hour >= 14 && hour < 22) return { name: 'Afternoon Shift', color: 'bg-amber-500' };
    return { name: 'Night Shift', color: 'bg-indigo-500' };
  };

  const currentShift = getCurrentShift();
  const runningMachines = machines.filter(m => m.status === 'running').length;
  const totalMachines = machines.length;

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  // Show operator setup after operator login
  if (currentUser?.role === 'operator' && showOperatorSetup) {
    return (
      <>
        <OperatorSetup
          machines={machines}
          operators={operators}
          parts={parts}
          onStartWork={handleStartWork}
          existingSetup={setupMode !== 'new' ? operatorSetup || undefined : undefined}
          mode={setupMode}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shadow-lg">
          <div className="w-full px-6 md:px-12">
            <div className="flex items-center justify-between w-full"> {/* Added w-full */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">OEE Management System</h1>
                  <p className="text-sm text-slate-300">Casting Factory Production Monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold">{format(currentTime, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-mono font-semibold">{format(currentTime, 'HH:mm:ss')}</span>
                </div>
                <Badge className={`${currentShift.color} text-white px-3 py-1`}>
                  {currentShift.name}
                </Badge>
                <div className="text-sm">
                  <span className="text-slate-400">Machines:</span>
                  <span className="ml-2 font-semibold">
                    {runningMachines}/{totalMachines} Running
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-600"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {currentUser?.employeeId}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {currentUser?.role}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white h-12 px-6"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-6 md:px-12 py-8">
          <Tabs defaultValue={currentUser?.role === 'operator' ? 'entry' : 'dashboard'} className="space-y-6">
              {currentUser?.role === 'manager' ? (
                <TabsList className="grid w-full grid-cols-7 h-14"> {/* Removed max-w-6xl */}
                  <TabsTrigger value="dashboard" className="text-base h-full">Dashboard</TabsTrigger>
                  <TabsTrigger value="history" className="text-base h-full">History</TabsTrigger>
                  <TabsTrigger value="operators" className="text-base h-full">Operators</TabsTrigger>
                  <TabsTrigger value="machines" className="text-base h-full">Machines</TabsTrigger>
                  <TabsTrigger value="parts" className="text-base h-full">Parts</TabsTrigger>
                  <TabsTrigger value="reasons" className="text-base h-full">Reasons</TabsTrigger>
                  <TabsTrigger value="downtime" className="text-base h-full">Scheduled Downtime</TabsTrigger>
                </TabsList>
              ) : (
                <div className="w-full"> {/* Now spans the full canvas */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Operator Data Entry</h2>
                    <p className="text-blue-100">Record production data for your current shift</p>
                  </div>
                </div>
              )}

              {currentUser?.role === 'manager' && (
                <>
                  <TabsContent value="dashboard">
                    <Dashboard
                      machines={machines}
                      productionRecords={productionRecords}
                    />
                  </TabsContent>
                  <TabsContent value="history">
                    <HistoricalData
                      productionRecords={productionRecords}
                      partProductionHistory={partProductionHistory}
                      downtimeEventHistory={downtimeEventHistory}
                      machines={machines}
                      parts={parts}
                      operators={operators}
                      defectReasons={defectReasons}
                      onDeleteRecord={deleteProductionRecord}
                      onDeletePartHistory={deletePartProductionHistory}
                      onDeleteDowntimeEvent={deleteDowntimeEventHistory}
                      userRole={currentUser?.role || 'operator'}
                    />
                  </TabsContent>

                  <TabsContent value="machines">
                    <MachineManagement
                      machines={machines}
                      productionRecords={productionRecords}
                      parts={parts}
                      onUpdateMachine={updateMachine}
                      onAddMachine={addMachine}
                      onDeleteMachine={deleteMachine}
                      userRole={currentUser?.role || 'operator'}
                    />
                  </TabsContent>

                  <TabsContent value="operators">
                    <OperatorManagement
                      operators={operators}
                      onAddOperator={addOperator}
                      onUpdateOperator={updateOperator}
                      onDeleteOperator={deleteOperator}
                    />
                  </TabsContent>

                  <TabsContent value="parts">
                    <PartManagement
                      parts={parts}
                      onAddPart={addPart}
                      onUpdatePart={updatePart}
                      onDeletePart={deletePart}
                    />
                  </TabsContent>

                  <TabsContent value="reasons">
                    <ReasonManagement
                      defectReasons={defectReasons}
                      downtimeReasons={downtimeReasons}
                      processReasons={processReasons}
                      machines={machines}
                      parts={parts}
                      onAddDefectReason={addDefectReason}
                      onUpdateDefectReason={updateDefectReason}
                      onDeleteDefectReason={deleteDefectReason}
                      onAddDowntimeReason={addDowntimeReason}
                      onUpdateDowntimeReason={updateDowntimeReason}
                      onDeleteDowntimeReason={deleteDowntimeReason}
                      onAddProcessReason={addProcessReason}
                      onUpdateProcessReason={updateProcessReason}
                      onDeleteProcessReason={deleteProcessReason}
                    />
                  </TabsContent>

                  <TabsContent value="downtime">
                    <ScheduledDowntimeManagement
                      scheduledDowntimes={scheduledDowntimes}
                      machines={machines}
                      onAdd={addScheduledDowntime}
                      onUpdate={updateScheduledDowntime}
                      onDelete={deleteScheduledDowntime}
                    />
                  </TabsContent>
                </>
              )}

              {currentUser?.role === 'operator' && (
                <TabsContent value="entry">
                  <DataEntry
                    machines={machines}
                    onAddRecord={addProductionRecord}
                    onAddPartHistory={addPartProductionHistory}
                    onAddDowntimeEvent={addDowntimeEventHistory}
                    currentUser={currentUser}
                    loginTimestamp={loginTimestamp}
                    operatorSetup={operatorSetup || undefined}
                    onEditSetup={handleEditSetup}
                    onCheckOff={handleCheckOff}
                  />
                </TabsContent>
              )}
            </Tabs>
        </main>
      </div>
      <Toaster />
    </>
  );
}
