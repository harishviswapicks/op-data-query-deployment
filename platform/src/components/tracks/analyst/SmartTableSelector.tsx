"use client";

import { useState, useEffect } from "react";
import { BigQueryTable } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Search, 
  Clock, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  SortAsc,
  Eye,
  BarChart3,
  Table as TableIcon,
  Layers
} from "lucide-react";

interface SmartTableSelectorProps {
  tables: BigQueryTable[];
  selectedTable: BigQueryTable | null;
  onTableSelect: (table: BigQueryTable) => void;
  onTablePreview: (table: BigQueryTable) => void;
  className?: string;
}

type SortOption = 'name' | 'lastUpdated' | 'rowCount' | 'queryTime';
type FilterOption = 'all' | 'realtime' | 'hourly' | 'daily' | 'stale';

export default function SmartTableSelector({ 
  tables, 
  selectedTable, 
  onTableSelect, 
  onTablePreview,
  className = "" 
}: SmartTableSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('lastUpdated');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort tables
  const filteredAndSortedTables = tables
    .filter(table => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Freshness filter
      const matchesFilter = filterBy === 'all' || table.dataFreshness === filterBy;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastUpdated':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'rowCount':
          return b.rowCount - a.rowCount;
        case 'queryTime':
          return a.estimatedQueryTime - b.estimatedQueryTime;
        default:
          return 0;
      }
    });

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'realtime': return 'text-accent';
      case 'hourly': return 'text-primary';
      case 'daily': return 'text-warning';
      case 'stale': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getFreshnessIcon = (freshness: string) => {
    switch (freshness) {
      case 'realtime': return <Zap className="w-3 h-3" />;
      case 'hourly': return <Clock className="w-3 h-3" />;
      case 'daily': return <Clock className="w-3 h-3" />;
      case 'stale': return <AlertTriangle className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-accent';
      case 'moderate': return 'text-warning';
      case 'complex': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatRowCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className={`bg-background/50 backdrop-blur-xl border border-border/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-subheadline font-semibold text-foreground">
              BigQuery Tables
            </h3>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="w-3 h-3" />
            Filters
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="pl-10 bg-muted/20 border-border/20"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-3 bg-muted/10 rounded-lg border border-border/10">
            <div className="flex items-center gap-2">
              <SortAsc className="w-3 h-3 text-muted-foreground" />
              <span className="text-footnote font-medium text-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-footnote bg-background border border-border/20 rounded px-2 py-1"
              >
                <option value="lastUpdated">Last Updated</option>
                <option value="name">Name</option>
                <option value="rowCount">Row Count</option>
                <option value="queryTime">Query Time</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <span className="text-footnote font-medium text-foreground">Filter by:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="text-footnote bg-background border border-border/20 rounded px-2 py-1"
              >
                <option value="all">All Tables</option>
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="stale">Stale</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table List */}
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {filteredAndSortedTables.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-footnote text-muted-foreground">
                {searchQuery ? "No tables match your search" : "No tables available"}
              </p>
            </div>
          ) : (
            filteredAndSortedTables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                  selectedTable?.id === table.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border/20 hover:border-primary/50 bg-muted/5'
                }`}
                onClick={() => onTableSelect(table)}
              >
                <CardContent className="p-4">
                  {/* Table Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TableIcon className="w-4 h-4 text-primary" />
                        <h4 className="text-footnote font-semibold text-foreground">
                          {table.name}
                        </h4>
                        <div className={`flex items-center gap-1 ${getFreshnessColor(table.dataFreshness)}`}>
                          {getFreshnessIcon(table.dataFreshness)}
                          <span className="text-caption-2 capitalize">
                            {table.dataFreshness}
                          </span>
                        </div>
                      </div>
                      <p className="text-caption-1 text-muted-foreground line-clamp-2">
                        {table.description}
                      </p>
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTablePreview(table);
                      }}
                      variant="ghost"
                      size="sm"
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Table Stats */}
                  <div className="grid grid-cols-3 gap-4 text-caption-2">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="font-medium text-foreground">
                        {formatRowCount(table.rowCount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Query:</span>
                      <span className="font-medium text-foreground">
                        ~{table.estimatedQueryTime}s
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <BarChart3 className={`w-3 h-3 ${getComplexityColor(table.queryComplexity)}`} />
                      <span className="text-muted-foreground">Complexity:</span>
                      <span className={`font-medium capitalize ${getComplexityColor(table.queryComplexity)}`}>
                        {table.queryComplexity}
                      </span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                    <div className="flex items-center gap-1 text-caption-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatLastUpdated(table.lastUpdated)}</span>
                    </div>
                    
                    {selectedTable?.id === table.id && (
                      <div className="flex items-center gap-1 text-caption-2 text-primary">
                        <CheckCircle className="w-3 h-3" />
                        <span>Selected</span>
                      </div>
                    )}
                  </div>

                  {/* Schema Preview */}
                  {selectedTable?.id === table.id && (
                    <div className="mt-3 pt-3 border-t border-border/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <span className="text-caption-2 font-medium text-foreground">
                          Schema ({table.schema.length} columns)
                        </span>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {table.schema.slice(0, 5).map((column, index) => (
                          <div key={index} className="flex items-center justify-between text-caption-2">
                            <span className="text-foreground font-mono">
                              {column.name}
                            </span>
                            <span className="text-muted-foreground">
                              {column.type}
                            </span>
                          </div>
                        ))}
                        {table.schema.length > 5 && (
                          <div className="text-caption-2 text-muted-foreground">
                            +{table.schema.length - 5} more columns
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-border/10 bg-muted/5">
        <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
          <span>
            {filteredAndSortedTables.length} of {tables.length} tables
          </span>
          {selectedTable && (
            <span className="text-primary">
              {selectedTable.name} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
