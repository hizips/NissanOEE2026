import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Machine, ProductionRecord, OEEMetrics } from '@/types';
import { Settings, Plus, Edit2, Trash2, Save, X, Activity, TrendingUp, AlertCircle, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface MachineManagementProps {
  machines: Machine[];
  productionRecords: ProductionRecord[];
  onUpdateMachine: (id: string, updates: Partial<Machine>) => void;
  onAddMachine: (machine: Omit<Machine, 'id'>) => void;
  onDeleteMachine: (id: string) => void;
  userRole: 'operator' | 'manager';
}

interface MachineStats {
  totalRecords: number;
  avgOEE: number;
  avgDowntime: number;
  totalDowntime: number;
  downtimePercentage: number;
}

export function MachineManagement({
  machines,
  productionRecords,
  onUpdateMachine,
  onAddMachine,
  onDeleteMachine,
  userRole,
}: MachineManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);

  const [newMachine, setNewMachine] = useState({
    name: '',
    idealCycleTime: 2.5,
    status: 'idle' as Machine['status'],
  });

  const [editForm, setEditForm] = useState({
    name: '',
    idealCycleTime: 2.5,
    status: 'idle' as Machine['status'],
  });

  const calculateOEE = (record: ProductionRecord, machine: Machine): number => {
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

  const machineStats = useMemo(() => {
    const stats = new Map<string, MachineStats>();

    machines.forEach(machine => {
      const records = productionRecords.filter(r => r.machineId === machine.id);

      if (records.length === 0) {
        stats.set(machine.id, {
          totalRecords: 0,
          avgOEE: 0,
          avgDowntime: 0,
          totalDowntime: 0,
          downtimePercentage: 0,
        });
        return;
      }

      const totalDowntime = records.reduce((sum, r) => sum + r.downtime, 0);
      const totalPlanned = records.reduce((sum, r) => sum + r.plannedProductionTime, 0);
      const avgDowntime = totalDowntime / records.length;
      const oeeValues = records.map(r => calculateOEE(r, machine));
      const avgOEE = oeeValues.reduce((sum, oee) => sum + oee, 0) / oeeValues.length;
      const downtimePercentage = totalPlanned > 0 ? (totalDowntime / totalPlanned) * 100 : 0;

      stats.set(machine.id, {
        totalRecords: records.length,
        avgOEE,
        avgDowntime,
        totalDowntime,
        downtimePercentage,
      });
    });

    return stats;
  }, [machines, productionRecords]);

  const handleAddMachine = () => {
    if (!newMachine.name.trim()) {
      toast.error('Machine name is required');
      return;
    }

    if (newMachine.idealCycleTime <= 0) {
      toast.error('Ideal cycle time must be greater than 0');
      return;
    }

    onAddMachine(newMachine);
    toast.success('Machine added successfully');
    setNewMachine({ name: '', idealCycleTime: 2.5, status: 'idle' });
    setIsAdding(false);
  };

  const startEditing = (machine: Machine) => {
    setEditingId(machine.id);
    setEditForm({
      name: machine.name,
      idealCycleTime: machine.idealCycleTime,
      status: machine.status,
    });
  };

  const handleUpdateMachine = () => {
    if (!editForm.name.trim()) {
      toast.error('Machine name is required');
      return;
    }

    if (editForm.idealCycleTime <= 0) {
      toast.error('Ideal cycle time must be greater than 0');
      return;
    }

    if (editingId) {
      onUpdateMachine(editingId, editForm);
      toast.success('Machine updated successfully');
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    setMachineToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (machineToDelete) {
      onDeleteMachine(machineToDelete);
      toast.success('Machine deleted successfully');
      setMachineToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: Machine['status']) => {
    const statusConfig = {
      running: { color: 'bg-green-600 text-white', label: 'Running', icon: <Activity className="h-3 w-3" /> },
      idle: { color: 'bg-gray-500 text-white', label: 'Idle', icon: null },
      maintenance: { color: 'bg-yellow-600 text-white', label: 'Maintenance', icon: <Settings className="h-3 w-3" /> },
      breakdown: { color: 'bg-red-600 text-white', label: 'Breakdown', icon: <AlertCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} gap-1 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getOEEColor = (oee: number) => {
    if (oee >= 85) return 'text-green-600';
    if (oee >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Machine Management</CardTitle>
                <CardDescription>Configure machines and monitor performance metrics</CardDescription>
              </div>
            </div>
            {userRole === 'manager' && (
              <Button onClick={() => setIsAdding(true)} className="gap-2" disabled={isAdding}>
                <Plus className="h-4 w-4" />
                Add Machine
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">New Machine</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Machine Name *</Label>
                      <Input
                        id="new-name"
                        value={newMachine.name}
                        onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                        placeholder="e.g., Casting Machine A1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-cycle-time">Ideal Cycle Time (min) *</Label>
                      <Input
                        id="new-cycle-time"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newMachine.idealCycleTime}
                        onChange={(e) => setNewMachine({ ...newMachine, idealCycleTime: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-status">Initial Status</Label>
                      <Select
                        value={newMachine.status}
                        onValueChange={(value: Machine['status']) => setNewMachine({ ...newMachine, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="idle">Idle</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="breakdown">Breakdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAdding(false);
                        setNewMachine({ name: '', idealCycleTime: 2.5, status: 'idle' });
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleAddMachine} className="gap-2">
                      <Save className="h-4 w-4" />
                      Add Machine
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {machines.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No machines configured yet.</p>
              <p className="text-sm">Click "Add Machine" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {machines.map(machine => {
                const stats = machineStats.get(machine.id);
                return (
                  <Card key={machine.id} className={editingId === machine.id ? 'border-2 border-blue-200' : 'border-2'}>
                    <CardContent className="pt-6">
                      {editingId === machine.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Machine Name *</Label>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Ideal Cycle Time (min) *</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={editForm.idealCycleTime}
                                onChange={(e) => setEditForm({ ...editForm, idealCycleTime: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={editForm.status}
                                onValueChange={(value: Machine['status']) => setEditForm({ ...editForm, status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="running">Running</SelectItem>
                                  <SelectItem value="idle">Idle</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="breakdown">Breakdown</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateMachine} className="gap-2">
                              <Save className="h-4 w-4" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-xl">{machine.name}</h3>
                                {getStatusBadge(machine.status)}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-4 w-4" />
                                  <span>Ideal Cycle Time: <strong>{machine.idealCycleTime} min</strong></span>
                                </div>
                                {stats && stats.totalRecords > 0 && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-4 w-4" />
                                      <span>Total Records: <strong>{stats.totalRecords}</strong></span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            {userRole === 'manager' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditing(machine)}
                                  className="gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(machine.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>

                          {stats && stats.totalRecords > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Average OEE</span>
                                  <span className={`font-bold text-lg ${getOEEColor(stats.avgOEE)}`}>
                                    {stats.avgOEE.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={stats.avgOEE} className="h-2" />
                                <p className="text-xs text-slate-500">
                                  {stats.avgOEE >= 85 ? 'Excellent performance' : stats.avgOEE >= 70 ? 'Good performance' : 'Below target'}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Downtime Rate</span>
                                  <span className={`font-bold text-lg ${stats.downtimePercentage > 15 ? 'text-red-600' : 'text-green-600'}`}>
                                    {stats.downtimePercentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={Math.min(stats.downtimePercentage, 100)} className="h-2" />
                                <p className="text-xs text-slate-500">
                                  Avg: {stats.avgDowntime.toFixed(0)} min/shift
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Total Downtime</span>
                                  <span className="font-bold text-lg text-slate-700">
                                    {(stats.totalDowntime / 60).toFixed(1)} hrs
                                  </span>
                                </div>
                                <Progress value={Math.min((stats.totalDowntime / 60) / 100 * 100, 100)} className="h-2" />
                                <p className="text-xs text-slate-500">
                                  Across {stats.totalRecords} records
                                </p>
                              </div>
                            </div>
                          )}

                          {stats && stats.totalRecords === 0 && (
                            <div className="pt-4 border-t">
                              <p className="text-sm text-slate-500 italic">No production data recorded yet for this machine.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {userRole === 'operator' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-sm text-blue-900">Operator Access</h4>
                <p className="text-sm text-blue-700">You have view-only access to machine configurations. Contact a manager to add, edit, or delete machines.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm mb-3">About Machine Configuration</h4>
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Ideal Cycle Time:</strong> The theoretical fastest time to manufacture one part under optimal conditions.
              This is used to calculate the Performance component of OEE.
            </p>
            <p>
              <strong>Machine Status:</strong> Current operational state of the machine. Update this to reflect real-time conditions.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs">
                {getStatusBadge('running')}
                <span>Active production</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {getStatusBadge('idle')}
                <span>Not in use</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {getStatusBadge('maintenance')}
                <span>Scheduled service</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {getStatusBadge('breakdown')}
                <span>Requires repair</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this machine? This will not delete associated production records,
              but you won't be able to add new records for this machine.
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