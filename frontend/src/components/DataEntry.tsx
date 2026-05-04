import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Machine, ProductionRecord } from '@/types';
import {
  ClipboardCheck,
  Save,
  Activity,
  AlertCircle,
  Wrench,
  Zap,
  Package,
  Settings,
  TestTube,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MachineSelector } from '@/components/MachineSelector';

interface DataEntryProps {
  machines: Machine[];
  onAddRecord: (record: Omit<ProductionRecord, 'id' | 'timestamp'>) => void;
  currentUser: { employeeId: string; role: 'operator' | 'manager' } | null;
  loginTimestamp: Date;
}

interface FormData {
  machineId: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  plannedProductionTime: number;
  downtime: number;
  totalCount: number;
  goodCount: number;
  operatorName: string;
  notes: string;
}

// Comprehensive 3-level fault hierarchy
const faultHierarchy: Record<string, {
  icon: any;
  color: string;
  subcategories: Record<string, string[]>;
}> = {
  'No Issue': {
    icon: CheckCircle,
    color: 'bg-green-600',
    subcategories: {},
  },
  'Mechanical Issue': {
    icon: Wrench,
    color: 'bg-red-600',
    subcategories: {
      'Bearing failure': [
        'Overheating',
        'Excessive wear',
        'Lubrication issue',
        'Contamination',
        'Improper installation',
      ],
      'Motor issue': [
        'Overheating',
        'Failure to start',
        'Abnormal noise',
        'Vibration',
        'Speed variation',
      ],
      'Tool wear': [
        'Blade dulling',
        'Cutting edge damage',
        'Surface degradation',
        'Dimensional change',
        'Complete failure',
      ],
      'Conveyor jam': [
        'Material blockage',
        'Belt misalignment',
        'Roller malfunction',
        'Foreign object',
        'Product accumulation',
      ],
      'Hydraulic leak': [
        'Hose failure',
        'Seal damage',
        'Fitting loose',
        'Cylinder leak',
        'Pump issue',
      ],
      'Pneumatic issue': [
        'Air leak',
        'Pressure loss',
        'Valve failure',
        'Actuator problem',
        'Compressor issue',
      ],
      'Other mechanical': [
        'General wear',
        'Alignment issue',
        'Component failure',
        'Structural problem',
        'Unknown cause',
      ],
    },
  },
  'Electrical Issue': {
    icon: Zap,
    color: 'bg-yellow-600',
    subcategories: {
      'Power loss': [
        'Main power outage',
        'Circuit breaker trip',
        'Fuse blown',
        'Transformer issue',
        'Voltage drop',
      ],
      'Sensor failure': [
        'Proximity sensor',
        'Temperature sensor',
        'Pressure sensor',
        'Photo eye',
        'Encoder failure',
      ],
      'Control system error': [
        'PLC malfunction',
        'HMI freeze',
        'Software crash',
        'Communication error',
        'Program error',
      ],
      'Wiring issue': [
        'Cable damage',
        'Loose connection',
        'Short circuit',
        'Corrosion',
        'Insulation failure',
      ],
      'Motor electrical': [
        'Winding failure',
        'Starter problem',
        'Drive malfunction',
        'Overload trip',
        'Phase imbalance',
      ],
      'Other electrical': [
        'Lighting failure',
        'Emergency stop',
        'Safety circuit',
        'Grounding issue',
        'Unknown cause',
      ],
    },
  },
  'Material Issue': {
    icon: Package,
    color: 'bg-orange-600',
    subcategories: {
      'Material shortage': [
        'Stock depletion',
        'Supply delay',
        'Inventory error',
        'Transportation delay',
        'Supplier issue',
      ],
      'Wrong material': [
        'Incorrect specification',
        'Wrong batch',
        'Mix-up in storage',
        'Labeling error',
        'Delivery error',
      ],
      'Material defect': [
        'Quality issue',
        'Contamination',
        'Dimensional problem',
        'Surface defect',
        'Chemical composition',
      ],
      'Material handling': [
        'Feeding problem',
        'Loading issue',
        'Unloading delay',
        'Storage problem',
        'Transfer issue',
      ],
      'Consumables': [
        'Cutting fluid low',
        'Lubricant depleted',
        'Coolant shortage',
        'Cleaning supplies',
        'Packaging material',
      ],
      'Other material': [
        'Waste disposal',
        'Scrap handling',
        'Material degradation',
        'Temperature issue',
        'Unknown cause',
      ],
    },
  },
  'Operator Issue': {
    icon: Users,
    color: 'bg-teal-600',
    subcategories: {
      'Break time': [
        'Lunch break',
        'Rest break',
        'Shift change',
        'Extended break',
        'Unscheduled break',
      ],
      'Training': [
        'New operator training',
        'Safety training',
        'Skills development',
        'On-the-job training',
        'Procedure update',
      ],
      'Staffing': [
        'Operator absent',
        'Insufficient staff',
        'Waiting for operator',
        'Position vacant',
        'Coverage issue',
      ],
      'Communication': [
        'Team meeting',
        'Shift handover',
        'Supervisor consultation',
        'Instruction unclear',
        'Documentation review',
      ],
      'Error': [
        'Setup mistake',
        'Wrong parameter',
        'Improper operation',
        'Missed step',
        'Incorrect procedure',
      ],
      'Other operator': [
        'Personal issue',
        'Fatigue',
        'Waiting instruction',
        'Administrative task',
        'Unknown cause',
      ],
    },
  },
  'Quality Issue': {
    icon: TestTube,
    color: 'bg-purple-600',
    subcategories: {
      'Inspection': [
        'Quality check',
        'First article inspection',
        'Dimensional verification',
        'Visual inspection',
        'Final inspection',
      ],
      'Testing': [
        'Material testing',
        'Performance test',
        'Pressure test',
        'Leak test',
        'Function test',
      ],
      'Rework': [
        'Defect correction',
        'Surface finishing',
        'Dimensional adjustment',
        'Assembly correction',
        'Cosmetic repair',
      ],
      'Rejection': [
        'Scrap processing',
        'Defect analysis',
        'Documentation',
        'Segregation',
        'Disposal',
      ],
      'Process adjustment': [
        'Parameter tuning',
        'Calibration',
        'Alignment correction',
        'Speed adjustment',
        'Temperature control',
      ],
      'Other quality': [
        'Documentation',
        'Sample collection',
        'Audit',
        'Certification',
        'Unknown cause',
      ],
    },
  },
  'Setup/Changeover': {
    icon: Settings,
    color: 'bg-blue-600',
    subcategories: {
      'Product changeover': [
        'Mold installation',
        'Tooling change',
        'Fixture setup',
        'Program loading',
        'Material change',
      ],
      'Machine setup': [
        'Initial setup',
        'Parameter setting',
        'Calibration',
        'Alignment',
        'Test run',
      ],
      'Cleaning': [
        'Scheduled cleaning',
        'Deep cleaning',
        'Purge operation',
        'Debris removal',
        'Contamination cleanup',
      ],
      'Tooling': [
        'Tool installation',
        'Tool change',
        'Tool adjustment',
        'Tool inspection',
        'Tool preparation',
      ],
      'Adjustment': [
        'Fine tuning',
        'Speed adjustment',
        'Position correction',
        'Sensor calibration',
        'Process optimization',
      ],
      'Other setup': [
        'Documentation',
        'Part preparation',
        'Equipment positioning',
        'Safety check',
        'Unknown cause',
      ],
    },
  },
  'Other': {
    icon: HelpCircle,
    color: 'bg-gray-600',
    subcategories: {
      'Maintenance': [
        'Preventive maintenance',
        'Corrective maintenance',
        'Predictive maintenance',
        'Lubrication',
        'Inspection',
      ],
      'Environmental': [
        'Temperature issue',
        'Humidity problem',
        'Dust/contamination',
        'Lighting issue',
        'Ventilation',
      ],
      'Utility': [
        'Compressed air',
        'Water supply',
        'Steam supply',
        'Gas supply',
        'Waste system',
      ],
      'External': [
        'Customer requirement',
        'Supplier delay',
        'Weather impact',
        'Transportation',
        'Regulatory compliance',
      ],
      'Safety': [
        'Safety incident',
        'Emergency drill',
        'Safety inspection',
        'Hazard identification',
        'Safety improvement',
      ],
      'Uncategorized': [
        'Awaiting diagnosis',
        'Multiple issues',
        'Intermittent problem',
        'Investigation ongoing',
        'Unknown',
      ],
    },
  },
};

