-- Users table for JWT authentication
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'MANAGER', 'USER'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Seed default admin user (password: admin123 - BCrypt encoded)
INSERT INTO users (username, email, password, full_name, role) VALUES
    ('admin', 'admin@bankassets.com', '$2a$10$c.lC6UpzqHcsdbzIDqvIO.eSzI2/BenSo0.RsyzYjfWDJXlmMIZue', 'System Administrator', 'ADMIN');
