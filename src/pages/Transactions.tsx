import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionForm } from '@/components/TransactionForm';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
  categories: { name: string } | null;
}

const Transactions = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat transaksi",
      });
    } else {
      setTransactions(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus transaksi",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      });
      fetchTransactions();
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-blue-100 shadow-sm">
  <div className="container mx-auto px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/dashboard")}
        className="text-blue-900 hover:bg-blue-50"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      {/* Bungkus h1 dan p di sini */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-blue-800">Manajemen Transaksi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola semua transaksi Anda di sini
        </p>
      </div>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all"
          onClick={() => setEditingTransaction(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white rounded-2xl shadow-lg border border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-blue-900 font-semibold">
            {editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm transaction={editingTransaction} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  </div>
</header>


      {/* MAIN */}
      <main className="container mx-auto px-6 py-10">
        {transactions.length === 0 ? (
          <Card className="p-14 text-center bg-white border border-blue-100 shadow-sm rounded-2xl">
            <p className="text-blue-700/70">Belum ada transaksi tercatat.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === "income"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-blue-900 font-semibold text-lg">
                        {transaction.description || "Tanpa deskripsi"}
                      </CardTitle>
                      <p className="text-sm text-blue-700/60">
                        {transaction.categories?.name || "Tanpa kategori"} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-blue-50 text-blue-800"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-red-50 text-red-600"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex justify-between items-center">
                  <p
                    className={`text-lg font-bold ${
                      transaction.type === "income" ? "text-blue-800" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Transactions;