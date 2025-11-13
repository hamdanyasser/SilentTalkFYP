import React, { useState } from 'react';
import '../styles/BookingPage.css';

interface Interpreter {
  id: string;
  name: string;
  languages: string[];
  rating: number;
  hourlyRate: number;
  avatar: string;
  specializations: string[];
  availability: string[];
}

interface Booking {
  id: string;
  interpreterId: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'onsite';
  location?: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const MOCK_INTERPRETERS: Interpreter[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    languages: ['ASL', 'English'],
    rating: 4.9,
    hourlyRate: 75,
    avatar: '/interpreters/sarah.jpg',
    specializations: ['Medical', 'Legal', 'Educational'],
    availability: ['Monday', 'Wednesday', 'Friday']
  },
  {
    id: '2',
    name: 'Michael Chen',
    languages: ['ASL', 'BSL', 'English'],
    rating: 4.8,
    hourlyRate: 80,
    avatar: '/interpreters/michael.jpg',
    specializations: ['Technical', 'Business', 'Conference'],
    availability: ['Tuesday', 'Thursday', 'Saturday']
  },
  {
    id: '3',
    name: 'Emma Williams',
    languages: ['ISL', 'English'],
    rating: 4.7,
    hourlyRate: 70,
    avatar: '/interpreters/emma.jpg',
    specializations: ['Mental Health', 'Social Services', 'Educational'],
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  }
];

const BookingPage: React.FC = () => {
  const [step, setStep] = useState<'select' | 'schedule' | 'confirm'>('select');
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    duration: 60,
    type: 'video' as 'video' | 'onsite',
    location: '',
    notes: ''
  });

  const handleSelectInterpreter = (interpreter: Interpreter) => {
    setSelectedInterpreter(interpreter);
    setStep('schedule');
  };

  const handleSchedule = () => {
    if (!bookingData.date || !bookingData.time) {
      alert('Please select both date and time');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedInterpreter) return;

    const booking: Omit<Booking, 'id' | 'status'> = {
      interpreterId: selectedInterpreter.id,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      type: bookingData.type,
      location: bookingData.location,
      notes: bookingData.notes
    };

    try {
      // TODO: API call to create booking
      console.log('Creating booking:', booking);
      alert('Booking confirmed! You will receive a confirmation email shortly.');
      // Reset form
      setStep('select');
      setSelectedInterpreter(null);
      setBookingData({
        date: '',
        time: '',
        duration: 60,
        type: 'video',
        location: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  const totalCost = selectedInterpreter
    ? (selectedInterpreter.hourlyRate * bookingData.duration) / 60
    : 0;

  return (
    <div className="booking-page">
      <header className="booking-header">
        <h1>Book a Sign Language Interpreter</h1>
        <div className="booking-steps">
          <div className={`step ${step === 'select' ? 'active' : step !== 'select' ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Select Interpreter</span>
          </div>
          <div className={`step ${step === 'schedule' ? 'active' : step === 'confirm' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Schedule</span>
          </div>
          <div className={`step ${step === 'confirm' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirm</span>
          </div>
        </div>
      </header>

      {step === 'select' && (
        <div className="interpreters-grid">
          {MOCK_INTERPRETERS.map((interpreter) => (
            <article key={interpreter.id} className="interpreter-card">
              <div className="interpreter-avatar">
                <img src={interpreter.avatar} alt={`${interpreter.name}'s avatar`} />
                <div className="rating">
                  <span className="star">★</span>
                  <span>{interpreter.rating}</span>
                </div>
              </div>

              <div className="interpreter-info">
                <h2>{interpreter.name}</h2>

                <div className="info-section">
                  <strong>Languages:</strong>
                  <div className="tags">
                    {interpreter.languages.map((lang) => (
                      <span key={lang} className="tag">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <strong>Specializations:</strong>
                  <div className="tags">
                    {interpreter.specializations.map((spec) => (
                      <span key={spec} className="tag tag-secondary">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <strong>Availability:</strong>
                  <p className="availability">{interpreter.availability.join(', ')}</p>
                </div>

                <div className="interpreter-footer">
                  <div className="rate">
                    <span className="rate-amount">${interpreter.hourlyRate}</span>
                    <span className="rate-unit">/hour</span>
                  </div>
                  <button
                    onClick={() => handleSelectInterpreter(interpreter)}
                    className="btn-primary"
                  >
                    Select
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {step === 'schedule' && selectedInterpreter && (
        <div className="schedule-form">
          <div className="form-header">
            <button onClick={() => setStep('select')} className="btn-back">
              ← Back to Interpreters
            </button>
            <h2>Schedule with {selectedInterpreter.name}</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSchedule();
            }}
            className="booking-form"
          >
            <div className="form-group">
              <label htmlFor="booking-type">Booking Type</label>
              <select
                id="booking-type"
                value={bookingData.type}
                onChange={(e) =>
                  setBookingData({ ...bookingData, type: e.target.value as 'video' | 'onsite' })
                }
                className="form-control"
              >
                <option value="video">Video Call</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="booking-date">Date</label>
                <input
                  id="booking-date"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="booking-time">Time</label>
                <input
                  id="booking-time"
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <select
                id="duration"
                value={bookingData.duration}
                onChange={(e) =>
                  setBookingData({ ...bookingData, duration: parseInt(e.target.value) })
                }
                className="form-control"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>

            {bookingData.type === 'onsite' && (
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={bookingData.location}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  placeholder="Enter address or meeting location"
                  className="form-control"
                  required={bookingData.type === 'onsite'}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                placeholder="Any special requirements or context for the interpreter..."
                rows={4}
                className="form-control"
              />
            </div>

            <div className="cost-summary">
              <div className="cost-row">
                <span>Duration:</span>
                <span>{bookingData.duration} minutes</span>
              </div>
              <div className="cost-row">
                <span>Rate:</span>
                <span>${selectedInterpreter.hourlyRate}/hour</span>
              </div>
              <div className="cost-row cost-total">
                <span>Estimated Total:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full">
              Continue to Confirmation
            </button>
          </form>
        </div>
      )}

      {step === 'confirm' && selectedInterpreter && (
        <div className="confirmation-screen">
          <div className="confirmation-card">
            <h2>Confirm Your Booking</h2>

            <div className="confirmation-details">
              <div className="detail-section">
                <h3>Interpreter</h3>
                <div className="interpreter-summary">
                  <img src={selectedInterpreter.avatar} alt={selectedInterpreter.name} />
                  <div>
                    <strong>{selectedInterpreter.name}</strong>
                    <p>{selectedInterpreter.languages.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Date & Time</h3>
                <p>
                  {new Date(bookingData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p>{bookingData.time}</p>
                <p>Duration: {bookingData.duration} minutes</p>
              </div>

              <div className="detail-section">
                <h3>Type</h3>
                <p>{bookingData.type === 'video' ? 'Video Call' : 'On-site'}</p>
                {bookingData.location && <p>{bookingData.location}</p>}
              </div>

              {bookingData.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p>{bookingData.notes}</p>
                </div>
              )}

              <div className="detail-section cost-section">
                <h3>Total Cost</h3>
                <p className="total-amount">${totalCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="confirmation-actions">
              <button onClick={() => setStep('schedule')} className="btn-secondary">
                ← Back to Edit
              </button>
              <button onClick={handleConfirmBooking} className="btn-primary">
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
