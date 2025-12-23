import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-blue-700">ドウデュース応援サイト</h1>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link to="/admin/login">
              <Button variant="outline" size="sm">
                管理
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}