import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from './AccessibilityProvider';
import { HelpCircle, X, Keyboard } from 'lucide-react';

export function KeyboardNavigationHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { announceToScreenReader } = useAccessibility();

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      announceToScreenReader('Keyboard navigation help opened. Here are all the keyboard shortcuts available for navigating OPSIS.');
    } else {
      announceToScreenReader('Keyboard navigation help closed.');
    }
  };

  const shortcuts = [
    {
      category: 'Page Navigation',
      shortcuts: [
        { keys: 'Alt + Down Arrow', description: 'Navigate to next element on page' },
        { keys: 'Alt + Up Arrow', description: 'Navigate to previous element on page' },
        { keys: 'Alt + M', description: 'Jump to main content area' },
        { keys: 'Alt + N', description: 'Jump to navigation menu' },
      ]
    },
    {
      category: 'Element Jumping',
      shortcuts: [
        { keys: 'Alt + B', description: 'Jump to next button' },
        { keys: 'Alt + L', description: 'Jump to next link' },
        { keys: 'Alt + I', description: 'Jump to next input field' },
        { keys: 'Alt + C', description: 'Jump to next card or content section' },
      ]
    },
    {
      category: 'Heading Navigation',
      shortcuts: [
        { keys: 'Alt + 1', description: 'Jump to next H1 heading' },
        { keys: 'Alt + 2', description: 'Jump to next H2 heading' },
        { keys: 'Alt + 3', description: 'Jump to next H3 heading' },
        { keys: 'Alt + 4-6', description: 'Jump to other heading levels' },
      ]
    },
    {
      category: 'Standard Navigation',
      shortcuts: [
        { keys: 'Tab', description: 'Move to next focusable element' },
        { keys: 'Shift + Tab', description: 'Move to previous focusable element' },
        { keys: 'Enter', description: 'Activate buttons and links' },
        { keys: 'Space', description: 'Activate buttons and checkboxes' },
        { keys: 'Arrow Keys', description: 'Navigate within radio groups and dropdowns' },
      ]
    },
    {
      category: 'Exam-Specific',
      shortcuts: [
        { keys: 'Alt + R', description: 'Read current question aloud' },
        { keys: 'Alt + F', description: 'Flag current question for review' },
        { keys: 'Alt + H', description: 'Show this help menu' },
        { keys: 'Ctrl + M (Cmd + M on Mac)', description: 'Start voice input' },
      ]
    }
  ];

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Show keyboard navigation help"
        data-testid="button-keyboard-help"
      >
        <Keyboard className="h-4 w-4 mr-2" aria-hidden="true" />
        Keyboard Help
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="keyboard-help-title">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle id="keyboard-help-title" className="text-2xl flex items-center">
              <Keyboard className="h-6 w-6 mr-2" aria-hidden="true" />
              Keyboard Navigation Guide
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              OPSIS is designed for full keyboard navigation. Use these shortcuts to navigate efficiently without a mouse.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            aria-label="Close keyboard help"
            data-testid="button-close-keyboard-help"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {shortcuts.map((category) => (
              <div key={category.category} className="space-y-3">
                <h3 className="text-lg font-semibold border-b border-border pb-2">
                  {category.category}
                </h3>
                <div className="space-y-2">
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
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              Navigation Tips
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>All shortcuts work from anywhere on the page (except when typing in text fields)</li>
              <li>Screen readers will announce each element as you navigate to it</li>
              <li>Elements are highlighted with a blue outline when focused</li>
              <li>Cards and content sections can be focused for easy navigation</li>
              <li>Press Alt + H anytime to hear this help information read aloud</li>
              <li>Use Tab for precise navigation, Alt + Arrow keys for quick exploration</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <Button
              onClick={handleToggle}
              className="bg-primary hover:bg-primary-dark"
              data-testid="button-close-help-bottom"
            >
              Got it, close help
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}