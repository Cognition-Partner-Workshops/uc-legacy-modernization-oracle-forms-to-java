import { useState, useEffect } from 'react';
import * as api from '../services/api';

type Tab = 'cycles' | 'reviews' | 'goals';

interface Cycle {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function PerformancePage() {
  const [tab, setTab] = useState<Tab>('cycles');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [rating, setRating] = useState('');
  const [comments, setComments] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getPerformanceCycles().then(setCycles).catch(() => setCycles([]));
  }, []);

  const handleSubmitReview = async () => {
    try {
      await api.submitReview({ rating, comments });
      setSuccess('Review submitted successfully');
      setShowReviewForm(false);
      setRating('');
      setComments('');
    } catch {}
  };

  const handleSaveGoal = async () => {
    try {
      await api.addGoal({ title: goalTitle, description: goalDesc, targetDate: goalDate });
      setSuccess('Goal added successfully');
      setShowGoalForm(false);
      setGoalTitle('');
      setGoalDesc('');
      setGoalDate('');
    } catch {}
  };

  return (
    <div>
      <h2>Performance Management</h2>
      {success && <div className="success-message" data-testid="success-message">{success}</div>}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'cycles'} onClick={() => setTab('cycles')}>
          Review Cycles
        </button>
        <button role="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')}>
          My Reviews
        </button>
        <button role="tab" aria-selected={tab === 'goals'} onClick={() => setTab('goals')}>
          Goals
        </button>
      </div>

      {tab === 'cycles' && (
        <table data-testid="cycles-table">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.startDate}</td>
                <td>{c.endDate}</td>
                <td><span className="badge badge-active">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'reviews' && (
        <div>
          <div data-testid="reviews-list">
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>No reviews submitted yet.</p>
          </div>
          {!showReviewForm ? (
            <button className="btn btn-primary" onClick={() => setShowReviewForm(true)}>
              Self Assessment
            </button>
          ) : (
            <div className="card">
              <h3>Self Assessment</h3>
              <div className="form-group">
                <label htmlFor="rating">Rating</label>
                <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="1">1 - Needs Improvement</option>
                  <option value="2">2 - Meets Some Expectations</option>
                  <option value="3">3 - Meets Expectations</option>
                  <option value="4">4 - Exceeds Expectations</option>
                  <option value="5">5 - Outstanding</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="comments">Comments</label>
                <textarea id="comments" value={comments}
                  onChange={(e) => setComments(e.target.value)} rows={4} />
              </div>
              <button className="btn btn-primary" onClick={handleSubmitReview}>Submit</button>
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>No goals set yet.</p>
          {!showGoalForm ? (
            <button className="btn btn-success" onClick={() => setShowGoalForm(true)}>
              Add Goal
            </button>
          ) : (
            <div className="card">
              <h3>New Goal</h3>
              <div className="form-group">
                <label htmlFor="goalTitle">Goal Title</label>
                <input id="goalTitle" value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)} rows={3} />
              </div>
              <div className="form-group">
                <label htmlFor="targetDate">Target Date</label>
                <input id="targetDate" type="date" value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Progress</label>
                <input type="range" data-testid="goal-progress" min="0" max="100" defaultValue="0" />
              </div>
              <button className="btn btn-primary" onClick={handleSaveGoal}>Save Goal</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
