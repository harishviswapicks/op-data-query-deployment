"use client";

import { useState } from "react";
import { NotionWorkspace, NotionPage, NotionDatabase } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Clock, 
  Tag, 
  Database,
  BookOpen,
  Star,
  Filter,
  RefreshCw
} from "lucide-react";

interface NotionInterfaceProps {
  onPageSelect?: (page: NotionPage) => void;
  onDatabaseSelect?: (database: NotionDatabase) => void;
  className?: string;
}

export default function NotionInterface({ 
  onPageSelect, 
  onDatabaseSelect,
  className = ""
}: NotionInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock Notion data
  const [workspaces] = useState<NotionWorkspace[]>([
    {
      id: "workspace1",
      name: "Company Wiki",
      databases: [
        {
          id: "db1",
          name: "Employee Directory",
          properties: [
            { name: "Name", type: "title" },
            { name: "Department", type: "select", options: ["Engineering", "Product", "Design"] },
            { name: "Role", type: "text" }
          ],
          url: "https://notion.so/db1"
        },
        {
          id: "db2",
          name: "Project Tracker",
          properties: [
            { name: "Project", type: "title" },
            { name: "Status", type: "select", options: ["Planning", "In Progress", "Complete"] },
            { name: "Owner", type: "person" }
          ],
          url: "https://notion.so/db2"
        }
      ],
      pages: [
        {
          id: "page1",
          title: "Employee Onboarding Guide",
          url: "https://notion.so/page1",
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          tags: ["onboarding", "hr", "guide"],
          content: "Complete guide for new employee onboarding process..."
        },
        {
          id: "page2",
          title: "Remote Work Policy",
          url: "https://notion.so/page2",
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          tags: ["policy", "remote", "hr"],
          content: "Guidelines and policies for remote work arrangements..."
        }
      ],
      lastSynced: new Date(Date.now() - 30 * 60 * 1000),
      accessLevel: "read"
    },
    {
      id: "workspace2",
      name: "Engineering Docs",
      databases: [
        {
          id: "db3",
          name: "API Documentation",
          properties: [
            { name: "Endpoint", type: "title" },
            { name: "Method", type: "select", options: ["GET", "POST", "PUT", "DELETE"] },
            { name: "Status", type: "select", options: ["Active", "Deprecated"] }
          ],
          url: "https://notion.so/db3"
        }
      ],
      pages: [
        {
          id: "page3",
          title: "System Architecture Overview",
          url: "https://notion.so/page3",
          lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          tags: ["architecture", "engineering", "system"],
          content: "High-level overview of our system architecture..."
        },
        {
          id: "page4",
          title: "Deployment Runbook",
          url: "https://notion.so/page4",
          lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          tags: ["deployment", "ops", "runbook"],
          content: "Step-by-step deployment procedures and troubleshooting..."
        }
      ],
      lastSynced: new Date(Date.now() - 15 * 60 * 1000),
      accessLevel: "write"
    }
  ]);

  // Flatten all pages and databases for search
  const allPages = workspaces.flatMap(ws => ws.pages);
  const allDatabases = workspaces.flatMap(ws => ws.databases);

  // Filter content based on search and filters
  const filteredPages = allPages.filter(page => {
    const matchesSearch = searchQuery === "" || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesWorkspace = selectedWorkspace === "all" || 
      workspaces.find(ws => ws.pages.includes(page))?.id === selectedWorkspace;
    
    const matchesType = filterType === "all" || filterType === "pages";
    
    return matchesSearch && matchesWorkspace && matchesType;
  });

  const filteredDatabases = allDatabases.filter(db => {
    const matchesSearch = searchQuery === "" || 
      db.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesWorkspace = selectedWorkspace === "all" || 
      workspaces.find(ws => ws.databases.includes(db))?.id === selectedWorkspace;
    
    const matchesType = filterType === "all" || filterType === "databases";
    
    return matchesSearch && matchesWorkspace && matchesType;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatLastModified = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className={`bg-background ${className}`}>
      <Card className="bg-card/50 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-3 text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notion Workspace
              </CardTitle>
              <p className="text-caption-1 text-muted-foreground mt-1">
                Search and browse your Notion content
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, databases, and content..."
                className="pl-10 bg-muted/20 border-border/30"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedWorkspace}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  className="px-3 py-1 bg-background border border-border/20 rounded-md text-footnote"
                >
                  <option value="all">All Workspaces</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 bg-background border border-border/20 rounded-md text-footnote"
              >
                <option value="all">All Types</option>
                <option value="pages">Pages Only</option>
                <option value="databases">Databases Only</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Databases */}
            {filteredDatabases.length > 0 && (
              <div>
                <h4 className="text-footnote font-medium text-foreground mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Databases ({filteredDatabases.length})
                </h4>
                <div className="space-y-2">
                  {filteredDatabases.map((database) => (
                    <button
                      key={database.id}
                      onClick={() => onDatabaseSelect?.(database)}
                      className="w-full p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-primary" />
                            <h5 className="text-footnote font-medium text-foreground">
                              {database.name}
                            </h5>
                          </div>
                          <p className="text-caption-1 text-muted-foreground mb-2">
                            {database.properties.length} properties
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {database.properties.slice(0, 3).map((prop, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary text-caption-2 rounded-md"
                              >
                                {prop.name}
                              </span>
                            ))}
                            {database.properties.length > 3 && (
                              <span className="px-2 py-1 bg-muted/20 text-muted-foreground text-caption-2 rounded-md">
                                +{database.properties.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pages */}
            {filteredPages.length > 0 && (
              <div>
                <h4 className="text-footnote font-medium text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Pages ({filteredPages.length})
                </h4>
                <div className="space-y-2">
                  {filteredPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => onPageSelect?.(page)}
                      className="w-full p-4 rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/10 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-accent" />
                            <h5 className="text-footnote font-medium text-foreground">
                              {page.title}
                            </h5>
                          </div>
                          
                          {page.content && (
                            <p className="text-caption-1 text-muted-foreground mb-2 line-clamp-2">
                              {page.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-caption-2 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatLastModified(page.lastModified)}</span>
                            </div>
                            {page.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <span>{page.tags.length} tags</span>
                              </div>
                            )}
                          </div>
                          
                          {page.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {page.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-accent/10 text-accent text-caption-2 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                              {page.tags.length > 3 && (
                                <span className="px-2 py-1 bg-muted/20 text-muted-foreground text-caption-2 rounded-md">
                                  +{page.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredPages.length === 0 && filteredDatabases.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-title-3 text-foreground font-semibold mb-2">
                  No Results Found
                </h3>
                <p className="text-muted-foreground text-callout mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedWorkspace("all");
                    setFilterType("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Workspace Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/10">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {workspaces.length}
              </div>
              <div className="text-caption-2 text-muted-foreground">Workspaces</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {allPages.length}
              </div>
              <div className="text-caption-2 text-muted-foreground">Pages</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <div className="text-footnote font-medium text-foreground">
                {allDatabases.length}
              </div>
              <div className="text-caption-2 text-muted-foreground">Databases</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/10">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Star className="w-3 h-3" />
              Favorites
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3" />
              Open Notion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
