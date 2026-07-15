import asyncio
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from agent import workflow

async def main():
    try:
        memory = MemorySaver()
        graph = workflow.compile(checkpointer=memory)
        config = {"configurable": {"thread_id": "test_1"}}
        input_state = {"messages": [HumanMessage(content="hi")]}
        print("Starting stream...")
        async for event in graph.astream(input_state, config=config, stream_mode="values"):
            print(event)
        print("Done.")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
