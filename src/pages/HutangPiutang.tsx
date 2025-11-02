import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Loan {
  id: string;
  type: 'hutang' | 'piutang';
  amount: number;
  description: string | null;
  date: string;
}

const LoansPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<Partial<Loan> | null>(null);

  // Redirect jika tidak login
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Fetch loans
  useEffect(() => {
    if (user) fetchLoans();
  }, [user]);

  const fetchLoans = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });

    if (data) setLoans(data);
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    await supabase.from('loans').delete().eq('id', id);
    fetchLoans();
  };

  const handleSave = async () => {
    if (!currentLoan || !currentLoan.type || !currentLoan.amount) return;
    
    if (currentLoan.id) {
      // Update existing
      await supabase
        .from('loans')
        .update({
          type: currentLoan.type,
          amount: currentLoan.amount,
          description: currentLoan.description,
          date: currentLoan.date,
        })
        .eq('id', currentLoan.id);
    } else {
      // Insert new
      await supabase.from('loans').insert({
        user_id: user!.id,
        type: currentLoan.type,
        amount: currentLoan.amount,
        description: currentLoan.description,
        date: currentLoan.date || new Date().toISOString().split('T')[0],
      });
    }

    setIsDialogOpen(false);
    setCurrentLoan(null);
    fetchLoans();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
    {/* HEADER */}
    <header className="border-b bg-white/70 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-blue-900 hover:bg-blue-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
  
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800">Hutang / Piutang</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola catatan hutang & piutang kamu dengan mudah dan rapi
            </p>
          </div>
        </div>
  
        <Button
          className="bg-blue-900 text-white hover:bg-blue-800 shadow-md px-4 py-2 flex items-center gap-2 rounded-xl"
          onClick={() => {
            setCurrentLoan({
              type: "hutang",
              amount: 0,
              date: new Date().toISOString().split("T")[0],
            });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Tambah Data
        </Button>
      </div>
    </header>
  
    {/* MAIN */}
    <main className="container mx-auto px-4 py-8">
      {loans.length === 0 ? (
        <Card className="p-12 text-center bg-white shadow-sm border border-blue-100 rounded-2xl">
          <p className="text-blue-700/70">Belum ada data Hutang / Piutang</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map((loan) => (
            <Card
              key={loan.id}
              className="border border-blue-100 shadow-md hover:shadow-xl transition-all rounded-2xl bg-white/90 backdrop-blur-sm"
            >
              <CardHeader className="flex justify-between items-start pb-0">
                <CardTitle className="text-blue-700 font-semibold text-lg">
                  {loan.type === "hutang" ? "🧾 Hutang" : "💰 Piutang"}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      setCurrentLoan(loan);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(loan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="mt-3">
                <div
                  className={`text-2xl font-bold ${
                    loan.type === "hutang" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(loan.amount)}
                </div>
                {loan.description && (
                  <p className="text-sm text-gray-600 mt-1">{loan.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(loan.date).toLocaleDateString("id-ID")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
  
      {/* Dialog Tambah/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-700 font-semibold">
              {currentLoan?.id ? "Edit Data" : "Tambah Data"} Hutang / Piutang
            </DialogTitle>
          </DialogHeader>
  
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label className="text-blue-700">Jenis</Label>
              <select
                className="w-full border border-blue-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={currentLoan?.type || "hutang"}
                onChange={(e) =>
                  setCurrentLoan({
                    ...currentLoan!,
                    type: e.target.value as "hutang" | "piutang",
                  })
                }
              >
                <option value="hutang">Hutang</option>
                <option value="piutang">Piutang</option>
              </select>
            </div>
  
            <div>
              <Label className="text-blue-700">Jumlah</Label>
              <Input
                type="number"
                value={currentLoan?.amount || ""}
                onChange={(e) =>
                  setCurrentLoan({
                    ...currentLoan!,
                    amount: parseFloat(e.target.value),
                  })
                }
                className="border-blue-200 focus:ring-blue-400"
              />
            </div>
  
            <div>
              <Label className="text-blue-700">Deskripsi</Label>
              <Input
                type="text"
                value={currentLoan?.description || ""}
                onChange={(e) =>
                  setCurrentLoan({
                    ...currentLoan!,
                    description: e.target.value,
                  })
                }
                className="border-blue-200 focus:ring-blue-400"
              />
            </div>
  
            <div>
              <Label className="text-blue-700">Tanggal</Label>
              <Input
                type="date"
                value={
                  currentLoan?.date?.split("T")[0] ||
                  new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setCurrentLoan({ ...currentLoan!, date: e.target.value })
                }
                className="border-blue-200 focus:ring-blue-400"
              />
            </div>
          </div>
  
          <DialogFooter>
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {currentLoan?.id ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  </div>
  
  

  );
};

export default LoansPage;
