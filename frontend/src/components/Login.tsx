import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Factory, User, Lock, LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (employeeId: string, role: 'operator' | 'manager') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'operator' | 'manager'>('operator');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim() || !password.trim()) {
      toast.error('Credentials are required');
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay[cite: 6]
    setTimeout(() => {
      // Demo credentials logic from Figma export[cite: 6]
      const validCredentials = [
        { id: 'OP001', password: 'operator123', role: 'operator' as const },
        { id: 'MGR001', password: 'manager123', role: 'manager' as const },
        { id: 'demo', password: 'demo', role: role },
      ];

      const isValid = validCredentials.some(
        cred => cred.id === employeeId && cred.password === password
      );

      if (isValid) {
        toast.success('Login successful!');
        onLogin(employeeId, role);
      } else {
        toast.error('Invalid credentials. Use OP001/operator123 or MGR001/manager123');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <Factory className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">OEE System</h1>
          <p className="text-slate-400">Production Monitoring Login</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-white">Staff Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Employee ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <Input
                    placeholder="Enter ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Role
                </Label>
                <Select value={role} onValueChange={(value: 'operator' | 'manager') => setRole(value)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold mt-4">
                {isLoading ? 'Verifying...' : 'Login to System'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Debug Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                <span>OP: OP001</span><span>PW: operator123</span>
                <span>MG: MGR001</span><span>PW: manager123</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}