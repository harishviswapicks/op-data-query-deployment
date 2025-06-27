#!/usr/bin/env python3
"""
Redis Setup and Testing Script for Celery Integration
This script helps set up and test Redis connection for Celery
"""

import os
import sys
import time
import redis
import subprocess
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RedisSetup:
    def __init__(self):
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis_db = int(os.getenv("REDIS_DB", 0))
        self.redis_password = os.getenv("REDIS_PASSWORD")
        
        # Create Redis connection
        self.redis_client = redis.Redis(
            host=self.redis_host,
            port=self.redis_port,
            db=self.redis_db,
            password=self.redis_password,
            decode_responses=True
        )
    
    def test_redis_connection(self) -> Dict[str, Any]:
        """Test Redis connection and return status"""
        try:
            # Test basic connection
            self.redis_client.ping()
            
            # Test basic operations
            test_key = "test_connection"
            test_value = "redis_working"
            
            self.redis_client.set(test_key, test_value, ex=10)  # Expire in 10 seconds
            retrieved_value = self.redis_client.get(test_key)
            
            if retrieved_value == test_value:
                self.redis_client.delete(test_key)
                return {
                    "status": "success",
                    "message": "Redis connection successful",
                    "host": self.redis_host,
                    "port": self.redis_port,
                    "db": self.redis_db
                }
            else:
                return {
                    "status": "error",
                    "message": "Redis set/get operation failed"
                }
        
        except redis.ConnectionError as e:
            return {
                "status": "error",
                "message": f"Redis connection failed: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Redis test failed: {str(e)}"
            }
    
    def get_redis_info(self) -> Dict[str, Any]:
        """Get Redis server information"""
        try:
            info = self.redis_client.info()
            return {
                "status": "success",
                "redis_version": info.get("redis_version", "unknown"),
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_in_seconds": info.get("uptime_in_seconds", 0),
                "role": info.get("role", "unknown")
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to get Redis info: {str(e)}"
            }
    
    def test_celery_connection(self) -> Dict[str, Any]:
        """Test Celery connection to Redis"""
        try:
            from tasks.celery_app import celery_app
            
            # Test broker connection
            broker_connection = celery_app.connection()
            broker_connection.ensure_connection(max_retries=3)
            
            # Get Celery inspect
            inspect = celery_app.control.inspect()
            
            # Check active workers
            active_workers = inspect.active()
            registered_tasks = inspect.registered()
            
            return {
                "status": "success",
                "message": "Celery connection to Redis successful",
                "broker_url": celery_app.conf.broker_url,
                "result_backend": celery_app.conf.result_backend,
                "active_workers": list(active_workers.keys()) if active_workers else [],
                "worker_count": len(active_workers) if active_workers else 0,
                "registered_tasks": registered_tasks
            }
        
        except ImportError as e:
            return {
                "status": "error",
                "message": f"Failed to import Celery: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Celery connection test failed: {str(e)}"
            }
    
    def run_test_task(self) -> Dict[str, Any]:
        """Run a test Celery task"""
        try:
            from tasks.report_tasks import health_check
            
            # Send test task
            result = health_check.delay()
            
            # Wait for result (with timeout)
            task_result = result.get(timeout=30)
            
            return {
                "status": "success",
                "message": "Test task completed successfully",
                "task_id": result.id,
                "task_result": task_result
            }
        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Test task failed: {str(e)}"
            }
    
    def start_redis_locally(self) -> Dict[str, Any]:
        """Start Redis server locally (for development)"""
        try:
            # Check if Redis is already running
            result = subprocess.run(
                ["redis-cli", "ping"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout.strip() == "PONG":
                return {
                    "status": "info",
                    "message": "Redis is already running"
                }
            
            # Try to start Redis server
            subprocess.Popen(
                ["redis-server"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait a moment for Redis to start
            time.sleep(2)
            
            # Test connection
            test_result = self.test_redis_connection()
            if test_result["status"] == "success":
                return {
                    "status": "success",
                    "message": "Redis server started successfully"
                }
            else:
                return {
                    "status": "error",
                    "message": "Redis server failed to start properly"
                }
        
        except FileNotFoundError:
            return {
                "status": "error",
                "message": "Redis not installed. Install with: brew install redis (macOS) or apt-get install redis-server (Ubuntu)"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to start Redis: {str(e)}"
            }

def print_result(title: str, result: Dict[str, Any]):
    """Pretty print test results"""
    print(f"\n{'='*50}")
    print(f"{title}")
    print(f"{'='*50}")
    
    status = result.get("status", "unknown")
    message = result.get("message", "No message")
    
    if status == "success":
        print(f"✅ {message}")
    elif status == "error":
        print(f"❌ {message}")
    elif status == "info":
        print(f"ℹ️  {message}")
    
    # Print additional details
    for key, value in result.items():
        if key not in ["status", "message"]:
            if isinstance(value, (dict, list)) and len(str(value)) > 100:
                print(f"   {key}: [Large data structure - {type(value).__name__}]")
            else:
                print(f"   {key}: {value}")

def main():
    """Main function to run all Redis and Celery tests"""
    print("🚀 Redis and Celery Setup & Testing")
    print("This script will test your Redis and Celery configuration\n")
    
    setup = RedisSetup()
    
    # Test 1: Start Redis (if needed)
    print("1. Starting Redis server...")
    start_result = setup.start_redis_locally()
    print_result("Redis Server Start", start_result)
    
    # Test 2: Test Redis connection
    print("\n2. Testing Redis connection...")
    connection_result = setup.test_redis_connection()
    print_result("Redis Connection Test", connection_result)
    
    if connection_result["status"] != "success":
        print("\n❌ Redis connection failed. Please ensure Redis is running.")
        sys.exit(1)
    
    # Test 3: Get Redis info
    print("\n3. Getting Redis server information...")
    info_result = setup.get_redis_info()
    print_result("Redis Server Info", info_result)
    
    # Test 4: Test Celery connection
    print("\n4. Testing Celery connection to Redis...")
    celery_result = setup.test_celery_connection()
    print_result("Celery Connection Test", celery_result)
    
    # Test 5: Run test task (only if workers are running)
    if celery_result.get("worker_count", 0) > 0:
        print("\n5. Running test Celery task...")
        task_result = setup.run_test_task()
        print_result("Celery Test Task", task_result)
    else:
        print("\n5. Skipping test task (no active workers)")
        print("   To run tasks, start Celery workers with: ./start_celery.sh")
    
    print(f"\n{'='*50}")
    print("🎉 Redis and Celery setup test completed!")
    print(f"{'='*50}")
    
    # Summary
    if connection_result["status"] == "success":
        print("✅ Redis is working correctly")
        if celery_result["status"] == "success":
            print("✅ Celery can connect to Redis")
            if celery_result.get("worker_count", 0) > 0:
                print("✅ Celery workers are running")
            else:
                print("⚠️  No Celery workers detected - start with ./start_celery.sh")
        else:
            print("❌ Celery cannot connect to Redis")
    else:
        print("❌ Redis setup needs attention")

if __name__ == "__main__":
    main() 