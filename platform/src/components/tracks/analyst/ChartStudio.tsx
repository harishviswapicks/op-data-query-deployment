"use client";

import { useState, useEffect } from "react";
import { ChartTemplate, ChartConfig, BigQueryTable } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap,
  Table as TableIcon,
  TrendingUp,
  Plus,
  Save,
  Download,
  Share,
  Settings,
  Palette,
  Layers,
  Filter,
  X,
  Check,
  Eye,
  Copy,
  Sparkles
} from "lucide-react";

interface ChartStudioProps {
  selectedTable: BigQueryTable | null;
  onChartCreate: (chart: ChartTemplate) => void;
  onChartSave: (chart: ChartTemplate) => void;
  className?: string;
}

type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table';

interface ChartBuilder {
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  filters: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
}

const chartTypes = [
  { type: 'line' as const, name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { type: 'bar' as const, name: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { type: 'pie' as const, name: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { type: 'scatter' as const, name: 'Scatter Plot', icon: Zap, description: 'Show correlations' },
  { type: 'table' as const, name: 'Data Table', icon: TableIcon, description: 'Raw data view' },
  { type: 'heatmap' as const, name: 'Heatmap', icon: TrendingUp, description: 'Show intensity patterns' }
];

const aggregationOptions = [
  { value: 'sum', label: 'Sum', description: 'Total of all values' },
  { value: 'avg', label: 'Average', description: 'Mean of all values' },
  { value: 'count', label: 'Count', description: 'Number of records' },
  { value: 'max', label: 'Maximum', description: 'Highest value' },
  { value: 'min', label: 'Minimum', description: 'Lowest value' }
];

const colorPalettes = [
  { name: 'Default', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'] },
  { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#10b981', '#84cc16', '#eab308'] },
  { name: 'Sunset', colors: ['#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1'] },
  { name: 'Forest', colors: ['#16a34a', '#65a30d', '#ca8a04', '#dc2626', '#7c2d12'] },
  { name: 'Monochrome', colors: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'] }
];

export default function ChartStudio({ 
  selectedTable, 
  onChartCreate, 
  onChartSave,
  className = "" 
}: ChartStudioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'type' | 'config' | 'preview'>('type');
  const [chartBuilder, setChartBuilder] = useState<ChartBuilder>({
    type: 'bar',
    title: '',
    aggregation: 'sum',
    filters: [],
    colors: colorPalettes[0].colors,
    showLegend: true,
    showGrid: true
  });

  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedTable && chartBuilder.title === '') {
      setChartBuilder(prev => ({
        ...prev,
        title: `${selectedTable.name} Analysis`
      }));
    }
  }, [selectedTable]);

  const handleChartTypeSelect = (type: ChartType) => {
    setChartBuilder(prev => ({ ...prev, type }));
    setCurrentStep('config');
  };

  const handleFieldSelect = (field: 'xAxis' | 'yAxis' | 'groupBy', value: string) => {
    setChartBuilder(prev => ({ ...prev, [field]: value }));
  };

  const addFilter = () => {
    if (!selectedTable) return;
    
    setChartBuilder(prev => ({
      ...prev,
      filters: [...prev.filters, {
        field: selectedTable.schema[0]?.name || '',
        operator: 'equals',
        value: ''
      }]
    }));
  };

  const removeFilter = (index: number) => {
    setChartBuilder(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    setChartBuilder(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const generatePreviewData = () => {
    // Mock data generation based on chart configuration
    const mockData = [];
    const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
    const series = ['Revenue', 'Profit', 'Growth'];
    
    for (let i = 0; i < categories.length; i++) {
      const dataPoint: any = { category: categories[i] };
      series.forEach(s => {
        dataPoint[s] = Math.floor(Math.random() * 1000) + 100;
      });
      mockData.push(dataPoint);
    }
    
    setPreviewData(mockData);
    setCurrentStep('preview');
  };

  const handleSaveChart = () => {
    if (!selectedTable) return;

    const chartTemplate: ChartTemplate = {
      id: `chart_${Date.now()}`,
      name: chartBuilder.title,
      type: chartBuilder.type,
      config: {
        title: chartBuilder.title,
        xAxis: chartBuilder.xAxis,
        yAxis: chartBuilder.yAxis,
        groupBy: chartBuilder.groupBy,
        aggregation: chartBuilder.aggregation,
        filters: chartBuilder.filters.map(f => ({
          field: f.field,
          operator: f.operator as any,
          value: f.value
        }))
      },
      previewData,
      tags: [selectedTable.name, chartBuilder.type]
    };

    onChartSave(chartTemplate);
    setIsOpen(false);
    resetBuilder();
  };

  const resetBuilder = () => {
    setChartBuilder({
      type: 'bar',
      title: '',
      aggregation: 'sum',
      filters: [],
      colors: colorPalettes[0].colors,
      showLegend: true,
      showGrid: true
    });
    setCurrentStep('type');
    setPreviewData([]);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'type': return 'Choose Chart Type';
      case 'config': return 'Configure Chart';
      case 'preview': return 'Preview & Save';
      default: return 'Chart Studio';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!selectedTable}
        className={`flex items-center gap-2 ${className}`}
        variant="outline"
      >
        <Plus className="w-4 h-4" />
        Create Chart
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-title-2 text-foreground">
                    {getStepTitle()}
                  </CardTitle>
                  <p className="text-footnote text-muted-foreground mt-1">
                    {selectedTable ? `Creating chart from ${selectedTable.name}` : 'Select a table first'}
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

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mt-6">
              {['type', 'config', 'preview'].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-footnote font-medium transition-all duration-200 ${
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground' 
                      : index < ['type', 'config', 'preview'].indexOf(currentStep)
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < ['type', 'config', 'preview'].indexOf(currentStep) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-footnote capitalize ${
                    currentStep === step ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ${
                      index < ['type', 'config', 'preview'].indexOf(currentStep)
                        ? 'bg-accent'
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Chart Type Selection */}
            {currentStep === 'type' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {chartTypes.map((chart) => {
                    const IconComponent = chart.icon;
                    return (
                      <button
                        key={chart.type}
                        onClick={() => handleChartTypeSelect(chart.type)}
                        className={`p-6 rounded-lg border text-center transition-all duration-200 hover:scale-105 ${
                          chartBuilder.type === chart.type
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border/20 hover:border-primary/50 bg-muted/10'
                        }`}
                      >
                        <IconComponent className="w-8 h-8 mx-auto mb-3 text-primary" />
                        <h3 className="font-medium text-foreground mb-1">
                          {chart.name}
                        </h3>
                        <p className="text-caption-1 text-muted-foreground">
                          {chart.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Chart Configuration */}
            {currentStep === 'config' && (
              <div className="space-y-6">
                {/* Chart Title */}
                <div className="space-y-2">
                  <label className="text-footnote font-medium text-foreground">
                    Chart Title
                  </label>
                  <Input
                    value={chartBuilder.title}
                    onChange={(e) => setChartBuilder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chart title..."
                    className="bg-muted/20 border-border/20"
                  />
                </div>

                {/* Field Selection */}
                {selectedTable && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-footnote font-medium text-foreground">
                        X-Axis
                      </label>
                      <select
                        value={chartBuilder.xAxis || ''}
                        onChange={(e) => handleFieldSelect('xAxis', e.target.value)}
                        className="w-full p-2 bg-muted/20 border border-border/20 rounded-lg text-footnote"
                      >
                        <option value="">Select field...</option>
                        {selectedTable.schema.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name} ({column.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-footnote font-medium text-foreground">
                        Y-Axis
                      </label>
                      <select
                        value={chartBuilder.yAxis || ''}
                        onChange={(e) => handleFieldSelect('yAxis', e.target.value)}
                        className="w-full p-2 bg-muted/20 border border-border/20 rounded-lg text-footnote"
                      >
                        <option value="">Select field...</option>
                        {selectedTable.schema.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name} ({column.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-footnote font-medium text-foreground">
                        Aggregation
                      </label>
                      <select
                        value={chartBuilder.aggregation}
                        onChange={(e) => setChartBuilder(prev => ({ 
                          ...prev, 
                          aggregation: e.target.value as any 
                        }))}
                        className="w-full p-2 bg-muted/20 border border-border/20 rounded-lg text-footnote"
                      >
                        {aggregationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-footnote font-medium text-foreground">
                      Filters
                    </label>
                    <Button
                      onClick={addFilter}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Add Filter
                    </Button>
                  </div>

                  {chartBuilder.filters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg border border-border/10">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                        className="flex-1 p-2 bg-background border border-border/20 rounded text-footnote"
                      >
                        {selectedTable?.schema.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        className="p-2 bg-background border border-border/20 rounded text-footnote"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater than</option>
                        <option value="less_than">Less than</option>
                      </select>

                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Value..."
                        className="flex-1 bg-background border-border/20"
                      />

                      <Button
                        onClick={() => removeFilter(index)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Color Palette */}
                <div className="space-y-3">
                  <label className="text-footnote font-medium text-foreground">
                    Color Palette
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {colorPalettes.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => setChartBuilder(prev => ({ ...prev, colors: palette.colors }))}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          JSON.stringify(chartBuilder.colors) === JSON.stringify(palette.colors)
                            ? 'border-primary bg-primary/10'
                            : 'border-border/20 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          {palette.colors.slice(0, 3).map((color, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-caption-2 text-foreground">
                          {palette.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setCurrentStep('type')}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={generatePreviewData}
                    disabled={!chartBuilder.title || !chartBuilder.xAxis}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Chart
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 'preview' && (
              <div className="space-y-6">
                {/* Chart Preview */}
                <div className="p-6 bg-muted/10 rounded-lg border border-border/10">
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-title-3 text-foreground font-semibold mb-2">
                      {chartBuilder.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {chartBuilder.type.charAt(0).toUpperCase() + chartBuilder.type.slice(1)} chart preview
                    </p>
                    <div className="flex items-center justify-center gap-4 text-caption-1 text-muted-foreground">
                      <span>X-Axis: {chartBuilder.xAxis}</span>
                      <span>•</span>
                      <span>Y-Axis: {chartBuilder.yAxis}</span>
                      <span>•</span>
                      <span>Aggregation: {chartBuilder.aggregation}</span>
                    </div>
                  </div>
                </div>

                {/* Chart Configuration Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-muted/5 border-border/10">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-3">Configuration</h4>
                      <div className="space-y-2 text-footnote">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground capitalize">{chartBuilder.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">X-Axis:</span>
                          <span className="text-foreground">{chartBuilder.xAxis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Y-Axis:</span>
                          <span className="text-foreground">{chartBuilder.yAxis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aggregation:</span>
                          <span className="text-foreground capitalize">{chartBuilder.aggregation}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/5 border-border/10">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-3">Filters</h4>
                      {chartBuilder.filters.length === 0 ? (
                        <p className="text-footnote text-muted-foreground">No filters applied</p>
                      ) : (
                        <div className="space-y-2">
                          {chartBuilder.filters.map((filter, index) => (
                            <div key={index} className="text-footnote">
                              <span className="text-foreground">{filter.field}</span>
                              <span className="text-muted-foreground mx-2">{filter.operator}</span>
                              <span className="text-foreground">"{filter.value}"</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setCurrentStep('config')}
                    variant="outline"
                  >
                    Back to Config
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChart}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Chart
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
