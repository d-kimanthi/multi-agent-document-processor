import time
from typing import Dict, Any
from functools import wraps
import asyncio


class MetricsCollector:
    def __init__(self):
        self.metrics = {
            "request_count": 0,
            "error_count": 0,
            "response_times": [],
            "agent_metrics": {},
        }

    def increment_requests(self):
        self.metrics["request_count"] += 1

    def increment_errors(self):
        self.metrics["error_count"] += 1

    def add_response_time(self, response_time: float):
        self.metrics["response_times"].append(response_time)
        # Keep only last 1000 response times
        if len(self.metrics["response_times"]) > 1000:
            self.metrics["response_times"] = self.metrics["response_times"][-500:]

    def get_metrics(self) -> Dict[str, Any]:
        response_times = self.metrics["response_times"]
        return {
            "request_count": self.metrics["request_count"],
            "error_count": self.metrics["error_count"],
            "error_rate": self.metrics["error_count"]
            / max(self.metrics["request_count"], 1),
            "avg_response_time": (
                sum(response_times) / len(response_times) if response_times else 0
            ),
            "min_response_time": min(response_times) if response_times else 0,
            "max_response_time": max(response_times) if response_times else 0,
        }


# Global metrics collector
metrics_collector = MetricsCollector()


def track_metrics(func):
    """Decorator to track function execution metrics"""

    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        metrics_collector.increment_requests()

        try:
            result = await func(*args, **kwargs)
            return result
        except Exception as e:
            metrics_collector.increment_errors()
            raise
        finally:
            end_time = time.time()
            metrics_collector.add_response_time(end_time - start_time)

    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        metrics_collector.increment_requests()

        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            metrics_collector.increment_errors()
            raise
        finally:
            end_time = time.time()
            metrics_collector.add_response_time(end_time - start_time)

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def get_metrics() -> Dict[str, Any]:
    """Get current metrics"""
    return metrics_collector.get_metrics()
