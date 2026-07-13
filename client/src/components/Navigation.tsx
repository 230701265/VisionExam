import { Link, useLocation } from 'wouter';
import { useAccessibility } from './AccessibilityProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Settings, 
  HelpCircle, 
  LogOut,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  ChevronDown
} from 'lucide-react';

interface NavigationProps {
  currentUser?: { id: string; username: string; role: string } | null;
  onLogout?: () => void;
}

const LOGO = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect width="28" height="28" rx="7" fill="hsl(221 83% 53%)"/>
    <path d="M8 19V10l6-3 6 3v9l-6 3-6-3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="14" cy="14" r="2.5" fill="white"/>
  </svg>
);

export function Navigation({ currentUser, onLogout }: NavigationProps) {
  const [location] = useLocation();
  const { announceToScreenReader } = useAccessibility();

  const studentNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, 'data-testid': 'link-dashboard' },
    { href: '/settings', label: 'Settings', icon: Settings, 'data-testid': 'link-settings' },
    { href: '/help', label: 'Help', icon: HelpCircle, 'data-testid': 'link-help' },
  ];

  const instructorNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, 'data-testid': 'link-dashboard' },
    { href: '/exams', label: 'Manage Exams', icon: BookOpen, 'data-testid': 'link-manage-exams' },
    { href: '/grade', label: 'Grade Answers', icon: ClipboardCheck, 'data-testid': 'link-grade-answers' },
    { href: '/settings', label: 'Settings', icon: Settings, 'data-testid': 'link-settings' },
    { href: '/help', label: 'Help', icon: HelpCircle, 'data-testid': 'link-help' },
  ];

  const navItems = currentUser?.role === 'instructor' ? instructorNavItems : studentNavItems;

  const handleNavigation = (label: string) => {
    announceToScreenReader(`Navigating to ${label}`);
  };

  const handleLogout = () => {
    if (onLogout) {
      announceToScreenReader('Logging out');
      onLogout();
    }
  };

  const initials = currentUser?.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <header role="banner" id="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo + Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="OPSIS home" data-testid="link-home" className="flex items-center gap-2.5 shrink-0">
              <LOGO />
              <span className="font-bold text-base tracking-tight text-foreground">OPSIS</span>
            </Link>

            {/* Primary nav */}
            <nav role="navigation" aria-label="Main navigation" id="main-nav">
              <ul className="flex items-center gap-0.5" role="list">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <li key={item.href} role="listitem">
                      <Link
                        href={item.href}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                          transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary
                          ${isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => handleNavigation(item.label)}
                        data-testid={item['data-testid']}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Right side: user info + logout */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-xs font-medium border-border text-muted-foreground capitalize"
              >
                {currentUser.role}
              </Badge>

              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div
                  className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold select-none"
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <span className="text-sm font-medium text-foreground hidden md:inline">
                  {currentUser.username}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                onClick={handleLogout}
                data-testid="button-logout"
                aria-label="Logout"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
