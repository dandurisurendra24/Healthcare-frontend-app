import React from 'react';
import './Card.css';

const Card = ({ children, className = '', title, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;