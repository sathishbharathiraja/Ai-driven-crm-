import os
import json
from typing import Annotated, TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, AIMessage, ToolMessage, SystemMessage
from langchain_groq import ChatGroq
from tools import tools
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    hcp_name: Optional[str]
    interaction_type: Optional[str]
    interaction_date: Optional[str]
    interaction_time: Optional[str]
    attendees: Optional[str]
    topics_discussed: Optional[str]
    materials_shared: Optional[List[str]]
    samples_distributed: Optional[List[str]]
    sentiment: Optional[str]
    outcomes: Optional[str]
    follow_up_actions: Optional[List[Dict[str, str]]]
    ai_suggested_follow_ups: Optional[List[str]]
    _save_requested: Optional[bool]

# Expected to have GROQ_API_KEY in environment
try:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    llm_with_tools = llm.bind_tools(tools)
except Exception as e:
    print(f"Warning: Failed to initialize ChatGroq: {e}")
    llm_with_tools = None

system_prompt = SystemMessage(content="""You are an expert Medical AI Assistant designed to help a pharmaceutical representative log Healthcare Professional (HCP) interactions into a CRM system. 
You MUST use the exact following 5 tools to perform all actions:
1. `log_interaction`: Use this to extract initial information and populate the CRM form fields based on the user's first input.
2. `edit_interaction`: Use this if the user wants to fix a mistake or change a specific field. It updates ONLY the specific field mentioned without touching other data.
3. `search_materials`: Use this to look up clinical brochures or samples before adding them to ensure they exist.
4. `schedule_follow_up`: Use this to append a specific follow-up task to the follow-up actions list.
5. `save_interaction`: Use this to commit the data to the SQL database when the user says to log, save, or confirm.
Always ask for clarification if something is missing. Do NOT output the raw JSON to the user; simply reply confirming what you've updated.
""")

def call_model(state: AgentState):
    if not llm_with_tools:
        return {"messages": [AIMessage(content="Error: LLM not initialized. Check GROQ_API_KEY.")]}
    
    messages = [system_prompt] + state['messages']
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def call_tools(state: AgentState):
    messages = state['messages']
    last_message = messages[-1]
    
    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return {}
    
    tool_messages = []
    state_updates = {}
    
    tool_by_name = {tool.name: tool for tool in tools}
    
    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        
        if tool_name in tool_by_name:
            tool_func = tool_by_name[tool_name]
            try:
                tool_result = tool_func.invoke(tool_args)
                if isinstance(tool_result, dict):
                    # Handle special appends
                    if "_append_follow_up" in tool_result:
                        current_follow_ups = state.get("follow_up_actions") or []
                        state_updates["follow_up_actions"] = current_follow_ups + [tool_result["_append_follow_up"]]
                        del tool_result["_append_follow_up"]
                    
                    if "materials_shared" in tool_result:
                        current_materials = state.get("materials_shared") or []
                        # Avoid duplicates
                        new_mats = [m for m in tool_result["materials_shared"] if m not in current_materials]
                        state_updates["materials_shared"] = current_materials + new_mats
                    
                    state_updates.update(tool_result)
                    tool_messages.append(
                        ToolMessage(
                            content=f"Successfully updated fields: {list(tool_result.keys()) + list(state_updates.keys())}",
                            name=tool_name,
                            tool_call_id=tool_call["id"]
                        )
                    )
                else:
                    tool_messages.append(
                        ToolMessage(
                            content=f"Tool executed but returned unexpected format: {type(tool_result)}",
                            name=tool_name,
                            tool_call_id=tool_call["id"]
                        )
                    )
            except Exception as e:
                tool_messages.append(
                    ToolMessage(
                        content=f"Error executing tool: {str(e)}",
                        name=tool_name,
                        tool_call_id=tool_call["id"]
                    )
                )
        else:
            tool_messages.append(
                ToolMessage(
                    content=f"Tool {tool_name} not found.",
                    name=tool_name,
                    tool_call_id=tool_call["id"]
                )
            )
            
    return {"messages": tool_messages, **state_updates}

def should_continue(state: AgentState) -> str:
    messages = state['messages']
    last_message = messages[-1]
    
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return END

# Define graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", call_tools)

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", END)

graph = workflow.compile()