export function DataEntry({ machines, onAddRecord, currentUser, loginTimestamp }: DataEntryProps) {
  // Fixed demo values for stable presentation
  const DEMO_DATE = '2026-04-27';
  const DEMO_OPERATOR = 'OP001';

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      date: format(loginTimestamp, 'yyyy-MM-dd'),
      shift: 'morning',
      plannedProductionTime: 480,
      downtime: 0,
      totalCount: 0,
      goodCount: 0,
      operatorName: currentUser?.employeeId || DEMO_OPERATOR,
      notes: '',
    },
  });

  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'afternoon' | 'night'>('morning');
  const [plannedTimeSlider, setPlannedTimeSlider] = useState<number>(480);
  const [downtimeSlider, setDowntimeSlider] = useState<number>(0);

  // Fault selection states
  const [faultLevel1, setFaultLevel1] = useState<string>('');
  const [faultLevel2, setFaultLevel2] = useState<string>('');
  const [faultLevel3, setFaultLevel3] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState<string>('');

  // Auto-detect current shift based on login time
  useEffect(() => {
    const hour = loginTimestamp.getHours();
    let shift: 'morning' | 'afternoon' | 'night' = 'morning';
    if (hour >= 6 && hour < 14) shift = 'morning';
    else if (hour >= 14 && hour < 22) shift = 'afternoon';
    else shift = 'night';
    setSelectedShift(shift);
  }, [loginTimestamp]);

  // Update planned time value when slider changes
  useEffect(() => {
    setValue('plannedProductionTime', plannedTimeSlider);
  }, [plannedTimeSlider, setValue]);

  // Update downtime value when slider changes
  useEffect(() => {
    setValue('downtime', downtimeSlider);
  }, [downtimeSlider, setValue]);

  // Ensure downtime doesn't exceed planned time
  useEffect(() => {
    if (downtimeSlider > plannedTimeSlider) {
      setDowntimeSlider(plannedTimeSlider);
    }
  }, [plannedTimeSlider, downtimeSlider]);

  const totalCount = watch('totalCount');
  const goodCount = watch('goodCount');
  const plannedTime = watch('plannedProductionTime');
  const downtime = watch('downtime');

  const operatingTime = plannedTime - downtime;
  const defectCount = totalCount - goodCount;
  const defectRate = totalCount > 0 ? ((defectCount / totalCount) * 100).toFixed(1) : '0.0';

  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const calculateEstimatedOEE = (): number => {
    if (!selectedMachine || plannedTime === 0 || totalCount === 0) return 0;

    const availability = (operatingTime / plannedTime) * 100;
    const performance = operatingTime > 0 ? ((selectedMachine.idealCycleTime * totalCount) / operatingTime) * 100 : 0;
    const quality = (goodCount / totalCount) * 100;
    return Math.min((availability * performance * quality) / 10000, 100);
  };

  const estimatedOEE = calculateEstimatedOEE();

  const onSubmit = (data: FormData) => {
    if (!selectedMachineId) {
      toast.error('Please select a machine');
      return;
    }

    if (data.goodCount > data.totalCount) {
      toast.error('Good count cannot exceed total count');
      return;
    }

    if (data.downtime > data.plannedProductionTime) {
      toast.error('Downtime cannot exceed planned production time');
      return;
    }

    const machine = machines.find(m => m.id === selectedMachineId);
    if (!machine) {
      toast.error('Selected machine not found');
      return;
    }

    // Build fault report string
    let faultReport = '';
    if (faultLevel1 && faultLevel1 !== 'No Issue') {
      faultReport = `Fault: ${faultLevel1}`;
      if (faultLevel2) {
        faultReport += ` → ${faultLevel2}`;
        if (faultLevel3) {
          faultReport += ` → ${faultLevel3}`;
        }
      }
      if (additionalComments.trim()) {
        faultReport += `\nComments: ${additionalComments.trim()}`;
      }
    }

    const record: Omit<ProductionRecord, 'id' | 'timestamp'> = {
      machineId: selectedMachineId,
      machineName: machine.name,
      date: data.date,
      shift: selectedShift,
      plannedProductionTime: data.plannedProductionTime,
      downtime: data.downtime,
      totalCount: data.totalCount,
      goodCount: data.goodCount,
      defectCount: data.totalCount - data.goodCount,
      operatorName: data.operatorName,
      notes: faultReport,
    };

    onAddRecord(record);
    toast.success('Production record saved successfully!');

    // Auto-detect shift from login time
    const hour = loginTimestamp.getHours();
    let detectedShift: 'morning' | 'afternoon' | 'night' = 'morning';
    if (hour >= 6 && hour < 14) detectedShift = 'morning';
    else if (hour >= 14 && hour < 22) detectedShift = 'afternoon';
    else detectedShift = 'night';

    // Reset form but keep operator name and date (from login)
    reset({
      date: format(loginTimestamp, 'yyyy-MM-dd'),
      shift: detectedShift,
      plannedProductionTime: 480,
      downtime: 0,
      totalCount: 0,
      goodCount: 0,
      operatorName: currentUser?.employeeId || DEMO_OPERATOR,
      notes: '',
    });
    setSelectedMachineId('');
    setPlannedTimeSlider(480);
    setDowntimeSlider(0);
    setFaultLevel1('');
    setFaultLevel2('');
    setFaultLevel3('');
    setAdditionalComments('');
    setSelectedShift(detectedShift);
  };

  // Get subcategories for level 2
  const level2Options = faultLevel1 && faultLevel1 !== 'No Issue'
    ? Object.keys(faultHierarchy[faultLevel1]?.subcategories || {})
    : [];

  // Get options for level 3
  const level3Options = faultLevel2
    ? faultHierarchy[faultLevel1]?.subcategories[faultLevel2] || []
    : [];

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto">
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <ClipboardCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Production Data Entry</CardTitle>
                <CardDescription className="text-base">Record shift production data for OEE tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Shift Information */}
              <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 p-6 rounded-xl border-2 border-blue-300 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" />
                    Shift Information
                  </h3>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-filled Fields
                  </Badge>
                </div>
                
                {/* Visual Machine Selection Carousel */}
                <div className="md:col-span-2 mb-6">
                  <MachineSelector
                    machines={machines}
                    selectedMachineId={selectedMachineId}
                    onSelectMachine={setSelectedMachineId}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Time - Auto-filled (Demo: Static) */}
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>Current Time</span>
                          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 text-xs">
                            Auto
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>System time (auto-captured at entry start)</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="h-14 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 rounded-md flex items-center justify-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-mono font-bold text-2xl text-blue-700">
                        {format(loginTimestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-xs text-center text-slate-600">
                      {format(loginTimestamp, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  {/* Operator Name - Auto-filled */}
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <Label htmlFor="operatorName" className="text-base font-semibold">
                            Operator Name *
                          </Label>
                          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 text-xs">
                            Auto
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your operator ID (auto-filled from login credentials)</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="relative">
                      <Input
                        id="operatorName"
                        {...register('operatorName', { required: true })}
                        value={currentUser?.employeeId || DEMO_OPERATOR}
                        className="h-14 text-lg font-bold bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 text-blue-800 pl-12"
                        readOnly
                      />
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  {/* Date - Auto-filled */}
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                          <Label htmlFor="date" className="text-base font-semibold">
                            Date *
                          </Label>
                          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 text-xs">
                            Auto
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Production date (auto-filled with current date, editable)</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        {...register('date', { required: true })}
                        className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 text-blue-800 pl-12"
                      />
                      <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                    </div>
                    <p className="text-xs text-center text-slate-600">
                      {format(loginTimestamp, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  {/* Shift - Auto-detected */}
                  <div className="space-y-3 md:col-span-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <Label htmlFor="shift" className="text-base font-semibold">
                            Shift *
                          </Label>
                          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300 text-xs">
                            Auto
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Work shift (auto-detected based on entry time, editable)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Select value={selectedShift} onValueChange={(value: 'morning' | 'afternoon' | 'night') => setSelectedShift(value)}>
                      <SelectTrigger className="h-16 text-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning" className="text-lg py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                            <div>
                              <div className="font-semibold">Morning Shift</div>
                              <div className="text-xs text-slate-600">6:00 AM - 2:00 PM</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="afternoon" className="text-lg py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                            <div>
                              <div className="font-semibold">Afternoon Shift</div>
                              <div className="text-xs text-slate-600">2:00 PM - 10:00 PM</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="night" className="text-lg py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                            <div>
                              <div className="font-semibold">Night Shift</div>
                              <div className="text-xs text-slate-600">10:00 PM - 6:00 AM</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto-fill info banner */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-700">
                      <strong className="text-blue-700">Smart Auto-fill:</strong> Operator name ({currentUser?.employeeId || DEMO_OPERATOR}), date ({format(loginTimestamp, 'MMMM d, yyyy')}), time ({format(loginTimestamp, 'HH:mm:ss')}), and shift are automatically populated based on your login and system capture time to reduce manual entry and ensure accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Allocation with Sliders */}
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Time Allocation (minutes)
                </h3>
                <div className="space-y-8">
                  {/* Planned Time Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base font-semibold cursor-help">
                            Planned Time *
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total shift duration in minutes (use slider to adjust)</p>
                        </TooltipContent>
                      </Tooltip>
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xl min-w-[160px] text-center">
                        {plannedTimeSlider} min
                        <span className="text-sm font-normal ml-2 opacity-90">
                          ({(plannedTimeSlider / 60).toFixed(1)}h)
                        </span>
                      </div>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[plannedTimeSlider]}
                        onValueChange={(value) => setPlannedTimeSlider(value[0])}
                        min={60}
                        max={720}
                        step={30}
                        className="w-full h-3"
                      />
                      <div className="flex justify-between text-sm text-slate-600 mt-3 font-semibold">
                        <span>60 min<br/><span className="text-xs font-normal">(1h)</span></span>
                        <span>240 min<br/><span className="text-xs font-normal">(4h)</span></span>
                        <span>480 min<br/><span className="text-xs font-normal">(8h)</span></span>
                        <span>720 min<br/><span className="text-xs font-normal">(12h)</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Downtime Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base font-semibold cursor-help">
                            Downtime
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use the slider to set total downtime in minutes</p>
                        </TooltipContent>
                      </Tooltip>
                      <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xl min-w-[160px] text-center">
                        {downtimeSlider} min
                        <span className="text-sm font-normal ml-2 opacity-90">
                          ({(downtimeSlider / 60).toFixed(1)}h)
                        </span>
                      </div>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[downtimeSlider]}
                        onValueChange={(value) => setDowntimeSlider(value[0])}
                        min={0}
                        max={plannedTimeSlider}
                        step={5}
                        className="w-full h-3"
                      />
                      <div className="flex justify-between text-sm text-slate-600 mt-3 font-semibold">
                        <span>0 min</span>
                        <span>{Math.floor(plannedTimeSlider / 4)} min</span>
                        <span>{Math.floor(plannedTimeSlider / 2)} min</span>
                        <span>{plannedTimeSlider} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Operating Time Display */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-base font-semibold cursor-help mb-1">
                              Operating Time
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actual operating time = Planned Time - Downtime</p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-sm text-slate-600">
                          {plannedTimeSlider} min - {downtimeSlider} min = <span className="font-bold text-green-700">{operatingTime} min</span>
                        </p>
                      </div>
                      <div className="bg-green-600 text-white px-6 py-3 rounded-lg">
                        <div className="font-bold text-3xl">{operatingTime}</div>
                        <div className="text-sm opacity-90">minutes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Output */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Package className="h-6 w-6 text-green-600" />
                  Production Output
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help">
                          <Label htmlFor="totalCount">Total Parts *</Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total number of parts produced (including defects)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="totalCount"
                      type="number"
                      min="0"
                      {...register('totalCount', { required: true, min: 0, valueAsNumber: true })}
                      className="h-14 text-2xl font-bold text-center"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help">
                          <Label htmlFor="goodCount">Good Parts *</Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of quality parts without defects</p>
                      </TooltipContent>
                    </Tooltip>
                    <Input
                      id="goodCount"
                      type="number"
                      min="0"
                      max={totalCount}
                      {...register('goodCount', { required: true, min: 0, valueAsNumber: true })}
                      className="h-14 text-2xl font-bold text-center"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help">
                          Defect Rate
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of defective parts (auto-calculated)</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className={`h-14 px-4 py-2 border-2 rounded-md flex flex-col items-center justify-center ${
                      parseFloat(defectRate) > 5 ? 'bg-red-100 border-red-300' : 'bg-white border-green-300'
                    }`}>
                      <span className={`font-bold text-2xl ${parseFloat(defectRate) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {defectRate}%
                      </span>
                      <span className="text-xs text-slate-600">{defectCount} defects</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OEE Display */}
              {totalCount > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-xl mb-1">Estimated OEE</h3>
                      <p className="text-sm text-slate-600">Calculated from entered data</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold ${
                        estimatedOEE >= 85 ? 'text-green-600' :
                        estimatedOEE >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {estimatedOEE.toFixed(1)}%
                      </div>
                      <Badge className={`mt-2 text-base px-4 py-1 ${
                        estimatedOEE >= 85 ? 'bg-green-600' :
                        estimatedOEE >= 70 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {estimatedOEE >= 85 ? 'Excellent' : estimatedOEE >= 70 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Hierarchical Fault Reporting System */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border-2 border-slate-300">
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-slate-700" />
                  Fault & Issue Reporting
                </h3>
                
                <div className="space-y-6">
                  {/* Level 1: Main Category */}
                  <div className="space-y-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-base font-semibold cursor-help">
                          Main Category *
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the primary fault category or "No Issue" if none</p>
                      </TooltipContent>
                    </Tooltip>
                    <Select 
                      value={faultLevel1} 
                      onValueChange={(value) => {
                        setFaultLevel1(value);
                        setFaultLevel2('');
                        setFaultLevel3('');
                      }}
                    >
                      <SelectTrigger className="h-16 text-lg border-2">
                        <SelectValue placeholder="Select main fault category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(faultHierarchy).map(([category, data]) => {
                          const Icon = data.icon;
                          return (
                            <SelectItem key={category} value={category} className="text-lg py-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 ${data.color} rounded-lg`}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-semibold">{category}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level 2: Subcategory (only if not "No Issue") */}
                  {faultLevel1 && faultLevel1 !== 'No Issue' && level2Options.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base font-semibold cursor-help">
                            Subcategory *
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the specific type of fault within {faultLevel1}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Select 
                        value={faultLevel2} 
                        onValueChange={(value) => {
                          setFaultLevel2(value);
                          setFaultLevel3('');
                        }}
                      >
                        <SelectTrigger className="h-16 text-lg border-2 bg-white">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {level2Options.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory} className="text-lg py-3">
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Level 3: Detailed Cause (only if subcategory selected) */}
                  {faultLevel2 && level3Options.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base font-semibold cursor-help">
                            Detailed Cause (Optional)
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Specify the exact cause of {faultLevel2}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Select value={faultLevel3} onValueChange={setFaultLevel3}>
                        <SelectTrigger className="h-16 text-lg border-2 bg-white">
                          <SelectValue placeholder="Select detailed cause (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {level3Options.map((cause) => (
                            <SelectItem key={cause} value={cause} className="text-lg py-3">
                              {cause}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Additional Comments (only if fault selected) */}
                  {faultLevel1 && faultLevel1 !== 'No Issue' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-base font-semibold cursor-help flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <Label htmlFor="additionalComments">Additional Comments (Optional)</Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add any extra details about the fault or issue</p>
                        </TooltipContent>
                      </Tooltip>
                      <Textarea
                        id="additionalComments"
                        value={additionalComments}
                        onChange={(e) => setAdditionalComments(e.target.value)}
                        placeholder="Any additional details, observations, or corrective actions taken..."
                        rows={3}
                        className="resize-none text-base border-2"
                      />
                    </div>
                  )}

                  {/* Fault Summary Display */}
                  {faultLevel1 && faultLevel1 !== 'No Issue' && (
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Fault Summary:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-blue-600 text-base px-3 py-1">{faultLevel1}</Badge>
                        {faultLevel2 && (
                          <>
                            <span className="text-slate-400">→</span>
                            <Badge className="bg-blue-500 text-base px-3 py-1">{faultLevel2}</Badge>
                          </>
                        )}
                        {faultLevel3 && (
                          <>
                            <span className="text-slate-400">→</span>
                            <Badge className="bg-blue-400 text-base px-3 py-1">{faultLevel3}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Auto-detect shift from login time
                        const hour = loginTimestamp.getHours();
                        let detectedShift: 'morning' | 'afternoon' | 'night' = 'morning';
                        if (hour >= 6 && hour < 14) detectedShift = 'morning';
                        else if (hour >= 14 && hour < 22) detectedShift = 'afternoon';
                        else detectedShift = 'night';

                        reset({
                          date: format(loginTimestamp, 'yyyy-MM-dd'),
                          shift: detectedShift,
                          plannedProductionTime: 480,
                          downtime: 0,
                          totalCount: 0,
                          goodCount: 0,
                          operatorName: currentUser?.employeeId || DEMO_OPERATOR,
                          notes: '',
                        });
                        setSelectedMachineId('');
                        setPlannedTimeSlider(480);
                        setDowntimeSlider(0);
                        setFaultLevel1('');
                        setFaultLevel2('');
                        setFaultLevel3('');
                        setAdditionalComments('');
                        setSelectedShift(detectedShift);
                      }}
                      className="flex-1 h-16 text-lg font-semibold"
                    >
                      Clear Form
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all fields to default values</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      className="flex-1 h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 gap-3"
                    >
                      <Save className="h-6 w-6" />
                      Save Production Record
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Submit the production data to the system</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-slate-50 border-blue-300 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-base mb-3">Data Entry Guidelines</h4>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Complete this form at the <strong>end of each shift</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Record <strong>actual production numbers</strong>, not targets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Use the <strong>fault reporting system</strong> to categorize any issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Select <strong>"No Issue"</strong> if shift ran smoothly without problems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Contact supervisor if OEE falls below <strong>60%</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}