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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Machine, ProductionRecord } from '@/types';
import { ClipboardCheck, Save, Activity, Clock, Package, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MachineSelector } from './MachineSelector';

interface DataEntryProps {
  machines: Machine[];
  onAddRecord: (record: Omit<ProductionRecord, 'id' | 'timestamp'>) => void;
  currentUser: { employeeId: string; role: 'operator' | 'manager' } | null;
  loginTimestamp: Date;
}

export function DataEntry({ machines, onAddRecord, currentUser, loginTimestamp }: DataEntryProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      date: format(loginTimestamp, 'yyyy-MM-dd'),
      shift: 'morning',
      plannedProductionTime: 480,
      downtime: 0,
      totalCount: 0,
      goodCount: 0,
      operatorName: currentUser?.employeeId || 'OP001',
      notes: '',
    },
  });

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [plannedTimeSlider, setPlannedTimeSlider] = useState(480);
  const [downtimeSlider, setDowntimeSlider] = useState(0);

  useEffect(() => { setValue('plannedProductionTime', plannedTimeSlider); }, [plannedTimeSlider, setValue]);
  useEffect(() => { setValue('downtime', downtimeSlider); }, [downtimeSlider, setValue]);

  const onSubmit = (data: any) => {
    const machine = machines.find(m => m.id === selectedMachineId);
    if (!machine) return toast.error('Select a machine');
    onAddRecord({ ...data, machineId: selectedMachineId, machineName: machine.name, defectCount: data.totalCount - data.goodCount });
    toast.success('Record saved!');
    reset();
  };

  return (
    <Card className="max-w-5xl mx-auto shadow-lg">
      <CardHeader className="bg-slate-50">
        <CardTitle>Production Data Entry</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <MachineSelector machines={machines} selectedMachineId={selectedMachineId} onSelectMachine={setSelectedMachineId} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2"><Label>Total Parts</Label><Input type="number" {...register('totalCount')} className="h-12 text-lg" /></div>
             <div className="space-y-2"><Label>Good Parts</Label><Input type="number" {...register('goodCount')} className="h-12 text-lg" /></div>
             <div className="space-y-2"><Label>Downtime (min)</Label><Slider value={[downtimeSlider]} onValueChange={v => setDowntimeSlider(v[0])} max={480} /></div>
          </div>
          <Button type="submit" className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700">Save Production Record</Button>
        </form>
      </CardContent>
    </Card>
  );
}