import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPhoneSlash, FaRedo } from "react-icons/fa";

const CallTimeoutModal = ({ show, onHide, onRetry, targetUser, callType }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="text-center w-100">
          <div className="text-warning mb-2">
            <FaPhoneSlash size={40} />
          </div>
          Call Timeout
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center pt-0">
        <p className="mb-3">
          <strong>{targetUser}</strong> didn't answer your {callType} call.
        </p>
        <p className="text-muted small mb-0">
          They might be busy or away from their device.
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 justify-content-center">
        <Button variant="outline-primary" onClick={onRetry} className="me-2">
          <FaRedo className="me-1" />
          Try Again
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CallTimeoutModal;
