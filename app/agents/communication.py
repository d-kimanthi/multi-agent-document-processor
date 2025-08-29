import asyncio
from typing import Dict, Optional
from app.agents.base_agent import BaseAgent, Message


class MessageBus:
    _instance = None

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.message_history: List[Message] = []
        self.running = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def register_agent(self, agent: BaseAgent):
        """Register an agent with the message bus"""
        self.agents[agent.agent_id] = agent

    async def unregister_agent(self, agent_id: str):
        """Unregister an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]

    async def send_message(self, message: Message):
        """Send message to target agent"""
        if message.to_agent not in self.agents:
            raise ValueError(f"Agent {message.to_agent} not found")

        target_agent = self.agents[message.to_agent]

        # Add to message history for monitoring
        self.message_history.append(message)
        if len(self.message_history) > 10000:  # Keep last 10k messages
            self.message_history = self.message_history[-5000:]

        # Send to agent's queue
        try:
            await target_agent.message_queue.put(message)
        except asyncio.QueueFull:
            raise RuntimeError(f"Agent {message.to_agent} message queue is full")

    async def broadcast_message(
        self, message: Message, exclude_agent: Optional[str] = None
    ):
        """Broadcast message to all agents except sender"""
        for agent_id, agent in self.agents.items():
            if agent_id != exclude_agent:
                message_copy = message.copy()
                message_copy.to_agent = agent_id
                await self.send_message(message_copy)

    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        return {
            agent_id: {
                "status": agent.status.value,
                "metrics": agent.metrics,
                "queue_size": agent.message_queue.qsize(),
            }
            for agent_id, agent in self.agents.items()
        }

    def get_message_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent message history"""
        return [
            {
                "id": msg.id,
                "from": msg.from_agent,
                "to": msg.to_agent,
                "type": msg.message_type.value,
                "timestamp": msg.timestamp.isoformat(),
                "correlation_id": msg.correlation_id,
            }
            for msg in self.message_history[-limit:]
        ]
