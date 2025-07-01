from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from models import BigQueryTable, QueryRequest, QueryResponse, User
from routers.auth import get_current_user
from bigquery_client import bigquery_service
import os
import logging
import json
from google.oauth2 import service_account
from google.cloud import bigquery

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/config-status")
async def check_bigquery_config():
    """
    Check BigQuery configuration status (for debugging)
    """
    try:
        config_status = {
            "bigquery_project_id": {
                "set": bool(os.getenv("BIGQUERY_PROJECT_ID")),
                "value": os.getenv("BIGQUERY_PROJECT_ID", "Not set")
            },
            "google_credentials_json": {
                "set": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")),
                "length": len(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")) if os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON") else 0
            },
            "google_credentials_path": {
                "set": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
                "value": os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "Not set")
            },
            "bigquery_client_initialized": bigquery_service.client is not None,
            "using_mock_data": bigquery_service.client is None
        }
        
        return config_status
        
    except Exception as e:
        logger.error(f"Error checking BigQuery config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking configuration: {str(e)}"
        )

@router.get("/datasets")
async def list_datasets(current_user: User = Depends(get_current_user)):
    """
    List available BigQuery datasets
    """
    try:
        datasets = bigquery_service.list_datasets()
        return {
            "datasets": datasets,
            "mock_data": len(datasets) > 0 and datasets[0].get("mock", False)
        }
    except Exception as e:
        logger.error(f"Error listing datasets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing datasets: {str(e)}"
        )

@router.get("/datasets/{dataset_id}/tables")
async def list_tables(
    dataset_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    List tables in a specific dataset
    """
    try:
        tables = bigquery_service.list_tables(dataset_id)
        return {
            "dataset_id": dataset_id,
            "tables": tables,
            "mock_data": len(tables) > 0 and tables[0].get("mock", False)
        }
    except Exception as e:
        logger.error(f"Error listing tables: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing tables: {str(e)}"
        )

@router.post("/query")
async def execute_query(
    query_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Execute a BigQuery SQL query
    """
    try:
        sql_query = query_data.get("sql")
        if not sql_query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SQL query is required"
            )
        
        max_rows = query_data.get("max_rows", 1000)
        result = bigquery_service.execute_query(sql_query, max_rows)
        
        return result
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing query: {str(e)}"
        )

@router.get("/tables", response_model=List[BigQueryTable])
async def get_available_tables(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available BigQuery tables
    """
    # TODO: Return list of available BigQuery tables with metadata
    pass

@router.get("/tables/{table_id}", response_model=BigQueryTable)
async def get_table_details(
    table_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific table
    """
    # TODO: Return detailed table information including schema
    pass

@router.get("/tables/{table_id}/schema")
async def get_table_schema(
    table_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get schema information for a specific table
    """
    # TODO: Return table schema details
    pass

@router.get("/tables/{table_id}/preview")
async def preview_table_data(
    table_id: str,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    Preview data from a table (limited rows)
    """
    # TODO: Return preview of table data
    pass

@router.get("/query/{query_id}/status")
async def get_query_status(
    query_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of a running query
    """
    # TODO: Return query execution status
    pass

@router.get("/query/{query_id}/results", response_model=QueryResponse)
async def get_query_results(
    query_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get results of a completed query
    """
    # TODO: Return query results
    pass

@router.post("/validate-query")
async def validate_sql_query(
    sql: str,
    current_user: User = Depends(get_current_user)
):
    """
    Validate SQL query syntax without executing
    """
    # TODO: Validate SQL query syntax
    pass

@router.get("/debug-credentials")
async def debug_credentials():
    """
    Debug endpoint to test credential parsing and BigQuery client initialization
    """
    debug_info = {}
    
    try:
        # Check environment variables
        project_id = os.getenv("BIGQUERY_PROJECT_ID")
        credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        
        debug_info["project_id"] = project_id
        debug_info["project_id_set"] = bool(project_id)
        debug_info["credentials_json_set"] = bool(credentials_json)
        debug_info["credentials_json_length"] = len(credentials_json) if credentials_json else 0
        
        if credentials_json:
            # Show first and last 50 characters to help identify format issues
            debug_info["credentials_json_start"] = credentials_json[:50]
            debug_info["credentials_json_end"] = credentials_json[-50:]
            
            # Check for common formatting issues
            debug_info["starts_with_brace"] = credentials_json.strip().startswith("{")
            debug_info["ends_with_brace"] = credentials_json.strip().endswith("}")
            debug_info["contains_type"] = '"type"' in credentials_json
            debug_info["contains_project_id"] = '"project_id"' in credentials_json
            debug_info["contains_private_key"] = '"private_key"' in credentials_json
        else:
            debug_info["credentials_json_preview"] = "None"
        
        # Test JSON parsing
        if not credentials_json:
            debug_info["json_parse_success"] = False
            debug_info["json_parse_error"] = "credentials_json is None or empty"
            debug_info["recommended_fix"] = "Set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable with your service account JSON"
            return debug_info
            
        try:
            credentials_info = json.loads(credentials_json)
            debug_info["json_parse_success"] = True
            debug_info["json_keys"] = list(credentials_info.keys()) if isinstance(credentials_info, dict) else "Not a dictionary"
            
            # Check for required fields
            required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email", "client_id"]
            missing_fields = [field for field in required_fields if field not in credentials_info]
            debug_info["missing_required_fields"] = missing_fields
            debug_info["has_all_required_fields"] = len(missing_fields) == 0
            
        except json.JSONDecodeError as e:
            debug_info["json_parse_success"] = False
            debug_info["json_parse_error"] = str(e)
            debug_info["recommended_fix"] = "Fix JSON formatting in GOOGLE_APPLICATION_CREDENTIALS_JSON. Common issues: escaped quotes, missing brackets, invalid characters"
            return debug_info
        except Exception as e:
            debug_info["json_parse_success"] = False
            debug_info["json_parse_error"] = f"Unexpected error: {str(e)}"
            return debug_info
        
        # Test credentials creation
        try:
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
            debug_info["credentials_creation_success"] = True
            debug_info["service_account_email"] = credentials.service_account_email
        except Exception as e:
            debug_info["credentials_creation_success"] = False
            debug_info["credentials_creation_error"] = str(e)
            debug_info["recommended_fix"] = "Service account JSON is malformed or missing required fields"
            return debug_info
        
        # Test BigQuery client creation
        try:
            client = bigquery.Client(credentials=credentials, project=project_id)
            debug_info["client_creation_success"] = True
            debug_info["client_project"] = client.project
            
            # Test a simple operation with timeout
            try:
                datasets = list(client.list_datasets(max_results=1))
                debug_info["client_test_success"] = True
                debug_info["datasets_count"] = len(datasets)
                debug_info["bigquery_access_confirmed"] = True
                
            except Exception as e:
                debug_info["client_test_success"] = False
                debug_info["client_test_error"] = str(e)
                debug_info["recommended_fix"] = "Service account might not have BigQuery permissions. Grant 'BigQuery Data Viewer' and 'BigQuery Job User' roles."
        
        except Exception as e:
            debug_info["client_creation_success"] = False
            debug_info["client_creation_error"] = str(e)
        
        return debug_info
        
    except Exception as e:
        debug_info["overall_error"] = str(e)
        debug_info["recommended_fix"] = "Unexpected error occurred during debugging"
        return debug_info
