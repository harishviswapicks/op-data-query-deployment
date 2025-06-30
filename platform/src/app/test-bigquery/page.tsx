"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestBigQueryPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'https://operational-data-querying-production.up.railway.app';

  const runTest = async (testName: string, endpoint: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🧪 Running test: ${testName}`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults({ testName, data, success: true });
      console.log(`✅ ${testName} Success:`, data);
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error';
      setError(`❌ ${testName} Failed: ${errorMsg}`);
      setResults({ testName, error: errorMsg, success: false });
      console.error(`❌ ${testName} Error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Backend Health',
      endpoint: '/health',
      description: 'Check if backend is responding'
    },
    {
      name: 'BigQuery Config',
      endpoint: '/api/bigquery/config-status',
      description: 'Check BigQuery configuration'
    },
    {
      name: 'List Datasets',
      endpoint: '/api/bigquery/datasets',
      description: 'Get available BigQuery datasets'
    },
    {
      name: 'Test Chat (Unauthenticated)',
      endpoint: '/api/chat/test',
      options: {
        method: 'POST'
      },
      description: 'Test AI chat without authentication'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          🧪 BigQuery Integration Test Suite
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tests.map((test) => (
            <Card key={test.name}>
              <CardHeader>
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{test.description}</p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => runTest(test.name, test.endpoint, test.options)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Testing...' : `Test ${test.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results Display */}
        {results && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className={results.success ? 'text-green-600' : 'text-red-600'}>
                {results.success ? '✅' : '❌'} {results.testName} Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results.data || results.error, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Info */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Backend:</strong> {API_BASE}</p>
              <p><strong>Frontend:</strong> {window.location.origin}</p>
              <p><strong>BigQuery Project:</strong> prizepicksanalytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 