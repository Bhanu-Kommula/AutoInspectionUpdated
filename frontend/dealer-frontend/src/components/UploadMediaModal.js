// UploadMediaModal.js
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";

const API_UPLOAD_MEDIA = `${process.env.REACT_APP_API_BASE || "https://api-gateway.onrender.com"}/inspection/upload-media`;

const UploadMediaModal = ({ show, onClose, postId }) => {
  const [mediaType, setMediaType] = useState("image");
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.warning("📁 Please select files to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("type", mediaType);
    for (let file of files) {
      formData.append("files", file);
    }

    try {
      await axios.post(API_UPLOAD_MEDIA, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("✅ Media uploaded successfully!");
      setFiles([]);
      onClose();
    } catch (err) {
      console.error(err);
      let errorMessage = "❌ Upload failed";
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>📤 Upload Inspection Media</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>🗂️ Select Media Type</Form.Label>
          <Form.Select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
          >
            <option value="image">📷 Image</option>
            <option value="video">🎥 Video</option>
            <option value="audio">🎙️ Audio</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>📁 Choose File(s)</Form.Label>
          <Form.Control type="file" multiple onChange={handleFileChange} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          ❌ Cancel
        </Button>
        <Button variant="primary" onClick={handleUpload}>
          ✅ Upload
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadMediaModal;
