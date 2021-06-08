import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import Home from './Home';

const Routes = () => {
  return (
    <Router>
      <div>
        <header>
          <h1 id="header-logo">COLLECTed</h1>
          <nav>
            <div id="nav-container">
              <Link to="/">Home</Link>
            </div>
          </nav>
        </header>
        <main>
          <div>
            <Switch>
              <Route exact path="/" component={Home} />
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
