import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';

interface TransactionData {
  month: string;
  income: number;
  expense: number;
}

interface PieData {
  name: string;
  value: number;
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#1e40af', '#93c5fd'];

const Analysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<TransactionData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalysisData();
      fetchPieData();
    }
  }, [user]);

  // 🔹 Data untuk Line Chart (trend bulanan)
  const fetchAnalysisData = async () => {
    if (!user) return;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching analysis data:', error);
      setIsLoadingData(false);
      return;
    }

    if (transactions) {
      const monthlyMap = new Map<string, { income: number; expense: number }>();

      transactions.forEach((t) => {
        const month = new Date(t.date).toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        });
        const current = monthlyMap.get(month) || { income: 0, expense: 0 };
        if (t.type === 'income')
          current.income += parseFloat(t.amount.toString());
        else current.expense += parseFloat(t.amount.toString());
        monthlyMap.set(month, current);
      });

      const data = Array.from(monthlyMap.entries()).map(([month, values]) => ({
        month,
        ...values,
      }));

      setChartData(data);
    }
    setIsLoadingData(false);
  };

  // 🔹 Data untuk Pie Chart (kategori pengeluaran)
  const fetchPieData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense');

    if (error) {
      console.error('Error fetching pie data:', error);
      return;
    }

    if (data) {
      const grouped = data.reduce((acc: Record<string, number>, curr: any) => {
        const name = curr.categories?.name || 'Tanpa Kategori';
        acc[name] = (acc[name] || 0) + Number(curr.amount);
        return acc;
      }, {});

      const formatted = Object.entries(grouped).map(([name, value]) => ({
        name,
        value,
      }));

      setPieData(formatted);
    }
  };

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

  // 🔹 Hitung total untuk persentase label di pie chart
  const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-10 shadow-sm">
  <div className="container mx-auto px-4 py-4 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-blue-800">
          Analisis Keuangan
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Ringkasan keuangan bulanan Anda
        </p>
      </div>
    </div>
  </div>
</header>


      {/* Main Content */}
      <main className="container mx-auto px-4 py-10">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart */}
          <Card className="rounded-2xl border border-blue-100 shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                Tren Bulanan
              </CardTitle>
              <p className="text-sm text-blue-500">
                Pemasukan vs Pengeluaran
              </p>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e7ff',
                        borderRadius: 12,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#2563eb"
                      strokeWidth={3}
                      name="Pemasukan"
                      dot={{ fill: '#2563eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Pengeluaran"
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p className="text-sm">Belum ada data transaksi</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="rounded-2xl border border-blue-100 shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                Ringkasan Pengeluaran
              </CardTitle>
              <p className="text-sm text-blue-500">Distribusi per kategori</p>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#2563eb"
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={({ name, value }) => {
                        const percent = ((value / total) * 100).toFixed(0);
                        return `${name} ${percent}%`;
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                      <LabelList dataKey="name" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e7ff',
                        borderRadius: 10,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">
                  Belum ada data pengeluaran
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <div className="mt-10">
          <Card className="rounded-2xl border border-blue-100 shadow-md bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">
                Catatan Analisis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed">
                Halaman ini digunakan untuk menampilkan tren keuangan, analisis
                pemasukan dan pengeluaran, serta ringkasan kategori. Semua data
                bersumber dari transaksi pengguna dan diperbarui otomatis.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analysis;
