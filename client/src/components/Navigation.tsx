import { Link, useLocation } from 'wouter';
import { useAccessibility } from './AccessibilityProvider';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentUser?: { id: string; username: string; role: string } | null;
  onLogout?: () => void;
}

export function Navigation({ currentUser, onLogout }: NavigationProps) {
  const [location] = useLocation();
  const { announceToScreenReader } = useAccessibility();

  const navItems = [
    { href: '/', label: 'Dashboard', 'data-testid': 'link-dashboard' },
    { href: '/settings', label: 'Settings', 'data-testid': 'link-settings' },
    { href: '/help', label: 'Help', 'data-testid': 'link-help' },
  ];

  if (currentUser?.role === 'instructor') {
    navItems.splice(1, 0, 
      { href: '/exams', label: 'Manage Exams', 'data-testid': 'link-manage-exams' },
      { href: '/grade', label: 'Grade Answers', 'data-testid': 'link-grade-answers' }
    );
  }

  const handleNavigation = (label: string) => {
    announceToScreenReader(`Navigating to ${label}`);
  };

  const handleLogout = () => {
    if (onLogout) {
      announceToScreenReader('Logging out');
      onLogout();
    }
  };

  return (
    <header role="banner" className="bg-primary text-primary-foreground shadow-lg border-b border-primary/20">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand and Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">
              <Link 
                href="/" 
                className="focus-visible:outline-4 focus-visible:outline-white rounded-lg px-2 py-1 transition-all duration-200 hover:bg-white/10" 
                data-testid="link-home"
                aria-label="OPSIS - Go to homepage"
              >
                OPSIS
              </Link>
            </h1>
            {/* User context indicator */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-2 text-sm bg-white/10 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true" />
                <span className="font-medium">{currentUser.username}</span>
                <span className="text-white/70">({currentUser.role})</span>
              </div>
            )}
          </div>

          {/* Enhanced Navigation */}
          <nav 
            id="navigation" 
            role="navigation" 
            aria-label="Main navigation"
            className="flex items-center space-x-2"
          >
            <ul className="flex items-center space-x-1">
              {navItems.map((item, index) => {
                const isActive = location === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all duration-200
                        focus-visible:outline-4 focus-visible:outline-white
                        hover:bg-white/10 hover:scale-105
                        ${isActive 
                          ? 'bg-white/20 text-white shadow-md border border-white/30' 
                          : 'text-white/90 hover:text-white'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleNavigation(item.label)}
                      data-testid={item['data-testid']}
                      title={`Navigate to ${item.label} ${isActive ? '(current page)' : ''}`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="sr-only"> (current page)</span>
                      )}
                    </Link>
                  </li>
                );
              })}
              
              {/* User Actions */}
              {currentUser && (
                <li className="ml-4 pl-4 border-l border-white/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 focus-visible:outline-4 focus-visible:outline-white rounded-lg px-4 py-2 font-medium transition-all duration-200 hover:scale-105"
                    onClick={handleLogout}
                    data-testid="button-logout"
                    aria-label="Logout from your account"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Mobile navigation indicator (for future mobile support) */}
        <div className="sr-only">
          Navigation contains {navItems.length} main sections. Current page: {navItems.find(item => item.href === location)?.label || 'Unknown'}
        </div>
      </div>
    </header>
  );
}
