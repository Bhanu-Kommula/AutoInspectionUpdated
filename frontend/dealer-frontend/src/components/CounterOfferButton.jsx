import React, { useState, useEffect, useCallback } from "react";
import {
  FaHandshake,
  FaClock,
  FaRedo,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useCountdown } from "../hooks/useCountdown";

const CounterOfferButton = ({
  post,
  eligibility,
  onCounterOfferClick,
  onEligibilityRefresh,
  disabled = false,
  // When true, hides the informational UI boxes (attempts, counters, max attempts)
  hideInfo = false,
}) => {
  const [localEligibility, setLocalEligibility] = useState(eligibility);
  // Hide attempt/counter/max-attempt banners on feed UI while keeping logic intact
  const showAttemptMeta = false;

  // Callback when countdown completes
  const onCountdownComplete = useCallback(() => {
    console.log(
      `Countdown completed for post ${post.id}, refreshing eligibility...`
    );
    // Refresh eligibility when countdown completes
    if (onEligibilityRefresh) {
      onEligibilityRefresh(post.id);
    }
  }, [post.id, onEligibilityRefresh]);

  // Initialize countdown with remaining seconds
  const initialSeconds = eligibility?.remainingCooldownSeconds || 0;
  const {
    timeLeft,
    start,
    formatTime,
    formatTimeHuman,
    isComplete,
    isRunning,
  } = useCountdown(initialSeconds, onCountdownComplete);

  // Update local eligibility when prop changes
  useEffect(() => {
    setLocalEligibility(eligibility);

    // Start countdown if there's remaining time
    if (eligibility?.remainingCooldownSeconds > 0) {
      start(eligibility.remainingCooldownSeconds);
    }
  }, [eligibility, start]);

  // Check if this is a re-counter offer (after rejection)
  const isReCounterOffer =
    eligibility?.attemptNumber && eligibility.attemptNumber > 1;
  const attemptsRemaining = eligibility?.maxAttempts
    ? eligibility.maxAttempts - eligibility.attemptNumber
    : null;

  // Determine if button should be disabled
  const isDisabled =
    disabled ||
    localEligibility?.success === false ||
    localEligibility?.canSubmit === false ||
    localEligibility?.canSubmitCounterOffer === false ||
    localEligibility?.maxAttemptsReached === true ||
    (timeLeft > 0 && localEligibility?.remainingCooldownSeconds > 0);

  const canSubmit = !isDisabled;

  // Get button text based on state
  const getButtonText = () => {
    if (isDisabled && localEligibility?.maxAttemptsReached) {
      return "Max Attempts Reached";
    } else if (isDisabled && localEligibility?.remainingCooldownSeconds > 0) {
      // Show live countdown timer in MM:SS format
      return `Can Re-Counter Offer (${formatTime()})`;
    } else if (isDisabled) {
      return `Can Re-Counter Offer (${formatTimeHuman()})`;
    } else if (isReCounterOffer) {
      return `Re-Counter Offer (${attemptsRemaining} left)`;
    } else {
      return "Submit Counter Offer";
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (isDisabled && localEligibility?.maxAttemptsReached) {
      return "You have reached the maximum number of counter offer attempts (3) for this post";
    } else if (isDisabled && localEligibility?.remainingCooldownSeconds > 0) {
      return `You can submit another counter offer in ${formatTime()}`;
    } else if (isDisabled) {
      return `You can submit another counter offer in ${formatTimeHuman()}`;
    } else if (isReCounterOffer) {
      return `This is your ${eligibility.attemptNumber}${getOrdinalSuffix(
        eligibility.attemptNumber
      )} counter offer attempt. You have ${attemptsRemaining} attempts remaining.`;
    } else {
      return "Submit Counter Offer";
    }
  };

  // Get ordinal suffix for attempt numbers
  const getOrdinalSuffix = (num) => {
    if (num >= 11 && num <= 13) return "th";
    switch (num % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Get button style
  const getButtonStyle = () => {
    const baseStyle = {
      width: "100%",
      color: "white",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      transition: "background-color 0.2s ease",
      cursor: isDisabled ? "not-allowed" : "pointer",
    };

    if (isDisabled && localEligibility?.maxAttemptsReached) {
      return {
        ...baseStyle,
        backgroundColor: "#dc3545",
        opacity: 0.8,
      };
    } else if (isDisabled && localEligibility?.remainingCooldownSeconds > 0) {
      return {
        ...baseStyle,
        backgroundColor: "#6c757d",
        opacity: 0.8,
      };
    } else if (isDisabled) {
      return {
        ...baseStyle,
        backgroundColor: "#6c757d",
        opacity: 0.8,
      };
    } else if (isReCounterOffer) {
      return {
        ...baseStyle,
        backgroundColor: "#fd7e14",
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: "#fd7e14",
      };
    }
  };

  const handleClick = () => {
    if (canSubmit && onCounterOfferClick) {
      onCounterOfferClick(post);
    }
  };

  const handleMouseEnter = (e) => {
    if (!isDisabled) {
      if (isReCounterOffer) {
        e.target.style.backgroundColor = "#e55d07";
      } else {
        e.target.style.backgroundColor = "#e55d07";
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!isDisabled) {
      if (isReCounterOffer) {
        e.target.style.backgroundColor = "#fd7e14";
      } else {
        e.target.style.backgroundColor = "#fd7e14";
      }
    }
  };

  return (
    <div style={hideInfo ? { fontSize: 0 } : undefined}>
      {/* Attempt counter display (hidden when hideInfo=true or showAttemptMeta=false) */}
      {((!hideInfo && isReCounterOffer) ||
        (showAttemptMeta && isReCounterOffer)) && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#6c757d",
            marginBottom: "0.25rem",
            textAlign: "center",
            padding: "0.25rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "0.25rem",
            border: "1px solid #dee2e6",
          }}
        >
          <FaRedo style={{ marginRight: "0.25rem" }} />
          Attempt {eligibility.attemptNumber} of {eligibility.maxAttempts}
        </div>
      )}

      {/* Counter offer attempts label - only show when there are actual attempts and not hidden */}
      {isReCounterOffer && eligibility?.attemptNumber > 0 && !hideInfo && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#6c757d",
            marginBottom: "0.25rem",
            textAlign: "center",
            padding: "0.25rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "0.25rem",
            border: "1px solid #dee2e6",
          }}
        >
          Counter Offers: {attemptsRemaining}
        </div>
      )}

      {/* Max attempts warning */}
      {localEligibility?.maxAttemptsReached && !hideInfo && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#dc3545",
            marginBottom: "0.25rem",
            textAlign: "center",
            padding: "0.25rem",
            backgroundColor: "#f8d7da",
            borderRadius: "0.25rem",
            border: "1px solid #f5c6cb",
          }}
        >
          <FaExclamationTriangle style={{ marginRight: "0.25rem" }} />
          Max attempts reached
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={getTooltipText()}
        style={getButtonStyle()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDisabled && localEligibility?.maxAttemptsReached ? (
            <FaExclamationTriangle style={{ marginRight: "0.5rem" }} />
          ) : isDisabled && localEligibility?.remainingCooldownSeconds > 0 ? (
            <FaClock style={{ marginRight: "0.5rem" }} />
          ) : isDisabled ? (
            <FaExclamationTriangle style={{ marginRight: "0.5rem" }} />
          ) : isReCounterOffer ? (
            <FaRedo style={{ marginRight: "0.5rem" }} />
          ) : (
            <FaHandshake style={{ marginRight: "0.5rem" }} />
          )}
          {getButtonText()}
        </span>
      </button>
    </div>
  );
};

export default CounterOfferButton;
