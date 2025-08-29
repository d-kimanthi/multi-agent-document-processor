from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import BaseModel
import asyncio
import uuid
from datetime import datetime
import json


class AgentStatus(Enum):
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    STOPPED = "stopped"


class MessageType(Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class Message(BaseModel):
    id: str = None
    from_agent: str
    to_agent: str
    message_type: MessageType
    payload: Dict[str, Any]
    timestamp: datetime = None
    correlation_id: Optional[str] = None

    def __init__(self, **data):
        if data.get("id") is None:
            data["id"] = str(uuid.uuid4())
        if data.get("timestamp") is None:
            data["timestamp"] = datetime.utcnow()
        super().__init__(**data)


class BaseAgent(ABC):
    def __init__(self, agent_id: str, agent_type: str):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.status = AgentStatus.IDLE
        self.message_queue = asyncio.Queue(maxsize=1000)
        self.running = False
        self.metrics = {"messages_processed": 0, "errors": 0, "processing_time": 0.0}

    async def start(self):
        """Start the agent"""
        self.running = True
        self.status = AgentStatus.IDLE
        asyncio.create_task(self._message_loop())
        await self.initialize()

    async def stop(self):
        """Stop the agent"""
        self.running = False
        self.status = AgentStatus.STOPPED
        await self.cleanup()

    @abstractmethod
    async def initialize(self):
        """Initialize agent-specific resources"""
        pass

    @abstractmethod
    async def cleanup(self):
        """Cleanup agent-specific resources"""
        pass

    @abstractmethod
    async def process_message(self, message: Message) -> Optional[Message]:
        """Process incoming message and return response if needed"""
        pass

    async def send_message(
        self,
        to_agent: str,
        message_type: MessageType,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
    ):
        """Send message to another agent"""
        from app.agents.communication import MessageBus

        message = Message(
            from_agent=self.agent_id,
            to_agent=to_agent,
            message_type=message_type,
            payload=payload,
            correlation_id=correlation_id,
        )

        await MessageBus.get_instance().send_message(message)

    async def _message_loop(self):
        """Main message processing loop"""
        while self.running:
            try:
                # Get message with timeout
                message = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)

                self.status = AgentStatus.BUSY
                start_time = asyncio.get_event_loop().time()

                # Process message
                response = await self.process_message(message)

                # Send response if needed
                if response:
                    await self.send_message(
                        response.to_agent,
                        response.message_type,
                        response.payload,
                        message.id,  # Use original message ID as correlation
                    )

                # Update metrics
                processing_time = asyncio.get_event_loop().time() - start_time
                self.metrics["messages_processed"] += 1
                self.metrics["processing_time"] += processing_time

                self.status = AgentStatus.IDLE

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.status = AgentStatus.ERROR
                self.metrics["errors"] += 1
                await self._handle_error(e, message if "message" in locals() else None)

    async def _handle_error(self, error: Exception, message: Optional[Message]):
        """Handle processing errors"""
        print(f"Agent {self.agent_id} error: {str(error)}")

        if message:
            # Send error response
            await self.send_message(
                message.from_agent,
                MessageType.ERROR,
                {"error": str(error), "original_message_id": message.id},
            )
