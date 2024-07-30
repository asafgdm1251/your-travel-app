import React, { useState, useEffect } from 'react';
import './TripForm.css'; // Ensure CSS is correctly linked

function TripForm() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const [tripType, setTripType] = useState('');
  const [tripDetails, setTripDetails] = useState({});
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/plan-trip/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ start_date: startDate, end_date: endDate, budget: budget, trip_type: tripType })
      });

      if (!response.ok) {
        throw new Error('Failed to plan the trip. Please try again.');
      }
      const data = await response.json();
      setTripDetails(data);
      setSelectedDestination(null); // Clear previous selection on new trip plan
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSelectDestination = (destination) => {
  //   setSelectedDestination(destination);
  // };
  const handleSelectDestination = (destination) => {
    setSelectedDestination(destination === selectedDestination ? null : destination);
  };
  

  return (
    <div className="container">
    <img src="/logo2.png" alt="Logo" className="logo" />
    <p className='catchphrase'>Your next adventure is just a click away!</p>
      <form onSubmit={handleSubmit}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        <input type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value))} required />
        <select value={tripType} onChange={e => setTripType(e.target.value)} required>
          <option value="">Select a Trip Type</option>
          <option value="ski">Ski</option>
          <option value="beach">Beach</option>
          <option value="city">City</option>
        </select>
        <button type="submit">Submit</button>
      </form>

      {error && <p>{error}</p>}
      {!isLoading && tripDetails && (
        <div className="destinations">
          {Object.entries(tripDetails).map(([destination, details], index) => (
            <div key={index} className={`destination-card ${selectedDestination === destination ? 'selected' : ''}`} onClick={() => handleSelectDestination(destination)}>
              <strong>{destination}</strong>
              <div className="icon-text">
                <img src="/plane.svg" alt="Plane Icon" className="icon" />
                <p>${details.flight_price}</p>
              </div>
              <div className="icon-text">
                <img src="/hotel.svg" alt="Hotel Icon" className="icon" />
                <p>{details.hotel_name} (${details.hotel_price})</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="loading-container">
          <img src='/loading2.gif' alt="Loading..." />
        </div>
      )}

      {/* Conditionally render TripDetails if a destination is selected */}
      {selectedDestination && (
        <TripDetails
          destination={selectedDestination}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}

function TripDetails({ destination, startDate, endDate }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/get-trip-details/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ destination, start_date: startDate, end_date: endDate })
      });
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      } else {
        console.error('Failed to fetch trip details');
      }
      setIsLoading(false);
    }

    fetchDetails();
  }, [destination, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <img src='/loading2.gif' alt="Loading..." />
      </div>
    );
  }
  if (!details) return null;
  // const { daily_plan, images } = details;
  const {daily_plan} = details;

  // Split the daily plan into an array of days
  // const days = daily_plan.split('\n\n');
  const days = daily_plan.split(/\*\*Day \d+:/);
  const validDays = days.slice(1); // Adjusted to skip the first empty element if present
  return (
    <div className="container">
      <h3>Daily Plan for {destination}</h3>
      {/* <div className="images-container">
        {images.slice(0, 4).map((img, index) => (
          <img key={index} src={img} alt={`Scenery from ${destination} Day ${index + 1}`} style={{ width: '25%', height: 'auto' }} />
        ))}
      </div> */}
      <div className="day-details-container">
        {validDays.map((day, index) => {
          const parts = day.trim().split('\n');
          const dayHeader = parts[0].replace(/(\w+ \d+, \d{4})\*\*/, (match, p1) => p1);
          const contentLines = parts.slice(1);

          return (
            <div key={index} className="day-card">
              <h5 className="day-header">Day {index + 1}: <span className="date-header">{dayHeader}</span></h5>
              {contentLines.map((line, lineIndex) => {
                const splitLine = line.split(/(\*\*(.*?)\*\*:)/g).filter(Boolean);
                return (
                  <p key={lineIndex}>
                    {splitLine.map((part, partIndex) =>
                      /(\*\*(.*?)\*\*:)/.test(part) ? <strong key={partIndex}>{part.replace(/\*\*/g, '')}</strong> : part
                    )}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TripForm;
