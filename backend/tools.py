from langchain_core.tools import tool
from typing import List, Optional, Dict, Literal

@tool
def log_interaction(
    hcp_name: Optional[str] = None,
    interaction_type: Optional[Literal["Meeting", "Email", "Call"]] = None,
    interaction_date: Optional[str] = None,
    interaction_time: Optional[str] = None,
    attendees: Optional[str] = None,
    topics_discussed: Optional[str] = None,
    sentiment: Optional[Literal["Positive", "Neutral", "Negative"]] = None,
    outcomes: Optional[str] = None
) -> dict:
    """Extracts and logs the initial interaction details. Use this to populate the CRM form fields based on the first user input. For sentiment, ONLY use 'Positive', 'Neutral', or 'Negative'. For interaction_type, ONLY use 'Meeting', 'Email', or 'Call'."""
    updates = {}
    if hcp_name is not None: updates["hcp_name"] = hcp_name
    if interaction_type is not None: updates["interaction_type"] = interaction_type
    if interaction_date is not None: updates["interaction_date"] = interaction_date
    if interaction_time is not None: updates["interaction_time"] = interaction_time
    if attendees is not None: updates["attendees"] = attendees
    if topics_discussed is not None: updates["topics_discussed"] = topics_discussed
    if sentiment is not None: updates["sentiment"] = sentiment
    if outcomes is not None: updates["outcomes"] = outcomes
    return updates

@tool
def edit_interaction(
    field_to_update: str,
    new_value: str
) -> dict:
    """If the user mentions a mistake or wants to change a specific field (e.g., 'Change the HCP name to Dr. Adams'), use this tool. It will update ONLY the specific field mentioned while keeping all other data the same. Valid fields: hcp_name, interaction_type, interaction_date, interaction_time, attendees, topics_discussed, sentiment, outcomes. If updating sentiment, new_value MUST be 'Positive', 'Neutral', or 'Negative'. If updating interaction_type, new_value MUST be 'Meeting', 'Email', or 'Call'."""
    return {field_to_update: new_value}

@tool
def search_materials(query: str) -> dict:
    """Searches the company repository for available clinical brochures, materials, or samples. Call this before adding a material to verify it exists."""
    # Mock database logic for the tool
    available = ["OncoBoost Phase 3 Brochure", "Prodo-X Efficacy Study", "CardioPlus Samples", "General Product Guide"]
    matches = [m for m in available if query.lower() in m.lower()]
    if matches:
        # Also auto-add the first match to materials_shared state
        return {"search_results": matches, "materials_shared": matches}
    return {"search_results": ["No matching materials found."]}

@tool
def schedule_follow_up(action: str, due_date: str) -> dict:
    """Appends a new specific follow-up action to the follow_up_actions list (e.g. 'Send email', 'Next Tuesday')."""
    return {"_append_follow_up": {"action": action, "due_date": due_date}}

@tool
def save_interaction() -> dict:
    """Saves the current state of the interaction to the SQL database. Call this when the user says to log, save, or confirm the interaction."""
    return {"_save_requested": True}

tools = [
    log_interaction,
    edit_interaction,
    search_materials,
    schedule_follow_up,
    save_interaction
]
