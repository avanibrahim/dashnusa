import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Wallet, Receipt, Tags, Plus, Menu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface ChartData {
  month: string;
  income: number;
  expense: number;
}

interface CategorySpending {
  name: string;
  value: number;
  color: string;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  categories: { name: string } | null;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchChartData();
      fetchCategorySpending();
      fetchRecentTransactions();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id);

    if (transactions) {
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      setStats({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
      });
    }
    setIsLoadingData(false);
  };

  const fetchChartData = async () => {
    if (!user) return;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (transactions) {
      const monthlyData = new Map<string, { income: number; expense: number }>();

      transactions.forEach((t) => {
        const month = new Date(t.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        const existing = monthlyData.get(month) || { income: 0, expense: 0 };
        
        if (t.type === 'income') {
          existing.income += parseFloat(t.amount.toString());
        } else {
          existing.expense += parseFloat(t.amount.toString());
        }
        
        monthlyData.set(month, existing);
      });

      const data = Array.from(monthlyData.entries()).map(([month, values]) => ({
        month,
        ...values,
      }));

      setChartData(data);
    }
  };

  const fetchCategorySpending = async () => {
    if (!user) return;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category_id, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense');

    if (transactions) {
      const categoryMap = new Map<string, number>();
      
      transactions.forEach((t) => {
        const categoryName = t.categories?.name || 'Tanpa Kategori';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + parseFloat(t.amount.toString()));
      });

      const colors = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--success))', 'hsl(142 76% 60%)', 'hsl(178 85% 60%)', 'hsl(0 84% 70%)'];
      
      const data = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setCategorySpending(data);
    }
  };

  const fetchRecentTransactions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('transactions')
      .select('id, type, amount, description, date, categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5);

    if (data) {
      setRecentTransactions(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const NavItems = () => (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate('/transactions')}
        className="justify-start"
      >
        <Receipt className="w-4 h-4 mr-2" />
        Transaksi
      </Button>
      <Button
        variant="ghost"
        onClick={() => navigate('/categories')}
        className="justify-start"
      >
        <Tags className="w-4 h-4 mr-2" />
        Kategori
      </Button>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>
    </>
  );

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">BudgetForge</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Kelola Keuangan Anda</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2">
            <NavItems />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold">BudgetForge</h2>
                    <p className="text-xs text-muted-foreground">Menu</p>
                  </div>
                </div>
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">Dashboard</h2>
            <p className="text-sm md:text-base text-muted-foreground">Ringkasan keuangan Anda</p>
          </div>
          <Button 
            onClick={() => navigate('/transactions')}
            className="gradient-primary text-primary-foreground shadow-soft w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Pemasukan
              </CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-success/10 flex items-center justify-center">
                <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold text-success">
                {formatCurrency(stats.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold text-destructive">
                {formatCurrency(stats.totalExpense)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in gradient-card border-l-4 border-l-primary sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Saldo
              </CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-xl md:text-3xl font-bold ${stats.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(stats.balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.balance >= 0 ? 'Surplus' : 'Defisit'} bulan ini
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Line Chart */}
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Tren Keuangan Bulanan</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">Pemasukan vs Pengeluaran</p>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--success))"
                      strokeWidth={3}
                      name="Pemasukan"
                      dot={{ fill: 'hsl(var(--success))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={3}
                      name="Pengeluaran"
                      dot={{ fill: 'hsl(var(--destructive))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Belum ada data transaksi</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Pengeluaran per Kategori</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">Top 6 kategori</p>
            </CardHeader>
            <CardContent>
              {categorySpending.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {categorySpending.slice(0, 3).map((cat, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="truncate max-w-[100px]">{cat.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Tags className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Belum ada pengeluaran</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">Transaksi Terbaru</CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">5 transaksi terakhir</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/transactions')}
              className="text-primary"
            >
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {transaction.description || 'Tanpa deskripsi'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.categories?.name || 'Tanpa kategori'} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm md:text-base font-bold flex-shrink-0 ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Belum ada transaksi</p>
                <Button
                  variant="link"
                  onClick={() => navigate('/transactions')}
                  className="mt-2 text-primary"
                >
                  Tambah transaksi pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;