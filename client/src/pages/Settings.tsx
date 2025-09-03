import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Eye, 
  Keyboard, 
  Mouse, 
  Monitor, 
  Clock, 
  Palette,
  FileText,
  Headphones,
  Download,
  Upload,
  RotateCcw,
  Save,
  Zap,
  Globe,
  Move,
  Type,
  Focus,
  Volume1,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface SettingsProps {
  currentUser: { id: string; username: string; role: string };
}

export default function Settings({ currentUser }: SettingsProps) {
  const { 
    settings, 
    updateSettings, 
    isLoading, 
    resetToDefaults, 
    exportSettings, 
    importSettings,
    speak,
    stopSpeaking,
    announceToScreenReader 
  } = useAccessibility();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState('visual');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await updateSettings(localSettings);
    toast({
      title: "Settings Saved",
      description: "Your accessibility preferences have been saved successfully.",
    });
    announceToScreenReader("Settings saved successfully");
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalSettings(settings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
      variant: "destructive"
    });
  };

  const handleExport = () => {
    const settingsData = exportSettings();
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opsis-accessibility-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Settings Exported",
      description: "Settings have been downloaded as a JSON file.",
    });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importSettings(content)) {
        setLocalSettings(settings);
        toast({
          title: "Settings Imported",
          description: "Settings have been imported successfully.",
        });
      } else {
        toast({
          title: "Import Failed",
          description: "The file format is invalid or corrupted.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const updateLocalSetting = (key: keyof typeof localSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const getSpeechRateLabel = (value: number) => {
    const rate = value / 10;
    if (rate < 0.8) return 'Very Slow';
    if (rate < 1.0) return 'Slow';
    if (rate === 1.0) return 'Normal';
    if (rate < 1.5) return 'Fast';
    return 'Very Fast';
  };

  const getAnimationSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'slow': return 'Slower animations for better visibility';
      case 'normal': return 'Standard animation speed';
      case 'fast': return 'Faster animations';
      case 'off': return 'No animations (recommended for motion sensitivity)';
      default: return 'Standard animation speed';
    }
  };

  return (
    <main id="main-content" role="main" className="max-w-6xl mx-auto px-6 py-8">
      <section aria-labelledby="settings-heading">
        <div className="mb-8">
          <h2 id="settings-heading" className="text-4xl font-bold mb-4 flex items-center">
            <SettingsIcon className="mr-3 h-10 w-10 text-primary" />
            Comprehensive Accessibility Settings
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            Customize your OPSIS experience with extensive accessibility options designed for all users.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">WCAG 2.1 AA Compliant</Badge>
            <Badge variant="secondary">Screen Reader Optimized</Badge>
            <Badge variant="secondary">International Keyboard Support</Badge>
            <Badge variant="secondary">Cross-Platform Compatible</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="visual" className="flex items-center gap-2" data-testid="tab-visual">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2" data-testid="tab-audio">
              <Headphones className="h-4 w-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2" data-testid="tab-navigation">
              <Keyboard className="h-4 w-4" />
              Navigation
            </TabsTrigger>
            <TabsTrigger value="motion" className="flex items-center gap-2" data-testid="tab-motion">
              <Move className="h-4 w-4" />
              Motion
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2" data-testid="tab-content">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2" data-testid="tab-advanced">
              <Zap className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Visual & Display Settings */}
          <TabsContent value="visual" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Display Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="mr-2 h-5 w-5" />
                    Display Settings
                  </CardTitle>
                  <CardDescription>
                    Control visual appearance and readability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="font-size" className="text-base font-medium mb-2 block">
                      Font Size: {localSettings.fontSize}px
                    </Label>
                    <Slider
                      id="font-size"
                      min={12}
                      max={48}
                      step={2}
                      value={[localSettings.fontSize]}
                      onValueChange={([value]) => updateLocalSetting('fontSize', value)}
                      className="focus-visible:outline-2 focus-visible:outline-primary"
                      data-testid="slider-font-size"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Current: {localSettings.fontSize < 16 ? 'Small' : localSettings.fontSize < 20 ? 'Medium' : localSettings.fontSize < 28 ? 'Large' : 'Extra Large'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="line-height" className="text-base font-medium mb-2 block">
                      Line Height: {localSettings.lineHeight}
                    </Label>
                    <Slider
                      id="line-height"
                      min={1}
                      max={3}
                      step={0.1}
                      value={[localSettings.lineHeight]}
                      onValueChange={([value]) => updateLocalSetting('lineHeight', value)}
                      data-testid="slider-line-height"
                    />
                  </div>

                  <div>
                    <Label htmlFor="letter-spacing" className="text-base font-medium mb-2 block">
                      Letter Spacing: {localSettings.letterSpacing}px
                    </Label>
                    <Slider
                      id="letter-spacing"
                      min={-2}
                      max={8}
                      step={0.5}
                      value={[localSettings.letterSpacing]}
                      onValueChange={([value]) => updateLocalSetting('letterSpacing', value)}
                      data-testid="slider-letter-spacing"
                    />
                  </div>

                  <div>
                    <Label htmlFor="font-family" className="text-base font-medium mb-2 block">
                      Font Family
                    </Label>
                    <Select 
                      value={localSettings.fontFamily} 
                      onValueChange={(value) => updateLocalSetting('fontFamily', value)}
                    >
                      <SelectTrigger id="font-family" data-testid="select-font-family">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Inter)</SelectItem>
                        <SelectItem value="dyslexia">Dyslexia-Friendly</SelectItem>
                        <SelectItem value="serif">Serif (Georgia)</SelectItem>
                        <SelectItem value="mono">Monospace (Courier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contrast and Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="mr-2 h-5 w-5" />
                    Contrast & Colors
                  </CardTitle>
                  <CardDescription>
                    Optimize colors for visual accessibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="contrast-mode" className="text-base font-medium mb-2 block">
                      Contrast Mode
                    </Label>
                    <Select 
                      value={localSettings.contrastMode} 
                      onValueChange={(value: 'normal' | 'high' | 'dark') => updateLocalSetting('contrastMode', value)}
                    >
                      <SelectTrigger id="contrast-mode" data-testid="select-contrast-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal Contrast</SelectItem>
                        <SelectItem value="high">High Contrast</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color-theme" className="text-base font-medium mb-2 block">
                      Color Vision Support
                    </Label>
                    <Select 
                      value={localSettings.colorTheme} 
                      onValueChange={(value) => updateLocalSetting('colorTheme', value)}
                    >
                      <SelectTrigger id="color-theme" data-testid="select-color-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Colors</SelectItem>
                        <SelectItem value="protanopia">Protanopia Support</SelectItem>
                        <SelectItem value="deuteranopia">Deuteranopia Support</SelectItem>
                        <SelectItem value="tritanopia">Tritanopia Support</SelectItem>
                        <SelectItem value="monochrome">Monochrome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cursor-size" className="text-base font-medium mb-2 block">
                      Cursor Size
                    </Label>
                    <Select 
                      value={localSettings.cursorSize} 
                      onValueChange={(value) => updateLocalSetting('cursorSize', value)}
                    >
                      <SelectTrigger id="cursor-size" data-testid="select-cursor-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="focus-indicator" className="text-base font-medium mb-2 block">
                      Focus Indicator Style
                    </Label>
                    <Select 
                      value={localSettings.focusIndicatorStyle} 
                      onValueChange={(value) => updateLocalSetting('focusIndicatorStyle', value)}
                    >
                      <SelectTrigger id="focus-indicator" data-testid="select-focus-indicator">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="thick">Thick Border</SelectItem>
                        <SelectItem value="colored">Colored Highlight</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audio Settings */}
          <TabsContent value="audio" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Speech Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume2 className="mr-2 h-5 w-5" />
                    Text-to-Speech
                  </CardTitle>
                  <CardDescription>
                    Configure speech synthesis and audio feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="speech-enabled" className="text-base font-medium">
                        Enable Text-to-Speech
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Read text aloud using browser speech synthesis
                      </p>
                    </div>
                    <Switch
                      id="speech-enabled"
                      checked={localSettings.speechEnabled}
                      onCheckedChange={(checked) => updateLocalSetting('speechEnabled', checked)}
                      data-testid="switch-speech-enabled"
                    />
                  </div>

                  <div>
                    <Label htmlFor="speech-rate" className="text-base font-medium mb-2 block">
                      Speech Rate
                    </Label>
                    <Slider
                      id="speech-rate"
                      min={5}
                      max={20}
                      step={1}
                      value={[localSettings.speechRate]}
                      onValueChange={([value]) => updateLocalSetting('speechRate', value)}
                      data-testid="slider-speech-rate"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Current: {getSpeechRateLabel(localSettings.speechRate)} ({((localSettings.speechRate) / 10).toFixed(1)}x)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="speech-volume" className="text-base font-medium mb-2 block">
                      Speech Volume: {localSettings.speechVolume}%
                    </Label>
                    <Slider
                      id="speech-volume"
                      min={0}
                      max={100}
                      step={5}
                      value={[localSettings.speechVolume]}
                      onValueChange={([value]) => updateLocalSetting('speechVolume', value)}
                      data-testid="slider-speech-volume"
                    />
                  </div>

                  <div>
                    <Label htmlFor="speech-pitch" className="text-base font-medium mb-2 block">
                      Speech Pitch: {localSettings.speechPitch / 10}
                    </Label>
                    <Slider
                      id="speech-pitch"
                      min={1}
                      max={20}
                      step={1}
                      value={[localSettings.speechPitch]}
                      onValueChange={([value]) => updateLocalSetting('speechPitch', value)}
                      data-testid="slider-speech-pitch"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => speak('This is a test of the speech synthesis system.')}
                      data-testid="button-test-speech"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test Speech
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={stopSpeaking}
                      data-testid="button-stop-speech"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume1 className="mr-2 h-5 w-5" />
                    Audio Feedback
                  </CardTitle>
                  <CardDescription>
                    Control audio announcements and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="audio-instructions" className="text-base font-medium">
                        Audio Instructions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provides spoken guidance for navigation and actions
                      </p>
                    </div>
                    <Switch
                      id="audio-instructions"
                      checked={localSettings.audioInstructions}
                      onCheckedChange={(checked) => updateLocalSetting('audioInstructions', checked)}
                      data-testid="switch-audio-instructions"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sound-effects" className="text-base font-medium">
                        Sound Effects
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Plays audio feedback for buttons and interactions
                      </p>
                    </div>
                    <Switch
                      id="sound-effects"
                      checked={localSettings.soundEffects}
                      onCheckedChange={(checked) => updateLocalSetting('soundEffects', checked)}
                      data-testid="switch-sound-effects"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="audio-descriptions" className="text-base font-medium">
                        Audio Descriptions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provides detailed descriptions of visual content
                      </p>
                    </div>
                    <Switch
                      id="audio-descriptions"
                      checked={localSettings.audioDescriptions}
                      onCheckedChange={(checked) => updateLocalSetting('audioDescriptions', checked)}
                      data-testid="switch-audio-descriptions"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="announce-changes" className="text-base font-medium">
                        Announce Changes
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Announces page updates to screen readers
                      </p>
                    </div>
                    <Switch
                      id="announce-changes"
                      checked={localSettings.announceChanges}
                      onCheckedChange={(checked) => updateLocalSetting('announceChanges', checked)}
                      data-testid="switch-announce-changes"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Navigation Settings */}
          <TabsContent value="navigation" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Keyboard Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Keyboard className="mr-2 h-5 w-5" />
                    Keyboard Navigation
                  </CardTitle>
                  <CardDescription>
                    Customize keyboard interaction and navigation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="keyboard-navigation" className="text-base font-medium mb-2 block">
                      Navigation Mode
                    </Label>
                    <Select 
                      value={localSettings.keyboardNavigation} 
                      onValueChange={(value) => updateLocalSetting('keyboardNavigation', value)}
                    >
                      <SelectTrigger id="keyboard-navigation" data-testid="select-keyboard-navigation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="enhanced">Enhanced (Recommended)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tab-order" className="text-base font-medium mb-2 block">
                      Tab Order
                    </Label>
                    <Select 
                      value={localSettings.tabOrder} 
                      onValueChange={(value) => updateLocalSetting('tabOrder', value)}
                    >
                      <SelectTrigger id="tab-order" data-testid="select-tab-order">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="logical">Logical</SelectItem>
                        <SelectItem value="visual">Visual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="skip-links-visible" className="text-base font-medium">
                        Always Show Skip Links
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Makes navigation shortcuts always visible
                      </p>
                    </div>
                    <Switch
                      id="skip-links-visible"
                      checked={localSettings.skipLinksVisible}
                      onCheckedChange={(checked) => updateLocalSetting('skipLinksVisible', checked)}
                      data-testid="switch-skip-links-visible"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sticky-focus" className="text-base font-medium">
                        Sticky Focus
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Maintains focus visibility longer
                      </p>
                    </div>
                    <Switch
                      id="sticky-focus"
                      checked={localSettings.stickyFocus}
                      onCheckedChange={(checked) => updateLocalSetting('stickyFocus', checked)}
                      data-testid="switch-sticky-focus"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mouse and Touch */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mouse className="mr-2 h-5 w-5" />
                    Mouse & Touch
                  </CardTitle>
                  <CardDescription>
                    Configure pointer interaction settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="click-delay" className="text-base font-medium mb-2 block">
                      Click Delay: {localSettings.clickDelay}ms
                    </Label>
                    <Slider
                      id="click-delay"
                      min={0}
                      max={1000}
                      step={50}
                      value={[localSettings.clickDelay]}
                      onValueChange={([value]) => updateLocalSetting('clickDelay', value)}
                      data-testid="slider-click-delay"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Adds delay to prevent accidental clicks
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="structural-navigation" className="text-base font-medium">
                        Structural Navigation
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable navigation by headings, landmarks
                      </p>
                    </div>
                    <Switch
                      id="structural-navigation"
                      checked={localSettings.structuralNavigation}
                      onCheckedChange={(checked) => updateLocalSetting('structuralNavigation', checked)}
                      data-testid="switch-structural-navigation"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="landmark-navigation" className="text-base font-medium">
                        Landmark Navigation
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Navigate between ARIA landmarks
                      </p>
                    </div>
                    <Switch
                      id="landmark-navigation"
                      checked={localSettings.landmarkNavigation}
                      onCheckedChange={(checked) => updateLocalSetting('landmarkNavigation', checked)}
                      data-testid="switch-landmark-navigation"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Motion Settings */}
          <TabsContent value="motion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Move className="mr-2 h-5 w-5" />
                  Motion & Animation Control
                </CardTitle>
                <CardDescription>
                  Configure motion and animation preferences for comfort and accessibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="reduced-motion" className="text-base font-medium">
                          Reduce Motion
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Minimizes animations and transitions
                        </p>
                      </div>
                      <Switch
                        id="reduced-motion"
                        checked={localSettings.reducedMotion}
                        onCheckedChange={(checked) => updateLocalSetting('reducedMotion', checked)}
                        data-testid="switch-reduced-motion"
                      />
                    </div>

                    <div>
                      <Label htmlFor="animation-speed" className="text-base font-medium mb-2 block">
                        Animation Speed
                      </Label>
                      <Select 
                        value={localSettings.animationSpeed} 
                        onValueChange={(value) => updateLocalSetting('animationSpeed', value)}
                      >
                        <SelectTrigger id="animation-speed" data-testid="select-animation-speed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        {getAnimationSpeedLabel(localSettings.animationSpeed)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="parallax-effects" className="text-base font-medium">
                          Parallax Effects
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable background motion effects
                        </p>
                      </div>
                      <Switch
                        id="parallax-effects"
                        checked={localSettings.parallaxEffects}
                        onCheckedChange={(checked) => updateLocalSetting('parallaxEffects', checked)}
                        data-testid="switch-parallax-effects"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="autoplay-media" className="text-base font-medium">
                          Autoplay Media
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically play videos and animations
                        </p>
                      </div>
                      <Switch
                        id="autoplay-media"
                        checked={localSettings.autoplayMedia}
                        onCheckedChange={(checked) => updateLocalSetting('autoplayMedia', checked)}
                        data-testid="switch-autoplay-media"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Settings */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Reading & Content
                  </CardTitle>
                  <CardDescription>
                    Optimize content display and reading experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="reading-mode" className="text-base font-medium">
                        Reading Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Simplified view optimized for reading
                      </p>
                    </div>
                    <Switch
                      id="reading-mode"
                      checked={localSettings.readingMode}
                      onCheckedChange={(checked) => updateLocalSetting('readingMode', checked)}
                      data-testid="switch-reading-mode"
                    />
                  </div>

                  <div>
                    <Label htmlFor="text-justification" className="text-base font-medium mb-2 block">
                      Text Alignment
                    </Label>
                    <Select 
                      value={localSettings.textJustification} 
                      onValueChange={(value) => updateLocalSetting('textJustification', value)}
                    >
                      <SelectTrigger id="text-justification" data-testid="select-text-justification">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="center">Center Aligned</SelectItem>
                        <SelectItem value="justify">Justified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paragraph-spacing" className="text-base font-medium mb-2 block">
                      Paragraph Spacing: {localSettings.paragraphSpacing}rem
                    </Label>
                    <Slider
                      id="paragraph-spacing"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={[localSettings.paragraphSpacing]}
                      onValueChange={([value]) => updateLocalSetting('paragraphSpacing', value)}
                      data-testid="slider-paragraph-spacing"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Timing & Timeouts
                  </CardTitle>
                  <CardDescription>
                    Control time-sensitive features and warnings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="extended-timeouts" className="text-base font-medium">
                        Extended Timeouts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provides more time for form completion
                      </p>
                    </div>
                    <Switch
                      id="extended-timeouts"
                      checked={localSettings.extendedTimeouts}
                      onCheckedChange={(checked) => updateLocalSetting('extendedTimeouts', checked)}
                      data-testid="switch-extended-timeouts"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="timeout-warnings" className="text-base font-medium">
                        Timeout Warnings
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Warns before session expires
                      </p>
                    </div>
                    <Switch
                      id="timeout-warnings"
                      checked={localSettings.timeoutWarnings}
                      onCheckedChange={(checked) => updateLocalSetting('timeoutWarnings', checked)}
                      data-testid="switch-timeout-warnings"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="highlight-links" className="text-base font-medium">
                        Highlight Links
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Makes links more visually distinct
                      </p>
                    </div>
                    <Switch
                      id="highlight-links"
                      checked={localSettings.highlightLinks}
                      onCheckedChange={(checked) => updateLocalSetting('highlightLinks', checked)}
                      data-testid="switch-highlight-links"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="show-tooltips" className="text-base font-medium">
                        Enhanced Tooltips
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Shows helpful information on hover
                      </p>
                    </div>
                    <Switch
                      id="show-tooltips"
                      checked={localSettings.showTooltips}
                      onCheckedChange={(checked) => updateLocalSetting('showTooltips', checked)}
                      data-testid="switch-show-tooltips"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Language & Localization
                  </CardTitle>
                  <CardDescription>
                    Configure language and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="language" className="text-base font-medium mb-2 block">
                      Interface Language
                    </Label>
                    <Select 
                      value={localSettings.language} 
                      onValueChange={(value) => updateLocalSetting('language', value)}
                    >
                      <SelectTrigger id="language" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
                        <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                        <SelectItem value="ja-JP">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-format" className="text-base font-medium mb-2 block">
                      Date Format
                    </Label>
                    <Select 
                      value={localSettings.dateFormat} 
                      onValueChange={(value) => updateLocalSetting('dateFormat', value)}
                    >
                      <SelectTrigger id="date-format" data-testid="select-date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Format</SelectItem>
                        <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                        <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                        <SelectItem value="eu">European (DD/MM/YYYY)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="verbose-mode" className="text-base font-medium">
                        Verbose Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provides detailed descriptions and context
                      </p>
                    </div>
                    <Switch
                      id="verbose-mode"
                      checked={localSettings.verboseMode}
                      onCheckedChange={(checked) => updateLocalSetting('verboseMode', checked)}
                      data-testid="switch-verbose-mode"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    Settings Management
                  </CardTitle>
                  <CardDescription>
                    Import, export, and manage your accessibility settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleExport}
                      className="flex items-center gap-2"
                      data-testid="button-export-settings"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleImport}
                      className="flex items-center gap-2"
                      data-testid="button-import-settings"
                    >
                      <Upload className="h-4 w-4" />
                      Import
                    </Button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => updateLocalSetting('contrastMode', localSettings.contrastMode === 'high' ? 'normal' : 'high')}
                        className="text-sm"
                        data-testid="button-toggle-contrast"
                      >
                        Toggle High Contrast
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateLocalSetting('fontSize', localSettings.fontSize === 18 ? 24 : 18)}
                        className="text-sm"
                        data-testid="button-toggle-font-size"
                      >
                        Toggle Large Text
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => updateLocalSetting('reducedMotion', !localSettings.reducedMotion)}
                        className="text-sm"
                        data-testid="button-toggle-motion"
                      >
                        Toggle Reduced Motion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 border-t pt-8">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            size="lg"
            className="bg-primary hover:bg-primary/90 px-8 py-3 focus-visible:outline-2 focus-visible:outline-primary min-w-[140px]"
            data-testid="button-save-settings"
          >
            <Save className="mr-2 h-5 w-5" />
            {isLoading ? 'Saving...' : 'Save All Settings'}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="px-8 py-3 focus-visible:outline-2 focus-visible:outline-primary min-w-[140px]"
            data-testid="button-reset-settings"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset to Defaults
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => speak('Settings page loaded with comprehensive accessibility options. Use Tab to navigate between controls, or press Alt plus H to access keyboard shortcuts.')}
            className="px-8 py-3 focus-visible:outline-2 focus-visible:outline-primary min-w-[140px]"
            data-testid="button-help-audio"
          >
            <Volume2 className="mr-2 h-5 w-5" />
            Audio Help
          </Button>
        </div>

        {/* Keyboard Shortcuts Quick Reference */}
        <Card className="mt-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Keyboard className="mr-2 h-5 w-5" />
              International Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              WCAG 2.1 AA compliant keyboard navigation for worldwide accessibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Navigation Shortcuts
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + ↑↓</dt>
                    <dd>Navigate sections</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + M</dt>
                    <dd>Main content</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + N</dt>
                    <dd>Navigation menu</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + F</dt>
                    <dd>Search/Find</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Focus className="mr-2 h-4 w-4" />
                  Element Navigation
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + H</dt>
                    <dd>Next heading</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + B</dt>
                    <dd>Next button</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + L</dt>
                    <dd>Next link</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + I</dt>
                    <dd>Next input field</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Type className="mr-2 h-4 w-4" />
                  Content Controls
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">Ctrl/Cmd + +</dt>
                    <dd>Increase font size</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Ctrl/Cmd + -</dt>
                    <dd>Decrease font size</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Alt/Option + R</dt>
                    <dd>Read page content</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Esc</dt>
                    <dd>Stop speech/Close</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}