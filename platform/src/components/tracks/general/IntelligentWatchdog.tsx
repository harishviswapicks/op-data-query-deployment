"use client";

import { useState, useEffect } from "react";
import { SlackChannel, WatchdogRule, AlertCondition } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Bell, 
  Plus, 
  Settings, 
  Trash2, 
  Edit3,
  MessageSquare,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Filter,
  Search,
  Hash,
  AtSign,
  TrendingUp,
  Volume2,
  VolumeX,
  Pause,
  Play,
  X,
  Save
} from "lucide-react";

interface IntelligentWatchdogProps {
  channels: SlackChannel[];
  watchdogRules: WatchdogRule[];
  onRuleCreate: (rule: WatchdogRule) => void;
  onRuleUpdate: (rule: WatchdogRule) => void;
  onRuleDelete: (ruleId: string) => void;
  className?: string;
}

interface RuleBuilder {
  channelId: string;
  keywords: string[];
  alertConditions: AlertCondition[];
  isActive: boolean;
  cooldownPeriod: number;
  personalizedRules: Array<{
    type: 'user_specific' | 'topic_specific' | 'time_based';
    condition: string;
    action: 'notify' | 'summarize' | 'ignore';
    parameters: Record<string, any>;
  }>;
}

const alertTypes = [
  { type: 'keyword_match' as const, name: 'Keyword Match', icon: Search, description: 'Alert when specific keywords are mentioned' },
  { type: 'mention' as const, name: 'Mentions', icon: AtSign, description: 'Alert when you are mentioned' },
  { type: 'thread_activity' as const, name: 'Thread Activity', icon: MessageSquare, description: 'Alert on high activity in threads' },
  { type: 'sentiment_change' as const, name: 'Sentiment Change', icon: TrendingUp, description: 'Alert on negative sentiment shifts' }
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'text-muted-foreground', description: 'Background notifications' },
  { value: 'medium', label: 'Medium', color: 'text-warning', description: 'Standard notifications' },
  { value: 'high', label: 'High', color: 'text-destructive', description: 'Important notifications' },
  { value: 'urgent', label: 'Urgent', color: 'text-accent', description: 'Immediate notifications' }
];

