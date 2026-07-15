import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Clock, Mic, Search, PlusSquare, Smile, Meh, Frown } from 'lucide-react';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const CRMForm = () => {
  const state = useSelector(state => state.interaction);
  const prevState = usePrevious(state) || {};

  const isUpdated = (key) => {
    if (!prevState) return false;
    return JSON.stringify(prevState[key]) !== JSON.stringify(state[key]);
  };

  return (
    <div className="crm-form-container">
      <h1 className="main-title">Log HCP Interaction</h1>
      
      <div className="crm-form">
        <h3 className="section-title">Interaction Details</h3>

        <div className="form-row">
          <div className="form-group flex-2">
            <label>HCP Name</label>
            <input 
              type="text" 
              className={`form-input ${isUpdated('hcp_name') ? 'updated-field' : ''}`}
              value={state.hcp_name || ''} 
              readOnly 
              placeholder="Search or select HCP..."
            />
          </div>
          <div className="form-group flex-1">
            <label>Interaction Type</label>
            <select 
              className={`form-input ${isUpdated('interaction_type') ? 'updated-field' : ''}`}
              value={state.interaction_type || 'Meeting'} 
              disabled
            >
              <option value="Meeting">Meeting</option>
              <option value="Email">Email</option>
              <option value="Call">Call</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>Date</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className={`form-input ${isUpdated('interaction_date') ? 'updated-field' : ''}`}
                value={state.interaction_date || '19-04-2025'} 
                readOnly 
              />
              <Calendar size={16} className="icon-right" />
            </div>
          </div>
          <div className="form-group flex-1">
            <label>Time</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className={`form-input ${isUpdated('interaction_time') ? 'updated-field' : ''}`}
                value={state.interaction_time || '19:36'} 
                readOnly 
              />
              <Clock size={16} className="icon-right" />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Attendees</label>
          <input 
            type="text" 
            className={`form-input ${isUpdated('attendees') ? 'updated-field' : ''}`}
            value={state.attendees || ''} 
            readOnly 
            placeholder="Enter names or search..."
          />
        </div>

        <div className="form-group">
          <label>Topics Discussed</label>
          <div className="textarea-wrapper">
            <textarea 
              className={`form-input ${isUpdated('topics_discussed') ? 'updated-field' : ''}`}
              value={state.topics_discussed || ''} 
              readOnly 
              placeholder="Enter key discussion points..."
              rows={3}
            />
            <Mic size={16} className="icon-bottom-right" />
          </div>
          <button className="voice-note-btn" disabled>
             <Mic size={14} style={{marginRight: '6px'}}/> Summarize from Voice Note (Requires Consent)
          </button>
        </div>

        <div className="form-group">
          <label>Materials Shared / Samples Distributed</label>
          
          <div className="materials-row">
            <div className="materials-content">
              <span className="materials-title">Materials Shared</span>
              <p className="materials-empty">
                {state.materials_shared && state.materials_shared.length > 0 
                  ? state.materials_shared.join(', ') 
                  : 'No materials added.'}
              </p>
            </div>
            <button className="action-btn" disabled><Search size={14} style={{marginRight: '4px'}}/> Search/Add</button>
          </div>

          <div className="materials-row">
            <div className="materials-content">
              <span className="materials-title">Samples Distributed</span>
              <p className="materials-empty">
                {state.samples_distributed && state.samples_distributed.length > 0 
                  ? state.samples_distributed.join(', ') 
                  : 'No samples added.'}
              </p>
            </div>
            <button className="action-btn" disabled><PlusSquare size={14} style={{marginRight: '4px'}}/> Add Sample</button>
          </div>
        </div>

        <div className="form-group">
          <label>Observed/Inferred HCP Sentiment</label>
          <div className="sentiment-group">
            <label className="radio-label">
              <input type="radio" checked={state.sentiment === 'Positive'} disabled />
              <Smile size={18} color={state.sentiment === 'Positive' ? '#10b981' : '#94a3b8'} className="sentiment-icon"/> Positive
            </label>
            <label className="radio-label">
              <input type="radio" checked={state.sentiment === 'Neutral' || !state.sentiment} disabled />
              <Meh size={18} color={(state.sentiment === 'Neutral' || !state.sentiment) ? '#f59e0b' : '#94a3b8'} className="sentiment-icon"/> Neutral
            </label>
            <label className="radio-label">
              <input type="radio" checked={state.sentiment === 'Negative'} disabled />
              <Frown size={18} color={state.sentiment === 'Negative' ? '#ef4444' : '#94a3b8'} className="sentiment-icon"/> Negative
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Outcomes</label>
          <textarea 
            className={`form-input ${isUpdated('outcomes') ? 'updated-field' : ''}`}
            value={state.outcomes || ''} 
            readOnly 
            placeholder="Key outcomes or agreements..."
            rows={2}
          />
        </div>

        <div className="form-group">
          <label>Follow-up Actions</label>
          <textarea 
            className={`form-input ${isUpdated('follow_up_actions') ? 'updated-field' : ''}`}
            value={state.follow_up_actions && state.follow_up_actions.length > 0 
              ? state.follow_up_actions.map(a => `- ${a.action || a.task} (Due: ${a.due_date})`).join('\n') 
              : ''} 
            readOnly 
            placeholder="Enter next steps or tasks..."
            rows={2}
          />
        </div>

        <div className="ai-suggestions">
          <label>AI Suggested Follow-ups:</label>
          {state.ai_suggested_follow_ups && state.ai_suggested_follow_ups.length > 0 ? (
            <ul className="suggestion-list">
              {state.ai_suggested_follow_ups.map((sug, i) => (
                <li key={i}><span style={{color: 'var(--primary-color)'}}>+</span> {sug}</li>
              ))}
            </ul>
          ) : (
            <ul className="suggestion-list">
              <li><span style={{color: 'var(--primary-color)'}}>+</span> Schedule follow-up meeting in 2 weeks</li>
              <li><span style={{color: 'var(--primary-color)'}}>+</span> Send OncoBoost Phase III PDF</li>
              <li><span style={{color: 'var(--primary-color)'}}>+</span> Add Dr. Sharma to advisory board invite list</li>
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default CRMForm;
