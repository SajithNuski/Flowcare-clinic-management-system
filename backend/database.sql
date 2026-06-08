SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS flowcare;
CREATE DATABASE flowcare;
USE flowcare;

-- Users table
CREATE TABLE users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	nic VARCHAR(12) NOT NULL UNIQUE,
	date_of_birth DATE NOT NULL,
	gender ENUM('male','female','other') NOT NULL,
	phone VARCHAR(15) NOT NULL,
	email VARCHAR(100) UNIQUE,
	password VARCHAR(255) NOT NULL,
	role ENUM('patient','receptionist','doctor','admin') DEFAULT 'patient',
	status ENUM('active','inactive') DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE doctors (
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	specialisation VARCHAR(100),
	working_days VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
	bio TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE appointments (
	id INT AUTO_INCREMENT PRIMARY KEY,
	patient_id INT NOT NULL,
	doctor_id INT NOT NULL,
	appointment_date DATE NOT NULL,
	time_slot VARCHAR(10) NOT NULL,
	visit_reason VARCHAR(100) DEFAULT 'General consultation',
	notes TEXT,
	status ENUM('confirmed','cancelled','rescheduled','no_show','completed') DEFAULT 'confirmed',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Queue table
CREATE TABLE queue (
	id INT AUTO_INCREMENT PRIMARY KEY,
	patient_id INT NOT NULL,
	doctor_id INT NOT NULL,
	queue_number INT NOT NULL,
	date DATE NOT NULL,
	status ENUM('waiting','in_consultation','completed','no_show') DEFAULT 'waiting',
	check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	completed_time TIMESTAMP NULL,
	FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Consultations table
CREATE TABLE consultations (
	id INT AUTO_INCREMENT PRIMARY KEY,
	queue_id INT NOT NULL,
	patient_id INT NOT NULL,
	doctor_id INT NOT NULL,
	notes TEXT,
	diagnosis TEXT,
	referral TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
	FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
	id INT AUTO_INCREMENT PRIMARY KEY,
	patient_id INT NOT NULL,
	queue_id INT NOT NULL,
	amount DECIMAL(10,2) NOT NULL,
	payment_date DATE NOT NULL,
	notes TEXT,
	FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE
);

-- Announcements table
CREATE TABLE announcements (
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(200) NOT NULL,
	message TEXT NOT NULL,
	created_by INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log table
CREATE TABLE activity_log (
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	action VARCHAR(100) NOT NULL,
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clinic settings table
CREATE TABLE clinic_settings (
	id INT AUTO_INCREMENT PRIMARY KEY,
	setting_key VARCHAR(50) NOT NULL UNIQUE,
	setting_value TEXT NOT NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- Insert admin user first
INSERT INTO users (full_name, nic, date_of_birth, gender, phone, email, password, role)
VALUES ('Admin', '000000000V', '1990-01-01', 'male', '0771234567', 'admin@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'admin');
-- Note: above password hash is for "password" -- tell developer to change this

-- Insert two sample doctors into users first
INSERT INTO users (full_name, nic, date_of_birth, gender, phone, email, password, role)
VALUES ('Dr. K. Ranasinghe', '123456789V', '1980-03-15', 'male', '0712345678', 'ranasinghe@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'doctor');

INSERT INTO users (full_name, nic, date_of_birth, gender, phone, email, password, role)
VALUES ('Dr. S. Perera', '987654321V', '1985-07-22', 'female', '0723456789', 'perera@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'doctor');

-- Insert receptionist
INSERT INTO users (full_name, nic, date_of_birth, gender, phone, email, password, role)
VALUES ('Nishani Fernando', '456789123V', '1995-11-10', 'female', '0734567890', 'nishani@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'receptionist');

-- THEN insert into doctors table using the user IDs just created
INSERT INTO doctors (user_id, specialisation, working_days, bio)
VALUES (2, 'General Physician', 'Mon,Tue,Wed,Thu,Fri', 'MBBS Colombo, 14 years experience');

INSERT INTO doctors (user_id, specialisation, working_days, bio)
VALUES (3, 'Paediatrician', 'Mon,Wed,Fri', 'MBBS DCH Sri Lanka, 9 years experience');

-- Insert clinic settings
INSERT INTO clinic_settings (setting_key, setting_value) VALUES
('clinic_name', 'Badulla Medical Centre'),
('clinic_address', 'No. 14, Bandarawela Road, Badulla, Uva Province'),
('clinic_phone', '055 222 4567'),
('clinic_email', 'badullamedical@gmail.com'),
('open_time', '08:00'),
('close_time', '17:00'),
('open_days', 'Mon,Tue,Wed,Thu,Fri,Sat');