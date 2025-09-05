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
    <header role="banner" className="bg-primary text-white">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <Link href="/" className="focus-visible:outline-2 focus-visible:outline-white" data-testid="link-home">
              OPSIS
            </Link>
          </h1>
          <nav role="navigation" aria-label="Main navigation">
            <ul className="flex space-x-6 items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`text-white hover:underline focus-visible:outline-2 focus-visible:outline-white transition-colors ${
                      location === item.href ? 'font-semibold text-white/90' : 'text-white/80 hover:text-white'
                    }`}
                    aria-current={location === item.href ? 'page' : undefined}
                    onClick={() => handleNavigation(item.label)}
                    data-testid={item['data-testid']}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {currentUser && (
                <li>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
