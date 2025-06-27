#!/usr/bin/env python3
"""
Test BigQuery connection with prizepicksanalytics project
"""
import os
import sys
from bigquery_client import BigQueryService

# Manually set the project ID for testing
os.environ["BIGQUERY_PROJECT_ID"] = "prizepicksanalytics"

def test_bigquery_connection():
    """Test BigQuery connection and data discovery"""
    print("🔍 Testing BigQuery Connection for PrizePicksAnalytics")
    print("=" * 60)
    
    # Initialize BigQuery service
    bq_service = BigQueryService()
    
    # Test 1: List datasets
    print("\n📁 1. Discovering available datasets...")
    try:
        datasets = bq_service.list_datasets()
        if datasets:
            print(f"✅ Found {len(datasets)} datasets:")
            for dataset in datasets:
                mock_flag = " (MOCK)" if dataset.get("mock") else " (REAL)"
                print(f"   📊 {dataset['dataset_id']}{mock_flag}")
                print(f"      Location: {dataset.get('location', 'Unknown')}")
                if dataset.get('created'):
                    print(f"      Created: {dataset['created']}")
        else:
            print("⚠️  No datasets found - using mock data")
    except Exception as e:
        print(f"❌ Error listing datasets: {e}")
    
    # Test 2: Try to list tables in first dataset
    print("\n📋 2. Exploring tables in datasets...")
    try:
        if datasets and not datasets[0].get("mock"):
            # Use real dataset
            dataset_id = datasets[0]['dataset_id']
            print(f"   Checking real dataset: {dataset_id}")
        else:
            # Use mock dataset for testing
            dataset_id = "sales_data"
            print(f"   Using mock dataset: {dataset_id}")
        
        tables = bq_service.list_tables(dataset_id)
        if tables:
            print(f"✅ Found {len(tables)} tables in {dataset_id}:")
            for table in tables:
                mock_flag = " (MOCK)" if table.get("mock") else " (REAL)"
                print(f"   📊 {table['table_id']}{mock_flag}")
                print(f"      Rows: {table.get('num_rows', 'Unknown'):,}")
                print(f"      Size: {table.get('size_bytes', 0):,} bytes")
        else:
            print(f"⚠️  No tables found in dataset {dataset_id}")
    except Exception as e:
        print(f"❌ Error listing tables: {e}")
    
    # Test 3: Try a sample query
    print("\n🔍 3. Testing query execution...")
    try:
        # Simple query to test connection
        test_query = """
        SELECT 
            'test' as source,
            CURRENT_TIMESTAMP() as query_time,
            'Connection successful' as status
        """
        
        result = bq_service.execute_query(test_query)
        if result.get("success"):
            print("✅ Query executed successfully!")
            print(f"   Rows returned: {result['row_count']}")
            print(f"   Columns: {', '.join(result['columns'])}")
            if result.get("data"):
                print(f"   Sample data: {result['data'][0]}")
                
            mock_flag = " (using mock data)" if result.get("mock") else " (using real BigQuery)"
            print(f"   Status: {mock_flag}")
        else:
            print(f"❌ Query failed: {result.get('error')}")
    except Exception as e:
        print(f"❌ Error executing query: {e}")
    
    # Test 4: Test schema discovery
    print("\n📋 4. Testing schema discovery...")
    try:
        # Test schema on first available table
        if tables:
            table_id = tables[0]['table_id']
            schema_result = bq_service.get_table_schema(dataset_id, table_id)
            
            if schema_result.get("success"):
                print(f"✅ Schema retrieved for {dataset_id}.{table_id}:")
                print(f"   Table rows: {schema_result.get('row_count', 'Unknown'):,}")
                print(f"   Columns ({len(schema_result.get('schema', []))}):")
                
                for field in schema_result.get('schema', [])[:5]:  # Show first 5 columns
                    print(f"      {field['name']} ({field['type']}) - {field.get('description', 'No description')}")
                
                if len(schema_result.get('schema', [])) > 5:
                    print(f"      ... and {len(schema_result['schema']) - 5} more columns")
            else:
                print(f"❌ Schema error: {schema_result.get('error')}")
        else:
            print("⚠️  No tables available for schema testing")
    except Exception as e:
        print(f"❌ Error getting schema: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 BigQuery Connection Test Complete!")
    
    # Summary
    if bq_service.client:
        print("✅ BigQuery client is configured and ready")
        print(f"✅ Project ID: {bq_service.project_id}")
        print("✅ Your AI-powered Slack integration can connect to real data!")
    else:
        print("⚠️  BigQuery client not configured - using mock data")
        print("   To connect to real data, set up service account credentials")
        print("   Your Slack integration will work with sample data for now")

if __name__ == "__main__":
    test_bigquery_connection() 