import { Button } from '@/components/ui/button';
import { useAccessibility } from './AccessibilityProvider';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Volume2, VolumeX, Play, Pause, HelpCircle } from 'lucide-react';

interface AudioControlsProps {
  className?: string;
}

export function AudioControls({ className = '' }: AudioControlsProps) {
  const { settings, announceToScreenReader } = useAccessibility();
  const { speak, stop, speaking } = useTextToSpeech({
    rate: settings.speechRate / 10,
    volume: settings.speechVolume / 100,
  });

  const readPageContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      const textContent = mainContent.textContent?.replace(/\s+/g, ' ').trim() || '';
      speak(textContent);
      announceToScreenReader('Reading page content');
    }
  };

  const toggleSpeech = () => {
    if (speaking) {
      stop();
      announceToScreenReader('Speech stopped');
    } else {
      announceToScreenReader('Speech controls ready');
    }
  };

  const showKeyboardHelp = () => {
    const helpText = `Keyboard shortcuts: Alt + R to read page, Alt + N for next question, Alt + P for previous question, Alt + F to flag question, Alt + H for help, Tab to navigate, Space to select, Enter to activate buttons`;
    speak(helpText);
    announceToScreenReader(helpText);
  };

  return (
    <div className={`p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg ${className}`}>
      <h3 className="text-xl font-semibold mb-4">Audio Controls</h3>
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={readPageContent}
          className="bg-primary hover:bg-primary-dark text-white focus-visible:outline-2 focus-visible:outline-primary"
          aria-describedby="read-page-desc"
          data-testid="button-read-page"
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Read This Page
        </Button>
        <p id="read-page-desc" className="sr-only">
          Activates text-to-speech to read the current page content
        </p>
        
        <Button 
          onClick={toggleSpeech}
          variant={speaking ? "destructive" : "default"}
          className="focus-visible:outline-2 focus-visible:outline-primary"
          aria-describedby="speech-desc"
          data-testid="button-toggle-speech"
        >
          {speaking ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {speaking ? 'Stop Speech' : 'Enable Audio Instructions'}
        </Button>
        <p id="speech-desc" className="sr-only">
          {speaking ? 'Stops current speech' : 'Toggles audio instructions for navigation and interactions'}
        </p>
        
        <Button 
          onClick={showKeyboardHelp}
          variant="outline"
          className="focus-visible:outline-2 focus-visible:outline-primary"
          aria-describedby="keyboard-desc"
          data-testid="button-keyboard-help"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Keyboard Shortcuts
        </Button>
        <p id="keyboard-desc" className="sr-only">
          Lists available keyboard shortcuts for navigation
        </p>
      </div>
    </div>
  );
}
