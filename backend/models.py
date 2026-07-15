from sqlalchemy import Column, Integer, String, Text
from database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String, index=True)
    interaction_type = Column(String)
    interaction_date = Column(String)
    interaction_time = Column(String)
    attendees = Column(String)
    topics_discussed = Column(Text)
    materials_shared = Column(String) # JSON string
    samples_distributed = Column(String) # JSON string
    sentiment = Column(String)
    outcomes = Column(Text)
    follow_up_actions = Column(String) # JSON string
    ai_suggested_follow_ups = Column(String) # JSON string
