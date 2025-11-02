import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // toggle login/register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('email not confirmed')) {
          setMessage('Email belum dikonfirmasi. Silakan cek inbox Anda.');
        } else {
          setMessage(error.message);
        }
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Akun berhasil dibuat! Silakan cek email untuk konfirmasi.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blue-50/20 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-elevated relative overflow-hidden">
        {/* Pemanis gambar */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-600 rounded-full opacity-20 pointer-events-none"></div>
        <CardHeader className="space-y-3 text-center relative z-10">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">{isLogin ? 'Selamat Datang' : 'Daftar Akun'}</CardTitle>
          <CardDescription>
            {isLogin
              ? 'Masuk ke akun NotaNusa Anda'
              : 'Buat akun baru untuk mulai mengelola keuangan'}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nama Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isLogin ? (
              <>
                Belum punya akun?{' '}
                <button
                  className="text-blue-600 font-medium hover:underline"
                  onClick={() => setIsLogin(false)}
                >
                  Daftar sekarang
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  className="text-blue-600 font-medium hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Masuk
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
