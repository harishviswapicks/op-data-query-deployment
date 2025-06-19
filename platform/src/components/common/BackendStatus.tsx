"use client";

import { useState, useEffect } from "react";
import { checkBackendHealth } from "@/lib/api";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className = "" }: BackendStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const connected = await checkBackendHealth();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/20 ${className}`}>
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
        <span className="text-caption-1 text-muted-foreground">Checking backend...</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-105 ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' 
          : 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400'
      } ${className}`}
      onClick={checkStatus}
      title={isConnected ? "Backend connected" : "Backend not available - using local mode"}
    >
      {isChecking ? (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : isConnected ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      <span className="text-caption-1 font-medium">
        {isConnected ? 'Backend Connected' : 'Local Mode'}
      </span>
    </div>
  );
}
