import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Archive, Menu, X, Plane, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/dispatcher', label: 'Управление', icon: LayoutDashboard },
  { path: '/dispatcher/archive', label: 'Архив', icon: Archive },
];

export function DispatcherHeader() {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-14">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <Link to="/dispatcher" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground hidden sm:inline">
                Диспетчер
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              ← Назад
            </Link>
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-2 w-full
                          ${isActive ? 'bg-accent font-medium' : ''}
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: User menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Админ
                </Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {user?.name || 'Пользователь'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/">← Вернуться к записи</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}


