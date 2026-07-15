import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver
from agent import workflow

from database import engine, Base, SessionLocal
from models import Interaction

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory = MemorySaver()
graph = workflow.compile(checkpointer=memory)

def save_interaction_to_db(state: dict):
    db = SessionLocal()
    try:
        interaction = Interaction(
            hcp_name=state.get("hcp_name"),
            interaction_type=state.get("interaction_type"),
            interaction_date=state.get("interaction_date"),
            interaction_time=state.get("interaction_time"),
            attendees=state.get("attendees"),
            topics_discussed=state.get("topics_discussed"),
            materials_shared=json.dumps(state.get("materials_shared") or []),
            samples_distributed=json.dumps(state.get("samples_distributed") or []),
            sentiment=state.get("sentiment"),
            outcomes=state.get("outcomes"),
            follow_up_actions=json.dumps(state.get("follow_up_actions") or []),
            ai_suggested_follow_ups=json.dumps(state.get("ai_suggested_follow_ups") or [])
        )
        db.add(interaction)
        db.commit()
    finally:
        db.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    thread_id = str(id(websocket))
    config = {"configurable": {"thread_id": thread_id}}
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_text = message_data.get("message")
            if not user_text:
                continue
                
            input_state = {"messages": [HumanMessage(content=user_text)]}
            
            try:
                async for event in graph.astream(input_state, config=config, stream_mode="values"):
                    state = event
                    
                    serializable_state = {
                        "hcp_name": state.get("hcp_name") or "",
                        "interaction_type": state.get("interaction_type") or "Meeting",
                        "interaction_date": state.get("interaction_date") or "",
                        "interaction_time": state.get("interaction_time") or "",
                        "attendees": state.get("attendees") or "",
                        "topics_discussed": state.get("topics_discussed") or "",
                        "materials_shared": state.get("materials_shared") or [],
                        "samples_distributed": state.get("samples_distributed") or [],
                        "sentiment": state.get("sentiment") or "",
                        "outcomes": state.get("outcomes") or "",
                        "follow_up_actions": state.get("follow_up_actions") or [],
                        "ai_suggested_follow_ups": state.get("ai_suggested_follow_ups") or []
                    }
                    
                    if state.get("_save_requested"):
                        save_interaction_to_db(serializable_state)
                        # Reset the save flag in graph state to prevent duplicate saves
                        state["_save_requested"] = False
                    
                    messages = state.get("messages", [])
                    latest_msg = ""
                    msg_id = ""
                    for msg in reversed(messages):
                        if isinstance(msg, AIMessage) and msg.content:
                            msg_id = getattr(msg, "id", None) or str(id(msg))
                            if isinstance(msg.content, str):
                                latest_msg = msg.content
                                break
                            elif isinstance(msg.content, list):
                                text_chunks = [c.get("text", "") for c in msg.content if isinstance(c, dict) and c.get("type") == "text"]
                                text = " ".join(text_chunks).strip()
                                if text:
                                    latest_msg = text
                                    break
                                if any(c.get("type") == "tool_use" for c in msg.content if isinstance(c, dict)):
                                    break
                    
                    response_payload = {
                        "type": "state_update",
                        "state": serializable_state,
                        "latest_ai_message": latest_msg,
                        "message_id": msg_id
                    }
                    await websocket.send_text(json.dumps(response_payload))
            except Exception as e:
                error_msg = f"LangGraph Error: {str(e)}"
                print(error_msg)
                if 'state' not in locals():
                    state = {}
                fallback_state = {
                    "hcp_name": state.get("hcp_name") or "",
                    "interaction_type": state.get("interaction_type") or "Meeting",
                    "interaction_date": state.get("interaction_date") or "",
                    "interaction_time": state.get("interaction_time") or "",
                    "attendees": state.get("attendees") or "",
                    "topics_discussed": state.get("topics_discussed") or "",
                    "materials_shared": state.get("materials_shared") or [],
                    "samples_distributed": state.get("samples_distributed") or [],
                    "sentiment": state.get("sentiment") or "",
                    "outcomes": state.get("outcomes") or "",
                    "follow_up_actions": state.get("follow_up_actions") or [],
                    "ai_suggested_follow_ups": state.get("ai_suggested_follow_ups") or []
                }
                
                response_payload = {
                    "type": "state_update",
                    "state": fallback_state,
                    "latest_ai_message": error_msg
                }
                await websocket.send_text(json.dumps(response_payload))
                
    except WebSocketDisconnect:
        print(f"Client {thread_id} disconnected")
    except Exception as e:
        print(f"Error: {e}")
