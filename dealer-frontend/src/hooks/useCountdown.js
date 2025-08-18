import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for countdown timer
 * @param {number} initialSeconds - Initial countdown time in seconds
 * @param {function} onComplete - Callback when countdown reaches zero
 * @returns {object} - { timeLeft, start, stop, reset, isRunning, formatTime }
 */
export const useCountdown = (initialSeconds = 0, onComplete = null) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Start countdown
  const start = (seconds = timeLeft) => {
    if (seconds > 0) {
      setTimeLeft(seconds);
      setIsRunning(true);
    } else {
      setTimeLeft(0);
      setIsRunning(false);
    }
  };

  // Stop countdown
  const stop = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reset countdown
  const reset = (newSeconds = initialSeconds) => {
    stop();
    setTimeLeft(newSeconds);
  };

  // Format time as HH:MM:SS or MM:SS or SS
  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
  };

  // Format time in a human-readable way
  const formatTimeHuman = (seconds) => {
    if (seconds === undefined || seconds === null || seconds < 0) {
      return "Available now";
    }

    if (seconds === 0) return "Expired";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && hours === 0) parts.push(`${secs}s`);

    return parts.join(" ") || "Less than 1s";
  };

  // Effect to handle countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;

          if (newTime <= 0) {
            setIsRunning(false);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onComplete]);

  // Update timeLeft when initialSeconds changes
  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  return {
    timeLeft,
    start,
    stop,
    reset,
    isRunning,
    formatTime: () => formatTime(timeLeft),
    formatTimeHuman: () => formatTimeHuman(timeLeft),
    isComplete: timeLeft <= 0,
  };
};

export default useCountdown;
