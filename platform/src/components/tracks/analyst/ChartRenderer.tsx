"use client";

import { useState } from "react";
import { ChartConfig, ChartData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Download, 
  Settings, 
  Maximize2,
  Copy,
  Share
} from "lucide-react";

interface ChartRendererProps {
  chartData?: ChartData;
  config?: ChartConfig;
  onConfigChange?: (config: ChartConfig) => void;
  className?: string;
}

export default function ChartRenderer({ 
  chartData, 
  config, 
  onConfigChange,
  className = ""
}: ChartRendererProps) {
  const [selectedChartType, setSelectedChartType] = useState<string>(chartData?.type || 'bar');
  const [showSettings, setShowSettings] = useState(false);

  // Mock chart data for demo
  const mockData = chartData?.data || [
    { name: 'Jan', value: 400, category: 'Revenue' },
    { name: 'Feb', value: 300, category: 'Revenue' },
    { name: 'Mar', value: 600, category: 'Revenue' },
    { name: 'Apr', value: 800, category: 'Revenue' },
    { name: 'May', value: 500, category: 'Revenue' },
    { name: 'Jun', value: 900, category: 'Revenue' }
  ];

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
    { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
    { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
    { id: 'scatter', name: 'Scatter Plot', icon: TrendingUp, description: 'Show relationships between variables' }
  ];

  const renderMockChart = () => {
    const maxValue = Math.max(...mockData.map(d => d.value));
    
    switch (selectedChartType) {
      case 'bar':
        return (
          <div className="space-y-3">
            {mockData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-caption-1 text-muted-foreground">
                  {item.name}
                </div>
                <div className="flex-1 bg-muted/20 rounded-full h-6 relative overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-caption-1 font-medium text-foreground">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'line':
        return (
          <div className="relative h-48 flex items-end justify-between px-4 py-4 bg-muted/10 rounded-lg">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
              <polyline
                fill="none"
                stroke="rgb(0, 122, 255)"
                strokeWidth="2"
                points={mockData.map((item, index) => 
                  `${(index / (mockData.length - 1)) * 280 + 10},${190 - (item.value / maxValue) * 160}`
                ).join(' ')}
              />
              {mockData.map((item, index) => (
                <circle
                  key={index}
                  cx={(index / (mockData.length - 1)) * 280 + 10}
                  cy={190 - (item.value / maxValue) * 160}
                  r="3"
                  fill="rgb(0, 122, 255)"
                />
              ))}
            </svg>
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4">
              {mockData.map((item, index) => (
                <span key={index} className="text-caption-2 text-muted-foreground">
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        );
      
      case 'pie':
        const total = mockData.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        return (
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {mockData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = currentAngle;
                  currentAngle += angle;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                  const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M 50 50`,
                    `L ${x1} ${y1}`,
                    `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  const colors = ['rgb(0, 122, 255)', 'rgb(48, 209, 88)', 'rgb(255, 159, 10)', 'rgb(191, 90, 242)', 'rgb(255, 45, 85)', 'rgb(100, 210, 255)'];
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colors[index % colors.length]}
                      opacity={0.8}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-title-3 font-semibold text-foreground">{total}</div>
                  <div className="text-caption-1 text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
            <div className="ml-6 space-y-2">
              {mockData.map((item, index) => {
                const colors = ['rgb(0, 122, 255)', 'rgb(48, 209, 88)', 'rgb(255, 159, 10)', 'rgb(191, 90, 242)', 'rgb(255, 45, 85)', 'rgb(100, 210, 255)'];
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-caption-1 text-foreground">{item.name}</span>
                    <span className="text-caption-1 text-muted-foreground">({item.value})</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'scatter':
        return (
          <div className="relative h-48 bg-muted/10 rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 300 200">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 20" fill="none" stroke="rgb(84, 84, 88)" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Data points */}
              {mockData.map((item, index) => (
                <circle
                  key={index}
                  cx={(index / (mockData.length - 1)) * 280 + 10}
                  cy={190 - (item.value / maxValue) * 160}
                  r="4"
                  fill="rgb(0, 122, 255)"
                  opacity="0.7"
                />
              ))}
            </svg>
          </div>
        );
      
      default:
        return <div className="text-center text-muted-foreground">Chart type not supported</div>;
    }
  };

  return (
    <div className={`bg-background ${className}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-3 text-foreground">
                {chartData?.title || 'Chart Visualization'}
              </CardTitle>
              <p className="text-caption-1 text-muted-foreground mt-1">
                Interactive data visualization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {chartTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedChartType(type.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 whitespace-nowrap ${
                    selectedChartType === type.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/20 hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                  title={type.description}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-footnote font-medium">{type.name}</span>
                </button>
              );
            })}
          </div>

          {/* Chart Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-muted/20 rounded-lg border border-border/10">
              <h4 className="text-footnote font-medium text-foreground mb-3">Chart Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-caption-1 text-muted-foreground">Title</label>
                  <input
                    type="text"
                    defaultValue={chartData?.title || 'Chart Title'}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                  />
                </div>
                <div>
                  <label className="text-caption-1 text-muted-foreground">X-Axis Label</label>
                  <input
                    type="text"
                    defaultValue="Categories"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                  />
                </div>
                <div>
                  <label className="text-caption-1 text-muted-foreground">Y-Axis Label</label>
                  <input
                    type="text"
                    defaultValue="Values"
                    className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote"
                  />
                </div>
                <div>
                  <label className="text-caption-1 text-muted-foreground">Color Scheme</label>
                  <select className="w-full mt-1 px-3 py-2 bg-background border border-border/20 rounded-md text-footnote">
                    <option>Default</option>
                    <option>Blue</option>
                    <option>Green</option>
                    <option>Purple</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Chart Visualization */}
          <div className="min-h-[200px] p-4 bg-muted/5 rounded-lg border border-border/10">
            {renderMockChart()}
          </div>

          {/* Chart Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {mockData.length}
              </div>
              <div className="text-caption-2 text-muted-foreground">Data Points</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {Math.max(...mockData.map(d => d.value))}
              </div>
              <div className="text-caption-2 text-muted-foreground">Max Value</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {Math.round(mockData.reduce((sum, d) => sum + d.value, 0) / mockData.length)}
              </div>
              <div className="text-caption-2 text-muted-foreground">Average</div>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {mockData.reduce((sum, d) => sum + d.value, 0)}
              </div>
              <div className="text-caption-2 text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/10">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Copy className="w-3 h-3" />
              Copy Chart
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-3 h-3" />
              Export PNG
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-3 h-3" />
              Export SVG
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share className="w-3 h-3" />
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
