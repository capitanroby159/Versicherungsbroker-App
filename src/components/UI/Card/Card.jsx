import React from 'react';
import './Card.css';

/**
 * Card Component
 * Flexible Container für Content
 * 
 * @component
 * @example
 * <Card>
 *   <Card.Header><h3>Titel</h3></Card.Header>
 *   <Card.Body>Content hier...</Card.Body>
 *   <Card.Footer>
 *     <Button>Speichern</Button>
 *   </Card.Footer>
 * </Card>
 */
const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`.trim()}>
      {children}
    </div>
  );
};

Card.Header = ({ children }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }) => (
  <div className="card-body">{children}</div>
);

Card.Footer = ({ children }) => (
  <div className="card-footer">{children}</div>
);

export default Card;
