import React from 'react';
import { FiPhone, FiVideo } from 'react-icons/fi';
import './CallButton.css';

const CallButton = ({ 
  type = 'video', // 'video' or 'audio'
  onClick,
  disabled = false,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'primary', // 'primary', 'secondary', 'outline'
  title
}) => {
  const getIcon = () => {
    return type === 'video' ? <FiVideo /> : <FiPhone />;
  };

  const getDefaultTitle = () => {
    return type === 'video' ? 'Start video call' : 'Start audio call';
  };

  return (
    <button
      className={`call-button call-button--${type} call-button--${size} call-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title || getDefaultTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default CallButton;
