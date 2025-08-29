# app/agents/orchestrator_agent.py
from typing import Dict, Any, Optional, List
from app.agents.base_agent import BaseAgent, Message, MessageType, AgentStatus
from app.agents.communication import MessageBus
from app.agents.curator_agent import CuratorAgent
from app.agents.analyzer_agent import AnalyzerAgent
from app.agents.summarizer_agent import SummarizerAgent
from app.agents.query_agent import QueryAgent
import asyncio
import json
from enum import Enum


class WorkflowStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowStep(Enum):
    DOCUMENT_INGESTION = "document_ingestion"
    TEXT_ANALYSIS = "text_analysis"
    SUMMARIZATION = "summarization"
    INDEXING = "indexing"
    COMPLETION = "completion"


class DocumentWorkflow:
    def __init__(self, document_id: str, workflow_id: str):
        self.document_id = document_id
        self.workflow_id = workflow_id
        self.status = WorkflowStatus.PENDING
        self.current_step = WorkflowStep.DOCUMENT_INGESTION
        self.results = {}
        self.error_messages = []
        self.started_at = None
        self.completed_at = None


class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__("orchestrator", "orchestrator")
        self.sub_agents = {}
        self.active_workflows: Dict[str, DocumentWorkflow] = {}
        self.message_bus = MessageBus.get_instance()

    async def initialize(self):
        """Initialize orchestrator and sub-agents"""
        # Register with message bus
        await self.message_bus.register_agent(self)

        # Create and initialize sub-agents
        self.sub_agents = {
            "curator": CuratorAgent(),
            "analyzer": AnalyzerAgent(),
            "summarizer": SummarizerAgent(),
            "query": QueryAgent(),
        }

        # Start all sub-agents
        for agent in self.sub_agents.values():
            await self.message_bus.register_agent(agent)
            await agent.start()

        print("Orchestrator and all sub-agents initialized")

    async def cleanup(self):
        """Cleanup orchestrator and sub-agents"""
        # Stop all sub-agents
        for agent in self.sub_agents.values():
            await agent.stop()
            await self.message_bus.unregister_agent(agent.agent_id)

        await self.message_bus.unregister_agent(self.agent_id)
        print("Orchestrator and sub-agents shut down")

    async def process_message(self, message: Message) -> Optional[Message]:
        """Process incoming orchestrator messages"""
        try:
            if message.message_type == MessageType.REQUEST:
                return await self._handle_request(message)
            elif message.message_type == MessageType.RESPONSE:
                return await self._handle_response(message)
            elif message.message_type == MessageType.ERROR:
                return await self._handle_error_message(message)

        except Exception as e:
            print(f"Orchestrator error processing message: {e}")
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _handle_request(self, message: Message) -> Optional[Message]:
        """Handle incoming requests"""
        action = message.payload.get("action")

        if action == "process_document":
            return await self._start_document_workflow(message)
        elif action == "get_workflow_status":
            return await self._get_workflow_status(message)
        elif action == "query_documents":
            return await self._handle_query(message)
        elif action == "get_system_status":
            return await self._get_system_status(message)

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.ERROR,
            payload={"error": f"Unknown action: {action}"},
        )

    async def _handle_response(self, message: Message) -> Optional[Message]:
        """Handle responses from sub-agents"""
        workflow_id = message.payload.get("workflow_id")
        if not workflow_id or workflow_id not in self.active_workflows:
            return None

        workflow = self.active_workflows[workflow_id]
        step_result = message.payload.get("result")

        # Store step result
        workflow.results[workflow.current_step.value] = step_result

        # Move to next step
        await self._advance_workflow(workflow, message.from_agent)

        return None

    async def _handle_error_message(self, message: Message) -> Optional[Message]:
        """Handle error messages from sub-agents"""
        workflow_id = message.payload.get("workflow_id")
        if workflow_id and workflow_id in self.active_workflows:
            workflow = self.active_workflows[workflow_id]
            workflow.status = WorkflowStatus.FAILED
            workflow.error_messages.append(
                {
                    "agent": message.from_agent,
                    "error": message.payload.get("error"),
                    "step": workflow.current_step.value,
                }
            )

        return None

    async def _start_document_workflow(self, message: Message) -> Message:
        """Start a new document processing workflow"""
        document_id = message.payload.get("document_id")
        workflow_id = message.payload.get("workflow_id", f"workflow_{document_id}")

        # Create new workflow
        workflow = DocumentWorkflow(document_id, workflow_id)
        workflow.status = WorkflowStatus.PROCESSING
        workflow.started_at = asyncio.get_event_loop().time()
        self.active_workflows[workflow_id] = workflow

        # Start with curator agent
        await self.send_message(
            "curator",
            MessageType.REQUEST,
            {
                "action": "ingest_document",
                "document_id": document_id,
                "workflow_id": workflow_id,
                "file_path": message.payload.get("file_path"),
            },
        )

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.RESPONSE,
            payload={
                "workflow_id": workflow_id,
                "status": workflow.status.value,
                "message": "Document workflow started",
            },
        )

    async def _advance_workflow(self, workflow: DocumentWorkflow, completed_agent: str):
        """Advance workflow to next step"""
        step_transitions = {
            WorkflowStep.DOCUMENT_INGESTION: (WorkflowStep.TEXT_ANALYSIS, "analyzer"),
            WorkflowStep.TEXT_ANALYSIS: (WorkflowStep.SUMMARIZATION, "summarizer"),
            WorkflowStep.SUMMARIZATION: (WorkflowStep.INDEXING, "query"),
            WorkflowStep.INDEXING: (WorkflowStep.COMPLETION, None),
        }

        if workflow.current_step in step_transitions:
            next_step, next_agent = step_transitions[workflow.current_step]
            workflow.current_step = next_step

            if next_agent:
                # Send to next agent
                await self.send_message(
                    next_agent,
                    MessageType.REQUEST,
                    {
                        "action": self._get_action_for_step(next_step),
                        "document_id": workflow.document_id,
                        "workflow_id": workflow.workflow_id,
                        "previous_results": workflow.results,
                    },
                )
            else:
                # Workflow complete
                workflow.status = WorkflowStatus.COMPLETED
                workflow.completed_at = asyncio.get_event_loop().time()
                await self._notify_workflow_completion(workflow)

    def _get_action_for_step(self, step: WorkflowStep) -> str:
        """Get the action name for a workflow step"""
        action_map = {
            WorkflowStep.TEXT_ANALYSIS: "analyze_document",
            WorkflowStep.SUMMARIZATION: "summarize_document",
            WorkflowStep.INDEXING: "index_document",
        }
        return action_map.get(step, "process")

    async def _notify_workflow_completion(self, workflow: DocumentWorkflow):
        """Notify about workflow completion"""
        print(
            f"Workflow {workflow.workflow_id} completed for document {workflow.document_id}"
        )

        # Could send notifications to external systems here
        # or trigger additional processing

    async def _get_workflow_status(self, message: Message) -> Message:
        """Get status of a specific workflow"""
        workflow_id = message.payload.get("workflow_id")

        if workflow_id not in self.active_workflows:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": f"Workflow {workflow_id} not found"},
            )

        workflow = self.active_workflows[workflow_id]

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.RESPONSE,
            payload={
                "workflow_id": workflow_id,
                "document_id": workflow.document_id,
                "status": workflow.status.value,
                "current_step": workflow.current_step.value,
                "results": workflow.results,
                "error_messages": workflow.error_messages,
            },
        )

    async def _handle_query(self, message: Message) -> Message:
        """Handle document queries"""
        # Forward to query agent
        await self.send_message(
            "query",
            MessageType.REQUEST,
            {
                "action": "answer_query",
                "query": message.payload.get("query"),
                "correlation_id": message.id,
            },
        )

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.RESPONSE,
            payload={"message": "Query forwarded to query agent"},
        )

    async def _get_system_status(self, message: Message) -> Message:
        """Get overall system status"""
        agent_status = self.message_bus.get_agent_status()

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.RESPONSE,
            payload={
                "system_status": "operational",
                "agents": agent_status,
                "active_workflows": len(self.active_workflows),
                "message_history_size": len(self.message_bus.message_history),
            },
        )


# Helper function for external API access
def get_orchestrator() -> OrchestratorAgent:
    """Get the global orchestrator instance"""
    from app.main import orchestrator

    return orchestrator
