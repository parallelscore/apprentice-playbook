-- Sync runs table
CREATE TABLE sync_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  status ENUM('success', 'failed', 'running'),
  error_message TEXT
);

-- Orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  amount DECIMAL(10,2),

  status ENUM(
    'pending',
    'completed',
    'failed'
  ),

  sync_run_id INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sync_run_id)
    REFERENCES sync_runs(id)
);

-- Indexes
CREATE INDEX idx_orders_external_id
ON orders(external_id);

CREATE INDEX idx_sync_runs_status
ON sync_runs(status);

-- Sample sync run
INSERT INTO sync_runs (
  status,
  finished_at
)
VALUES (
  'success',
  CURRENT_TIMESTAMP
);

-- Sample orders
INSERT INTO orders (
  external_id,
  customer_name,
  amount,
  status,
  sync_run_id
)
VALUES
('ORD-1001', 'John Doe', 120.50, 'completed', 1),
('ORD-1002', 'Sarah Smith', 89.99, 'pending', 1),
('ORD-1003', 'Michael Lee', 45.00, 'failed', 1);