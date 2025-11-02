import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
}

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
}

export const CategoryForm = ({ category, onSuccess }: CategoryFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState<'income' | 'expense'>(category?.type as any || 'expense');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const categoryData = {
      user_id: user.id,
      name,
      type,
      icon: null,
    };

    let error;
    if (category) {
      const result = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', category.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('categories')
        .insert([categoryData]);
      error = result.error;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan kategori",
      });
    } else {
      toast({
        title: "Berhasil",
        description: category ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Kategori</Label>
        <Input
          id="name"
          placeholder="Contoh: Gaji, Makanan, Transport"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

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

      <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isLoading}>
        {isLoading ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </form>
  );
};