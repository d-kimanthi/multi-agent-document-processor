from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.agents.orchestrator_agent import get_orchestrator
from app.agents.communication import MessageBus

router = APIRouter()


@router.get("/status")
async def get_agent_status():
    """Get status of all agents in the system"""
    try:
        orchestrator = get_orchestrator()
        if not orchestrator:
            raise HTTPException(status_code=503, detail="Orchestrator not available")

        message_bus = MessageBus.get_instance()
        agent_status = message_bus.get_agent_status()

        return {
            "system_status": "operational",
            "total_agents": len(agent_status),
            "agents": agent_status,
            "message_bus_stats": {
                "registered_agents": len(message_bus.agents),
                "message_history_size": len(message_bus.message_history),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get agent status: {str(e)}"
        )


@router.get("/messages")
async def get_message_history(limit: int = 100):
    """Get recent message history between agents"""
    try:
        message_bus = MessageBus.get_instance()
        message_history = message_bus.get_message_history(limit)

        return {
            "total_messages": len(message_bus.message_history),
            "returned_messages": len(message_history),
            "messages": message_history,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get message history: {str(e)}"
        )


@router.get("/workflows")
async def get_active_workflows():
    """Get information about active workflows"""
    try:
        orchestrator = get_orchestrator()
        if not orchestrator:
            raise HTTPException(status_code=503, detail="Orchestrator not available")

        workflows = []
        for workflow_id, workflow in orchestrator.active_workflows.items():
            workflows.append(
                {
                    "workflow_id": workflow_id,
                    "document_id": workflow.document_id,
                    "status": workflow.status.value,
                    "current_step": workflow.current_step.value,
                    "started_at": workflow.started_at,
                    "completed_at": workflow.completed_at,
                    "error_messages": workflow.error_messages,
                    "progress": len(workflow.results),
                }
            )

        return {"active_workflows": len(workflows), "workflows": workflows}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get workflows: {str(e)}"
        )


@router.get("/metrics")
async def get_system_metrics():
    """Get system performance metrics"""
    try:
        orchestrator = get_orchestrator()
        if not orchestrator:
            raise HTTPException(status_code=503, detail="Orchestrator not available")

        message_bus = MessageBus.get_instance()
        agent_status = message_bus.get_agent_status()

        # Calculate aggregate metrics
        total_messages = sum(
            agent["metrics"]["messages_processed"] for agent in agent_status.values()
        )
        total_errors = sum(
            agent["metrics"]["errors"] for agent in agent_status.values()
        )
        avg_processing_time = (
            sum(agent["metrics"]["processing_time"] for agent in agent_status.values())
            / len(agent_status)
            if agent_status
            else 0
        )

        return {
            "system_metrics": {
                "total_messages_processed": total_messages,
                "total_errors": total_errors,
                "error_rate": total_errors / max(total_messages, 1),
                "average_processing_time": avg_processing_time,
                "active_agents": len(
                    [a for a in agent_status.values() if a["status"] != "stopped"]
                ),
                "total_agents": len(agent_status),
            },
            "agent_metrics": agent_status,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@router.post("/agents/{agent_id}/restart")
async def restart_agent(agent_id: str):
    """Restart a specific agent"""
    try:
        orchestrator = get_orchestrator()
        if not orchestrator:
            raise HTTPException(status_code=503, detail="Orchestrator not available")

        if agent_id not in orchestrator.sub_agents:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        agent = orchestrator.sub_agents[agent_id]

        # Stop and restart the agent
        await agent.stop()
        await agent.start()

        return {
            "message": f"Agent {agent_id} restarted successfully",
            "agent_id": agent_id,
            "status": agent.status.value,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to restart agent: {str(e)}"
        )
