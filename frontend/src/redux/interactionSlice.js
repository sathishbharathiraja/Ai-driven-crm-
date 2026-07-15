import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hcp_name: '',
  interaction_type: 'Meeting',
  interaction_date: '',
  interaction_time: '',
  attendees: '',
  topics_discussed: '',
  materials_shared: [],
  samples_distributed: [],
  sentiment: '', // 'Positive', 'Neutral', 'Negative'
  outcomes: '',
  follow_up_actions: [],
  ai_suggested_follow_ups: []
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    updateInteractionState: (state, action) => {
      // Merge backend updates into the current state
      return { ...state, ...action.payload };
    },
    resetInteractionState: () => initialState
  }
});

export const { updateInteractionState, resetInteractionState } = interactionSlice.actions;
export default interactionSlice.reducer;
