#!/bin/bash

echo "Stopping all microservices..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local service_dir=$2
    
    if [ -f "${service_dir}/${service_name}.pid" ]; then
        local pid=$(cat "${service_dir}/${service_name}.pid")
        if ps -p $pid > /dev/null; then
            echo "Stopping $service_name (PID: $pid)..."
            kill $pid
            rm "${service_dir}/${service_name}.pid"
        else
            echo "$service_name is not running"
            rm "${service_dir}/${service_name}.pid"
        fi
    else
        echo "No PID file found for $service_name"
    fi
}

cd "$(dirname "$0")"

# Stop all services
stop_service "serviceregistry" "Backend/serviceregistry"
stop_service "gateway" "Backend/gateway"
stop_service "dealer" "Backend/dealer"
stop_service "postings" "Backend/postings"
stop_service "tech-dashboard" "Backend/tech-dashboard"
stop_service "technician" "Backend/techincian"

echo "All services stopped."
