import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import Home from './Home';
import Allbooks from './Allbooks';
import AllApparels from './AllApparels';

const Routes = () => {
  return (
    <Router>
      <div>
        <header>
          <h1>COLLECTed</h1>
          <div id="nav-container">
            <Link to="/">Home</Link>
            <Link to="/books">Books</Link>
            <Link to="/apparels">Apparel</Link>
          </div>
        </header>
        <nav></nav>
        <main>
          <div>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/books" component={Allbooks} />
              <Route exact path="/apparels" component={AllApparels} />
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
