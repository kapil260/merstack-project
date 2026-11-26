// A small summary box: icon + label + big number + optional small text
const StatCard = ({ icon, label, value, sub, tone = "navy" }) => (
  <div className="stat-card">
    <div className={`stat-icon tone-${tone}`}>{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  </div>
);

export default StatCard;
