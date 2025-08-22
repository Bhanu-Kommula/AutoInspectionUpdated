import React from 'react';
import './TimeoutErrorMessage.css';

const TimeoutErrorMessage = ({ onRetry, serviceName = "service" }) => {
  return (
    <div className="timeout-error-container">
      <div className="timeout-error-card">
        <div className="timeout-icon">⏰</div>
        <h3>Service Starting Up</h3>
        <p>
          The {serviceName} is waking up from sleep mode. This can take up to 2 minutes 
          on the free hosting tier.
        </p>
        <div className="timeout-details">
          <ul>
            <li>✅ Your login was successful</li>
            <li>🔄 Services are warming up automatically</li>
            <li>⏰ This is normal for the first request</li>
          </ul>
        </div>
        {onRetry && (
          <button 
            className="retry-button" 
            onClick={onRetry}
          >
            🔄 Try Again
          </button>
        )}
        <div className="timeout-tip">
          <strong>Tip:</strong> Future requests will be much faster once services are warmed up!
        </div>
      </div>
    </div>
  );
};

export default TimeoutErrorMessage;
