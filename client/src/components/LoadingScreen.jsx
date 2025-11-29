import '../css/LoadingScreen.css';
import PropTypes from 'prop-types';

const LoadingScreen = ({ message = "Loading" }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner-modern">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

LoadingScreen.propTypes = {
  message: PropTypes.string,
};

export default LoadingScreen;