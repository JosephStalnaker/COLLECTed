import axios from 'axios';

//action types
const SET_APPARELS = 'SET_APPARELS';

//action creator
export const setApparels = (apparels) => ({
  type: SET_APPARELS,
  apparels: apparels,
});

//thunk
export const fetchApparels = () => async (dispatch) => {
  try {
    const { data } = await axios.get('api/apparels');
    console.log('here is data in thunk fetchApparels', data);
    dispatch(setApparels(data));
  } catch (error) {
    console.log('error fetching apparels', error.message);
  }
};

//reducer
export default function apparelsReducer(state = [], action) {
  switch (action.type) {
    case SET_APPARELS:
      return action.apparels;
    default:
      return state;
  }
}
