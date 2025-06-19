"use client";

import { useState } from "react";
import { UserProfile, AgentConfiguration } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bot, 
  Settings, 
  Save, 
  RotateCcw, 
  Sliders,
  MessageSquare,
  Clock,
  Zap,
  Brain
} from "lucide-react";

interface PersonalAssistantProps {
  userProfile: UserProfile;
  onConfigUpdate?: (config: AgentConfiguration) => void;
  className?: string;
}

export default function PersonalAssistant({ 
  userProfile, 
  onConfigUpdate,
  className = ""
}: PersonalAssistantProps) {
  const [config, setConfig] = useState<AgentConfiguration>(userProfile.agentConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfigChange = (field: keyof AgentConfiguration, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onConfigUpdate?.(config);
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(userProfile.agentConfig);
    setHasChanges(false);
  };

  const getPersonalityDescription = (personality: string) => {
    switch (personality) {
      case 'professional':
        return 'Formal, business-focused responses with clear structure';
      case 'friendly':
        return 'Warm, approachable tone with casual language';
      case 'concise':
        return 'Brief, to-the-point answers without extra details';
      case 'detailed':
        return 'Comprehensive explanations with context and examples';
      default:
        return 'Balanced approach suitable for most situations';
    }
  };

  const getCreativityDescription = (level: number) => {
    if (level <= 25) return 'Conservative - Stick to established patterns and safe responses';
    if (level <= 50) return 'Balanced - Mix of reliable and creative approaches';
    if (level <= 75) return 'Creative - More varied and innovative responses';
    return 'Very Creative - Highly original and experimental approaches';
  };

  const getResponseLengthDescription = (length: string) => {
    switch (length) {
      case 'brief':
        return 'Short, concise answers focusing on key points';
      case 'standard':
        return 'Balanced detail level suitable for most questions';
      case 'comprehensive':
        return 'Detailed explanations with full context and examples';
      default:
        return 'Standard response length';
    }
  };

  return (
    <div className={`bg-background ${className}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-3 text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Personal Assistant Settings
              </CardTitle>
              <p className="text-caption-1 text-muted-foreground mt-1">
                Customize your AI assistant's personality and behavior
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Personality Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-subheadline font-semibold text-foreground">Personality</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-footnote font-medium text-foreground mb-3 block">
                  Response Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'professional', label: 'Professional' },
                    { value: 'friendly', label: 'Friendly' },
                    { value: 'concise', label: 'Concise' },
                    { value: 'detailed', label: 'Detailed' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleConfigChange('personality', option.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        config.personality === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-footnote font-medium text-foreground mb-1">
                        {option.label}
                      </div>
                      <div className="text-caption-1 text-muted-foreground">
                        {getPersonalityDescription(option.value)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-footnote font-medium text-foreground mb-3 block">
                  Response Detail Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'brief', label: 'Brief' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'comprehensive', label: 'Comprehensive' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleConfigChange('responseLength', option.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                        config.responseLength === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-footnote font-medium text-foreground mb-1">
                        {option.label}
                      </div>
                      <div className="text-caption-1 text-muted-foreground">
                        {getResponseLengthDescription(option.value)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-accent" />
              <h3 className="text-subheadline font-semibold text-foreground">Advanced Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Creativity Level */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-footnote font-medium text-foreground">
                    Response Creativity
                  </label>
                  <span className="text-caption-1 text-muted-foreground">
                    {config.creativityLevel}%
                  </span>
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.creativityLevel}
                    onChange={(e) => handleConfigChange('creativityLevel', Number(e.target.value))}
                    className="w-full h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-caption-2 text-muted-foreground">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                    <span>Very Creative</span>
                  </div>
                  <p className="text-caption-1 text-muted-foreground">
                    {getCreativityDescription(config.creativityLevel)}
                  </p>
                </div>
              </div>

              {/* Response Style */}
              <div>
                <label className="text-footnote font-medium text-foreground mb-3 block">
                  Communication Style
                </label>
                <select
                  value={config.responseStyle}
                  onChange={(e) => handleConfigChange('responseStyle', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/20 rounded-lg text-footnote"
                >
                  <option value="balanced">Balanced - Mix of formal and casual</option>
                  <option value="quick">Quick - Fast, efficient responses</option>
                  <option value="thorough">Thorough - Detailed, comprehensive answers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-warning" />
              <h3 className="text-subheadline font-semibold text-foreground">Quick Presets</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setConfig({
                    personality: 'professional',
                    responseStyle: 'balanced',
                    creativityLevel: 30,
                    responseLength: 'standard'
                  });
                  setHasChanges(true);
                }}
                className="p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-footnote font-medium text-foreground">Executive Assistant</span>
                </div>
                <p className="text-caption-1 text-muted-foreground">
                  Professional, balanced responses for business communications
                </p>
              </button>

              <button
                onClick={() => {
                  setConfig({
                    personality: 'friendly',
                    responseStyle: 'quick',
                    creativityLevel: 70,
                    responseLength: 'brief'
                  });
                  setHasChanges(true);
                }}
                className="p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-footnote font-medium text-foreground">Casual Helper</span>
                </div>
                <p className="text-caption-1 text-muted-foreground">
                  Friendly, quick responses for everyday questions
                </p>
              </button>

              <button
                onClick={() => {
                  setConfig({
                    personality: 'detailed',
                    responseStyle: 'thorough',
                    creativityLevel: 40,
                    responseLength: 'comprehensive'
                  });
                  setHasChanges(true);
                }}
                className="p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-warning" />
                  </div>
                  <span className="text-footnote font-medium text-foreground">Technical Expert</span>
                </div>
                <p className="text-caption-1 text-muted-foreground">
                  Detailed, thorough explanations with comprehensive context
                </p>
              </button>

              <button
                onClick={() => {
                  setConfig({
                    personality: 'concise',
                    responseStyle: 'balanced',
                    creativityLevel: 20,
                    responseLength: 'brief'
                  });
                  setHasChanges(true);
                }}
                className="p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-footnote font-medium text-foreground">Quick Answers</span>
                </div>
                <p className="text-caption-1 text-muted-foreground">
                  Brief, to-the-point responses for fast information
                </p>
              </button>
            </div>
          </div>

          {/* Current Configuration Summary */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border/10">
            <h4 className="text-footnote font-medium text-foreground mb-3">Current Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-caption-1">
              <div>
                <span className="text-muted-foreground">Personality:</span>
                <span className="ml-2 text-foreground capitalize">{config.personality}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Style:</span>
                <span className="ml-2 text-foreground capitalize">{config.responseStyle}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Creativity:</span>
                <span className="ml-2 text-foreground">{config.creativityLevel}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Detail Level:</span>
                <span className="ml-2 text-foreground capitalize">{config.responseLength}</span>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/10">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Changes
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(0, 122, 255);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(0, 122, 255);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
