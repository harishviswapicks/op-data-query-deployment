"use client";

import { useState } from "react";
import { UserProfile, AgentConfiguration, UserPreferences } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, MessageSquare, Zap, Microscope, Settings2 } from "lucide-react";
import Image from "next/image";

interface UserProfileSetupProps {
  email: string;
  onComplete: (profile: UserProfile) => void;
}

export default function UserProfileSetup({ email, onComplete }: UserProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'analyst' | 'general_employee' | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfiguration>({
    personality: 'professional',
    responseStyle: 'balanced',
    creativityLevel: 50,
    responseLength: 'standard'
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultAgentMode: 'quick',
    autoUpgradeToDeep: false,
    notificationChannels: ['slack'],
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York'
    },
    favoriteDataSources: []
  });

  const handleRoleSelect = (role: 'analyst' | 'general_employee') => {
    setSelectedRole(role);
    
    // Set role-specific defaults
    if (role === 'analyst') {
      setPreferences(prev => ({
        ...prev,
        favoriteDataSources: ['bigquery', 'analytics'],
        defaultAgentMode: 'quick'
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        favoriteDataSources: ['notion', 'slack'],
        defaultAgentMode: 'quick'
      }));
    }
  };

  const handlePersonalityChange = (personality: AgentConfiguration['personality']) => {
    setAgentConfig(prev => ({ ...prev, personality }));
  };

  const handleCreativityChange = (value: number) => {
    setAgentConfig(prev => ({ ...prev, creativityLevel: value }));
  };

  const handleResponseLengthChange = (length: AgentConfiguration['responseLength']) => {
    setAgentConfig(prev => ({ ...prev, responseLength: length }));
  };

  const handleComplete = async () => {
    if (!selectedRole) return;

    // Store the setup data and redirect to password setup
    // We'll pass this data to the password setup component
    const setupData = {
      email,
      role: selectedRole,
      preferences,
      agentConfig,
    };
    
    // Store in sessionStorage temporarily
    sessionStorage.setItem('pendingRegistration', JSON.stringify(setupData));
    
    // Call onComplete with a special flag to indicate password setup is needed
    onComplete({
      id: 'pending',
      email,
      role: selectedRole,
      preferences,
      agentConfig,
      createdAt: new Date(),
      lastActive: new Date(),
      needsPasswordSetup: true
    } as any);
  };

  const getCreativityLabel = (value: number) => {
    if (value <= 25) return 'Conservative';
    if (value <= 50) return 'Balanced';
    if (value <= 75) return 'Creative';
    return 'Very Creative';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/prizepicks.svg"
                alt="PrizePicks Logo"
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
            <CardTitle className="text-title-2 text-foreground font-semibold">
              Welcome to AI Data Platform
            </CardTitle>
            <p className="text-muted-foreground text-callout">
              Let's personalize your AI Agent experience
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    stepNum <= step ? 'bg-primary' : 'bg-muted/50'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-title-3 text-foreground font-semibold mb-2">
                    Choose Your Role
                  </h3>
                  <p className="text-muted-foreground text-callout">
                    This helps us customize your experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect('analyst')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      selectedRole === 'analyst'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/20 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-headline text-foreground font-semibold">
                        Data Analyst
                      </h4>
                    </div>
                    <p className="text-footnote text-muted-foreground">
                      Advanced analytics, BigQuery access, chart creation, and automated reporting
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {['BigQuery', 'Charts', 'Reports', 'KPIs'].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary text-caption-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('general_employee')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      selectedRole === 'general_employee'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/20 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-accent" />
                      </div>
                      <h4 className="text-headline text-foreground font-semibold">
                        General Employee
                      </h4>
                    </div>
                    <p className="text-footnote text-muted-foreground">
                      Notion integration, Slack assistance, personal watchdog, and workplace Q&A
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {['Notion', 'Slack', 'Watchdog', 'Q&A'].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-accent/10 text-accent text-caption-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!selectedRole}
                    className="px-6"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Agent Preferences */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-title-3 text-foreground font-semibold mb-2">
                    Agent Preferences
                  </h3>
                  <p className="text-muted-foreground text-callout">
                    Customize how your AI Agent responds
                  </p>
                </div>

                {/* Default Mode */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Preferred Response Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, defaultAgentMode: 'quick' }))}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        preferences.defaultAgentMode === 'quick'
                          ? 'border-primary bg-primary/10'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-footnote font-medium">Quick Mode</span>
                      </div>
                      <p className="text-caption-1 text-muted-foreground text-left">
                        Fast responses, 1-3 turns, under 30 seconds
                      </p>
                    </button>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, defaultAgentMode: 'deep' }))}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        preferences.defaultAgentMode === 'deep'
                          ? 'border-primary bg-primary/10'
                          : 'border-border/20 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Microscope className="w-4 h-4 text-accent" />
                        <span className="text-footnote font-medium">Deep Research</span>
                      </div>
                      <p className="text-caption-1 text-muted-foreground text-left">
                        Comprehensive analysis, 5-10 minutes
                      </p>
                    </button>
                  </div>
                </div>

                {/* Personality */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Assistant Personality
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'professional', label: 'Professional', desc: 'Formal and business-focused' },
                      { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
                      { value: 'concise', label: 'Concise', desc: 'Brief and to the point' },
                      { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePersonalityChange(option.value as AgentConfiguration['personality'])}
                        className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                          agentConfig.personality === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border/20 hover:border-primary/50'
                        }`}
                      >
                        <div className="text-footnote font-medium text-foreground">
                          {option.label}
                        </div>
                        <div className="text-caption-1 text-muted-foreground">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(1)}
                    variant="ghost"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="px-6"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Advanced Settings */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-title-3 text-foreground font-semibold mb-2">
                    Fine-tune Your Assistant
                  </h3>
                  <p className="text-muted-foreground text-callout">
                    Advanced settings for optimal performance
                  </p>
                </div>

                {/* Creativity Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-footnote font-medium text-foreground">
                      Response Creativity
                    </label>
                    <span className="text-caption-1 text-muted-foreground">
                      {getCreativityLabel(agentConfig.creativityLevel)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={agentConfig.creativityLevel}
                      onChange={(e) => handleCreativityChange(Number(e.target.value))}
                      className="w-full h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-caption-2 text-muted-foreground">
                      <span>Conservative</span>
                      <span>Very Creative</span>
                    </div>
                  </div>
                  <p className="text-caption-1 text-muted-foreground">
                    Higher creativity means more varied and innovative responses
                  </p>
                </div>

                {/* Response Length */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Response Detail Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'brief', label: 'Brief', desc: 'Short answers' },
                      { value: 'standard', label: 'Standard', desc: 'Balanced detail' },
                      { value: 'comprehensive', label: 'Detailed', desc: 'Full explanations' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleResponseLengthChange(option.value as AgentConfiguration['responseLength'])}
                        className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                          agentConfig.responseLength === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border/20 hover:border-primary/50'
                        }`}
                      >
                        <div className="text-footnote font-medium text-foreground">
                          {option.label}
                        </div>
                        <div className="text-caption-1 text-muted-foreground">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Working Hours (for notifications)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-caption-1 text-muted-foreground">Start Time</label>
                      <Input
                        type="time"
                        value={preferences.workingHours.start}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start: e.target.value }
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-caption-1 text-muted-foreground">End Time</label>
                      <Input
                        type="time"
                        value={preferences.workingHours.end}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end: e.target.value }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(2)}
                    variant="ghost"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="px-6"
                  >
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
