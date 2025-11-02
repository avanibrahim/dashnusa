import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-bold">Halaman Tidak Ditemukan</h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak dapat ditemukan.
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="gradient-primary text-primary-foreground"
        >
          <Home className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
