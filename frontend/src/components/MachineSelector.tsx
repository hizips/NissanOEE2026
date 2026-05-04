import { useRef, useEffect } from 'react';
import type { Machine } from '@/types'; 
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MachineSelectorProps {
  machines: Machine[];
  selectedMachineId: string;
  onSelectMachine: (machineId: string) => void;
}

export function MachineSelector({ machines, selectedMachineId, onSelectMachine }: MachineSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold flex items-center gap-2"><Factory className="text-blue-600" /> Select Machine</h3>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {machines.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMachine(m.id)}
            className={`flex-shrink-0 w-64 p-6 rounded-xl border-2 transition-all ${
              selectedMachineId === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <div className="text-4xl mb-4">🏭</div>
            <h4 className="font-bold">{m.name}</h4>
            <Badge variant="outline" className="mt-2">{m.status}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}