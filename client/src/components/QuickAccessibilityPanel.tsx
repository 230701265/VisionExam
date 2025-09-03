import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { 
  Settings, 
  Eye, 
  Volume2, 
  Move, 
  Type, 
  Palette, 
  X, 
  ChevronDown,
  ChevronUp,
  Zap,
  Monitor,
  Headphones,
  MousePointer,
  Focus
} from 'lucide-react';

interface QuickAccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAccessibilityPanel({ isOpen, onClose }: QuickAccessibilityPanelProps) {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  const handleQuickChange = async (key: keyof typeof settings, value: any) => {
    await updateSettings({ [key]: value });
    announceToScreenReader(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} changed`);
  };

  const quickPresets = [
    {
      name: 'High Visibility',
      icon: Eye,
      description: 'Large text, high contrast, enhanced focus',
      action: () => {
        updateSettings({
          fontSize: 24,
          contrastMode: 'high',
          focusIndicatorStyle: 'thick',
          highlightLinks: true
        });
        announceToScreenReader('High visibility mode activated');
      }
    },
    {
      name: 'Motion Sensitive',
      icon: Move,
      description: 'Reduced motion and animations',
      action: () => {
        updateSettings({
          reducedMotion: true,
          animationSpeed: 'off',
          parallaxEffects: false,
          autoplayMedia: false
        });
        announceToScreenReader('Motion sensitive mode activated');
      }
    },
    {
      name: 'Audio Focus',
      icon: Headphones,
      description: 'Enhanced audio feedback and instructions',
      action: () => {
        updateSettings({
          speechEnabled: true,
          audioInstructions: true,
          announceChanges: true,
          verboseMode: true
        });
        announceToScreenReader('Audio focus mode activated');
      }
    },
    {
      name: 'Reading Mode',
      icon: Type,
      description: 'Optimized for reading and focus',
      action: () => {
        updateSettings({
          readingMode: true,
          fontSize: 20,
          lineHeight: 1.8,
          paragraphSpacing: 1.5,
          fontFamily: 'serif'
        });
        announceToScreenReader('Reading mode activated');
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" role="dialog" aria-labelledby="quick-accessibility-title">
      <div className="fixed right-4 top-4 bottom-4 w-96 max-h-[90vh] overflow-y-auto">
        <Card className="h-full shadow-2xl border-2 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-primary/5">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle id="quick-accessibility-title" className="text-lg">
                Quick Accessibility
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
                data-testid="button-toggle-collapse"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close accessibility panel"
                data-testid="button-close-panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isCollapsed && (
            <CardContent className="space-y-6 p-6">
              {/* Quick Presets */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Presets
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {quickPresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 text-left"
                      onClick={preset.action}
                      data-testid={`button-preset-${index}`}
                    >
                      <preset.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Visual Controls */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Monitor className="mr-2 h-4 w-4" />
                  Visual
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Font Size: {settings.fontSize}px
                    </label>
                    <Slider
                      min={14}
                      max={32}
                      step={2}
                      value={[settings.fontSize]}
                      onValueChange={([value]) => handleQuickChange('fontSize', value)}
                      className="w-full"
                      data-testid="slider-quick-font-size"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Contrast Mode
                    </label>
                    <Select
                      value={settings.contrastMode}
                      onValueChange={(value: 'normal' | 'high' | 'dark') => handleQuickChange('contrastMode', value)}
                    >
                      <SelectTrigger className="h-8" data-testid="select-quick-contrast">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High Contrast</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Color Support
                    </label>
                    <Select
                      value={settings.colorTheme}
                      onValueChange={(value) => handleQuickChange('colorTheme', value)}
                    >
                      <SelectTrigger className="h-8" data-testid="select-quick-color-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="protanopia">Protanopia</SelectItem>
                        <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                        <SelectItem value="tritanopia">Tritanopia</SelectItem>
                        <SelectItem value="monochrome">Monochrome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Audio
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Text-to-Speech
                    </label>
                    <Switch
                      checked={settings.speechEnabled}
                      onCheckedChange={(checked) => handleQuickChange('speechEnabled', checked)}
                      data-testid="switch-quick-speech"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Audio Instructions
                    </label>
                    <Switch
                      checked={settings.audioInstructions}
                      onCheckedChange={(checked) => handleQuickChange('audioInstructions', checked)}
                      data-testid="switch-quick-audio-instructions"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Speech Rate: {(settings.speechRate / 10).toFixed(1)}x
                    </label>
                    <Slider
                      min={5}
                      max={20}
                      step={1}
                      value={[settings.speechRate]}
                      onValueChange={([value]) => handleQuickChange('speechRate', value)}
                      className="w-full"
                      data-testid="slider-quick-speech-rate"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Volume: {settings.speechVolume}%
                    </label>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[settings.speechVolume]}
                      onValueChange={([value]) => handleQuickChange('speechVolume', value)}
                      className="w-full"
                      data-testid="slider-quick-volume"
                    />
                  </div>
                </div>
              </div>

              {/* Motion Controls */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Move className="mr-2 h-4 w-4" />
                  Motion
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Reduce Motion
                    </label>
                    <Switch
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => handleQuickChange('reducedMotion', checked)}
                      data-testid="switch-quick-reduced-motion"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Animation Speed
                    </label>
                    <Select
                      value={settings.animationSpeed}
                      onValueChange={(value) => handleQuickChange('animationSpeed', value)}
                    >
                      <SelectTrigger className="h-8" data-testid="select-quick-animation-speed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Focus className="mr-2 h-4 w-4" />
                  Navigation
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Skip Links Visible
                    </label>
                    <Switch
                      checked={settings.skipLinksVisible}
                      onCheckedChange={(checked) => handleQuickChange('skipLinksVisible', checked)}
                      data-testid="switch-quick-skip-links"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Highlight Links
                    </label>
                    <Switch
                      checked={settings.highlightLinks}
                      onCheckedChange={(checked) => handleQuickChange('highlightLinks', checked)}
                      data-testid="switch-quick-highlight-links"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Focus Style
                    </label>
                    <Select
                      value={settings.focusIndicatorStyle}
                      onValueChange={(value) => handleQuickChange('focusIndicatorStyle', value)}
                    >
                      <SelectTrigger className="h-8" data-testid="select-quick-focus-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="thick">Thick</SelectItem>
                        <SelectItem value="colored">Colored</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-2">
                <Button 
                  className="w-full" 
                  onClick={onClose}
                  data-testid="button-apply-close"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Open Full Settings
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Changes are applied instantly. Press Ctrl+A to open full settings.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}