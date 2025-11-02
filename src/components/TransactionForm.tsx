import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category_id: string | null;
  description: string;
  date: string;
}

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSuccess: () => void;
}

export const TransactionForm = ({ transaction, onSuccess }: TransactionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type as any || 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type);

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const transactionData = {
      user_id: user.id,
      type,
      amount: parseFloat(amount),
      category_id: categoryId || null,
      description,
      date,
    };

    let error;
    if (transaction) {
      const result = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', transaction.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('transactions')
        .insert([transactionData]);
      error = result.error;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan transaksi",
      });
    } else {
      toast({
        title: "Berhasil",
        description: transaction ? "Transaksi berhasil diperbarui" : "Transaksi berhasil ditambahkan",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipe</Label>
        <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Jumlah</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="Catatan transaksi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Tanggal</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </form>
  );
};