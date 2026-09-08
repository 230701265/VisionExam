import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Keyboard, HelpCircle, Volume2, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAccessibility } from "./AccessibilityProvider";
// import { Badge } from "@/components/ui/badge";

export function InternationalKeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    international: true,
    landmarks: false,
    elements: false,
    coding: false,
    accessibility: false
  });
  const { speak, stopSpeaking } = useAccessibility();

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const readSection = (text: string) => {
    stopSpeaking();
    speak(text);
  };

  const shortcutCategories = [
    {
      title: "OPSIS Assist Navigation",
      key: "international",
      badge: "WCAG 2.1",
      shortcuts: [
        { key: "Ctrl + Shift + Space", description: "Turn OPSIS Assist continuous listening and reading cursor on or off" },
        { key: "↓", description: "Read the next content unit while OPSIS Assist is on" },
        { key: "↑", description: "Read the previous content unit while OPSIS Assist is on" },
        { key: "Enter / Space", description: "Activate the current OPSIS Assist item" },
        { key: "Tab", description: "Standard forward navigation (all browsers, all countries)" },
        { key: "Shift + Tab", description: "Standard backward navigation (international)" },
        { key: "Alt + A / F11", description: "Open the Accessibility Center" },
        { key: "Microphone button", description: "Start a short push-to-talk command while Assist is off" }
      ]
    },
    {
      title: "Exam Navigation",
      key: "landmarks",
      badge: "Section 508",
      shortcuts: [
        { key: "Alt + N", description: "Move to the next exam question" },
        { key: "Alt + P", description: "Move to the previous exam question" },
        { key: "Alt + F", description: "Flag or unflag the current question" },
        { key: "Alt + R", description: "Read the current question when narration is enabled" },
        { key: "Alt + H", description: "Open exam keyboard help" }
      ]
    },
    {
      title: "Voice Commands",
      key: "elements",
      badge: "EN 301 549",
      shortcuts: [
        { key: "Say “help”", description: "Hear commands available in the current page" },
        { key: "Say “next question”", description: "Move forward in an exam" },
        { key: "Say “previous question”", description: "Move backward in an exam" },
        { key: "Say “read question”", description: "Read the current question" },
        { key: "Say “submit exam”", description: "Stage submission; a separate confirmation is always required" }
      ]
    },
    {
      title: "VS Code Editor (Monaco) - Cross-Platform",
      key: "coding",
      badge: "VS Code",
      shortcuts: [
        { key: "F5", description: "Run code / Execute current solution (universal)" },
        { key: "F9", description: "Reset code editor to initial state (universal)" },
        { key: "Ctrl + S (Cmd + S on Mac)", description: "Save current code" },
        { key: "Ctrl + / (Cmd + / on Mac)", description: "Toggle line comment" },
        { key: "Ctrl + Z (Cmd + Z on Mac)", description: "Undo last change" },
        { key: "Ctrl + Y (Cmd + Shift + Z on Mac)", description: "Redo change" },
        { key: "Ctrl + F (Cmd + F on Mac)", description: "Find in code" },
        { key: "Ctrl + H (Cmd + Option + F on Mac)", description: "Find and replace" },
        { key: "Ctrl + A (Cmd + A on Mac)", description: "Select all code" },
        { key: "Alt + Shift + F (Option + Shift + F on Mac)", description: "Format/beautify code" },
        { key: "Ctrl + D (Cmd + D on Mac)", description: "Add selection to next find match" },
        { key: "F2", description: "Rename symbol (if available)" },
        { key: "Ctrl + G (Cmd + G on Mac)", description: "Go to line number" },
        { key: "Ctrl + P (Cmd + P on Mac)", description: "Quick open/command palette" }
      ]
    },
    {
      title: "Screen Reader & Accessibility Support",
      key: "accessibility",
      badge: "Global",
      shortcuts: [
        { key: "NVDA (Windows)", description: "Complete support with live regions and ARIA labels" },
        { key: "JAWS (Windows)", description: "Full compatibility with forms mode and virtual cursor" },
        { key: "VoiceOver (macOS)", description: "Native macOS screen reader with landmark navigation" },
        { key: "Orca (Linux)", description: "Linux screen reader support with speech synthesis" },
        { key: "TalkBack (Android)", description: "Mobile screen reader support (web browsers)" },
        { key: "Dragon NaturallySpeaking", description: "Voice control software compatibility" },
        { key: "Text-to-Speech API", description: "Built-in browser speech synthesis (40+ languages)" },
        { key: "ARIA Live Regions", description: "Real-time announcements for code execution and navigation" },
        { key: "High Contrast Mode", description: "Windows high contrast theme support" },
        { key: "Magnification Software", description: "Compatible with ZoomText, SuperNova, MAGic" }
      ]
    }
  ];

  return (
    <>
      {/* Floating help button with international accessibility */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open international keyboard navigation help - WCAG 2.1 compliant shortcuts for screen readers worldwide"
              data-testid="button-international-help"
            >
              <div className="flex flex-col items-center">
                <Globe className="h-5 w-5 mb-1" />
                <Keyboard className="h-4 w-4" />
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-6xl max-h-[95vh] overflow-y-auto" 
            role="dialog" 
            aria-labelledby="international-help-dialog-title"
            aria-describedby="international-help-description"
          >
            <DialogHeader>
              <DialogTitle id="international-help-dialog-title" className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-600" />
                <Keyboard className="h-6 w-6 text-green-600" />
                International Keyboard Navigation
              </DialogTitle>
              <p id="international-help-description" className="text-sm text-gray-600 dark:text-gray-400">
                WCAG 2.1 AA, Section 508, EN 301 549 compliant shortcuts for worldwide accessibility
              </p>
            </DialogHeader>

            <div className="space-y-6" role="main">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800" role="region" aria-labelledby="welcome-heading">
                <h3 id="welcome-heading" className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  🌍 Universal Access OPSIS - Cross-Platform Coding Exam System
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Windows • Mac • Linux</span>
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                  Engineered following international accessibility standards used by millions of blind and visually impaired developers worldwide. 
                  Compatible with all major screen readers, voice control software, and assistive technologies across Windows, macOS, Linux, iOS, and Android platforms.
                </p>
              </div>

              {shortcutCategories.map((category) => (
                <Collapsible
                  key={category.key}
                  open={sectionsOpen[category.key as keyof typeof sectionsOpen]}
                  onOpenChange={() => toggleSection(category.key as keyof typeof sectionsOpen)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left h-auto p-4 focus-visible:outline-2 focus-visible:outline-primary focus-visible:ring-2 focus-visible:ring-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-expanded={sectionsOpen[category.key as keyof typeof sectionsOpen]}
                      aria-controls={`section-${category.key}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{category.title}</span>
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border">{category.badge}</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {category.shortcuts.length} shortcuts available
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const shortcutText = `${category.title} section: ${category.shortcuts.map(s => `${s.key}: ${s.description}`).join('. ')}`;
                            readSection(shortcutText);
                          }}
                          className="h-8 w-8 p-0 ml-2"
                          aria-label={`Read aloud all ${category.title} shortcuts`}
                          data-testid={`button-read-${category.key}`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center" aria-hidden="true">
                        {sectionsOpen[category.key as keyof typeof sectionsOpen] ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent 
                    className="px-4 pb-4"
                    id={`section-${category.key}`}
                    role="region"
                    aria-labelledby={`heading-${category.key}`}
                  >
                    <div className="grid gap-3 mt-3" role="list" aria-label={`${category.title} keyboard shortcuts`}>
                      {category.shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          role="listitem"
                        >
                          <kbd className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 px-3 py-2 rounded-md text-sm font-mono min-w-0 flex-shrink-0 border shadow-sm font-semibold">
                            {shortcut.key}
                          </kbd>
                          <span className="text-sm leading-relaxed flex-1">{shortcut.description}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800" role="complementary" aria-labelledby="tips-heading">
                  <h3 id="tips-heading" className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                    🎯 International Best Practices
                  </h3>
                  <ul className="text-green-800 dark:text-green-200 text-sm space-y-2" role="list">
                    <li role="listitem">• <strong>OPSIS Assist:</strong> Use Up and Down to read app content while Assist is on</li>
                    <li role="listitem">• <strong>F5/F9:</strong> International coding shortcuts (VS Code, Eclipse, IntelliJ)</li>
                    <li role="listitem">• <strong>ARIA Landmarks:</strong> Jump between content areas instantly</li>
                    <li role="listitem">• <strong>Live Regions:</strong> Real-time screen reader announcements</li>
                    <li role="listitem">• <strong>Speech Support:</strong> 40+ languages with adjustable rate/volume</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800" role="note" aria-labelledby="standards-heading">
                  <h3 id="standards-heading" className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
                    📋 Compliance Standards
                  </h3>
                  <div className="text-amber-800 dark:text-amber-200 text-sm space-y-1">
                    <div><strong>WCAG 2.1 AA:</strong> Web accessibility guidelines</div>
                    <div><strong>Section 508:</strong> US federal requirements</div>
                    <div><strong>EN 301 549:</strong> European accessibility standard</div>
                    <div><strong>ADA:</strong> Americans with Disabilities Act</div>
                    <div><strong>DDA:</strong> Disability Discrimination Act (AU)</div>
                    <div><strong>AODA:</strong> Accessibility for Ontarians (CA)</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800" role="region" aria-labelledby="global-heading">
                <h3 id="global-heading" className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  🌐 Global Screen Reader Support
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-purple-800 dark:text-purple-200 text-sm">
                  <div>
                    <strong>Windows:</strong> NVDA, JAWS, Narrator, SuperNova
                  </div>
                  <div>
                    <strong>macOS:</strong> VoiceOver (built-in)
                  </div>
                  <div>
                    <strong>Linux:</strong> Orca, SpeechD
                  </div>
                  <div>
                    <strong>Mobile:</strong> TalkBack (Android), VoiceOver (iOS)
                  </div>
                  <div>
                    <strong>Voice Control:</strong> Dragon, Windows Speech
                  </div>
                  <div>
                    <strong>Magnification:</strong> ZoomText, MAGic, Windows Magnifier
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}