#!/usr/bin/env python3
"""
Test real BigQuery connection to PrizePicksAnalytics
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set your project ID
os.environ["BIGQUERY_PROJECT_ID"] = "prizepicksanalytics"

def test_real_bigquery_connection():
    """Test connection to actual PrizePicksAnalytics BigQuery project"""
    print("🔍 Testing REAL BigQuery Connection to PrizePicksAnalytics")
    print("=" * 70)
    
    try:
        from google.cloud import bigquery
        from google.oauth2 import service_account
        import google.auth
        
        # Try different authentication methods
        print("🔐 Testing authentication methods...")
        
        # Method 1: Try default credentials first
        print("\n1️⃣ Trying Application Default Credentials...")
        try:
            credentials, project = google.auth.default()
            print(f"✅ Found default credentials for project: {project}")
            
            # Create client with default credentials
            client = bigquery.Client(project="prizepicksanalytics")
            print(f"✅ BigQuery client created successfully!")
            
            # Test basic connection
            print(f"✅ Testing connection to project: {client.project}")
            
        except Exception as e:
            print(f"❌ Default credentials failed: {e}")
            client = None
        
        # Method 2: Check if service account file exists
        print("\n2️⃣ Checking for service account file...")
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if creds_path and os.path.exists(creds_path):
            print(f"✅ Found service account file: {creds_path}")
            try:
                credentials = service_account.Credentials.from_service_account_file(creds_path)
                client = bigquery.Client(credentials=credentials, project="prizepicksanalytics")
                print("✅ Service account authentication successful!")
            except Exception as e:
                print(f"❌ Service account authentication failed: {e}")
        else:
            print("⚠️  No service account file found")
            print(f"   Looking for: {creds_path}")
        
        # If we have a client, test actual BigQuery operations
        if client:
            print("\n🔍 Testing BigQuery operations...")
            
            # Test 1: List datasets
            try:
                print("📁 Listing datasets...")
                datasets = list(client.list_datasets())
                if datasets:
                    print(f"✅ Found {len(datasets)} datasets:")
                    for dataset in datasets:
                        print(f"   📊 {dataset.dataset_id}")
                        
                        # Test listing tables in first dataset
                        if dataset == datasets[0]:
                            print(f"   🔍 Exploring tables in {dataset.dataset_id}...")
                            try:
                                tables = list(client.list_tables(dataset.dataset_id))
                                if tables:
                                    print(f"   ✅ Found {len(tables)} tables:")
                                    for table in tables[:5]:  # Show first 5 tables
                                        print(f"      📋 {table.table_id} ({table.num_rows:,} rows)")
                                else:
                                    print("   ⚠️  No tables found in this dataset")
                            except Exception as e:
                                print(f"   ❌ Error listing tables: {e}")
                else:
                    print("⚠️  No datasets found")
                    print("   This might mean:")
                    print("   - Your service account doesn't have BigQuery permissions")
                    print("   - The project doesn't have any datasets yet")
                    print("   - You need to grant BigQuery Data Viewer role")
                    
            except Exception as e:
                print(f"❌ Error listing datasets: {e}")
                print("   This usually means authentication or permission issues")
            
            # Test 2: Try a simple query
            try:
                print("\n💾 Testing query execution...")
                query = """
                SELECT 
                    'PrizePicksAnalytics' as project,
                    CURRENT_TIMESTAMP() as query_time,
                    'Real connection successful!' as status
                """
                
                job = client.query(query)
                results = job.result()
                
                print("✅ Query executed successfully!")
                for row in results:
                    print(f"   Result: {dict(row)}")
                    
            except Exception as e:
                print(f"❌ Query execution failed: {e}")
                
        else:
            print("\n❌ No valid authentication method found")
            print("\n🔧 TO FIX THIS:")
            print("1. Create a service account in Google Cloud Console:")
            print("   https://console.cloud.google.com/iam-admin/serviceaccounts?project=prizepicksanalytics")
            print("2. Give it BigQuery Data Viewer + BigQuery Job User roles")
            print("3. Download the JSON key file")
            print("4. Update your .env file:")
            print("   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json")
            
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Run: pip install google-cloud-bigquery")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    print("\n" + "=" * 70)
    print("🎯 BigQuery Connection Test Complete!")

if __name__ == "__main__":
    test_real_bigquery_connection() 