import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceMonitor } from "../utils/performanceUtils";

const PerformanceMonitor = ({ componentName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  const { renderCount, timeSinceLastRender } =
    usePerformanceMonitor(componentName);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderTimes = useRef([]);
  const updateTimeout = useRef(null);

  // Throttle metrics updates to prevent infinite loops
  const updateMetrics = useCallback(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(() => {
      setMetrics((prev) => {
        const newRenderTimes = [...renderTimes.current, timeSinceLastRender];
        if (newRenderTimes.length > 10) {
          newRenderTimes.shift();
        }
        renderTimes.current = newRenderTimes;

        return {
          renderCount,
          averageRenderTime:
            newRenderTimes.reduce((a, b) => a + b, 0) / newRenderTimes.length,
          lastRenderTime: timeSinceLastRender,
          memoryUsage: performance.memory
            ? performance.memory.usedJSHeapSize / 1024 / 1024
            : 0,
          fps: prev.fps, // Keep previous FPS to prevent unnecessary updates
        };
      });
    }, 100); // Throttle to 100ms
  }, [renderCount, timeSinceLastRender]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    // Calculate FPS
    const calculateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round(
          (frameCount.current * 1000) / (currentTime - lastTime.current)
        );
        setMetrics((prev) => ({ ...prev, fps }));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      requestAnimationFrame(calculateFPS);
    };

    requestAnimationFrame(calculateFPS);

    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (!isVisible || process.env.NODE_ENV !== "development") {
    return null;
  }

  const getPerformanceColor = (value, threshold) => {
    if (value <= threshold * 0.7) return "#22c55e"; // Green
    if (value <= threshold) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        minWidth: "200px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <div
        style={{ marginBottom: "8px", fontWeight: "bold", color: "#60a5fa" }}
      >
        🚀 Performance Monitor - {componentName}
      </div>

      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#9ca3af" }}>Renders:</span>
        <span
          style={{
            color: getPerformanceColor(renderCount, 50),
            marginLeft: "8px",
          }}
        >
          {renderCount}
        </span>
      </div>

      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#9ca3af" }}>Last Render:</span>
        <span
          style={{
            color: getPerformanceColor(metrics.lastRenderTime, 16),
            marginLeft: "8px",
          }}
        >
          {metrics.lastRenderTime.toFixed(2)}ms
        </span>
      </div>

      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#9ca3af" }}>Avg Render:</span>
        <span
          style={{
            color: getPerformanceColor(metrics.averageRenderTime, 16),
            marginLeft: "8px",
          }}
        >
          {metrics.averageRenderTime.toFixed(2)}ms
        </span>
      </div>

      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#9ca3af" }}>FPS:</span>
        <span
          style={{
            color: getPerformanceColor(60 - metrics.fps, 20),
            marginLeft: "8px",
          }}
        >
          {metrics.fps}
        </span>
      </div>

      {performance.memory && (
        <div style={{ marginBottom: "4px" }}>
          <span style={{ color: "#9ca3af" }}>Memory:</span>
          <span
            style={{
              color: getPerformanceColor(metrics.memoryUsage, 50),
              marginLeft: "8px",
            }}
          >
            {metrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: "8px",
          fontSize: "10px",
          color: "#6b7280",
          borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          paddingTop: "8px",
        }}
      >
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default React.memo(PerformanceMonitor);
