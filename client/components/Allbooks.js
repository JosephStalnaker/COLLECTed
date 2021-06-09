import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBooks } from '../redux/books';
//import AddBook from './AddBook
import 'regenerator-runtime/runtime';

class AllBooks extends React.Component {
  componentDidMount() {
    console.log('here is state', this.state);
    console.log('here are props', this.props);
    this.props.loadBooks();
  }

  render() {
    const { books } = this.props;
    console.log('here are books', books);
    return (
      <div>
        <main>
          <div id="all-books-container">
            {books.map((book) => (
              <div id="all-books-book-container" key={book.id}>
                <img src={book.imageUrl} width="100" height="75" />
                <div id="all-books-details">
                  <Link to={`/books/${book.id}`}>
                    <h3>{book.title}</h3>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  books: state.books,
});

const mapDispatchToProps = (dispatch) => ({
  loadBooks: () => dispatch(fetchBooks()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AllBooks);
