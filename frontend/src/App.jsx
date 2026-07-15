import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateInteractionState } from './redux/interactionSlice';
import CRMForm from './components/CRMForm';
import AIAssistant from './components/AIAssistant';

function App() {
  const dispatch = useDispatch();
  const state = useSelector(state => state.interaction);

  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'ai',
      text: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.',
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [ws, setWs] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket('ws://localhost:8000/ws');
    
    socket.onopen = () => {
      console.log('Connected to WebSocket server');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'state_update') {
        setIsTyping(false);
        // Dispatch to Redux
        dispatch(updateInteractionState(data.state));
        
        if (data.latest_ai_message) {
          setMessages(prev => {
            const msgId = data.message_id || Date.now().toString();
            const existingIndex = prev.findIndex(m => m.id === msgId);
            if (existingIndex !== -1) {
              // Update existing message
              const newMessages = [...prev];
              newMessages[existingIndex] = {
                ...newMessages[existingIndex],
                text: data.latest_ai_message
              };
              return newMessages;
            } else {
              // Add new message
              return [
                ...prev,
                {
                  id: msgId,
                  sender: 'ai',
                  text: data.latest_ai_message,
                  timestamp: new Date().toISOString()
                }
              ];
            }
          });
        }
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, [dispatch]);

  const handleSendMessage = (text) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    // Add user message to UI immediately
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: text,
        timestamp: new Date().toISOString()
      }
    ]);
    
    setIsTyping(true);
    
    // Send to backend
    ws.send(JSON.stringify({ message: text }));
  };

  return (
    <div className="app-container">
      <div className="panel left-panel">
        <CRMForm state={state} />
      </div>
      <div className="panel right-panel">
        <AIAssistant 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping} 
          connected={ws !== null}
        />
      </div>
    </div>
  );
}

export default App;
