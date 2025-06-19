"use client";

import { useState } from "react";
import { ScheduledReport, ScheduleFrequency, NotificationRecipient } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Check,
  X
} from "lucide-react";

interface SchedulingPanelProps {
  onScheduleCreate?: (schedule: ScheduledReport) => void;
  onScheduleUpdate?: (id: string, schedule: ScheduledReport) => void;
  onScheduleDelete?: (id: string) => void;
  className?: string;
}

export default function SchedulingPanel({ 
  onScheduleCreate, 
  onScheduleUpdate, 
  onScheduleDelete,
  className = ""
}: SchedulingPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as ScheduleFrequency['type'],
    time: '09:00',
    timezone: 'America/New_York',
    recipients: [] as NotificationRecipient[]
  });

  // Mock existing schedules
  const [schedules, setSchedules] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily KPI Report',
      description: 'Executive dashboard with key performance indicators',
      frequency: {
        type: 'daily',
        time: '09:00',
        timezone: 'America/New_York'
      },
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      enabled: true,
      recipients: [
        { type: 'slack_channel', address: '#executives', name: 'Executives Channel' },
        { type: 'email', address: 'ceo@company.com', name: 'CEO' }
      ],
      template: {
        id: 'kpi-template',
        name: 'KPI Dashboard',
        sections: [],
        format: 'markdown'
      }
    },
    {
      id: '2',
      name: 'Weekly User Growth Analysis',
      description: 'Comprehensive user acquisition and retention metrics',
      frequency: {
        type: 'weekly',
        dayOfWeek: 1, // Monday
        time: '10:00',
        timezone: 'America/New_York'
      },
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      enabled: false,
      recipients: [
        { type: 'slack_channel', address: '#growth-team', name: 'Growth Team' }
      ],
      template: {
        id: 'growth-template',
        name: 'Growth Analysis',
        sections: [],
        format: 'html'
      }
    }
  ]);

  const handleCreateSchedule = () => {
    const newSchedule: ScheduledReport = {
      id: `schedule_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      frequency: {
        type: formData.frequency,
        time: formData.time,
        timezone: formData.timezone
      },
      nextRun: calculateNextRun(formData.frequency, formData.time),
      enabled: true,
      recipients: formData.recipients,
      template: {
        id: 'default-template',
        name: 'Default Report',
        sections: [],
        format: 'markdown'
      }
    };

    setSchedules(prev => [...prev, newSchedule]);
    onScheduleCreate?.(newSchedule);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      time: '09:00',
      timezone: 'America/New_York',
      recipients: []
    });
  };

  const calculateNextRun = (frequency: string, time: string): Date => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay() + 1) % 7);
    }

    return nextRun;
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    ));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    onScheduleDelete?.(id);
  };

  const addRecipient = (type: NotificationRecipient['type']) => {
    const newRecipient: NotificationRecipient = {
      type,
      address: type === 'slack_channel' ? '#' : '',
      name: ''
    };
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, newRecipient]
    }));
  };

  const updateRecipient = (index: number, field: keyof NotificationRecipient, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
  };

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const getRecipientIcon = (type: NotificationRecipient['type']) => {
    switch (type) {
      case 'slack_channel':
      case 'slack_dm':
        return MessageSquare;
      case 'email':
        return Mail;
      default:
        return Bell;
    }
  };

  const formatNextRun = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `in ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays}d`;
    }
  };

  return (
    <div className={`bg-background ${className}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-3 text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Reports
              </CardTitle>
              <p className="text-caption-1 text-muted-foreground mt-1">
                Automate your data analysis and reporting
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Create Schedule Form */}
          {showCreateForm && (
            <div className="p-4 bg-muted/20 rounded-lg border border-border/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-footnote font-medium text-foreground">Create New Schedule</h4>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Report Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Daily KPI Report"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the report"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Frequency & Time */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as ScheduleFrequency['type'] }))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Time</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-caption-1 text-muted-foreground">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>

                {/* Recipients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-caption-1 text-muted-foreground">Recipients</label>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => addRecipient('slack_channel')}
                        variant="outline"
                        size="sm"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Slack
                      </Button>
                      <Button
                        onClick={() => addRecipient('email')}
                        variant="outline"
                        size="sm"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.recipients.map((recipient, index) => {
                      const IconComponent = getRecipientIcon(recipient.type);
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background rounded-md border border-border/20">
                          <IconComponent className="w-4 h-4 text-muted-foreground" />
                          <Input
                            value={recipient.address}
                            onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                            placeholder={recipient.type === 'slack_channel' ? '#channel-name' : 'email@company.com'}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => removeRecipient(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/10">
                  <Button
                    onClick={handleCreateSchedule}
                    disabled={!formData.name || !formData.recipients.length}
                  >
                    Create Schedule
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

          {/* Existing Schedules */}
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 bg-muted/10 rounded-lg border border-border/10 hover:bg-muted/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-footnote font-medium text-foreground">
                        {schedule.name}
                      </h4>
                      <div className={`w-2 h-2 rounded-full ${
                        schedule.enabled ? 'bg-accent' : 'bg-muted-foreground/50'
                      }`} />
                      <span className={`text-caption-2 ${
                        schedule.enabled ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    
                    <p className="text-caption-1 text-muted-foreground mb-3">
                      {schedule.description}
                    </p>

                    <div className="flex items-center gap-4 text-caption-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {schedule.frequency.type} at {schedule.frequency.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Next run {formatNextRun(schedule.nextRun)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Recipients */}
                    <div className="flex items-center gap-2 mt-3">
                      {schedule.recipients.map((recipient, index) => {
                        const IconComponent = getRecipientIcon(recipient.type);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-background rounded-md border border-border/20"
                          >
                            <IconComponent className="w-3 h-3 text-muted-foreground" />
                            <span className="text-caption-2 text-foreground">
                              {recipient.address}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleSchedule(schedule.id)}
                      variant="outline"
                      size="sm"
                      title={schedule.enabled ? 'Pause schedule' : 'Resume schedule'}
                    >
                      {schedule.enabled ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Edit schedule"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteSchedule(schedule.id)}
                      variant="outline"
                      size="sm"
                      title="Delete schedule"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {schedules.length === 0 && !showCreateForm && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-title-3 text-foreground font-semibold mb-2">
                  No Scheduled Reports
                </h3>
                <p className="text-muted-foreground text-callout mb-4">
                  Create your first automated report to get started
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Schedule
                </Button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {schedules.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/10">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-foreground">
                  {schedules.length}
                </div>
                <div className="text-caption-2 text-muted-foreground">Total Schedules</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-accent">
                  {schedules.filter(s => s.enabled).length}
                </div>
                <div className="text-caption-2 text-muted-foreground">Active</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-footnote font-medium text-foreground">
                  {schedules.reduce((sum, s) => sum + s.recipients.length, 0)}
                </div>
                <div className="text-caption-2 text-muted-foreground">Recipients</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
