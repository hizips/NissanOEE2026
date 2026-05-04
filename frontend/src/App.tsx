import { useState, useEffect } from 'react';
// decoupled types to prevent circular dependencies
import { Machine, ProductionRecord } from '@/types'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dashboard } from '@/components/Dashboard';
import { DataEntry } from '@/components/DataEntry';
import { MachineManagement } from '@/components/MachineManagement';
import { HistoricalData } from '@/components/HistoricalData';
import { Login } from '@/components/Login';
import { Toaster } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Factory, Clock, Calendar, LogOut, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Sample data generator remains here for local dev testing
const generateSampleData = (): ProductionRecord[] => {
  const sampleRecords: ProductionRecord[] = [];
  const machines = [
    { id: '1', name: 'Casting Machine A1', idealCycleTime: 2.5 },
    { id: '2', name: 'Casting Machine A2', idealCycleTime: 2.5 },
    { id: '3', name: 'Molding Machine B1', idealCycleTime: 3.0 },
    { id: '4', name: 'Core Machine C1', idealCycleTime: 1.8 },
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
          const defectRate = 0.02 + Math.random() * 0.08;
          const defects = Math.floor(actualCount * defectRate);

          sampleRecords.push({
            id: crypto.randomUUID(),
            machineId: machine.id,
            machineName: machine.name,
            date: dateStr,
            shift,
            plannedProductionTime: plannedTime,
            downtime,
            downtimeReason: downtime > 60 ? { category: 'Material', subcategory: 'Shortage' } : undefined,
            totalCount: actualCount,
            goodCount: actualCount - defects,
            defectCount: defects,
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
    return sessionStorage.getItem('oee-authenticated') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<{ employeeId: string; role: 'operator' | 'manager' } | null>(() => {
    const saved = sessionStorage.getItem('oee-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginTimestamp, setLoginTimestamp] = useState<Date>(() => {
    const saved = sessionStorage.getItem('oee-login-timestamp');
    return saved ? new Date(saved) : new Date();
  });

  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('oee-machines');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Casting Machine A1', idealCycleTime: 2.5, status: 'running' },
      { id: '2', name: 'Casting Machine A2', idealCycleTime: 2.5, status: 'maintenance' },
      { id: '3', name: 'Molding Machine B1', idealCycleTime: 3.0, status: 'running' },
      { id: '4', name: 'Core Machine C1', idealCycleTime: 1.8, status: 'running' },
    ];
  });

  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem('oee-production-records');
    if (saved) return JSON.parse(saved);
    const sampleData = generateSampleData();
    localStorage.setItem('oee-production-records', JSON.stringify(sampleData));
    return sampleData;
  });

  useEffect(() => {
    localStorage.setItem('oee-machines', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('oee-production-records', JSON.stringify(productionRecords));
  }, [productionRecords]);

  const addProductionRecord = (record: Omit<ProductionRecord, 'id' | 'timestamp'>) => {
    const newRecord: ProductionRecord = { ...record, id: crypto.randomUUID(), timestamp: Date.now() };
    setProductionRecords([newRecord, ...productionRecords]);
    toast.success('Production data recorded');
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

  const deleteProductionRecord = (id: string) => {
    setProductionRecords(productionRecords.filter(r => r.id !== id));
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
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.clear();
    toast.success('Logged out successfully');
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentShift = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 14) return { name: 'Morning Shift', color: 'bg-blue-500' };
    if (hour >= 14 && hour < 22) return { name: 'Afternoon Shift', color: 'bg-amber-500' };
    return { name: 'Night Shift', color: 'bg-indigo-500' };
  };

  const currentShift = getCurrentShift();
  const runningMachines = machines.filter(m => m.status === 'running').length;

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg"><Factory className="w-6 h-6" /></div>
              <h1 className="text-xl font-bold tracking-tight">OEE Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-4 text-slate-300">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{format(currentTime, 'MMM dd')}</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{format(currentTime, 'HH:mm:ss')}</span>
                <Badge className={`${currentShift.color} text-white border-none`}>{currentShift.name}</Badge>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{currentUser?.employeeId}</p>
                  <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs defaultValue={currentUser?.role === 'operator' ? 'entry' : 'dashboard'} className="space-y-8">
            {currentUser?.role === 'manager' && (
              <TabsList className="bg-slate-200/50 p-1 rounded-xl h-12 inline-flex">
                <TabsTrigger value="dashboard" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="entry" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Data Entry</TabsTrigger>
                <TabsTrigger value="history" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
                <TabsTrigger value="machines" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Machines</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="dashboard" className="mt-0">
              <Dashboard machines={machines} productionRecords={productionRecords} />
            </TabsContent>

            <TabsContent value="entry" className="mt-0">
              <DataEntry machines={machines} onAddRecord={addProductionRecord} currentUser={currentUser} loginTimestamp={loginTimestamp} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoricalData productionRecords={productionRecords} machines={machines} onDeleteRecord={deleteProductionRecord} userRole={currentUser?.role || 'operator'} />
            </TabsContent>

            <TabsContent value="machines" className="mt-0">
              <MachineManagement machines={machines} productionRecords={productionRecords} onUpdateMachine={updateMachine} onAddMachine={addMachine} onDeleteMachine={deleteMachine} userRole={currentUser?.role || 'operator'} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}