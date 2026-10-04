import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg group-hover:scale-110 transition-transform">
              D
            </div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ドウデュース応援サイト
            </h1>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/mares">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                交配牝馬
              </Button>
            </Link>
            <Link to="/offspring">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                産駒一覧
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                管理
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}