// Spinning circle shown while data is loading
const Loader = ({ text = "Loading..." }) => (
  <div className="loader-wrap">
    <div className="spinner"></div>
    <p>{text}</p>
  </div>
);

export default Loader;
