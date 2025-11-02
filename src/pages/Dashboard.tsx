import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Wallet, Receipt, Tags, Plus, Menu, Home, HandCoins, ChartNoAxesCombined } from 'lucide-react';
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
      navigate('/auth');
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
      setStats({ totalIncome: income, totalExpense: expense, balance: income - expense });
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
        if (t.type === 'income') existing.income += parseFloat(t.amount.toString());
        else existing.expense += parseFloat(t.amount.toString());
        monthlyData.set(month, existing);
      });
      const data = Array.from(monthlyData.entries()).map(([month, values]) => ({ month, ...values }));
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
        .map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }))
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
    if (data) setRecentTransactions(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  // desktop
  const NavItems = () => (
    <>
      <Button variant="ghost" onClick={() => navigate('/')} className="justify-start">
        <Home className="w-4 h-4 mr-2" />
        Dashboard
      </Button>
      <Button variant="ghost" onClick={() => navigate('/transactions')} className="justify-start">
        <Receipt className="w-4 h-4 mr-2" />
        Transaksi
      </Button>
      <Button variant="ghost" onClick={() => navigate('/categories')} className="justify-start">
        <Tags className="w-4 h-4 mr-2" />
        Kategori
      </Button>
      <Button variant="ghost" onClick={() => navigate('/hutang-piutang')} className="justify-start">
        <HandCoins className="w-4 h-4 mr-2" />
        Hutang Piutang
      </Button>
      <Button variant="ghost" onClick={() => navigate('/analysis')} className="justify-start">
        <ChartNoAxesCombined className="w-4 h-4 mr-2" />
        Analisis
      </Button>
      <div className="flex-1 mt-10">
      <Button variant="ghost" onClick={handleLogout} className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>
      </div>
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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-blue-100 p-4 bg-white/80 backdrop-blur-md sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/justlogop.png"
            alt="Logo NotaNusa"
            className="w-14 h-14 rounded-lg object-cover"
          />
          <h1 className="text-xl font-bold text-blue-900">NotaNusa</h1>
        </div>
        <nav className="flex flex-col gap-2 text-blue-900/80">
          <NavItems />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header Mobile */}
        <header className="border-b bg-white/70 backdrop-blur-sm sticky top-0 z-10 shadow-sm md:hidden">
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/justlogop.png"
                alt="Logo NotaNusa"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <h1 className="text-lg font-semibold text-blue-900">NotaNusa</h1>
            </div>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white">
                <div className="mt-8 flex flex-col gap-4">
                  <h2 className="font-bold text-blue-900">Menu</h2>
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="px-4 md:px-8 py-6 md:py-10 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Dashboard
              </h2>
              <p className="text-sm text-blue-700/70">
                Ringkasan keuangan Anda bulan ini
              </p>
            </div>
            <Button
              onClick={() => navigate("/transactions")}
              className="bg-blue-900 hover:bg-blue-800 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Transaksi
            </Button>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-blue-100 bg-white shadow-sm hover:shadow-md transition rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-blue-900 font-semibold text-sm">
                  Total Pemasukan
                </CardTitle>
                <ArrowUpCircle className="text-green-600 w-5 h-5" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalIncome)}
                </p>
                <p className="text-xs text-blue-700/70 mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-white shadow-sm hover:shadow-md transition rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-blue-900 font-semibold text-sm">
                  Total Pengeluaran
                </CardTitle>
                <ArrowDownCircle className="text-red-600 w-5 h-5" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalExpense)}
                </p>
                <p className="text-xs text-blue-700/70 mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-gradient-to-br from-blue-900 to-blue-700 shadow-md text-white rounded-xl">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="font-semibold text-sm">Saldo</CardTitle>
                <Wallet className="w-5 h-5 text-blue-100" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.balance)}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {stats.balance >= 0 ? "Surplus" : "Defisit"} bulan ini
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white border-blue-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-blue-900 font-semibold">
                  Tren Keuangan Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#16A34A"
                      strokeWidth={3}
                      name="Pemasukan"
                      dot={{ fill: "#16A34A" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#DC2626"
                      strokeWidth={3}
                      name="Pengeluaran"
                      dot={{ fill: "#DC2626" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-100 shadow-sm rounded-xl">
  <CardHeader>
    <CardTitle className="text-blue-900 font-semibold">
      Pengeluaran per Kategori
    </CardTitle>
  </CardHeader>

  <CardContent>
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={categorySpending}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
        >
          {categorySpending.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
      </PieChart>
    </ResponsiveContainer>

    {/* 🧠 Himbauan / Catatan */}
    <p className="text-sm text-gray-700 text-center mt-4 ">
      “Pantau dan kendalikan pengeluaran kamu agar tetap seimbang setiap bulan.”
    </p>
  </CardContent>
</Card>

          </div>

          {/* Transaksi Terbaru */}
          <Card className="bg-white border-blue-100 shadow-sm rounded-xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-blue-900 font-semibold">
                Transaksi Terbaru
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/transactions")}
                className="border-blue-200 text-blue-900 hover:bg-blue-50"
              >
                Lihat Semua
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((trx) => (
                    <div
                      key={trx.id}
                      className="flex justify-between items-center p-3 rounded-lg hover:bg-blue-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            trx.type === "income"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {trx.type === "income" ? (
                            <ArrowUpCircle className="text-green-600 w-5 h-5" />
                          ) : (
                            <ArrowDownCircle className="text-red-600 w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-blue-900">
                            {trx.description}
                          </p>
                          <p className="text-xs text-blue-700/70">
                            {trx.categories?.name} • {formatDate(trx.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          trx.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trx.type === "income" ? "+" : "-"}
                        {formatCurrency(trx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-blue-700/70">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;