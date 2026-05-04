import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProductionRecord, OEEMetrics, Machine } from '@/types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, CheckCircle2, AlertCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface DashboardProps {
  machines: Machine[];
  productionRecords: ProductionRecord[];
}

export function Dashboard({ machines, productionRecords }: DashboardProps) {
  const calculateOEE = (record: ProductionRecord, machine: Machine): OEEMetrics => {
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
    const oee = (availability * performance * quality) / 10000;

    return {
      availability: Math.min(availability, 100),
      performance: Math.min(performance, 100),
      quality: Math.min(quality, 100),
      oee: Math.min(oee, 100),
    };
  };

  const overallMetrics = useMemo(() => {
    if (productionRecords.length === 0) {
      return { availability: 0, performance: 0, quality: 0, oee: 0 };
    }
    const metricsArray = productionRecords.map(record => {
      const machine = machines.find(m => m.id === record.machineId);
      return machine ? calculateOEE(record, machine) : null;
    }).filter(Boolean) as OEEMetrics[];

    if (metricsArray.length === 0) return { availability: 0, performance: 0, quality: 0, oee: 0 };

    const avg = metricsArray.reduce((acc, metrics) => ({
      availability: acc.availability + metrics.availability,
      performance: acc.performance + metrics.performance,
      quality: acc.quality + metrics.quality,
      oee: acc.oee + metrics.oee,
    }), { availability: 0, performance: 0, quality: 0, oee: 0 });

    return {
      availability: avg.availability / metricsArray.length,
      performance: avg.performance / metricsArray.length,
      quality: avg.quality / metricsArray.length,
      oee: avg.oee / metricsArray.length,
    };
  }, [productionRecords, machines]);

  const machinePerformance = useMemo(() => {
    return machines.map(machine => {
      const machineRecords = productionRecords.filter(r => r.machineId === machine.id);
      if (machineRecords.length === 0) {
        return { name: machine.name, oee: 0, availability: 0, performance: 0, quality: 0, recordCount: 0 };
      }
      const metricsArray = machineRecords.map(record => calculateOEE(record, machine));
      const avg = metricsArray.reduce((acc, m) => ({
        availability: acc.availability + m.availability,
        performance: acc.performance + m.performance,
        quality: acc.quality + m.quality,
        oee: acc.oee + m.oee,
      }), { availability: 0, performance: 0, quality: 0, oee: 0 });
      return {
        name: machine.name,
        oee: avg.oee / metricsArray.length,
        availability: avg.availability / metricsArray.length,
        performance: avg.performance / metricsArray.length,
        quality: avg.quality / metricsArray.length,
        recordCount: metricsArray.length,
      };
    });
  }, [machines, productionRecords]);

  const dailyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => format(startOfDay(subDays(new Date(), 6 - i)), 'yyyy-MM-dd'));
    return last7Days.map(date => {
      const dayRecords = productionRecords.filter(r => r.date === date);
      if (dayRecords.length === 0) return { date: format(new Date(date), 'MMM dd'), oee: 0 };
      const metricsArray = dayRecords.map(record => {
        const machine = machines.find(m => m.id === record.machineId);
        return machine ? calculateOEE(record, machine) : null;
      }).filter(Boolean) as OEEMetrics[];
      const avgOEE = metricsArray.reduce((sum, m) => sum + m.oee, 0) / metricsArray.length;
      return { date: format(new Date(date), 'MMM dd'), oee: avgOEE };
    });
  }, [productionRecords, machines]);

  const shiftDistribution = useMemo(() => {
    const shifts = { morning: 0, afternoon: 0, night: 0 };
    productionRecords.forEach(r => shifts[r.shift]++);
    return [
      { name: 'Morning', value: shifts.morning },
      { name: 'Afternoon', value: shifts.afternoon },
      { name: 'Night', value: shifts.night },
    ];
  }, [productionRecords]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const getOEEColor = (oee: number) => oee >= 85 ? 'text-green-600' : oee >= 70 ? 'text-yellow-600' : 'text-red-600';

  const alerts = useMemo(() => {
    const alertList: any[] = [];
    const breakdown = machines.filter(m => m.status === 'breakdown');
    if (breakdown.length > 0) alertList.push({ type: 'critical', message: `Breakdown: ${breakdown.map(m => m.name).join(', ')}`, icon: <XCircle className="h-4 w-4" /> });
    return alertList;
  }, [machines]);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall OEE</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${getOEEColor(overallMetrics.oee)}`}>{overallMetrics.oee.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>OEE Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><RechartsTooltip /><Line type="monotone" dataKey="oee" stroke="#3b82f6" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Machine Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={machinePerformance}><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><RechartsTooltip /><Bar dataKey="oee" fill="#3b82f6" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}