import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import Allbooks from './Allbooks';
import Home from './Home';

const Routes = () => {
  return (
    <Router>
      <div>
        <header>
          <h1>COLLECTed</h1>
          <div id="nav-container">
            <Link to="/">Home</Link>
            <Link to="/books">Books</Link>
          </div>
        </header>
        <nav></nav>
        <main>
          <div>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/books" component={Allbooks} />
            </Switch>
          </div>
        </main>
        <footer>
          <div id="footer-details">
            <div>Footer Contents</div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default Routes;