export default function IntelligentWatchdog({ 
  channels, 
  watchdogRules, 
  onRuleCreate, 
  onRuleUpdate, 
  onRuleDelete,
  className = "" 
}: IntelligentWatchdogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WatchdogRule | null>(null);
  const [ruleBuilder, setRuleBuilder] = useState<RuleBuilder>({
    channelId: '',
    keywords: [],
    alertConditions: [],
    isActive: true,
    cooldownPeriod: 30,
    personalizedRules: []
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = watchdogRules.filter(rule => {
    if (!searchQuery) return true;
    const channel = channels.find(c => c.id === rule.channelId);
    return (
      channel?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const activeRulesCount = watchdogRules.filter(rule => rule.isActive).length;
  const totalChannelsMonitored = new Set(watchdogRules.map(rule => rule.channelId)).size;

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleBuilder({
      channelId: '',
      keywords: [],
      alertConditions: [],
      isActive: true,
      cooldownPeriod: 30,
      personalizedRules: []
    });
    setIsOpen(true);
  };

  const handleEditRule = (rule: WatchdogRule) => {
    setEditingRule(rule);
    setRuleBuilder({
      channelId: rule.channelId,
      keywords: rule.keywords,
      alertConditions: rule.alertConditions,
      isActive: rule.isActive,
      cooldownPeriod: rule.cooldownPeriod,
      personalizedRules: rule.personalizedRules
    });
    setIsOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleBuilder.channelId) return;

    const rule: WatchdogRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      channelId: ruleBuilder.channelId,
      keywords: ruleBuilder.keywords,
      alertConditions: ruleBuilder.alertConditions,
      isActive: ruleBuilder.isActive,
      personalizedRules: ruleBuilder.personalizedRules,
      cooldownPeriod: ruleBuilder.cooldownPeriod
    };

    if (editingRule) {
      onRuleUpdate(rule);
    } else {
      onRuleCreate(rule);
    }

    setIsOpen(false);
    setEditingRule(null);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !ruleBuilder.keywords.includes(newKeyword.trim())) {
      setRuleBuilder(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setRuleBuilder(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addAlertCondition = (type: AlertCondition['type']) => {
    const newCondition: AlertCondition = {
      type,
      priority: 'medium',
      threshold: type === 'thread_activity' ? 10 : undefined,
      timeWindow: type === 'sentiment_change' ? 60 : undefined
    };

    setRuleBuilder(prev => ({
      ...prev,
      alertConditions: [...prev.alertConditions, newCondition]
    }));
  };

  const updateAlertCondition = (index: number, updates: Partial<AlertCondition>) => {
    setRuleBuilder(prev => ({
      ...prev,
      alertConditions: prev.alertConditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeAlertCondition = (index: number) => {
    setRuleBuilder(prev => ({
      ...prev,
      alertConditions: prev.alertConditions.filter((_, i) => i !== index)
    }));
  };

  const toggleRuleActive = (ruleId: string) => {
    const rule = watchdogRules.find(r => r.id === ruleId);
    if (rule) {
      onRuleUpdate({ ...rule, isActive: !rule.isActive });
    }
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? `#${channel.name}` : 'Unknown Channel';
  };

  const getPriorityColor = (priority: string) => {
    const level = priorityLevels.find(p => p.value === priority);
    return level?.color || 'text-muted-foreground';
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${Math.floor(diffHours / 24)}d ago`;
    }
  };

  return (
    <div className={`bg-background/50 backdrop-blur-xl border border-border/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <h3 className="text-subheadline font-semibold text-foreground">
              Intelligent Watchdog
            </h3>
          </div>
          <Button
            onClick={handleCreateRule}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Rule
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/10 rounded-lg">
            <div className="text-title-3 font-semibold text-foreground">{activeRulesCount}</div>
            <div className="text-caption-2 text-muted-foreground">Active Rules</div>
          </div>
          <div className="text-center p-3 bg-muted/10 rounded-lg">
            <div className="text-title-3 font-semibold text-foreground">{totalChannelsMonitored}</div>
            <div className="text-caption-2 text-muted-foreground">Channels</div>
          </div>
          <div className="text-center p-3 bg-muted/10 rounded-lg">
            <div className="text-title-3 font-semibold text-accent">AI</div>
            <div className="text-caption-2 text-muted-foreground">Powered</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules..."
            className="pl-10 bg-muted/20 border-border/20"
          />
        </div>
      </div>

      {/* Rules List */}
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-footnote text-muted-foreground">
                {searchQuery ? "No rules match your search" : "No watchdog rules configured"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={handleCreateRule}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Create your first rule
                </Button>
              )}
            </div>
          ) : (
            filteredRules.map((rule) => {
              const channel = channels.find(c => c.id === rule.channelId);
              return (
                <Card
                  key={rule.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    rule.isActive
                      ? 'border-border/20 bg-muted/5'
                      : 'border-border/10 bg-muted/20 opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Rule Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="text-footnote font-semibold text-foreground">
                            {getChannelName(rule.channelId)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            rule.isActive ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
                          }`} />
                        </div>
                        
                        {/* Keywords */}
                        {rule.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {rule.keywords.slice(0, 3).map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary text-caption-2 rounded-md"
                              >
                                {keyword}
                              </span>
                            ))}
                            {rule.keywords.length > 3 && (
                              <span className="px-2 py-1 bg-muted/20 text-muted-foreground text-caption-2 rounded-md">
                                +{rule.keywords.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Alert Conditions */}
                        <div className="flex items-center gap-2 text-caption-2 text-muted-foreground">
                          <Bell className="w-3 h-3" />
                          <span>{rule.alertConditions.length} alert condition{rule.alertConditions.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{rule.cooldownPeriod}m cooldown</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleRuleActive(rule.id)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                        >
                          {rule.isActive ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleEditRule(rule)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          title="Edit rule"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => onRuleDelete(rule.id)}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Channel Info */}
                    {channel && (
                      <div className="flex items-center justify-between pt-3 border-t border-border/10">
                        <div className="flex items-center gap-2 text-caption-2 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{channel.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-1 text-caption-2 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Last activity {formatLastActivity(channel.lastActivity)}</span>
                        </div>
                      </div>
                    )}

                    {/* Alert Conditions Preview */}
                    {rule.alertConditions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/10">
                        <div className="flex flex-wrap gap-2">
                          {rule.alertConditions.map((condition, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-caption-2 ${
                                condition.priority === 'urgent' ? 'bg-accent/10 text-accent' :
                                condition.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                                condition.priority === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-muted/20 text-muted-foreground'
                              }`}
                            >
                              {condition.type === 'keyword_match' && <Search className="w-3 h-3" />}
                              {condition.type === 'mention' && <AtSign className="w-3 h-3" />}
                              {condition.type === 'thread_activity' && <MessageSquare className="w-3 h-3" />}
                              {condition.type === 'sentiment_change' && <TrendingUp className="w-3 h-3" />}
                              <span className="capitalize">
                                {condition.type.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Rule Builder Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Card className="bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-title-2 text-foreground">
                        {editingRule ? 'Edit Watchdog Rule' : 'Create Watchdog Rule'}
                      </CardTitle>
                      <p className="text-footnote text-muted-foreground mt-1">
                        Set up intelligent monitoring for Slack channels
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Channel Selection */}
                <div className="space-y-2">
                  <label className="text-footnote font-medium text-foreground">
                    Channel
                  </label>
                  <select
                    value={ruleBuilder.channelId}
                    onChange={(e) => setRuleBuilder(prev => ({ ...prev, channelId: e.target.value }))}
                    className="w-full p-3 bg-muted/20 border border-border/20 rounded-lg text-footnote"
                  >
                    <option value="">Select a channel...</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name} ({channel.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keywords */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Keywords to Monitor
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      placeholder="Add keyword..."
                      className="flex-1 bg-muted/20 border-border/20"
                    />
                    <Button
                      onClick={addKeyword}
                      disabled={!newKeyword.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {ruleBuilder.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ruleBuilder.keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg"
                        >
                          <span className="text-footnote">{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="text-primary/70 hover:text-primary"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alert Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-footnote font-medium text-foreground">
                      Alert Conditions
                    </label>
                  </div>

                  {/* Add Alert Condition Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {alertTypes.map((alertType) => {
                      const IconComponent = alertType.icon;
                      const hasCondition = ruleBuilder.alertConditions.some(c => c.type === alertType.type);
                      
                      return (
                        <button
                          key={alertType.type}
                          onClick={() => !hasCondition && addAlertCondition(alertType.type)}
                          disabled={hasCondition}
                          className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                            hasCondition
                              ? 'border-primary bg-primary/10 opacity-50 cursor-not-allowed'
                              : 'border-border/20 hover:border-primary/50 bg-muted/10 hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className="w-4 h-4 text-primary" />
                            <span className="text-footnote font-medium text-foreground">
                              {alertType.name}
                            </span>
                          </div>
                          <p className="text-caption-1 text-muted-foreground">
                            {alertType.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Configured Alert Conditions */}
                  {ruleBuilder.alertConditions.map((condition, index) => (
                    <div key={index} className="p-4 bg-muted/10 rounded-lg border border-border/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-footnote font-medium text-foreground capitalize">
                          {condition.type.replace('_', ' ')}
                        </h4>
                        <Button
                          onClick={() => removeAlertCondition(index)}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-destructive hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-caption-1 text-muted-foreground">Priority</label>
                          <select
                            value={condition.priority}
                            onChange={(e) => updateAlertCondition(index, { priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                            className="w-full p-2 bg-background border border-border/20 rounded text-footnote"
                          >
                            {priorityLevels.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(condition.type === 'thread_activity' || condition.type === 'sentiment_change') && (
                          <div className="space-y-2">
                            <label className="text-caption-1 text-muted-foreground">
                              {condition.type === 'thread_activity' ? 'Message Threshold' : 'Time Window (min)'}
                            </label>
                            <Input
                              type="number"
                              value={condition.threshold || condition.timeWindow || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (condition.type === 'thread_activity') {
                                  updateAlertCondition(index, { threshold: value });
                                } else {
                                  updateAlertCondition(index, { timeWindow: value });
                                }
                              }}
                              className="bg-background border-border/20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-footnote font-medium text-foreground">
                      Cooldown Period (minutes)
                    </label>
                    <Input
                      type="number"
                      value={ruleBuilder.cooldownPeriod}
                      onChange={(e) => setRuleBuilder(prev => ({ 
                        ...prev, 
                        cooldownPeriod: parseInt(e.target.value) || 30 
                      }))}
                      className="bg-muted/20 border-border/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-footnote font-medium text-foreground">
                      Status
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => setRuleBuilder(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          ruleBuilder.isActive
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        {ruleBuilder.isActive ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                        <span className="text-footnote">
                          {ruleBuilder.isActive ? 'Active' : 'Paused'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-border/10">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRule}
                    disabled={!ruleBuilder.channelId || ruleBuilder.alertConditions.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
