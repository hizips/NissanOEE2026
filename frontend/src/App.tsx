import { useState, useEffect } from 'react';

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

// Generate realistic sample data
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
    if (saved) {
      return JSON.parse(saved);
    }
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
    
  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-2 bg-blue-600 rounded-lg cursor-help">
                        <Factory className="w-8 h-8" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>OEE Production Monitoring Platform</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div>
                  <h1 className="text-2xl font-bold">OEE Management System</h1>
                  <p className="text-sm text-slate-300">Casting Factory Production Monitoring</p>
                </div>
              </div>
              <TooltipProvider>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{format(currentTime, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-mono font-semibold">{format(currentTime, 'HH:mm:ss')}</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`${currentShift.color} text-white px-3 py-1 cursor-help`}>
                        {currentShift.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current shift based on time of day</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm cursor-help">
                        <span className="text-slate-400">Machines:</span>
                        <span className="ml-2 font-semibold">
                          {runningMachines}/{totalMachines} Running
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Currently active machines out of total</p>
                    </TooltipContent>
                  </Tooltip>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleLogout}
                          className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white h-12 px-6"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-semibold">Logout</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sign out from the system</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <TooltipProvider>
            <Tabs defaultValue={currentUser?.role === 'operator' ? 'entry' : 'dashboard'} className="space-y-6">
              {currentUser?.role === 'manager' ? (
                <TabsList className="grid w-full grid-cols-4 max-w-2xl h-14">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="dashboard" className="text-base h-full">Dashboard</TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View real-time performance metrics and alerts</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="entry" className="text-base h-full">Data Entry</TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Record production data for current shift</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="history" className="text-base h-full">History</TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View historical production records</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger value="machines" className="text-base h-full">Machines</TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage machine settings and performance</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              ) : (
                <div className="max-w-2xl">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Operator Data Entry</h2>
                    <p className="text-blue-100">Record production data for your current shift</p>
                  </div>
                </div>
              )}

              {currentUser?.role === 'manager' && (
                <TabsContent value="dashboard">
                  <Dashboard
                    machines={machines}
                    productionRecords={productionRecords}
                  />
                </TabsContent>
              )}

              <TabsContent value="entry">
                <DataEntry
                  machines={machines}
                  onAddRecord={addProductionRecord}
                  currentUser={currentUser}
                  loginTimestamp={loginTimestamp}
                />
              </TabsContent>

              {currentUser?.role === 'manager' && (
                <>
                  <TabsContent value="history">
                    <HistoricalData
                      productionRecords={productionRecords}
                      machines={machines}
                      onDeleteRecord={deleteProductionRecord}
                      userRole={currentUser?.role || 'operator'}
                    />
                  </TabsContent>

                  <TabsContent value="machines">
                    <MachineManagement
                      machines={machines}
                      productionRecords={productionRecords}
                      onUpdateMachine={updateMachine}
                      onAddMachine={addMachine}
                      onDeleteMachine={deleteMachine}
                      userRole={currentUser?.role || 'operator'}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </TooltipProvider>
        </main>
      </div>
      <Toaster />
    </>
  );
}
