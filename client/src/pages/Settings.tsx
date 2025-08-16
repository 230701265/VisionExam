import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { Settings as SettingsIcon, Volume2, Eye, Keyboard } from 'lucide-react';

interface SettingsProps {
  currentUser: { id: string; username: string; role: string };
}

export default function Settings({ currentUser }: SettingsProps) {
  const { settings, updateSettings, isLoading } = useAccessibility();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    const defaultSettings = {
      fontSize: 18,
      contrastMode: 'normal',
      speechRate: 10,
      speechVolume: 80,
      audioInstructions: true,
      soundEffects: true,
      reducedMotion: false,
    };
    setLocalSettings({ ...settings, ...defaultSettings });
    updateSettings(defaultSettings);
  };

  const getSpeechRateLabel = (value: number) => {
    const rate = value / 10;
    if (rate < 0.8) return 'Very Slow';
    if (rate < 1.0) return 'Slow';
    if (rate === 1.0) return 'Normal';
    if (rate < 1.5) return 'Fast';
    return 'Very Fast';
  };

  return (
    <main id="main-content" role="main" className="max-w-4xl mx-auto px-6 py-8">
      <section aria-labelledby="settings-heading">
        <div className="mb-8">
          <h2 id="settings-heading" className="text-3xl font-bold mb-4 flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8" />
            Accessibility Settings
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Customize your exam experience for optimal accessibility and comfort.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Adjust visual appearance and readability options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="font-size" className="text-lg font-medium mb-2 block">
                  Font Size
                </Label>
                <Select 
                  value={localSettings.fontSize?.toString() || '18'} 
                  onValueChange={(value) => setLocalSettings({...localSettings, fontSize: parseInt(value)})}
                >
                  <SelectTrigger 
                    id="font-size" 
                    className="focus:ring-2 focus:ring-primary"
                    data-testid="select-font-size"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">Small (16px)</SelectItem>
                    <SelectItem value="18">Medium (18px) - Default</SelectItem>
                    <SelectItem value="24">Large (24px)</SelectItem>
                    <SelectItem value="32">Extra Large (32px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contrast-mode" className="text-lg font-medium mb-2 block">
                  Contrast Mode
                </Label>
                <Select 
                  value={localSettings.contrastMode || 'normal'} 
                  onValueChange={(value) => setLocalSettings({...localSettings, contrastMode: value})}
                >
                  <SelectTrigger 
                    id="contrast-mode" 
                    className="focus:ring-2 focus:ring-primary"
                    data-testid="select-contrast-mode"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High Contrast</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reduced-motion" className="text-lg font-medium">
                    Reduce Motion
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Minimizes animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={localSettings.reducedMotion || false}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, reducedMotion: checked})}
                  data-testid="switch-reduced-motion"
                />
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="mr-2 h-5 w-5" />
                Audio Settings
              </CardTitle>
              <CardDescription>
                Configure text-to-speech and audio feedback options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="speech-rate" className="text-lg font-medium mb-2 block">
                  Speech Rate
                </Label>
                <Slider
                  id="speech-rate"
                  min={5}
                  max={20}
                  step={1}
                  value={[localSettings.speechRate || 10]}
                  onValueChange={([value]) => setLocalSettings({...localSettings, speechRate: value})}
                  className="focus-visible:outline-2 focus-visible:outline-primary"
                  data-testid="slider-speech-rate"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Current rate: {getSpeechRateLabel(localSettings.speechRate || 10)} ({((localSettings.speechRate || 10) / 10).toFixed(1)}x)
                </p>
              </div>

              <div>
                <Label htmlFor="speech-volume" className="text-lg font-medium mb-2 block">
                  Speech Volume
                </Label>
                <Slider
                  id="speech-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[localSettings.speechVolume || 80]}
                  onValueChange={([value]) => setLocalSettings({...localSettings, speechVolume: value})}
                  className="focus-visible:outline-2 focus-visible:outline-primary"
                  data-testid="slider-speech-volume"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Current volume: {localSettings.speechVolume || 80}%
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="audio-instructions" className="text-lg font-medium">
                    Audio Instructions
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Provides spoken guidance for navigation
                  </p>
                </div>
                <Switch
                  id="audio-instructions"
                  checked={localSettings.audioInstructions ?? true}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, audioInstructions: checked})}
                  data-testid="switch-audio-instructions"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-effects" className="text-lg font-medium">
                    Sound Effects
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plays audio feedback for actions
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={localSettings.soundEffects ?? true}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, soundEffects: checked})}
                  data-testid="switch-sound-effects"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Keyboard className="mr-2 h-5 w-5" />
              Keyboard Shortcuts Reference
            </CardTitle>
            <CardDescription>
              Essential keyboard shortcuts for efficient navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">General Navigation</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Tab</dt>
                    <dd>Move to next element</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Shift + Tab</dt>
                    <dd>Move to previous element</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Enter / Space</dt>
                    <dd>Activate button or link</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt + H</dt>
                    <dd>Show help and shortcuts</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Exam Taking</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt + R</dt>
                    <dd>Read page content</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt + N</dt>
                    <dd>Next question</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt + P</dt>
                    <dd>Previous question</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt + F</dt>
                    <dd>Flag question for review</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary-dark px-8 py-3 focus-visible:outline-2 focus-visible:outline-primary"
            data-testid="button-save-settings"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="px-8 py-3 focus-visible:outline-2 focus-visible:outline-primary"
            data-testid="button-reset-settings"
          >
            Reset to Defaults
          </Button>
        </div>
      </section>
    </main>
  );
}
