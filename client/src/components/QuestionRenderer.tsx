import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAccessibility } from './AccessibilityProvider';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { CodingQuestionRenderer } from './CodingQuestionRenderer';
import type { CodeEditorVoiceActions } from './CodeEditor';
import type { Question, MultipleChoiceOption } from '@shared/schema';
import { Volume2, Flag, Mic, MicOff } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFlag?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isFlagged?: boolean;
  onCodeVoiceActionsReady?: (actions: CodeEditorVoiceActions | null) => void;
}

export function QuestionRenderer({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  onNext,
  onPrevious,
  onFlag,
  isFirst = false,
  isLast = false,
  isFlagged = false,
  onCodeVoiceActionsReady,
}: QuestionRendererProps) {
  const { speak, announceToScreenReader } = useAccessibility();
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearError
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-US'
  });

  const readQuestion = () => {
    const questionText = `Question ${questionNumber}: ${question.text}`;
    speak(questionText);
    announceToScreenReader('Reading question aloud');
  };

  const handleAnswerChange = (value: string) => {
    onAnswerChange(value);
    announceToScreenReader(`Answer updated`);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      clearError();
      resetTranscript();
      startListening();
    }
  };

  const insertVoiceText = () => {
    if (transcript) {
      const currentAnswer = answer || '';
      const newAnswer = currentAnswer + (currentAnswer ? ' ' : '') + transcript;
      onAnswerChange(newAnswer);
      resetTranscript();
      announceToScreenReader(`Voice input added: ${transcript}`);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      announceToScreenReader(`Moving to question ${questionNumber + 1}`);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
      announceToScreenReader(`Moving to question ${questionNumber - 1}`);
    }
  };

  const handleFlag = () => {
    if (onFlag) {
      onFlag();
      announceToScreenReader(isFlagged ? 'Question unflagged for review' : 'Question flagged for review');
    }
  };

  const renderMultipleChoice = () => {
    const options = question.options as MultipleChoiceOption[];
    
    return (
      <RadioGroup value={answer} onValueChange={handleAnswerChange}>
        <div className="space-y-4" role="radiogroup" aria-labelledby={`question-${questionNumber}`}>
          {options?.map((option) => (
            <div key={option.id} className="flex items-start p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-primary">
              <RadioGroupItem 
                value={option.id} 
                id={`option-${option.id}`}
                className="mt-1 mr-4"
                data-testid={`radio-option-${option.id}`}
              />
              <Label 
                htmlFor={`option-${option.id}`} 
                className="flex-1 cursor-pointer text-base"
              >
                <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                {option.text}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    );
  };

  const renderShortAnswer = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor={`answer-${questionNumber}`} className="text-lg font-medium">
          Your Answer:
        </Label>
        {isSupported && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleVoiceInput}
              variant={isListening ? "default" : "outline"}
              size="sm"
              className="focus-visible:outline-2 focus-visible:outline-primary"
              aria-describedby="voice-input-desc"
              data-testid="button-voice-input"
            >
              {isListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
              {isListening ? 'Stop Recording' : 'Voice Input'}
            </Button>
            {transcript && (
              <Button
                onClick={insertVoiceText}
                variant="secondary"
                size="sm"
                className="focus-visible:outline-2 focus-visible:outline-primary"
                data-testid="button-insert-voice-text"
              >
                Insert Voice Text
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Textarea
        id={`answer-${questionNumber}`}
        value={answer || ''}
        onChange={(e) => handleAnswerChange(e.target.value)}
        rows={8}
        className="w-full text-base focus:ring-2 focus:ring-primary"
        placeholder={isSupported ? "Type your detailed answer here or use voice input..." : "Type your detailed answer here. You can write multiple paragraphs..."}
        aria-describedby={`answer-help-${questionNumber}`}
        data-testid="textarea-short-answer"
        onFocus={() => announceToScreenReader(`Short answer text field for question ${questionNumber}. Type your detailed response here or use voice input.`)}
      />
      
      {/* Voice Recognition Status */}
      {isSupported && (
        <div className="mt-2">
          {isListening && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                🎤 Listening... Speak now
              </p>
              {interimTranscript && (
                <p className="text-sm text-red-600 dark:text-red-300 italic">
                  "{interimTranscript}"
                </p>
              )}
            </div>
          )}
          
          {transcript && !isListening && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Voice input recognized:
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                "{transcript}"
              </p>
            </div>
          )}
          
          {speechError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Voice input error:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {speechError}
              </p>
            </div>
          )}
        </div>
      )}
      
      <p id={`answer-help-${questionNumber}`} className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {isSupported 
          ? "Type your response or click 'Voice Input' to speak your answer. Use Tab to navigate and Enter for new lines. Press Alt + R to hear the question again."
          : "Please provide a detailed explanation. Use the Tab key to navigate and Enter to create new lines. Press Alt + R to hear the question again."
        }
      </p>
      
      <p id="voice-input-desc" className="sr-only">
        {isListening 
          ? "Voice recording is active. Speak your answer and click 'Stop Recording' when finished."
          : "Click to start voice recording. Your speech will be converted to text that you can then insert into your answer."
        }
      </p>
      
      {answer && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          Answer saved: {answer.length} characters written.
        </p>
      )}
    </div>
  );

  const renderTrueFalse = () => (
    <RadioGroup value={answer} onValueChange={handleAnswerChange}>
      <div className="space-y-4" role="radiogroup" aria-labelledby={`question-${questionNumber}`}>
        <div className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-primary">
          <RadioGroupItem 
            value="true" 
            id="true"
            className="mr-4"
            data-testid="radio-true"
          />
          <Label htmlFor="true" className="cursor-pointer text-base font-medium">
            True
          </Label>
        </div>
        <div className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-within:ring-2 focus-within:ring-primary">
          <RadioGroupItem 
            value="false" 
            id="false"
            className="mr-4"
            data-testid="radio-false"
          />
          <Label htmlFor="false" className="cursor-pointer text-base font-medium">
            False
          </Label>
        </div>
      </div>
    </RadioGroup>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-8 mb-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-semibold flex-1" id={`question-${questionNumber}`}>
            <span className="text-primary">Question {questionNumber}:</span>{' '}
            <span>{question.text}</span>
          </h3>
          <Button
            onClick={readQuestion}
            variant="outline"
            size="sm"
            className="ml-4 focus-visible:outline-2 focus-visible:outline-primary"
            aria-describedby="read-question-desc"
            data-testid="button-read-question"
          >
            <Volume2 className="h-4 w-4" />
            <span className="sr-only">Read Question</span>
          </Button>
          <p id="read-question-desc" className="sr-only">
            Uses text-to-speech to read the current question aloud
          </p>
        </div>

        {question.type === 'multiple_choice' && renderMultipleChoice()}
        {question.type === 'short_answer' && renderShortAnswer()}
        {question.type === 'true_false' && renderTrueFalse()}
        {question.type === 'coding' && (
          <CodingQuestionRenderer
            question={question}
            currentAnswer={answer || ''}
            onAnswerChange={onAnswerChange}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onVoiceActionsReady={onCodeVoiceActionsReady}
          />
        )}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-300 dark:border-gray-600">
        <Button
          onClick={handlePrevious}
          disabled={isFirst}
          variant="secondary"
          className="focus-visible:outline-2 focus-visible:outline-primary"
          data-testid="button-previous-question"
        >
          Previous Question
        </Button>

        <div className="flex gap-4">
          <Button
            onClick={handleFlag}
            variant={isFlagged ? "default" : "outline"}
            className="focus-visible:outline-2 focus-visible:outline-primary"
            aria-describedby="flag-desc"
            data-testid="button-flag-question"
          >
            <Flag className="mr-2 h-4 w-4" />
            {isFlagged ? 'Unflag' : 'Flag for Review'}
          </Button>
          <p id="flag-desc" className="sr-only">
            {isFlagged 
              ? 'Remove flag from this question'
              : 'Mark this question for later review. You can return to flagged questions before submitting.'
            }
          </p>

          <Button
            onClick={handleNext}
            disabled={isLast}
            className="bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
            data-testid="button-next-question"
          >
            {isLast ? 'Finish Exam' : 'Next Question'}
          </Button>
        </div>
      </div>
    </div>
  );
}
