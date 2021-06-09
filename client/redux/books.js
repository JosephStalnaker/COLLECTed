import axios from 'axios';

//action types
const SET_BOOKS = 'SET_BOOKS';

//action creator
export const setBooks = (books) => ({
  type: SET_BOOKS,
  books: books,
});

//thunk
export const fetchBooks = () => async (dispatch) => {
  try {
    const { data } = await axios.get('/api/books');
    console.log('here is data in thunk', data);
    dispatch(setBooks(data));
  } catch (error) {
    console.log('error fetching books', error.message);
  }
};

//reducer
export default function booksReducer(state = [], action) {
  switch (action.type) {
    case SET_BOOKS:
      return action.books;
    default:
      return state;
  }
}
