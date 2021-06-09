import { combineReducers } from 'redux';
import booksReducer from './books';
import apparelsReducer from './apparels';

const appReducer = combineReducers({
  books: booksReducer,
  apparels: apparelsReducer,
});

export default appReducer;
