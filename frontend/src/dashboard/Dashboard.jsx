import MainLayout from '../shared/components/layout/MainLayout';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome to your campaign command center!</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Characters</h3>
            <p className="card-value">3 Active</p>
            <p className="card-description">Manage player characters</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🎭</div>
            <h3>NPCs</h3>
            <p className="card-value">12 Created</p>
            <p className="card-description">Non-player characters</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🗺️</div>
            <h3>Maps</h3>
            <p className="card-value">5 Locations</p>
            <p className="card-description">Campaign locations</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📝</div>
            <h3>Session Notes</h3>
            <p className="card-value">8 Sessions</p>
            <p className="card-description">Campaign history</p>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">✨</span>
              <div className="activity-details">
                <p className="activity-text">New character created: <strong>Elara Moonwhisper</strong></p>
                <p className="activity-time">2 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🎭</span>
              <div className="activity-details">
                <p className="activity-text">NPC updated: <strong>Gundren Rockseeker</strong></p>
                <p className="activity-time">5 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📝</span>
              <div className="activity-details">
                <p className="activity-text">Session note added: <strong>The Goblin Ambush</strong></p>
                <p className="activity-time">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;