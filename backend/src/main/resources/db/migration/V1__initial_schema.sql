-- Bank Asset Management Schema

-- Branches
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    branch_id BIGINT REFERENCES branches(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    position VARCHAR(200),
    department_id BIGINT REFERENCES departments(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Asset Categories
CREATE TABLE asset_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES asset_categories(id),
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    warranty_expiry_date DATE,
    image_path VARCHAR(500),
    notes TEXT,
    current_employee_id BIGINT REFERENCES employees(id),
    current_department_id BIGINT REFERENCES departments(id),
    current_branch_id BIGINT REFERENCES branches(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_asset_status CHECK (status IN ('REGISTERED', 'ASSIGNED', 'IN_REPAIR', 'LOST', 'WRITTEN_OFF'))
);

-- Asset Assignment History
CREATE TABLE asset_assignments (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL REFERENCES assets(id),
    employee_id BIGINT REFERENCES employees(id),
    department_id BIGINT REFERENCES departments(id),
    branch_id BIGINT REFERENCES branches(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMP,
    assigned_by VARCHAR(255),
    return_notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Asset Status History
CREATE TABLE asset_status_history (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL REFERENCES assets(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Audit Logs (separate mechanism)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_serial ON assets(serial_number);
CREATE INDEX idx_assets_current_employee ON assets(current_employee_id);
CREATE INDEX idx_assets_current_department ON assets(current_department_id);
CREATE INDEX idx_asset_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_employee ON asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_active ON asset_assignments(active);
CREATE INDEX idx_asset_status_history_asset ON asset_status_history(asset_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Seed default categories
INSERT INTO asset_categories (name, description) VALUES
    ('IT', 'IT equipment: laptops, desktops, servers, networking'),
    ('Office', 'Office equipment: desks, chairs, cabinets'),
    ('Security', 'Security equipment: cameras, access control, safes'),
    ('Communication', 'Communication devices: phones, intercoms'),
    ('Peripherals', 'Peripheral devices: monitors, printers, scanners'),
    ('Banking Equipment', 'Banking-specific: ATMs, POS terminals, cash counters');
