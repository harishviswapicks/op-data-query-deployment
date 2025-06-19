"use client";

import { useState, useEffect } from "react";
import { UserProfile, AgentConfiguration } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Settings2, 
  Zap, 
  Brain, 
  MessageSquare, 
  Sliders, 
  Save,
  RotateCcw,
  Sparkles,
  Clock,
  Target
} from "lucide-react";

interface AgentPersonalityConfigProps {
  userProfile: UserProfile;
  onConfigUpdate: (config: AgentConfiguration) => void;
  onClose: () => void;
}

export default function AgentPersonalityConfig({ 
  userProfile, 
  onConfigUpdate, 
  onClose 
}: AgentPersonalityConfigProps) {
  const [config, setConfig] = useState<AgentConfiguration>(userProfile.agentConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasChanged = JSON.stringify(config) !== JSON.stringify(userProfile.agentConfig);
    setHasChanges(hasChanged);
  }, [config, userProfile.agentConfig]);

  const handlePersonalityChange = (personality: AgentConfiguration['personality']) => {
    setConfig(prev => ({ ...prev, personality }));
  };

  const handleResponseStyleChange = (responseStyle: AgentConfiguration['responseStyle']) => {
    setConfig(prev => ({ ...prev, responseStyle }));
  };

  const handleCreativityChange = (creativityLevel: number) => {
    setConfig(prev => ({ ...prev, creativityLevel }));
  };

  const handleResponseLengthChange = (responseLength: AgentConfiguration['responseLength']) => {
    setConfig(prev => ({ ...prev, responseLength }));
  };

  const handleCustomInstructionsChange = (customInstructions: string) => {
    setConfig(prev => ({ ...prev, customInstructions }));
  };

  const handleSave = () => {
    onConfigUpdate(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(userProfile.agentConfig);
  };

  const getPersonalityDescription = (personality: string) => {
    const descriptions = {
      professional: "Formal, precise, and business-focused responses",
      friendly: "Warm, conversational, and approachable tone",
      concise: "Brief, direct answers with minimal elaboration",
      detailed: "Comprehensive explanations with context and examples"
    };
    return descriptions[personality as keyof typeof descriptions] || "";
  };

  const getResponseStyleDescription = (style: string) => {
    const descriptions = {
      quick: "Fast, immediate responses prioritizing speed",
      thorough: "Comprehensive analysis with detailed reasoning",
      balanced: "Optimal mix of speed and thoroughness"
    };
    return descriptions[style as keyof typeof descriptions] || "";
  };

  const getCreativityDescription = (level: number) => {
    if (level < 30) return "Conservative and predictable responses";
    if (level < 70) return "Balanced creativity with reliable insights";
    return "Highly creative and innovative suggestions";
  };

  const getResponseLengthDescription = (length: string) => {
    const descriptions = {
      brief: "Short, to-the-point responses (1-2 sentences)",
      standard: "Moderate length with key details (1-2 paragraphs)",
      comprehensive: "Detailed responses with full context (multiple paragraphs)"
    };
    return descriptions[length as keyof typeof descriptions] || "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-title-2 text-foreground">
                    AI Assistant Configuration
                  </CardTitle>
                  <p className="text-footnote text-muted-foreground mt-1">
                    Customize your AI assistant's personality and behavior
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Personality Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-subheadline font-semibold text-foreground">
                  Personality Style
                </h3>
              </div>
              <p className="text-footnote text-muted-foreground">
                Choose how your AI assistant communicates with you
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {(['professional', 'friendly', 'concise', 'detailed'] as const).map((personality) => (
                  <button
                    key={personality}
                    onClick={() => handlePersonalityChange(personality)}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                      config.personality === personality
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border/20 hover:border-primary/50 bg-muted/10'
                    }`}
                  >
                    <div className="font-medium text-foreground capitalize mb-1">
                      {personality}
                    </div>
                    <div className="text-caption-1 text-muted-foreground">
                      {getPersonalityDescription(personality)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Response Style */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <h3 className="text-subheadline font-semibold text-foreground">
                  Response Style
                </h3>
              </div>
              <p className="text-footnote text-muted-foreground">
                Balance between speed and thoroughness
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {(['quick', 'balanced', 'thorough'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleResponseStyleChange(style)}
                    className={`p-4 rounded-lg border text-center transition-all duration-200 hover:scale-105 ${
                      config.responseStyle === style
                        ? 'border-accent bg-accent/10 shadow-md'
                        : 'border-border/20 hover:border-accent/50 bg-muted/10'
                    }`}
                  >
                    <div className="font-medium text-foreground capitalize mb-1">
                      {style}
                    </div>
                    <div className="text-caption-1 text-muted-foreground">
                      {getResponseStyleDescription(style)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Creativity Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" />
                <h3 className="text-subheadline font-semibold text-foreground">
                  Creativity Level
                </h3>
              </div>
              <p className="text-footnote text-muted-foreground">
                How creative and innovative should responses be?
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-footnote text-muted-foreground">Conservative</span>
                  <span className="text-footnote font-medium text-foreground">
                    {config.creativityLevel}%
                  </span>
                  <span className="text-footnote text-muted-foreground">Innovative</span>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.creativityLevel}
                    onChange={(e) => handleCreativityChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--warning)) 0%, hsl(var(--warning)) ${config.creativityLevel}%, hsl(var(--muted)) ${config.creativityLevel}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                </div>
                
                <p className="text-caption-1 text-muted-foreground">
                  {getCreativityDescription(config.creativityLevel)}
                </p>
              </div>
            </div>

            {/* Response Length */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-subheadline font-semibold text-foreground">
                  Response Length
                </h3>
              </div>
              <p className="text-footnote text-muted-foreground">
                How detailed should responses be?
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {(['brief', 'standard', 'comprehensive'] as const).map((length) => (
                  <button
                    key={length}
                    onClick={() => handleResponseLengthChange(length)}
                    className={`p-4 rounded-lg border text-center transition-all duration-200 hover:scale-105 ${
                      config.responseLength === length
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border/20 hover:border-primary/50 bg-muted/10'
                    }`}
                  >
                    <div className="font-medium text-foreground capitalize mb-1">
                      {length}
                    </div>
                    <div className="text-caption-1 text-muted-foreground">
                      {getResponseLengthDescription(length)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent" />
                <h3 className="text-subheadline font-semibold text-foreground">
                  Custom Instructions
                </h3>
              </div>
              <p className="text-footnote text-muted-foreground">
                Additional guidance for your AI assistant (optional)
              </p>
              
              <textarea
                value={config.customInstructions || ''}
                onChange={(e) => handleCustomInstructionsChange(e.target.value)}
                placeholder="e.g., Always include data sources, Focus on actionable insights, Use simple language..."
                className="w-full h-24 px-3 py-2 bg-muted/20 border border-border/20 rounded-lg text-body placeholder:text-muted-foreground/60 focus:bg-muted/30 focus:border-primary/30 transition-all duration-200 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-border/10">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!hasChanges}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2"
                  disabled={!hasChanges}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
