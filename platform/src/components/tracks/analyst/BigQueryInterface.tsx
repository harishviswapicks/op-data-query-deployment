"use client";

import { useState } from "react";
import { BigQueryTable, TableSchema } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Search, 
  Play, 
  Copy, 
  Download, 
  Clock, 
  Users, 
  Zap,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface BigQueryInterfaceProps {
  tables: BigQueryTable[];
  selectedTable: BigQueryTable | null;
  onTableSelect: (table: BigQueryTable) => void;
  onQueryExecute?: (query: string, table: BigQueryTable) => void;
}

export default function BigQueryInterface({ 
  tables, 
  selectedTable, 
  onTableSelect, 
  onQueryExecute 
}: BigQueryInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableSelect = (table: BigQueryTable) => {
    onTableSelect(table);
    // Generate a sample query for the selected table
    const sampleQuery = `SELECT *\nFROM \`${table.id}\`\nLIMIT 100;`;
    setSqlQuery(sampleQuery);
  };

  const handleQueryExecute = async () => {
    if (!selectedTable || !sqlQuery.trim()) return;
    
    setIsExecuting(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, selectedTable.estimatedQueryTime * 1000));
      onQueryExecute?.(sqlQuery, selectedTable);
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'realtime': return 'text-accent';
      case 'hourly': return 'text-primary';
      case 'daily': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getFreshnessIcon = (freshness: string) => {
    switch (freshness) {
      case 'realtime': return CheckCircle;
      case 'hourly': return Clock;
      case 'daily': return AlertCircle;
      default: return Info;
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border/10">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-title-3 text-foreground font-semibold">BigQuery Interface</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="pl-10 bg-muted/20 border-border/30"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tables List */}
        <div className="w-1/3 border-r border-border/10 flex flex-col">
          <div className="p-3 border-b border-border/10">
            <h3 className="text-footnote font-medium text-foreground">Available Tables</h3>
            <p className="text-caption-1 text-muted-foreground">{filteredTables.length} tables</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredTables.map((table) => {
                const FreshnessIcon = getFreshnessIcon(table.dataFreshness);
                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className={`w-full p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105 ${
                      selectedTable?.id === table.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/20 hover:border-primary/50 bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-footnote font-medium text-foreground truncate">
                        {table.name}
                      </span>
                      <FreshnessIcon className={`w-3 h-3 ${getFreshnessColor(table.dataFreshness)}`} />
                    </div>
                    
                    <p className="text-caption-1 text-muted-foreground mb-2 line-clamp-2">
                      {table.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-caption-2 text-muted-foreground">
                      <span>{(table.rowCount / 1000000).toFixed(1)}M rows</span>
                      <span className={getComplexityColor(table.queryComplexity)}>
                        {table.queryComplexity}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-caption-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>~{table.estimatedQueryTime}s</span>
                      <span>•</span>
                      <span className={getFreshnessColor(table.dataFreshness)}>
                        {table.dataFreshness}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Table Details & Query Editor */}
        <div className="flex-1 flex flex-col">
          {selectedTable ? (
            <>
              {/* Table Info */}
              <div className="flex-shrink-0 p-4 border-b border-border/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-title-3 text-foreground font-semibold">
                    {selectedTable.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy ID
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <p className="text-callout text-muted-foreground mb-3">
                  {selectedTable.description}
                </p>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <div className="text-footnote font-medium text-foreground">
                      {(selectedTable.rowCount / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-caption-2 text-muted-foreground">Rows</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <div className="text-footnote font-medium text-foreground">
                      {selectedTable.schema.length}
                    </div>
                    <div className="text-caption-2 text-muted-foreground">Columns</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <div className={`text-footnote font-medium ${getFreshnessColor(selectedTable.dataFreshness)}`}>
                      {selectedTable.dataFreshness}
                    </div>
                    <div className="text-caption-2 text-muted-foreground">Freshness</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded-lg">
                    <div className="text-footnote font-medium text-foreground">
                      {selectedTable.estimatedQueryTime}s
                    </div>
                    <div className="text-caption-2 text-muted-foreground">Est. Time</div>
                  </div>
                </div>
              </div>

              {/* Schema */}
              <div className="flex-shrink-0 p-4 border-b border-border/10">
                <h4 className="text-footnote font-medium text-foreground mb-2">Schema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {selectedTable.schema.map((column, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted/10 rounded-md"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        column.type === 'STRING' ? 'bg-blue-500' :
                        column.type === 'INTEGER' || column.type === 'FLOAT' ? 'bg-green-500' :
                        column.type === 'DATE' || column.type === 'TIMESTAMP' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-caption-1 font-medium text-foreground">
                        {column.name}
                      </span>
                      <span className="text-caption-2 text-muted-foreground">
                        {column.type}
                      </span>
                      {!column.nullable && (
                        <span className="text-caption-2 text-destructive">*</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Query Editor */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border/10">
                  <h4 className="text-footnote font-medium text-foreground">SQL Query</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleQueryExecute}
                      disabled={!sqlQuery.trim() || isExecuting}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isExecuting ? (
                        <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      {isExecuting ? 'Running...' : 'Run Query'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="w-full h-full bg-muted/10 border border-border/20 rounded-lg p-3 text-body font-mono resize-none focus:outline-none focus:border-primary/50 transition-colors"
                    disabled={isExecuting}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-title-3 text-foreground font-semibold mb-2">
                  Select a Table
                </h3>
                <p className="text-muted-foreground text-callout">
                  Choose a BigQuery table from the list to view its schema and run queries
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
