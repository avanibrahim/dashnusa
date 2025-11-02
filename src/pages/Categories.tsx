import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { CategoryForm } from '@/components/CategoryForm';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
}

const Categories = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat kategori",
      });
    } else {
      setCategories(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus kategori",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });
      fetchCategories();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

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

      {/* Bungkus h1 dan p di sini */}
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800">Kategori</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola kategori transaksi Anda di sini
        </p>
      </div>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-900 text-white hover:bg-blue-800 shadow-md"
          onClick={() => setEditingCategory(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
          </DialogTitle>
        </DialogHeader>

        <CategoryForm category={editingCategory} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  </div>
</header>


  {/* MAIN */}
  <main className="container mx-auto px-4 py-8">
    <Tabs defaultValue="income" className="w-full">

      {/* TAB BUTTONS */}
      <TabsList className="grid w-full grid-cols-2 mb-6 bg-blue-100 text-blue-900 rounded-lg shadow-sm">
        <TabsTrigger 
          value="income"
          className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-md"
        >
          Pemasukan
        </TabsTrigger>
        <TabsTrigger 
          value="expense"
          className="data-[state=active]:bg-blue-900 data-[state=active]:text-white rounded-md"
        >
          Pengeluaran
        </TabsTrigger>
      </TabsList>

      {/* INCOME TAB */}
      <TabsContent value="income" className="space-y-4">
        {incomeCategories.length === 0 ? (
          <Card className="p-12 text-center bg-white shadow-sm border border-blue-100">
            <p className="text-blue-700/70">Belum ada kategori pemasukan</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeCategories.map((category) => (
              <Card
                key={category.id}
                className="p-4 bg-white border border-blue-100 shadow-sm hover:shadow-md transition rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-green-700" />
                    </div>
                    <p className="font-semibold text-blue-900">{category.name}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <Pencil className="w-4 h-4 text-blue-800" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* EXPENSE TAB */}
      <TabsContent value="expense" className="space-y-4">
        {expenseCategories.length === 0 ? (
          <Card className="p-12 text-center bg-white shadow-sm border border-blue-100">
            <p className="text-blue-700/70">Belum ada kategori pengeluaran</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseCategories.map((category) => (
              <Card
                key={category.id}
                className="p-4 bg-white border border-blue-100 shadow-sm hover:shadow-md transition rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-red-700" />
                    </div>
                    <p className="font-semibold text-blue-900">{category.name}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <Pencil className="w-4 h-4 text-blue-800" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

    </Tabs>
  </main>
</div>
  );
};

export default Categories;