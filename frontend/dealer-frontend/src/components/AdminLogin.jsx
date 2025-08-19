import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { FaUserShield, FaEye, FaEyeSlash } from "react-icons/fa";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const navigate = useNavigate();
  const { login } = useAdminAuth();

  // Default admin credentials
  const defaultCredentials = {
    email: "admin1@gmail.com",
    password: "Admin@1",
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check credentials
      if (
        formData.email === defaultCredentials.email &&
        formData.password === defaultCredentials.password
      ) {
        const adminData = {
          id: 1,
          email: formData.email,
          name: "System Administrator",
          role: "ADMIN",
          loginTime: new Date().toISOString(),
        };

        login(adminData);
        navigate("/admin-dashboard");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setFormData(defaultCredentials);
    setShowCredentials(false);
  };

  return (
    <div className="admin-login-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card className="admin-login-card">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="admin-login-icon">
                    <FaUserShield />
                  </div>
                  <h2 className="admin-login-title">Admin Login</h2>
                  <p className="admin-login-subtitle">
                    Access the administrative dashboard
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className="admin-login-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <div className="password-input-group">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        required
                        className="admin-login-input"
                      />
                      <Button
                        type="button"
                        variant="outline-secondary"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="admin-login-btn w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="admin-login-link"
                      onClick={() => setShowCredentials(!showCredentials)}
                    >
                      {showCredentials ? "Hide" : "Show"} Default Credentials
                    </Button>
                  </div>

                  {showCredentials && (
                    <Alert variant="info" className="mt-3">
                      <strong>Default Admin Credentials:</strong>
                      <br />
                      Email: {defaultCredentials.email}
                      <br />
                      Password: {defaultCredentials.password}
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={fillDefaultCredentials}
                        >
                          Fill Credentials
                        </Button>
                      </div>
                    </Alert>
                  )}
                </Form>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    Secure access to administrative functions
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
