import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Machine, ProductionRecord } from '@/types';
import { History, Search, Trash2, Download, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';

interface HistoricalDataProps {
  productionRecords: ProductionRecord[];
  machines: Machine[];
  onDeleteRecord: (id: string) => void;
  userRole: 'operator' | 'manager';
}

export function HistoricalData({ productionRecords, machines, onDeleteRecord, userRole }: HistoricalDataProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return productionRecords.filter(record => {
      const matchesSearch =
        record.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMachine = filterMachine === 'all' || record.machineId === filterMachine;
      const matchesShift = filterShift === 'all' || record.shift === filterShift;

      return matchesSearch && matchesMachine && matchesShift;
    });
  }, [productionRecords, searchTerm, filterMachine, filterShift]);

  const calculateOEE = (record: ProductionRecord): number => {
    const machine = machines.find(m => m.id === record.machineId);
    if (!machine) return 0;

    const operatingTime = record.plannedProductionTime - record.downtime;
    const availability = record.plannedProductionTime > 0
      ? (operatingTime / record.plannedProductionTime) * 100
      : 0;

    const performance = operatingTime > 0
      ? ((machine.idealCycleTime * record.totalCount) / operatingTime) * 100
      : 0;

    const quality = record.totalCount > 0
      ? (record.goodCount / record.totalCount) * 100
      : 0;

    return Math.min((availability * performance * quality) / 10000, 100);
  };

  const getOEEBadge = (oee: number) => {
    if (oee >= 85) return <Badge className="bg-green-600">Excellent</Badge>;
    if (oee >= 70) return <Badge className="bg-yellow-600">Good</Badge>;
    if (oee >= 50) return <Badge className="bg-orange-600">Fair</Badge>;
    return <Badge className="bg-red-600">Poor</Badge>;
  };

  const getShiftBadge = (shift: string) => {
    const colors = {
      morning: 'bg-blue-100 text-blue-800',
      afternoon: 'bg-amber-100 text-amber-800',
      night: 'bg-indigo-100 text-indigo-800',
    };
    return <Badge variant="outline" className={colors[shift as keyof typeof colors]}>{shift}</Badge>;
  };

  const handleDelete = (id: string) => {
    setRecordToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteRecord(recordToDelete);
      toast.success('Record deleted successfully');
      setRecordToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Machine',
      'Shift',
      'Operator',
      'Planned Time (min)',
      'Downtime (min)',
      'Operating Time (min)',
      'Total Count',
      'Good Count',
      'Defect Count',
      'OEE (%)',
      'Notes',
    ];

    const rows = filteredRecords.map(record => {
      const operatingTime = record.plannedProductionTime - record.downtime;
      const oee = calculateOEE(record);

      return [
        record.date,
        record.machineName,
        record.shift,
        record.operatorName,
        record.plannedProductionTime,
        record.downtime,
        operatingTime,
        record.totalCount,
        record.goodCount,
        record.defectCount,
        oee.toFixed(2),
        record.notes || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oee-production-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Production History</CardTitle>
                <CardDescription>View and manage historical production records</CardDescription>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by machine, operator, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMachine} onValueChange={setFilterMachine}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Machines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {machines.map(machine => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterShift} onValueChange={setFilterShift}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No records found matching your filters.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead className="text-right">Planned Time</TableHead>
                      <TableHead className="text-right">Downtime</TableHead>
                      <TableHead className="text-right">Total Count</TableHead>
                      <TableHead className="text-right">Good Count</TableHead>
                      <TableHead className="text-right">OEE</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map(record => {
                      const oee = calculateOEE(record);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{record.machineName}</TableCell>
                          <TableCell>{getShiftBadge(record.shift)}</TableCell>
                          <TableCell>{record.operatorName}</TableCell>
                          <TableCell className="text-right">{record.plannedProductionTime} min</TableCell>
                          <TableCell className="text-right">
                            <span className={record.downtime > 0 ? 'text-red-600 font-semibold' : ''}>
                              {record.downtime} min
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{record.totalCount}</TableCell>
                          <TableCell className="text-right">
                            {record.goodCount}
                            {record.defectCount > 0 && (
                              <span className="text-xs text-red-600 ml-1">
                                (-{record.defectCount})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {oee.toFixed(1)}%
                          </TableCell>
                          <TableCell>{getOEEBadge(oee)}</TableCell>
                          <TableCell>
                            {userRole === 'manager' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600 text-center">
            Showing {filteredRecords.length} of {productionRecords.length} records
          </div>
        </CardContent>
      </Card>

      {userRole === 'operator' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-sm text-blue-900">Operator Access</h4>
                <p className="text-sm text-blue-700">You have view-only access to production history. Contact a manager to delete records.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
