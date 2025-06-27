import os
import logging
from typing import List, Dict, Any, Optional
from google.cloud import bigquery
from google.oauth2 import service_account
import pandas as pd

logger = logging.getLogger(__name__)

class BigQueryService:
    """Service for connecting to BigQuery and executing queries"""
    
    def __init__(self):
        self.project_id = os.getenv("BIGQUERY_PROJECT_ID")
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.client = None
        
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the BigQuery client"""
        try:
            if self.credentials_path and os.path.exists(self.credentials_path):
                # Use service account credentials
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path
                )
                self.client = bigquery.Client(
                    credentials=credentials,
                    project=self.project_id
                )
            else:
                # Use default credentials (for local development)
                self.client = bigquery.Client(project=self.project_id)
            
            logger.info(f"BigQuery client initialized for project: {self.project_id}")
            
        except Exception as e:
            logger.warning(f"BigQuery client initialization failed: {e}")
            logger.info("BigQuery tools will return mock data")
    
    def execute_query(self, sql_query: str, max_rows: int = 1000) -> Dict[str, Any]:
        """Execute a SQL query and return results"""
        try:
            if not self.client:
                # Return mock data if BigQuery not configured
                return self._mock_query_result(sql_query)
            
            # Configure query job
            job_config = bigquery.QueryJobConfig()
            job_config.maximum_bytes_billed = 1000000000  # 1GB limit
            
            # Execute query
            query_job = self.client.query(sql_query, job_config=job_config)
            
            # Get results
            results = query_job.result(max_results=max_rows)
            
            # Convert to DataFrame for easier handling
            df = results.to_dataframe()
            
            return {
                "success": True,
                "row_count": len(df),
                "columns": list(df.columns),
                "data": df.to_dict('records'),
                "query": sql_query,
                "bytes_processed": query_job.total_bytes_processed,
                "execution_time": query_job.ended - query_job.started
            }
            
        except Exception as e:
            logger.error(f"BigQuery execution error: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": sql_query
            }
    
    def get_table_schema(self, dataset_id: str, table_id: str) -> Dict[str, Any]:
        """Get schema information for a table"""
        try:
            if not self.client:
                return self._mock_table_schema(dataset_id, table_id)
            
            table_ref = self.client.dataset(dataset_id).table(table_id)
            table = self.client.get_table(table_ref)
            
            schema_info = []
            for field in table.schema:
                schema_info.append({
                    "name": field.name,
                    "type": field.field_type,
                    "mode": field.mode,
                    "description": field.description or ""
                })
            
            return {
                "success": True,
                "table_id": f"{dataset_id}.{table_id}",
                "row_count": table.num_rows,
                "size_bytes": table.num_bytes,
                "created": table.created.isoformat() if table.created else None,
                "modified": table.modified.isoformat() if table.modified else None,
                "schema": schema_info
            }
            
        except Exception as e:
            logger.error(f"Error getting table schema: {e}")
            return {
                "success": False,
                "error": str(e),
                "table_id": f"{dataset_id}.{table_id}"
            }
    
    def list_datasets(self) -> List[Dict[str, Any]]:
        """List available datasets"""
        try:
            if not self.client:
                return self._mock_datasets()
            
            datasets = list(self.client.list_datasets())
            
            return [
                {
                    "dataset_id": dataset.dataset_id,
                    "full_dataset_id": dataset.full_dataset_id,
                    "created": dataset.created.isoformat() if dataset.created else None,
                    "modified": dataset.modified.isoformat() if dataset.modified else None,
                    "location": dataset.location
                }
                for dataset in datasets
            ]
            
        except Exception as e:
            logger.error(f"Error listing datasets: {e}")
            return []
    
    def list_tables(self, dataset_id: str) -> List[Dict[str, Any]]:
        """List tables in a dataset"""
        try:
            if not self.client:
                return self._mock_tables(dataset_id)
            
            dataset_ref = self.client.dataset(dataset_id)
            tables = list(self.client.list_tables(dataset_ref))
            
            return [
                {
                    "table_id": table.table_id,
                    "full_table_id": table.full_table_id,
                    "table_type": table.table_type,
                    "created": table.created.isoformat() if table.created else None,
                    "modified": table.modified.isoformat() if table.modified else None,
                    "num_rows": table.num_rows,
                    "size_bytes": table.num_bytes
                }
                for table in tables
            ]
            
        except Exception as e:
            logger.error(f"Error listing tables: {e}")
            return []
    
    def preview_table(self, dataset_id: str, table_id: str, limit: int = 10) -> Dict[str, Any]:
        """Preview data from a table"""
        sql_query = f"""
        SELECT * 
        FROM `{self.project_id}.{dataset_id}.{table_id}` 
        LIMIT {limit}
        """
        return self.execute_query(sql_query, max_rows=limit)
    
    # Mock data methods for when BigQuery is not configured
    def _mock_query_result(self, sql_query: str) -> Dict[str, Any]:
        """Return mock data when BigQuery is not configured"""
        mock_data = [
            {"date": "2024-01-01", "revenue": 10000, "orders": 150, "region": "North"},
            {"date": "2024-01-02", "revenue": 12000, "orders": 180, "region": "South"},
            {"date": "2024-01-03", "revenue": 9500, "orders": 140, "region": "East"},
            {"date": "2024-01-04", "revenue": 11500, "orders": 170, "region": "West"},
            {"date": "2024-01-05", "revenue": 13000, "orders": 200, "region": "North"}
        ]
        
        return {
            "success": True,
            "row_count": len(mock_data),
            "columns": ["date", "revenue", "orders", "region"],
            "data": mock_data,
            "query": sql_query,
            "mock": True
        }
    
    def _mock_table_schema(self, dataset_id: str, table_id: str) -> Dict[str, Any]:
        """Return mock schema when BigQuery is not configured"""
        return {
            "success": True,
            "table_id": f"{dataset_id}.{table_id}",
            "row_count": 1000,
            "schema": [
                {"name": "date", "type": "DATE", "mode": "REQUIRED", "description": "Transaction date"},
                {"name": "revenue", "type": "FLOAT", "mode": "NULLABLE", "description": "Revenue amount"},
                {"name": "orders", "type": "INTEGER", "mode": "NULLABLE", "description": "Number of orders"},
                {"name": "region", "type": "STRING", "mode": "NULLABLE", "description": "Geographic region"}
            ],
            "mock": True
        }
    
    def _mock_datasets(self) -> List[Dict[str, Any]]:
        """Return mock datasets when BigQuery is not configured"""
        return [
            {
                "dataset_id": "sales_data",
                "full_dataset_id": "your-project.sales_data",
                "created": "2024-01-01T00:00:00Z",
                "modified": "2024-06-01T00:00:00Z",
                "location": "US",
                "mock": True
            },
            {
                "dataset_id": "user_analytics",
                "full_dataset_id": "your-project.user_analytics",
                "created": "2024-01-01T00:00:00Z",
                "modified": "2024-06-01T00:00:00Z",
                "location": "US",
                "mock": True
            }
        ]
    
    def _mock_tables(self, dataset_id: str) -> List[Dict[str, Any]]:
        """Return mock tables when BigQuery is not configured"""
        mock_tables = {
            "sales_data": [
                {"table_id": "daily_sales", "num_rows": 365, "size_bytes": 50000},
                {"table_id": "products", "num_rows": 100, "size_bytes": 15000},
                {"table_id": "customers", "num_rows": 5000, "size_bytes": 200000}
            ],
            "user_analytics": [
                {"table_id": "page_views", "num_rows": 100000, "size_bytes": 2000000},
                {"table_id": "user_sessions", "num_rows": 50000, "size_bytes": 1500000}
            ]
        }
        
        return [
            {
                **table,
                "full_table_id": f"your-project.{dataset_id}.{table['table_id']}",
                "table_type": "TABLE",
                "created": "2024-01-01T00:00:00Z",
                "modified": "2024-06-01T00:00:00Z",
                "mock": True
            }
            for table in mock_tables.get(dataset_id, [])
        ]

# Global BigQuery service instance
bigquery_service = BigQueryService() 