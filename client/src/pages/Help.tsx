import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { Keyboard, Volume2, Eye, HelpCircle, Users, BookOpen } from 'lucide-react';

interface HelpProps {
  currentUser: { id: string; username: string; role: string };
}

export default function Help({ currentUser }: HelpProps) {
  const { announceToScreenReader } = useAccessibility();

  const handleSectionFocus = (sectionName: string) => {
    announceToScreenReader(`${sectionName} help section`);
  };

  const keyboardShortcuts = [
    {
      category: 'Page Navigation',
      icon: <Keyboard className="h-5 w-5" />,
      shortcuts: [
        { keys: 'Alt + Down Arrow', description: 'Navigate to next element on page' },
        { keys: 'Alt + Up Arrow', description: 'Navigate to previous element on page' },
        { keys: 'Alt + M', description: 'Jump to main content area' },
        { keys: 'Alt + N', description: 'Jump to navigation menu' },
      ]
    },
    {
      category: 'Quick Jumps',
      icon: <Eye className="h-5 w-5" />,
      shortcuts: [
        { keys: 'Alt + B', description: 'Jump to next button' },
        { keys: 'Alt + L', description: 'Jump to next link' },
        { keys: 'Alt + I', description: 'Jump to next input field' },
        { keys: 'Alt + C', description: 'Jump to next card or content section' },
        { keys: 'Alt + 1-6', description: 'Jump to heading levels (H1-H6)' },
      ]
    },
    {
      category: 'Exam Features',
      icon: <BookOpen className="h-5 w-5" />,
      shortcuts: [
        { keys: 'Alt + R', description: 'Read current question aloud' },
        { keys: 'Alt + F', description: 'Flag current question for review' },
        { keys: 'Alt + H', description: 'Show keyboard help menu' },
        { keys: 'Ctrl + M (Cmd + M on Mac)', description: 'Start voice input' },
      ]
    },
    {
      category: 'Standard Navigation',
      icon: <Users className="h-5 w-5" />,
      shortcuts: [
        { keys: 'Tab', description: 'Move to next focusable element' },
        { keys: 'Shift + Tab', description: 'Move to previous focusable element' },
        { keys: 'Enter', description: 'Activate buttons and links' },
        { keys: 'Space', description: 'Activate buttons and checkboxes' },
        { keys: 'Arrow Keys', description: 'Navigate within radio groups and dropdowns' },
      ]
    }
  ];

  return (
    <main id="main-content" role="main" className="max-w-4xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">OPSIS Help Center</h1>
        <p className="text-lg text-muted-foreground">
          Complete guide to using OPSIS with full accessibility support for blind and visually impaired students.
        </p>
      </header>

      {/* Quick Start Guide */}
      <section className="mb-8" onFocus={() => handleSectionFocus('Quick Start')}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <HelpCircle className="h-6 w-6 mr-2" aria-hidden="true" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Essential information to get started with OPSIS navigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">For Students</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Login with your roll number (e.g., "S001") and password</li>
                <li>Use Alt + Down/Up arrows to navigate through available exams</li>
                <li>Press Enter on "Start Exam" buttons to begin</li>
                <li>During exams, use Alt + R to read questions aloud</li>
                <li>Use Alt + N and Alt + P to navigate between questions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">For Instructors</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Login with your username and password</li>
                <li>Navigate to "Manage Exams" to create and edit exams</li>
                <li>Use "Grade Answers" to review student submissions</li>
                <li>All keyboard navigation shortcuts work the same way</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="mb-8" onFocus={() => handleSectionFocus('Keyboard Shortcuts')}>
        <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {keyboardShortcuts.map((category) => (
            <Card key={category.category} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  {category.icon}
                  <span className="ml-2">{category.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Badge variant="secondary" className="text-xs font-mono whitespace-nowrap">
                        {shortcut.keys}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex-1">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Accessibility Features */}
      <section className="mb-8" onFocus={() => handleSectionFocus('Accessibility Features')}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Volume2 className="h-6 w-6 mr-2" aria-hidden="true" />
              Accessibility Features
            </CardTitle>
            <CardDescription>
              OPSIS is designed with comprehensive accessibility support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Screen Reader Support</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Full NVDA, JAWS, and VoiceOver compatibility</li>
                <li>Proper ARIA labels and landmarks throughout</li>
                <li>Live regions for dynamic content announcements</li>
                <li>Semantic HTML structure for easy navigation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Text-to-Speech</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Built-in text-to-speech for all content</li>
                <li>Adjustable speech rate and volume in Settings</li>
                <li>Automatic reading of questions and instructions</li>
                <li>Voice feedback for navigation actions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Visual Accessibility</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>High contrast mode for low vision users</li>
                <li>Adjustable font sizes up to 24px</li>
                <li>Clear focus indicators for keyboard navigation</li>
                <li>Dark mode support for light sensitivity</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8" onFocus={() => handleSectionFocus('Troubleshooting')}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Troubleshooting</CardTitle>
            <CardDescription>
              Common issues and solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Keyboard Navigation Not Working</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Make sure you're not in a text input field when using Alt shortcuts</li>
                <li>Try clicking elsewhere on the page first, then use shortcuts</li>
                <li>Refresh the page if shortcuts stop responding</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Screen Reader Issues</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Ensure your screen reader is running before opening OPSIS</li>
                <li>Try navigating with both Tab and Alt+Arrow keys</li>
                <li>Use landmarks navigation (headings, main, navigation) in your screen reader</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Text-to-Speech Not Working</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your browser's speech settings in Settings page</li>
                <li>Ensure your device volume is turned up</li>
                <li>Try a different browser if issues persist</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact Support */}
      <section onFocus={() => handleSectionFocus('Contact Support')}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Need More Help?</CardTitle>
            <CardDescription>
              Additional support resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>If you need additional assistance with OPSIS:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Contact your institution's accessibility services</li>
                <li>Reach out to your instructor for exam-specific questions</li>
                <li>Use the "Keyboard Help" button (bottom-right corner) for quick reference</li>
                <li>Practice with demo exams to familiarize yourself with the interface</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}