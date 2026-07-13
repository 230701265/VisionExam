import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { Keyboard, Volume2, Eye, HelpCircle, Users, BookOpen, Zap, Monitor } from 'lucide-react';

interface HelpProps {
  currentUser: { id: string; username: string; role: string };
}

const KbdKey = ({ children }: { children: string }) => (
  <kbd className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted border border-border text-xs font-mono font-semibold text-foreground">
    {children}
  </kbd>
);

export default function Help({ currentUser }: HelpProps) {
  const { announceToScreenReader } = useAccessibility();

  const handleSectionFocus = (sectionName: string) => {
    announceToScreenReader(`${sectionName} help section`);
  };

  const keyboardShortcuts = [
    {
      category: 'Page Navigation',
      icon: Keyboard,
      color: 'text-blue-600 bg-blue-50',
      shortcuts: [
        { keys: ['Alt', '↓'], description: 'Navigate to next element' },
        { keys: ['Alt', '↑'], description: 'Navigate to previous element' },
        { keys: ['Alt', 'M'], description: 'Jump to main content' },
        { keys: ['Alt', 'N'], description: 'Jump to navigation' },
        { keys: ['Alt', 'F'], description: 'Jump to footer' },
      ]
    },
    {
      category: 'Quick Jumps',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50',
      shortcuts: [
        { keys: ['Alt', 'B'], description: 'Jump to next button' },
        { keys: ['Alt', 'L'], description: 'Jump to next link' },
        { keys: ['Alt', 'I'], description: 'Jump to next input' },
        { keys: ['Alt', 'C'], description: 'Jump to next card' },
        { keys: ['Alt', '1–6'], description: 'Jump to heading level' },
      ]
    },
    {
      category: 'Exam Features',
      icon: BookOpen,
      color: 'text-green-600 bg-green-50',
      shortcuts: [
        { keys: ['Alt', 'R'], description: 'Read current question aloud' },
        { keys: ['Alt', 'H'], description: 'Show keyboard help menu' },
        { keys: ['Ctrl', 'M'], description: 'Start voice input (Mac: Cmd+M)' },
        { keys: ['F5'], description: 'Run code (VS Code shortcut)' },
        { keys: ['F9'], description: 'Reset code editor' },
      ]
    },
    {
      category: 'Accessibility Panel',
      icon: Monitor,
      color: 'text-purple-600 bg-purple-50',
      shortcuts: [
        { keys: ['Alt', 'A'], description: 'Open quick accessibility panel' },
        { keys: ['F11'], description: 'Toggle accessibility panel' },
        { keys: ['Esc'], description: 'Close any open panel' },
      ]
    },
    {
      category: 'Standard Navigation',
      icon: Users,
      color: 'text-slate-600 bg-slate-50',
      shortcuts: [
        { keys: ['Tab'], description: 'Move to next focusable element' },
        { keys: ['Shift', 'Tab'], description: 'Move to previous element' },
        { keys: ['Enter'], description: 'Activate buttons and links' },
        { keys: ['Space'], description: 'Activate buttons and checkboxes' },
        { keys: ['↑ ↓'], description: 'Navigate within groups/dropdowns' },
      ]
    }
  ];

  const screenReaders = [
    { name: 'NVDA', platform: 'Windows', description: 'Free, open-source screen reader. Recommended for Windows users.', badge: 'Free' },
    { name: 'JAWS', platform: 'Windows', description: 'Professional screen reader with advanced features for enterprise use.', badge: 'Paid' },
    { name: 'VoiceOver', platform: 'macOS / iOS', description: 'Built-in Apple screen reader. Press ⌘+F5 to activate on Mac.', badge: 'Built-in' },
    { name: 'Orca', platform: 'Linux', description: 'GNOME screen reader for Linux distributions.', badge: 'Free' },
    { name: 'TalkBack', platform: 'Android', description: 'Built-in Android screen reader for mobile devices.', badge: 'Built-in' },
  ];

  return (
    <main id="main-content" role="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Help Center</h1>
            <p className="text-muted-foreground text-sm">
              Keyboard shortcuts, screen reader support, and accessibility guides
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <section className="mb-8" onFocus={() => handleSectionFocus('Quick Start')} aria-labelledby="quickstart-heading">
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border pb-4">
            <CardTitle id="quickstart-heading" className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Log in', desc: 'Enter your credentials on the login page. Tab through the form fields.' },
                { step: '2', title: 'Browse exams', desc: 'On the Dashboard you\'ll see all available exams. Use Tab or Alt+↓ to navigate.' },
                { step: '3', title: 'Start an exam', desc: 'Press Enter on "Start Exam". The editor opens with full keyboard navigation.' },
                { step: '4', title: 'Answer questions', desc: 'Tab between questions. Alt+R reads the current question aloud.' },
                { step: '5', title: 'Submit', desc: 'Press the Submit button or use Ctrl+S. Results appear instantly.' },
                { step: '6', title: 'Review results', desc: 'Navigate to Results from the Dashboard to see your score breakdown.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-0.5">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Keyboard shortcuts */}
      <section className="mb-8" aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="text-xl font-bold text-foreground mb-4">Keyboard Shortcuts</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {keyboardShortcuts.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.category} className="border-border shadow-sm" onFocus={() => handleSectionFocus(group.category)}>
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${group.color}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    {group.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ul className="space-y-2" role="list">
                    {group.shortcuts.map((shortcut, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, ki) => (
                            <span key={ki} className="flex items-center gap-1">
                              <KbdKey>{key}</KbdKey>
                              {ki < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground/50 text-xs">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Screen readers */}
      <section aria-labelledby="screenreaders-heading" onFocus={() => handleSectionFocus('Screen Reader Support')}>
        <h2 id="screenreaders-heading" className="text-xl font-bold text-foreground mb-4">Screen Reader Compatibility</h2>
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <table className="table-premium w-full" role="table" aria-label="Supported screen readers">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Screen Reader</th>
                  <th scope="col" className="text-left">Platform</th>
                  <th scope="col" className="text-left hidden md:table-cell">Description</th>
                  <th scope="col" className="text-left">License</th>
                </tr>
              </thead>
              <tbody>
                {screenReaders.map((sr) => (
                  <tr key={sr.name}>
                    <td className="font-semibold text-foreground">{sr.name}</td>
                    <td className="text-muted-foreground">{sr.platform}</td>
                    <td className="text-muted-foreground hidden md:table-cell">{sr.description}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sr.badge === 'Free' || sr.badge === 'Built-in'
                          ? 'badge-success'
                          : 'badge-neutral'
                      }`}>
                        {sr.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
