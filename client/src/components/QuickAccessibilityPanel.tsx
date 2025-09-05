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
  
  // Default settings for toggling back to normal
  const defaultSettings = {
    fontSize: 18,
    contrastMode: 'normal' as const,
    focusIndicatorStyle: 'default' as const,
    highlightLinks: false,
    reducedMotion: false,
    animationSpeed: 'normal' as const,
    parallaxEffects: true,
    autoplayMedia: true,
    speechEnabled: false,
    audioInstructions: true,
    announceChanges: true,
    verboseMode: false,
    readingMode: false,
    lineHeight: 1.6,
    paragraphSpacing: 1,
    fontFamily: 'default' as const
  };
  
  // Check if presets are active
  const isHighVisibilityActive = settings.fontSize === 24 && settings.contrastMode === 'high' && 
    settings.focusIndicatorStyle === 'thick' && settings.highlightLinks;
    
  const isMotionSensitiveActive = settings.reducedMotion && settings.animationSpeed === 'off' && 
    !settings.parallaxEffects && !settings.autoplayMedia;
    
  const isAudioFocusActive = settings.speechEnabled && settings.audioInstructions && 
    settings.announceChanges && settings.verboseMode;
    
  const isReadingModeActive = settings.readingMode && settings.fontSize === 20 && 
    settings.lineHeight === 1.8 && settings.paragraphSpacing === 1.5 && settings.fontFamily === 'serif';

  if (!isOpen) return null;

  const handleQuickChange = async (key: keyof typeof settings, value: any) => {
    try {
      await updateSettings({ [key]: value });
      const readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
      announceToScreenReader(`${readableKey} changed to ${typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : value}`);
    } catch (error) {
      console.error('Failed to update accessibility setting:', error);
      announceToScreenReader('Setting update failed');
    }
  };

  const quickPresets = [
    {
      name: 'High Visibility',
      icon: Eye,
      description: 'Large text, high contrast, enhanced focus',
      isActive: isHighVisibilityActive,
      action: async () => {
        try {
          if (isHighVisibilityActive) {
            // Toggle off - restore defaults
            await updateSettings({
              fontSize: defaultSettings.fontSize,
              contrastMode: defaultSettings.contrastMode,
              focusIndicatorStyle: defaultSettings.focusIndicatorStyle,
              highlightLinks: defaultSettings.highlightLinks
            });
            announceToScreenReader('High visibility mode deactivated');
          } else {
            // Toggle on - apply preset
            await updateSettings({
              fontSize: 24,
              contrastMode: 'high',
              focusIndicatorStyle: 'thick',
              highlightLinks: true
            });
            announceToScreenReader('High visibility mode activated');
          }
        } catch (error) {
          announceToScreenReader('Failed to toggle high visibility mode');
        }
      }
    },
    {
      name: 'Motion Sensitive',
      icon: Move,
      description: 'Reduced motion and animations',
      isActive: isMotionSensitiveActive,
      action: async () => {
        try {
          if (isMotionSensitiveActive) {
            // Toggle off - restore defaults
            await updateSettings({
              reducedMotion: defaultSettings.reducedMotion,
              animationSpeed: defaultSettings.animationSpeed,
              parallaxEffects: defaultSettings.parallaxEffects,
              autoplayMedia: defaultSettings.autoplayMedia
            });
            announceToScreenReader('Motion sensitive mode deactivated');
          } else {
            // Toggle on - apply preset
            await updateSettings({
              reducedMotion: true,
              animationSpeed: 'off',
              parallaxEffects: false,
              autoplayMedia: false
            });
            announceToScreenReader('Motion sensitive mode activated');
          }
        } catch (error) {
          announceToScreenReader('Failed to toggle motion sensitive mode');
        }
      }
    },
    {
      name: 'Audio Focus',
      icon: Headphones,
      description: 'Enhanced audio feedback and instructions',
      isActive: isAudioFocusActive,
      action: async () => {
        try {
          if (isAudioFocusActive) {
            // Toggle off - restore defaults
            await updateSettings({
              speechEnabled: defaultSettings.speechEnabled,
              audioInstructions: defaultSettings.audioInstructions,
              announceChanges: defaultSettings.announceChanges,
              verboseMode: defaultSettings.verboseMode
            });
            announceToScreenReader('Audio focus mode deactivated');
          } else {
            // Toggle on - apply preset
            await updateSettings({
              speechEnabled: true,
              audioInstructions: true,
              announceChanges: true,
              verboseMode: true
            });
            announceToScreenReader('Audio focus mode activated');
          }
        } catch (error) {
          announceToScreenReader('Failed to toggle audio focus mode');
        }
      }
    },
    {
      name: 'Reading Mode',
      icon: Type,
      description: 'Optimized for reading and focus',
      isActive: isReadingModeActive,
      action: async () => {
        try {
          if (isReadingModeActive) {
            // Toggle off - restore defaults
            await updateSettings({
              readingMode: defaultSettings.readingMode,
              fontSize: defaultSettings.fontSize,
              lineHeight: defaultSettings.lineHeight,
              paragraphSpacing: defaultSettings.paragraphSpacing,
              fontFamily: defaultSettings.fontFamily
            });
            announceToScreenReader('Reading mode deactivated');
          } else {
            // Toggle on - apply preset
            await updateSettings({
              readingMode: true,
              fontSize: 20,
              lineHeight: 1.8,
              paragraphSpacing: 1.5,
              fontFamily: 'serif'
            });
            announceToScreenReader('Reading mode activated');
          }
        } catch (error) {
          announceToScreenReader('Failed to toggle reading mode');
        }
      }
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" 
      role="dialog" 
      aria-labelledby="quick-accessibility-title"
      aria-describedby="quick-accessibility-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <Card className="shadow-2xl border-2 border-primary/30 bg-background/95 backdrop-blur-sm">
          {/* Enhanced Header */}
          <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle id="quick-accessibility-title" className="text-xl font-bold">
                    Quick Accessibility
                  </CardTitle>
                  <p id="quick-accessibility-desc" className="text-sm text-muted-foreground mt-1">
                    Instantly adjust settings for better accessibility
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label={isCollapsed ? "Expand controls" : "Minimize controls"}
                  data-testid="button-toggle-collapse"
                  className="rounded-lg hover:bg-primary/10"
                >
                  {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close accessibility panel"
                  data-testid="button-close-panel"
                  className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isCollapsed && (
            <CardContent className="max-h-[calc(85vh-120px)] overflow-y-auto">
              <div className="space-y-8 p-6">
                {/* Quick Presets Section */}
                <section aria-labelledby="presets-heading">
                  <h3 id="presets-heading" className="text-lg font-bold mb-4 flex items-center border-b border-border/50 pb-2">
                    <Zap className="mr-3 h-5 w-5 text-primary" />
                    Quick Presets
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickPresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant={preset.isActive ? "default" : "outline"}
                        size="lg"
                        className={`
                          justify-start h-auto p-4 text-left transition-all duration-300 group
                          ${preset.isActive 
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' 
                            : 'hover:bg-primary/5 hover:border-primary/50 hover:scale-102'
                          }
                        `}
                        onClick={preset.action}
                        data-testid={`button-preset-${index}`}
                        aria-pressed={preset.isActive}
                        title={`${preset.name} - Click to ${preset.isActive ? 'deactivate' : 'activate'}`}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div className={`
                            p-2 rounded-lg transition-all duration-200
                            ${preset.isActive 
                              ? 'bg-primary-foreground/20' 
                              : 'bg-primary/10 group-hover:bg-primary/20'
                            }
                          `}>
                            <preset.icon className={`h-5 w-5 ${
                              preset.isActive ? 'text-primary-foreground' : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold flex items-center justify-between ${
                              preset.isActive ? 'text-primary-foreground' : 'text-foreground'
                            }`}>
                              <span className="truncate">{preset.name}</span>
                              {preset.isActive && (
                                <span className="ml-2 text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold shadow-sm">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${
                              preset.isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'
                            }`}>
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </section>

                {/* Quick Controls Grid */}
                <section aria-labelledby="controls-heading">
                  <h3 id="controls-heading" className="text-lg font-bold mb-4 flex items-center border-b border-border/50 pb-2">
                    <Settings className="mr-3 h-5 w-5 text-primary" />
                    Quick Controls
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual Controls */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                      <h4 className="font-semibold flex items-center text-sm">
                        <Monitor className="mr-2 h-4 w-4 text-blue-600" />
                        Visual Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                            <span>Font Size</span>
                            <span className="text-primary font-bold">{settings.fontSize}px</span>
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
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Small</span>
                            <span>Large</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Contrast Mode
                          </label>
                          <Select
                            value={settings.contrastMode}
                            onValueChange={(value: 'normal' | 'high' | 'dark') => handleQuickChange('contrastMode', value)}
                          >
                            <SelectTrigger className="h-10" data-testid="select-quick-contrast">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">🌟 Normal</SelectItem>
                              <SelectItem value="high">⚡ High Contrast</SelectItem>
                              <SelectItem value="dark">🌙 Dark Mode</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Color Support
                          </label>
                          <Select
                            value={settings.colorTheme}
                            onValueChange={(value) => handleQuickChange('colorTheme', value)}
                          >
                            <SelectTrigger className="h-10" data-testid="select-quick-color-theme">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">🎨 Default Colors</SelectItem>
                              <SelectItem value="protanopia">🔴 Protanopia Support</SelectItem>
                              <SelectItem value="deuteranopia">🟢 Deuteranopia Support</SelectItem>
                              <SelectItem value="tritanopia">🔵 Tritanopia Support</SelectItem>
                              <SelectItem value="monochrome">⚫ Monochrome</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Audio Controls */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                      <h4 className="font-semibold flex items-center text-sm">
                        <Volume2 className="mr-2 h-4 w-4 text-green-600" />
                        Audio Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium block">
                              Text-to-Speech
                            </label>
                            <p className="text-xs text-muted-foreground">Enable audio narration</p>
                          </div>
                          <Switch
                            checked={settings.speechEnabled}
                            onCheckedChange={(checked) => handleQuickChange('speechEnabled', checked)}
                            data-testid="switch-quick-speech"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium block">
                              Audio Instructions
                            </label>
                            <p className="text-xs text-muted-foreground">Spoken guidance</p>
                          </div>
                          <Switch
                            checked={settings.audioInstructions}
                            onCheckedChange={(checked) => handleQuickChange('audioInstructions', checked)}
                            data-testid="switch-quick-audio-instructions"
                          />
                        </div>

                        {settings.speechEnabled && (
                          <>
                            <div>
                              <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                                <span>Speech Rate</span>
                                <span className="text-primary font-bold">{(settings.speechRate / 10).toFixed(1)}x</span>
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
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Slow</span>
                                <span>Fast</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block flex items-center justify-between">
                                <span>Volume</span>
                                <span className="text-primary font-bold">{settings.speechVolume}%</span>
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
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Quiet</span>
                                <span>Loud</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Motion & Navigation Section */}
                <section aria-labelledby="motion-nav-heading">
                  <h3 id="motion-nav-heading" className="text-lg font-bold mb-4 flex items-center border-b border-border/50 pb-2">
                    <Move className="mr-3 h-5 w-5 text-primary" />
                    Motion & Navigation
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Motion Controls */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                      <h4 className="font-semibold flex items-center text-sm">
                        <Move className="mr-2 h-4 w-4 text-orange-600" />
                        Motion Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium block">
                              Reduce Motion
                            </label>
                            <p className="text-xs text-muted-foreground">Minimize animations</p>
                          </div>
                          <Switch
                            checked={settings.reducedMotion}
                            onCheckedChange={(checked) => handleQuickChange('reducedMotion', checked)}
                            data-testid="switch-quick-reduced-motion"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Animation Speed
                          </label>
                          <Select
                            value={settings.animationSpeed}
                            onValueChange={(value) => handleQuickChange('animationSpeed', value)}
                          >
                            <SelectTrigger className="h-10" data-testid="select-quick-animation-speed">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slow">🐌 Slow</SelectItem>
                              <SelectItem value="normal">⚡ Normal</SelectItem>
                              <SelectItem value="fast">🚀 Fast</SelectItem>
                              <SelectItem value="off">🚫 Off</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                      <h4 className="font-semibold flex items-center text-sm">
                        <Focus className="mr-2 h-4 w-4 text-purple-600" />
                        Navigation Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium block">
                              Skip Links Visible
                            </label>
                            <p className="text-xs text-muted-foreground">Show navigation shortcuts</p>
                          </div>
                          <Switch
                            checked={settings.skipLinksVisible}
                            onCheckedChange={(checked) => handleQuickChange('skipLinksVisible', checked)}
                            data-testid="switch-quick-skip-links"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium block">
                              Highlight Links
                            </label>
                            <p className="text-xs text-muted-foreground">Make links more visible</p>
                          </div>
                          <Switch
                            checked={settings.highlightLinks}
                            onCheckedChange={(checked) => handleQuickChange('highlightLinks', checked)}
                            data-testid="switch-quick-highlight-links"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Focus Style
                          </label>
                          <Select
                            value={settings.focusIndicatorStyle}
                            onValueChange={(value) => handleQuickChange('focusIndicatorStyle', value)}
                          >
                            <SelectTrigger className="h-10" data-testid="select-quick-focus-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">⚪ Default</SelectItem>
                              <SelectItem value="thick">⚫ Thick Border</SelectItem>
                              <SelectItem value="colored">🌈 Colored</SelectItem>
                              <SelectItem value="animated">✨ Animated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Action Buttons */}
                <section className="pt-6 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      size="lg"
                      className="h-12" 
                      onClick={() => {
                        onClose();
                        window.location.href = '/settings';
                      }}
                      data-testid="button-open-full-settings"
                    >
                      <Settings className="mr-2 h-5 w-5" />
                      Full Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-12" 
                      onClick={onClose}
                      data-testid="button-close-panel"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Close Panel
                    </Button>
                  </div>
                  <div className="text-center mt-4 p-3 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Keyboard Shortcuts:</strong> Alt+A or F11 to toggle this panel
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Changes are applied instantly and saved automatically
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}