import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Archive, Menu, X, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dispatcher', label: 'Управление', icon: LayoutDashboard },
  { path: '/dispatcher/archive', label: 'Архив', icon: Archive },
];

export function DispatcherSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile toggle - only show when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-30 lg:hidden bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 min-h-screen h-full w-full bg-sidebar z-50
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:relative lg:h-auto lg:min-h-screen lg:z-auto lg:w-56
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo with close button on mobile */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-sidebar-primary" />
              <span className="font-semibold text-sidebar-foreground">
                Диспетчер
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to pilot view */}
          <div className="p-3 border-t border-sidebar-border">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              ← Вернуться к записи
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
