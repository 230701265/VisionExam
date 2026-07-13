import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Eye, Type, Volume2, Keyboard, Brain, Sun, Moon, Contrast,
  Palette, MousePointer2, AlignLeft, AlignCenter, AlignJustify,
  Mic, Captions, AudioLines, Zap, RotateCcw, Download, Upload,
  CheckCircle2, BookOpen, ScanLine, Glasses, Shield, ArrowLeft,
  Info, FileText, Maximize2, SlidersHorizontal, ChevronRight,
} from 'lucide-react';

interface Props {
  currentUser: { id: string; username: string; role: string };
}

/* ── Reusable setting row ─────────────────────────────────── */
function SettingRow({
  id,
  label,
  description,
  children,
  badge,
}: {
  id: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
            {label}
          </Label>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed pr-4">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
}

/* ── Section card ─────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-1 pb-4">{children}</CardContent>
    </Card>
  );
}

/* ── Slider row ───────────────────────────────────────────── */
function SliderRow({
  id,
  label,
  description,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  onChange: (v: number) => void;
}) {
  return (
    <SettingRow id={id} label={label} description={description}>
      <div className="flex items-center gap-3 w-48">
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
          aria-label={label}
          aria-valuetext={displayValue}
        />
        <span className="text-sm font-semibold tabular-nums w-12 text-right text-foreground">
          {displayValue}
        </span>
      </div>
    </SettingRow>
  );
}

/* ── Preview panel ────────────────────────────────────────── */
function PreviewPanel({ settings }: { settings: ReturnType<typeof useAccessibility>['settings'] }) {
  const fontFamilyMap: Record<string, string> = {
    default: 'Inter, sans-serif',
    dyslexia: '"OpenDyslexic", "Comic Sans MS", cursive',
    serif: 'Georgia, serif',
    mono: '"Courier New", monospace',
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/2 overflow-hidden">
      <CardHeader className="pb-2 px-5 pt-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold text-primary">Live Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div
          className="p-4 rounded-xl bg-card border border-border"
          style={{
            fontSize: `${Math.min(settings.fontSize, 20)}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}px`,
            wordSpacing: `${settings.wordSpacing}px`,
            fontFamily: fontFamilyMap[settings.fontFamily] || undefined,
            textAlign: settings.textJustification,
          }}
          aria-label="Text preview with current settings"
        >
          <p className="font-semibold mb-1.5">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-muted-foreground text-[0.9em]">
            OPSIS provides a fully accessible examination experience for every student,
            regardless of ability or assistive technology used.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <a href="#" className="text-primary underline text-[0.85em] focus-visible:outline-2 focus-visible:outline-primary rounded" onClick={e => e.preventDefault()}>
              Sample link
            </a>
            <button className="px-2 py-0.5 rounded bg-primary text-white text-[0.8em] focus-visible:outline-2 focus-visible:outline-white">
              Sample button
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          Font: {settings.fontFamily} · Size: {settings.fontSize}px · Line height: {settings.lineHeight}
        </p>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function AccessibilityCenter({ currentUser: _currentUser }: Props) {
  const { settings, updateSettings, resetToDefaults, exportSettings, importSettings, isSpeaking, speak, stopSpeaking } = useAccessibility();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('vision');
  const [saveIndicator, setSaveIndicator] = useState(false);

  const handleUpdate = (patch: Partial<typeof settings>) => {
    updateSettings(patch);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

  const handleReset = () => {
    resetToDefaults();
    toast({ title: 'Settings reset', description: 'All accessibility settings restored to defaults.' });
  };

  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opsis-accessibility-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Settings exported', description: 'Your settings file has been downloaded.' });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = importSettings(ev.target?.result as string);
        toast(success
          ? { title: 'Settings imported', description: 'Your accessibility preferences have been applied.' }
          : { title: 'Import failed', description: 'Invalid settings file format.', variant: 'destructive' }
        );
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  });

  const TABS = [
    { id: 'vision',     label: 'Vision',        icon: Eye },
    { id: 'reading',    label: 'Reading',        icon: BookOpen },
    { id: 'audio',      label: 'Audio & Speech', icon: Volume2 },
    { id: 'navigation', label: 'Navigation',     icon: Keyboard },
    { id: 'cognitive',  label: 'Cognitive',      icon: Brain },
  ];

  return (
    <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20" role="main" aria-label="Accessibility Center">

      {/* ── Hero ─────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-foreground font-medium">Accessibility Center</span>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-7 text-white">
          <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20" />
          <div aria-hidden="true" className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-12 translate-y-12" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl leading-tight">Accessibility Center</span>
                    <span className="text-white/70 text-sm">Personalise your experience</span>
                  </div>
                </div>
                <p className="text-white/80 text-sm max-w-xl leading-relaxed">
                  Every setting here is designed to make OPSIS work the way you need it to.
                  Changes are saved automatically and persist across sessions.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['WCAG 2.2 AA', 'Screen Reader', 'Keyboard-first', 'Auto-saved'].map(b => (
                    <span key={b} className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">{b}</span>
                  ))}
                </div>
              </div>
              {saveIndicator && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm"
                  aria-live="polite"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Saved
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* ── Settings panel ──────────────────────── */}
        <div className="space-y-6">
          <motion.div {...fadeUp(0.05)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList
                className="flex flex-wrap gap-1 h-auto p-1.5 mb-6 bg-muted rounded-xl w-full"
                aria-label="Accessibility setting categories"
              >
                {TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
                      aria-label={`${t.label} settings`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* ══ VISION ══════════════════════════ */}
              <TabsContent value="vision" className="space-y-4 mt-0" role="tabpanel" aria-label="Vision settings">
                <SectionCard icon={Contrast} iconColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" title="Contrast & Colour" description="Adjust display contrast and colour settings for better visibility">
                  <SettingRow id="high-contrast" label="High Contrast" description="Maximise contrast between text and backgrounds (WCAG 1.4.6)">
                    <Switch
                      id="high-contrast"
                      checked={settings.contrastMode === 'high'}
                      onCheckedChange={v => handleUpdate({ contrastMode: v ? 'high' : 'normal' })}
                      aria-label="Toggle high contrast mode"
                    />
                  </SettingRow>
                  <SettingRow id="dark-mode" label="Dark Mode" description="Switch to a dark colour scheme to reduce eye strain in low light">
                    <Switch
                      id="dark-mode"
                      checked={settings.contrastMode === 'dark'}
                      onCheckedChange={v => handleUpdate({ contrastMode: v ? 'dark' : 'normal' })}
                      aria-label="Toggle dark mode"
                    />
                  </SettingRow>
                  <SettingRow id="color-theme" label="Colour Blind Mode" description="Apply colour filters designed for different types of colour vision deficiency">
                    <Select
                      value={settings.colorTheme}
                      onValueChange={v => handleUpdate({ colorTheme: v as typeof settings.colorTheme })}
                    >
                      <SelectTrigger id="color-theme" className="w-44" aria-label="Select colour blind mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">None (default)</SelectItem>
                        <SelectItem value="protanopia">Protanopia (red-blind)</SelectItem>
                        <SelectItem value="deuteranopia">Deuteranopia (green-blind)</SelectItem>
                        <SelectItem value="tritanopia">Tritanopia (blue-blind)</SelectItem>
                        <SelectItem value="monochrome">Monochrome (greyscale)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </SectionCard>

                <SectionCard icon={MousePointer2} iconColor="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" title="Cursor & Focus" description="Make the cursor and focus indicators more visible">
                  <SettingRow id="cursor-size" label="Cursor Size" description="Increase the mouse cursor size for easier tracking on screen">
                    <Select
                      value={settings.cursorSize}
                      onValueChange={v => handleUpdate({ cursorSize: v as typeof settings.cursorSize })}
                    >
                      <SelectTrigger id="cursor-size" className="w-40" aria-label="Select cursor size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow id="focus-style" label="Focus Indicator" description="Control how keyboard focus rings appear around interactive elements (WCAG 2.4.11)">
                    <Select
                      value={settings.focusIndicatorStyle}
                      onValueChange={v => handleUpdate({ focusIndicatorStyle: v as typeof settings.focusIndicatorStyle })}
                    >
                      <SelectTrigger id="focus-style" className="w-40" aria-label="Select focus indicator style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="thick">Thick ring</SelectItem>
                        <SelectItem value="colored">Coloured ring</SelectItem>
                        <SelectItem value="animated">Animated ring</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </SectionCard>
              </TabsContent>

              {/* ══ READING ═════════════════════════ */}
              <TabsContent value="reading" className="space-y-4 mt-0" role="tabpanel" aria-label="Reading settings">
                <SectionCard icon={Type} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" title="Text & Typography" description="Customise font style, size, and spacing for better readability">
                  <SliderRow
                    id="font-size"
                    label="Font Size"
                    description="Adjust base text size across the entire platform (12–32px)"
                    value={settings.fontSize}
                    min={12}
                    max={32}
                    displayValue={`${settings.fontSize}px`}
                    onChange={v => handleUpdate({ fontSize: v })}
                  />
                  <SettingRow id="font-family" label="Font Family" description="Choose a typeface optimised for your reading needs, including dyslexia-friendly options">
                    <Select
                      value={settings.fontFamily}
                      onValueChange={v => handleUpdate({ fontFamily: v as typeof settings.fontFamily })}
                    >
                      <SelectTrigger id="font-family" className="w-48" aria-label="Select font family">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Inter)</SelectItem>
                        <SelectItem value="dyslexia">Dyslexia-friendly (OpenDyslexic)</SelectItem>
                        <SelectItem value="serif">Serif (Georgia)</SelectItem>
                        <SelectItem value="mono">Monospace (Courier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SliderRow
                    id="line-height"
                    label="Line Height"
                    description="Increase spacing between lines to improve readability (WCAG 1.4.12)"
                    value={Math.round(settings.lineHeight * 10)}
                    min={10}
                    max={30}
                    displayValue={settings.lineHeight.toFixed(1)}
                    onChange={v => handleUpdate({ lineHeight: v / 10 })}
                  />
                  <SliderRow
                    id="letter-spacing"
                    label="Letter Spacing"
                    description="Adjust space between characters (0–6px)"
                    value={settings.letterSpacing}
                    min={0}
                    max={6}
                    displayValue={`${settings.letterSpacing}px`}
                    onChange={v => handleUpdate({ letterSpacing: v })}
                  />
                  <SliderRow
                    id="word-spacing"
                    label="Word Spacing"
                    description="Adjust space between words for better separation (0–8px)"
                    value={settings.wordSpacing}
                    min={0}
                    max={8}
                    displayValue={`${settings.wordSpacing}px`}
                    onChange={v => handleUpdate({ wordSpacing: v })}
                  />
                  <SettingRow id="text-justify" label="Text Alignment" description="Set the default text alignment for reading content">
                    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5" role="group" aria-label="Text alignment">
                      {[
                        { value: 'left', icon: AlignLeft, label: 'Left align' },
                        { value: 'center', icon: AlignCenter, label: 'Centre align' },
                        { value: 'justify', icon: AlignJustify, label: 'Justify' },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => handleUpdate({ textJustification: value as typeof settings.textJustification })}
                          className={`h-8 w-9 flex items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-primary ${settings.textJustification === value ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
                          aria-label={label}
                          aria-pressed={settings.textJustification === value}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </SettingRow>
                </SectionCard>

                <SectionCard icon={ScanLine} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" title="Reading Aids" description="Tools to help you focus while reading questions and content">
                  <SettingRow id="reading-mask" label="Reading Mask" badge="NEW" description="Dims the screen above and below your mouse position to highlight one line at a time — great for focus and dyslexia">
                    <Switch
                      id="reading-mask"
                      checked={settings.readingMask}
                      onCheckedChange={v => handleUpdate({ readingMask: v })}
                      aria-label="Toggle reading mask"
                    />
                  </SettingRow>
                  {settings.readingMask && (
                    <SliderRow
                      id="mask-height"
                      label="Mask Window Size"
                      description="Height of the visible area around your cursor (20–120px)"
                      value={settings.readingMaskHeight}
                      min={20}
                      max={120}
                      displayValue={`${settings.readingMaskHeight}px`}
                      onChange={v => handleUpdate({ readingMaskHeight: v })}
                    />
                  )}
                  <SettingRow id="reading-guide" label="Reading Guide Line" badge="NEW" description="Shows a subtle horizontal line that follows your mouse to help track which line you are reading">
                    <Switch
                      id="reading-guide"
                      checked={settings.readingGuide}
                      onCheckedChange={v => handleUpdate({ readingGuide: v })}
                      aria-label="Toggle reading guide line"
                    />
                  </SettingRow>
                  <SettingRow id="reading-mode" label="Reading Mode" description="Removes visual distractions and presents content in a clean, focused layout">
                    <Switch
                      id="reading-mode"
                      checked={settings.readingMode}
                      onCheckedChange={v => handleUpdate({ readingMode: v })}
                      aria-label="Toggle reading mode"
                    />
                  </SettingRow>
                  <SettingRow id="highlight-links" label="Highlight Links" description="Underline and highlight all links to make them more easily identifiable">
                    <Switch
                      id="highlight-links"
                      checked={settings.highlightLinks}
                      onCheckedChange={v => handleUpdate({ highlightLinks: v })}
                      aria-label="Toggle highlight links"
                    />
                  </SettingRow>
                </SectionCard>
              </TabsContent>

              {/* ══ AUDIO & SPEECH ══════════════════ */}
              <TabsContent value="audio" className="space-y-4 mt-0" role="tabpanel" aria-label="Audio and speech settings">
                <SectionCard icon={Volume2} iconColor="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" title="Text-to-Speech" description="Have the platform read content aloud using your device's voice synthesis">
                  <SettingRow id="speech-enabled" label="Text-to-Speech" description="Enable the platform to read questions, answers, and feedback aloud using your device's built-in speech synthesis">
                    <Switch
                      id="speech-enabled"
                      checked={settings.speechEnabled}
                      onCheckedChange={v => handleUpdate({ speechEnabled: v })}
                      aria-label="Toggle text-to-speech"
                    />
                  </SettingRow>
                  {settings.speechEnabled && (
                    <>
                      <SliderRow
                        id="speech-rate"
                        label="Voice Speed"
                        description="How fast the text is read aloud (0.5× to 2.0×)"
                        value={settings.speechRate}
                        min={5}
                        max={20}
                        displayValue={`${(settings.speechRate / 10).toFixed(1)}×`}
                        onChange={v => handleUpdate({ speechRate: v })}
                      />
                      <SliderRow
                        id="speech-pitch"
                        label="Voice Pitch"
                        description="Adjust the pitch of the synthesised voice (0.5 to 2.0)"
                        value={settings.speechPitch}
                        min={5}
                        max={20}
                        displayValue={`${(settings.speechPitch / 10).toFixed(1)}`}
                        onChange={v => handleUpdate({ speechPitch: v })}
                      />
                      <SliderRow
                        id="speech-volume"
                        label="Voice Volume"
                        description="Set the volume of the synthesised speech (0–100%)"
                        value={settings.speechVolume}
                        min={0}
                        max={100}
                        displayValue={`${settings.speechVolume}%`}
                        onChange={v => handleUpdate({ speechVolume: v })}
                      />
                      <SettingRow id="test-speech" label="Test Voice">
                        <Button
                          id="test-speech"
                          variant="outline"
                          size="sm"
                          onClick={() => isSpeaking ? stopSpeaking() : speak('Hello! This is how text-to-speech sounds with your current settings.')}
                          className="gap-2"
                          aria-label={isSpeaking ? 'Stop speech test' : 'Test speech settings'}
                        >
                          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {isSpeaking ? 'Stop' : 'Test Voice'}
                        </Button>
                      </SettingRow>
                    </>
                  )}
                </SectionCard>

                <SectionCard icon={Captions} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400" title="Captions & Feedback" description="Additional audio and visual feedback features">
                  <SettingRow id="live-captions" label="Live Captions" badge="NEW" description="Shows a caption bar at the bottom of the screen displaying the text currently being spoken aloud">
                    <Switch
                      id="live-captions"
                      checked={settings.liveCaptions}
                      onCheckedChange={v => handleUpdate({ liveCaptions: v })}
                      aria-label="Toggle live captions"
                    />
                  </SettingRow>
                  <SettingRow id="audio-instructions" label="Audio Instructions" description="Automatically read out navigation announcements and status changes">
                    <Switch
                      id="audio-instructions"
                      checked={settings.audioInstructions}
                      onCheckedChange={v => handleUpdate({ audioInstructions: v })}
                      aria-label="Toggle audio instructions"
                    />
                  </SettingRow>
                  <SettingRow id="audio-descriptions" label="Audio Descriptions" description="Provide verbal descriptions of visual elements and diagrams (WCAG 1.2.5)">
                    <Switch
                      id="audio-descriptions"
                      checked={settings.audioDescriptions}
                      onCheckedChange={v => handleUpdate({ audioDescriptions: v })}
                      aria-label="Toggle audio descriptions"
                    />
                  </SettingRow>
                  <SettingRow id="sound-effects" label="Sound Effects" description="Enable subtle audio cues when performing actions like submitting or flagging">
                    <Switch
                      id="sound-effects"
                      checked={settings.soundEffects}
                      onCheckedChange={v => handleUpdate({ soundEffects: v })}
                      aria-label="Toggle sound effects"
                    />
                  </SettingRow>
                  <SettingRow id="verbose-mode" label="Verbose Screen Reader Mode" description="More detailed announcements for complex elements — recommended for NVDA, JAWS, VoiceOver users">
                    <Switch
                      id="verbose-mode"
                      checked={settings.verboseMode}
                      onCheckedChange={v => handleUpdate({ verboseMode: v })}
                      aria-label="Toggle verbose screen reader mode"
                    />
                  </SettingRow>
                  <SettingRow id="screen-reader-mode" label="Screen Reader Mode" description="Optimise layout and interactions for use with an external screen reader (NVDA, JAWS, VoiceOver, Orca)">
                    <Switch
                      id="screen-reader-mode"
                      checked={settings.screenReaderMode}
                      onCheckedChange={v => handleUpdate({ screenReaderMode: v })}
                      aria-label="Toggle screen reader optimisation mode"
                    />
                  </SettingRow>
                </SectionCard>
              </TabsContent>

              {/* ══ NAVIGATION ══════════════════════ */}
              <TabsContent value="navigation" className="space-y-4 mt-0" role="tabpanel" aria-label="Navigation settings">
                <SectionCard icon={Keyboard} iconColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" title="Keyboard Navigation" description="Customise how you navigate the platform using a keyboard">
                  <SettingRow id="keyboard-nav" label="Navigation Mode" description="Choose the level of keyboard navigation enhancement">
                    <Select
                      value={settings.keyboardNavigation}
                      onValueChange={v => handleUpdate({ keyboardNavigation: v as typeof settings.keyboardNavigation })}
                    >
                      <SelectTrigger id="keyboard-nav" className="w-40" aria-label="Select keyboard navigation mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Tab key)</SelectItem>
                        <SelectItem value="enhanced">Enhanced (Alt+Arrow keys)</SelectItem>
                        <SelectItem value="custom">Custom (configurable)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                  <SettingRow id="skip-links" label="Visible Skip Links" description="Always show skip navigation links at the top of the page (WCAG 2.4.1)">
                    <Switch
                      id="skip-links"
                      checked={settings.skipLinksVisible}
                      onCheckedChange={v => handleUpdate({ skipLinksVisible: v })}
                      aria-label="Toggle visible skip links"
                    />
                  </SettingRow>
                  <SettingRow id="sticky-focus" label="Sticky Focus" description="Keep the keyboard focus indicator visible at all times, even when using a mouse">
                    <Switch
                      id="sticky-focus"
                      checked={settings.stickyFocus}
                      onCheckedChange={v => handleUpdate({ stickyFocus: v })}
                      aria-label="Toggle sticky focus indicator"
                    />
                  </SettingRow>
                  <SettingRow id="landmark-nav" label="Landmark Navigation" description="Enable quick navigation between ARIA landmark regions (Alt+Arrow keys)">
                    <Switch
                      id="landmark-nav"
                      checked={settings.landmarkNavigation}
                      onCheckedChange={v => handleUpdate({ landmarkNavigation: v })}
                      aria-label="Toggle landmark navigation"
                    />
                  </SettingRow>
                  <SettingRow id="announce-changes" label="Announce Changes" description="Alert screen readers when page content changes dynamically (WCAG 4.1.3)">
                    <Switch
                      id="announce-changes"
                      checked={settings.announceChanges}
                      onCheckedChange={v => handleUpdate({ announceChanges: v })}
                      aria-label="Toggle dynamic content announcements"
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard icon={Mic} iconColor="bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" title="Voice Navigation" description="Control the platform using your voice">
                  <SettingRow id="voice-nav" label="Voice Navigation" badge="NEW" description="Navigate and control OPSIS using voice commands such as 'Next question', 'Submit exam', 'Read question'">
                    <Switch
                      id="voice-nav"
                      checked={settings.voiceNavigation}
                      onCheckedChange={v => handleUpdate({ voiceNavigation: v })}
                      aria-label="Toggle voice navigation"
                    />
                  </SettingRow>
                  {settings.voiceNavigation && (
                    <div className="mt-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                      <p className="text-xs font-medium text-teal-800 dark:text-teal-300 mb-2">Voice Commands</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          'Next question', 'Previous question',
                          'Submit exam', 'Flag question',
                          'Read question', 'Open help',
                        ].map(cmd => (
                          <span key={cmd} className="text-xs text-teal-700 dark:text-teal-400 flex items-center gap-1">
                            <Mic className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                            "{cmd}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </TabsContent>

              {/* ══ COGNITIVE ═══════════════════════ */}
              <TabsContent value="cognitive" className="space-y-4 mt-0" role="tabpanel" aria-label="Cognitive settings">
                <SectionCard icon={Brain} iconColor="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" title="Motion & Animation" description="Reduce visual movement for users with vestibular disorders or sensitivity to motion (WCAG 2.3.3)">
                  <SettingRow id="reduced-motion" label="Reduce Motion" description="Minimise or eliminate animations, transitions, and parallax effects across the platform">
                    <Switch
                      id="reduced-motion"
                      checked={settings.reducedMotion}
                      onCheckedChange={v => handleUpdate({ reducedMotion: v })}
                      aria-label="Toggle reduced motion"
                    />
                  </SettingRow>
                  <SettingRow id="pause-animations" label="Pause Animations" description="Pause any looping animations or animated content (WCAG 2.2.2)">
                    <Switch
                      id="pause-animations"
                      checked={settings.pauseAnimations}
                      onCheckedChange={v => handleUpdate({ pauseAnimations: v })}
                      aria-label="Toggle pause animations"
                    />
                  </SettingRow>
                  <SettingRow id="animation-speed" label="Animation Speed" description="Control how fast interface animations play">
                    <Select
                      value={settings.animationSpeed}
                      onValueChange={v => handleUpdate({ animationSpeed: v as typeof settings.animationSpeed })}
                    >
                      <SelectTrigger id="animation-speed" className="w-36" aria-label="Select animation speed">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (0.5×)</SelectItem>
                        <SelectItem value="normal">Normal (1×)</SelectItem>
                        <SelectItem value="fast">Fast (2×)</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </SectionCard>

                <SectionCard icon={Glasses} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" title="Timing & Cognitive Load" description="Settings to reduce cognitive load and accommodate processing differences">
                  <SettingRow id="extended-timeouts" label="Extended Timeouts" description="Give more time before session timeouts and warnings appear — useful for users who need more time to read (WCAG 2.2.1)">
                    <Switch
                      id="extended-timeouts"
                      checked={settings.extendedTimeouts}
                      onCheckedChange={v => handleUpdate({ extendedTimeouts: v })}
                      aria-label="Toggle extended timeouts"
                    />
                  </SettingRow>
                  <SettingRow id="timeout-warnings" label="Timeout Warnings" description="Show prominent warnings before time-sensitive actions expire">
                    <Switch
                      id="timeout-warnings"
                      checked={settings.timeoutWarnings}
                      onCheckedChange={v => handleUpdate({ timeoutWarnings: v })}
                      aria-label="Toggle timeout warnings"
                    />
                  </SettingRow>
                  <SettingRow id="show-tooltips" label="Helpful Tooltips" description="Show descriptive tooltips on hover for all interactive elements">
                    <Switch
                      id="show-tooltips"
                      checked={settings.showTooltips}
                      onCheckedChange={v => handleUpdate({ showTooltips: v })}
                      aria-label="Toggle helpful tooltips"
                    />
                  </SettingRow>
                </SectionCard>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* ── Action buttons ─────────────────────── */}
          <motion.div {...fadeUp(0.1)}>
            <Separator className="mb-4" />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                className="gap-2"
                aria-label="Reset all accessibility settings to defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset to Defaults
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
                aria-label="Export settings to a JSON file"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                className="gap-2"
                aria-label="Import settings from a JSON file"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Import Settings
              </Button>
            </div>
          </motion.div>
        </div>

        {/* ── Sidebar: Preview + Info ──────────────── */}
        <motion.div {...fadeUp(0.08)} className="space-y-4">

          <PreviewPanel settings={settings} />

          {/* Quick status */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Active Features
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-1.5" role="list" aria-label="Currently active accessibility features">
                {[
                  { label: 'High Contrast',    active: settings.contrastMode === 'high' },
                  { label: 'Dark Mode',        active: settings.contrastMode === 'dark' },
                  { label: 'Colour Filter',    active: settings.colorTheme !== 'default', value: settings.colorTheme },
                  { label: 'Dyslexia Font',    active: settings.fontFamily === 'dyslexia' },
                  { label: 'Reading Mask',     active: settings.readingMask },
                  { label: 'Reading Guide',    active: settings.readingGuide },
                  { label: 'Text-to-Speech',   active: settings.speechEnabled },
                  { label: 'Live Captions',    active: settings.liveCaptions },
                  { label: 'Voice Nav',        active: settings.voiceNavigation },
                  { label: 'Reduced Motion',   active: settings.reducedMotion },
                  { label: 'Large Cursor',     active: settings.cursorSize !== 'normal' },
                  { label: 'Verbose SR Mode',  active: settings.verboseMode },
                ].map(f => (
                  <div key={f.label} role="listitem" className="flex items-center justify-between py-0.5">
                    <span className={`text-xs ${f.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {f.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${f.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${f.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} aria-hidden="true" />
                      {f.active ? (f.value ? f.value : 'On') : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts reference */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <dl className="space-y-2">
                {[
                  { key: 'Alt+A', label: 'Accessibility panel' },
                  { key: 'Alt+R', label: 'Read aloud' },
                  { key: 'Alt+H', label: 'Help' },
                  { key: 'Alt+N', label: 'Next question' },
                  { key: 'Alt+P', label: 'Previous question' },
                  { key: 'Alt+F', label: 'Flag question' },
                  { key: 'Ctrl+M', label: 'Voice input' },
                  { key: 'Tab', label: 'Navigate elements' },
                  { key: 'Esc', label: 'Close dialog' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-semibold">
                        {s.key}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* WCAG compliance info */}
          <Card className="border-primary/20 bg-primary/3 shadow-sm">
            <CardContent className="px-5 py-4">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">WCAG 2.2 AA Compliant</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    OPSIS meets all WCAG 2.2 Level AA success criteria. Compatible with
                    NVDA, JAWS, VoiceOver (macOS/iOS), Orca (Linux), and TalkBack (Android).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </motion.div>
      </div>
    </main>
  );
}
