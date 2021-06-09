import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchApparels } from '../redux/apparels';
//import AddBook from './AddBook
import 'regenerator-runtime/runtime';

class AllApparels extends React.Component {
  componentDidMount() {
    console.log('here is state', this.state);
    console.log('here are props', this.props);
    this.props.loadApparels();
  }

  render() {
    const { apparels } = this.props;
    console.log('here are apparels', apparels);
    return (
      <div>
        <main>
          <div id="all-apparels-container">
            {apparels.map((apparel) => (
              <div id="all-apparels-apparel-container" key={apparel.id}>
                <img src={apparel.imageUrl} width="100" height="75" />
                <div id="all-apparels-details">
                  <Link to={`/apparels/${apparel.id}`}>
                    <h3>{apparel.title}</h3>
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
  apparels: state.apparels,
});

const mapDispatchToProps = (dispatch) => ({
  loadApparels: () => dispatch(fetchApparels()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AllApparels);
