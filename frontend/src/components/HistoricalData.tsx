import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Machine, ProductionRecord } from '@/types';
import { History, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HistoricalDataProps {
  productionRecords: ProductionRecord[];
  machines: Machine[];
  onDeleteRecord: (id: string) => void;
  userRole: 'operator' | 'manager';
}

export function HistoricalData({ productionRecords, machines, onDeleteRecord, userRole }: HistoricalDataProps) {
  const calculateOEE = (record: ProductionRecord) => {
    const machine = machines.find(m => m.id === record.machineId);
    if (!machine) return 0;
    const availability = (record.plannedProductionTime - record.downtime) / record.plannedProductionTime;
    const performance = (machine.idealCycleTime * record.totalCount) / (record.plannedProductionTime - record.downtime);
    const quality = record.goodCount / record.totalCount;
    return (availability * performance * quality * 100) || 0;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><History /> Production History</CardTitle>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
             <TableRow>
                <TableHead>Date</TableHead><TableHead>Machine</TableHead><TableHead>Shift</TableHead><TableHead className="text-right">OEE</TableHead><TableHead></TableHead>
             </TableRow>
          </TableHeader>
          <TableBody>
            {productionRecords.map(r => (
              <TableRow key={r.id}>
                <TableCell>{format(new Date(r.date), 'MMM dd')}</TableCell>
                <TableCell>{r.machineName}</TableCell>
                <TableCell><Badge variant="outline">{r.shift}</Badge></TableCell>
                <TableCell className="text-right font-bold">{calculateOEE(r).toFixed(1)}%</TableCell>
                <TableCell>
                  {userRole === 'manager' && <Button variant="ghost" size="sm" onClick={() => onDeleteRecord(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}