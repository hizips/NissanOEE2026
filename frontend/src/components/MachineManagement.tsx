import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Machine, ProductionRecord } from '@/types';
import { Settings, Plus, Activity } from 'lucide-react';

interface MachineManagementProps {
  machines: Machine[];
  productionRecords: ProductionRecord[];
  onUpdateMachine: (id: string, updates: Partial<Machine>) => void;
  onAddMachine: (machine: Omit<Machine, 'id'>) => void;
  onDeleteMachine: (id: string) => void;
  userRole: 'operator' | 'manager';
}

export function MachineManagement({ machines, userRole }: MachineManagementProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="flex items-center gap-2"><Settings /> Machine Fleet</CardTitle>
         {userRole === 'manager' && <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Machine</Button>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map(m => (
          <Card key={m.id} className="p-4 flex items-center justify-between">
            <div><h4 className="font-bold">{m.name}</h4><p className="text-sm text-slate-500">Cycle: {m.idealCycleTime}m</p></div>
            <Badge className={m.status === 'running' ? 'bg-green-500' : 'bg-slate-400'}>{m.status}</Badge>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}