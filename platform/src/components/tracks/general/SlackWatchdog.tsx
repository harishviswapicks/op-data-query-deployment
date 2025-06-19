"use client";

import { useState } from "react";
import { SlackChannel, WatchdogRule, AlertCondition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, 
  Plus, 
  Trash2, 
  Settings, 
  Bell, 
  MessageSquare, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Hash
} from "lucide-react";

interface SlackWatchdogProps {
  channels?: SlackChannel[];
  onRuleCreate?: (rule: WatchdogRule) => void;
  onRuleUpdate?: (id: string, rule: WatchdogRule) => void;
  onRuleDelete?: (id: string) => void;
  className?: string;
}

export default function SlackWatchdog({ 
  channels = [],
  onRuleCreate, 
  onRuleUpdate, 
  onRuleDelete,
  className = ""
}: SlackWatchdogProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    channelId: '',
    keywords: [''],
    priority: 'medium' as AlertCondition['priority'],
    cooldownPeriod: 30
  });

  // Mock channels if none provided
  const [mockChannels] = useState<SlackChannel[]>([
    {
      id: "general",
      name: "general",
      isPrivate: false,
      memberCount: 245,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      watchdogEnabled: true
    },
    {
      id: "engineering",
      name: "engineering",
      isPrivate: false,
      memberCount: 42,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      watchdogEnabled: true
    },
    {
      id: "product",
      name: "product",
      isPrivate: false,
      memberCount: 18,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      watchdogEnabled: false
    },
    {
      id: "support",
      name: "customer-support",
      isPrivate: false,
      memberCount: 12,
      lastActivity: new Date(Date.now() - 45 * 60 * 1000),
      watchdogEnabled: true
    }
  ]);

  const activeChannels = channels.length > 0 ? channels : mockChannels;

  // Mock watchdog rules
  const [watchdogRules, setWatchdogRules] = useState<WatchdogRule[]>([
    {
      id: "rule1",
      channelId: "engineering",
      keywords: ["deployment", "release", "production"],
      alertConditions: [
        {
          type: "keyword_match",
          priority: "high",
          timeWindow: 60
        }
      ],
      isActive: true,
      personalizedRules: [],
      cooldownPeriod: 30
    },
    {
      id: "rule2",
      channelId: "general",
      keywords: ["meeting", "all-hands", "announcement"],
      alertConditions: [
        {
          type: "keyword_match",
          priority: "medium",
          timeWindow: 120
        }
      ],
      isActive: true,
      personalizedRules: [],
      cooldownPeriod: 60
    },
    {
      id: "rule3",
      channelId: "support",
      keywords: ["urgent", "critical", "down"],
      alertConditions: [
        {
          type: "keyword_match",
          priority: "urgent",
          timeWindow: 30
        }
      ],
      isActive: false,
      personalizedRules: [],
      cooldownPeriod: 15
    }
  ]);

  const handleCreateRule = () => {
    if (!formData.channelId || formData.keywords.filter(k => k.trim()).length === 0) return;

    const newRule: WatchdogRule = {
      id: `rule_${Date.now()}`,
      channelId: formData.channelId,
      keywords: formData.keywords.filter(k => k.trim()),
      alertConditions: [
        {
          type: "keyword_match",
          priority: formData.priority,
          timeWindow: 60
        }
      ],
      isActive: true,
      personalizedRules: [],
      cooldownPeriod: formData.cooldownPeriod
    };

    setWatchdogRules(prev => [...prev, newRule]);
    onRuleCreate?.(newRule);
    setShowCreateForm(false);
    setFormData({
      channelId: '',
      keywords: [''],
      priority: 'medium',
      cooldownPeriod: 30
    });
  };

  const toggleRule = (id: string) => {
    setWatchdogRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteRule = (id: string) => {
    setWatchdogRules(prev => prev.filter(rule => rule.id !== id));
    onRuleDelete?.(id);
  };

  const addKeyword = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, '']
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) => i === index ? value : keyword)
    }));
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const getChannelName = (channelId: string) => {
    const channel = activeChannels.find(ch => ch.id === channelId);
    return channel ? `#${channel.name}` : channelId;
  };

  const getPriorityColor = (priority: AlertCondition['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBg = (priority: AlertCondition['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10';
      case 'high': return 'bg-warning/10';
      case 'medium': return 'bg-primary/10';
      case 'low': return 'bg-muted/20';
      default: return 'bg-muted/20';
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  return (
    <div className={`bg-background ${className}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-3 text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Slack Watchdog
              </CardTitle>
              <p className="text-caption-1 text-muted-foreground mt-1">
                Monitor channels and get personalized alerts
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Create Rule Form */}
          {showCreateForm && (
            <div className="p-4 bg-muted/20 rounded-lg border border-border/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-footnote font-medium text-foreground">Create Watchdog Rule</h4>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Channel Selection */}
                <div>
                  <label className="text-caption-1 text-muted-foreground">Channel</label>
                  <select
                    value={formData.channelId}
                    onChange={(e) => setFormData(prev => ({ ...prev, channelId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                  >
                    <option value="">Select a channel</option>
                    {activeChannels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name} ({channel.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-caption-1 text-muted-foreground">Keywords to Watch</label>
                    <Button
                      onClick={addKeyword}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={keyword}
                          onChange={(e) => updateKeyword(index, e.target.value)}
                          placeholder="Enter keyword or phrase"
                          className="flex-1"
                        />
                        {formData.keywords.length > 1 && (
                          <Button
                            onClick={() => removeKeyword(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority & Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as AlertCondition['priority'] }))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Cooldown (minutes)</label>
                    <Input
                      type="number"
                      value={formData.cooldownPeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, cooldownPeriod: Number(e.target.value) }))}
                      min="5"
                      max="1440"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/10">
                  <Button
                    onClick={handleCreateRule}
                    disabled={!formData.channelId || formData.keywords.filter(k => k.trim()).length === 0}
                  >
                    Create Rule
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Rules */}
          <div className="space-y-4">
            <h4 className="text-footnote font-medium text-foreground">Active Rules</h4>
            {watchdogRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 bg-muted/10 rounded-lg border border-border/10 hover:bg-muted/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-footnote font-medium text-foreground">
                          {getChannelName(rule.channelId)}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        rule.isActive ? 'bg-accent' : 'bg-muted-foreground/50'
                      }`} />
                      <span className={`text-caption-2 ${
                        rule.isActive ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {rule.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent/10 text-accent text-caption-2 rounded-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-caption-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-3 h-3 ${getPriorityColor(rule.alertConditions[0]?.priority || 'medium')}`} />
                        <span className={getPriorityColor(rule.alertConditions[0]?.priority || 'medium')}>
                          {rule.alertConditions[0]?.priority || 'medium'} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{rule.cooldownPeriod}m cooldown</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleRule(rule.id)}
                      variant="outline"
                      size="sm"
                      title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                    >
                      {rule.isActive ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Edit rule"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteRule(rule.id)}
                      variant="outline"
                      size="sm"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {watchdogRules.length === 0 && !showCreateForm && (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-title-3 text-foreground font-semibold mb-2">
                  No Watchdog Rules
                </h3>
                <p className="text-muted-foreground text-callout mb-4">
                  Create your first rule to start monitoring Slack channels
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Rule
                </Button>
              </div>
            )}
          </div>

          {/* Channel Overview */}
          <div className="space-y-4">
            <h4 className="text-footnote font-medium text-foreground">Channel Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="p-3 rounded-lg bg-muted/10 border border-border/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span className="text-footnote font-medium text-foreground">
                        {channel.name}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      channel.watchdogEnabled ? 'bg-accent animate-pulse' : 'bg-muted-foreground/50'
                    }`} />
                  </div>
                  
                  <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{channel.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastActivity(channel.lastActivity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {watchdogRules.length > 0 && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/10">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-foreground">
                  {watchdogRules.length}
                </div>
                <div className="text-caption-2 text-muted-foreground">Total Rules</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-accent">
                  {watchdogRules.filter(r => r.isActive).length}
                </div>
                <div className="text-caption-2 text-muted-foreground">Active</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-foreground">
                  {activeChannels.filter(ch => ch.watchdogEnabled).length}
                </div>
                <div className="text-caption-2 text-muted-foreground">Monitored</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-foreground">
                  {watchdogRules.reduce((sum, r) => sum + r.keywords.length, 0)}
                </div>
                <div className="text-caption-2 text-muted-foreground">Keywords</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
