import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mb-6">Page Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-md text-center">
        The page you are looking for doesn't exist or you don't have permission to access it.
      </p>
      <Link to="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;
