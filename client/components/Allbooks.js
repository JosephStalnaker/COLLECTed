import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
//import fetchBooks from '../redux/books
//import AddBook from './AddBook

class AllBooks extends React.Component {
  componentDidMount() {
    this.props.loadBooks();
  }

  render() {
    const { books } = this.props;
    return (
      <div>
        <main>
          <div id="container">
            {books.map((book) => (
              <div id="all-books-container" key={book.id}>
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
