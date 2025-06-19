"use client";

import { useState, useEffect } from "react";
import { UserProfile, UIState } from "@/types";
import { useAuth } from "./auth/AuthProvider";
import AnalystTrack from "./tracks/analyst/AnalystTrack";
import GeneralEmployeeTrack from "./tracks/general/GeneralEmployeeTrack";
import UserProfileSetup from "./common/UserProfileSetup";
import AgentPersonalityConfig from "./common/AgentPersonalityConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings, Bell, Zap, Microscope } from "lucide-react";
import Image from "next/image";

export default function TrackRouter() {
  const { user: userProfile, logout } = useAuth();
  const [uiState, setUIState] = useState<UIState>({
    currentTrack: 'analyst',
    agentMode: 'quick',
    selectedDataSources: [],
    showSettings: false,
    showScheduleModal: false,
    showAgentConfig: false,
    activeResearchJobs: [],
    notifications: []
  });
  const [showAgentConfig, setShowAgentConfig] = useState(false);

  // Initialize UI state from user profile
  useEffect(() => {
    if (userProfile) {
      setUIState(prev => ({
        ...prev,
        currentTrack: userProfile.role,
        agentMode: userProfile.preferences.defaultAgentMode
      }));
    }
  }, [userProfile]);

  const handleTrackSwitch = async (track: 'analyst' | 'general_employee') => {
    setUIState(prev => ({ ...prev, currentTrack: track }));
    
    // Update in database
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { ...userProfile?.preferences }
        }),
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAgentModeSwitch = async (mode: 'quick' | 'deep') => {
    setUIState(prev => ({ ...prev, agentMode: mode }));
    
    if (userProfile) {
      const updatedPreferences = {
        ...userProfile.preferences,
        defaultAgentMode: mode
      };
      
      // Update in database
      try {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: updatedPreferences
          }),
        });
      } catch (error) {
        console.error('Failed to update preferences:', error);
      }
    }
  };

  const handleAgentConfigUpdate = async (config: any) => {
    // Update in database
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentConfig: config
        }),
      });
    } catch (error) {
      console.error('Failed to update agent config:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Show loading state if no user profile yet
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Enhanced Header with Track Switching */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Image
                src="/prizepicks.svg"
                alt="PrizePicks Logo"
                width={128}
                height={128}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-title-3 text-foreground font-semibold">
                  AI Data Platform
                </h1>
                <p className="text-footnote text-muted-foreground">
                  {uiState.currentTrack === 'analyst' ? 'Advanced Analytics & Insights' : 'Smart Workplace Assistant'}
                </p>
              </div>
            </div>

            {/* Track Switcher */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-muted/30 rounded-lg p-1">
                <Button
                  onClick={() => handleTrackSwitch('analyst')}
                  variant={uiState.currentTrack === 'analyst' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-footnote h-8 px-3 rounded-md"
                >
                  Analyst
                </Button>
                <Button
                  onClick={() => handleTrackSwitch('general_employee')}
                  variant={uiState.currentTrack === 'general_employee' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-footnote h-8 px-3 rounded-md"
                >
                  General
                </Button>
              </div>

              {/* Agent Mode Switcher */}
              <div className="flex items-center bg-muted/30 rounded-lg p-1">
                <Button
                  onClick={() => handleAgentModeSwitch('quick')}
                  variant={uiState.agentMode === 'quick' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-footnote h-8 px-3 rounded-md flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3" />
                  Quick
                </Button>
                <Button
                  onClick={() => handleAgentModeSwitch('deep')}
                  variant={uiState.agentMode === 'deep' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-footnote h-8 px-3 rounded-md flex items-center gap-1.5"
                >
                  <Microscope className="w-3 h-3" />
                  Deep
                </Button>
              </div>

              {/* User Section */}
              <div className="flex items-center gap-3">
                {uiState.notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setUIState(prev => ({ ...prev, showSettings: true }))}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
                  </Button>
                )}
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-footnote font-medium text-foreground">
                    {userProfile.email}
                  </span>
                </div>
                
                <Button
                  onClick={() => setShowAgentConfig(true)}
                  variant="ghost"
                  size="icon"
                  title="Configure AI Agents"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-footnote h-8 px-3"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Mode Indicator */}
      <div className="flex-shrink-0 bg-muted/20 border-b border-border/5">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {uiState.agentMode === 'quick' ? (
                <>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-footnote font-medium text-foreground">Quick Mode</span>
                  </div>
                  <span className="text-caption-1 text-muted-foreground">
                    Fast responses • 1-3 turns • &lt;30 seconds
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-accent" />
                    <span className="text-footnote font-medium text-foreground">Deep Research Mode</span>
                  </div>
                  <span className="text-caption-1 text-muted-foreground">
                    Comprehensive analysis • 5-10 minutes • Background processing
                  </span>
                </>
              )}
            </div>
            
            {uiState.activeResearchJobs.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-caption-1 text-muted-foreground">
                  {uiState.activeResearchJobs.length} research job{uiState.activeResearchJobs.length > 1 ? 's' : ''} running
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Route to appropriate track */}
      <div className="flex-1 overflow-hidden">
        {uiState.currentTrack === 'analyst' ? (
          <AnalystTrack
            userProfile={userProfile}
            uiState={uiState}
            onUIStateChange={setUIState}
          />
        ) : (
          <GeneralEmployeeTrack
            userProfile={userProfile}
            uiState={uiState}
            onUIStateChange={setUIState}
          />
        )}
      </div>

      {/* Agent Configuration Modal */}
      {showAgentConfig && userProfile && (
        <AgentPersonalityConfig
          userProfile={userProfile}
          onConfigUpdate={handleAgentConfigUpdate}
          onClose={() => setShowAgentConfig(false)}
        />
      )}
    </div>
  );
}
