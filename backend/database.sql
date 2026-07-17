SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS flowcare;
CREATE DATABASE flowcare;
USE flowcare;

-- Admin table
CREATE TABLE admin (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	nic VARCHAR(12) NOT NULL UNIQUE,
	date_of_birth DATE NOT NULL,
	gender ENUM('male','female','other') NOT NULL,
	phone VARCHAR(15) NOT NULL,
	email VARCHAR(100) UNIQUE,
	password VARCHAR(255) NOT NULL,
	status ENUM('active','inactive') DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Doctors table
CREATE TABLE doctors (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	nic VARCHAR(12) NOT NULL UNIQUE,
	date_of_birth DATE NOT NULL,
	gender ENUM('male','female','other') NOT NULL,
	phone VARCHAR(15) NOT NULL,
	address VARCHAR(255) DEFAULT NULL,
	email VARCHAR(100) UNIQUE,
	password VARCHAR(255) NOT NULL,
	status ENUM('active','inactive') DEFAULT 'active',
	specialisation VARCHAR(100),
	working_days VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
	working_time VARCHAR(100) DEFAULT NULL,
	bio TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Receptionist table
CREATE TABLE receptionist (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	nic VARCHAR(12) NOT NULL UNIQUE,
	date_of_birth DATE NOT NULL,
	gender ENUM('male','female','other') NOT NULL,
	phone VARCHAR(15) NOT NULL,
	address VARCHAR(255) DEFAULT NULL,
	email VARCHAR(100) UNIQUE,
	password VARCHAR(255) NOT NULL,
	status ENUM('active','inactive') DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Patients table
CREATE TABLE patients (
	id INT AUTO_INCREMENT PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	nic VARCHAR(12) NOT NULL UNIQUE,
	date_of_birth DATE NOT NULL,
	gender ENUM('male','female','other') NOT NULL,
	phone VARCHAR(15) NOT NULL,
	email VARCHAR(100) UNIQUE,
	password VARCHAR(255) DEFAULT NULL,
	status ENUM('active','inactive') DEFAULT 'active',
	medical_history TEXT DEFAULT NULL,
	allergies TEXT DEFAULT NULL,
	blood_group VARCHAR(5) DEFAULT NULL,
	emergency_contact VARCHAR(100) DEFAULT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Appointments table
CREATE TABLE appointments (
	id INT AUTO_INCREMENT PRIMARY KEY,
	patient_id INT NOT NULL,
	patient_name VARCHAR(100) DEFAULT NULL,
	doctor_id INT NOT NULL,
	appointment_date DATE NOT NULL,
	appointment_time VARCHAR(100) NOT NULL,
	visit_reason VARCHAR(100) DEFAULT 'General consultation',
	notes TEXT,
	status ENUM('confirmed','cancelled','rescheduled','no_show','completed') DEFAULT 'confirmed',
	cancelled_at TIMESTAMP NULL DEFAULT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
	FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
	FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payments table
CREATE TABLE payments (
	id INT AUTO_INCREMENT PRIMARY KEY,
	patient_id INT NOT NULL,
	queue_id INT NOT NULL,
	amount DECIMAL(10,2) NOT NULL,
	payment_date DATE NOT NULL,
	notes TEXT,
	FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
	FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Announcements table
CREATE TABLE announcements (
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(200) NOT NULL,
	message TEXT NOT NULL,
	created_by INT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Activity log table
CREATE TABLE activity_log (
	id INT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	action VARCHAR(100) NOT NULL,
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Clinic settings table
CREATE TABLE clinic_settings (
	id INT AUTO_INCREMENT PRIMARY KEY,
	setting_key VARCHAR(50) NOT NULL UNIQUE,
	setting_value TEXT NOT NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert admin user
INSERT INTO admin (full_name, nic, date_of_birth, gender, phone, email, password)
VALUES ('Admin', '000000000V', '1990-01-01', 'male', '0771234567', 'admin@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C');

-- Insert doctors
INSERT INTO doctors (full_name, nic, date_of_birth, gender, phone, email, password, specialisation, working_days, bio)
VALUES ('Dr. K. Ranasinghe', '123456789V', '1980-03-15', 'male', '0712345678', 'ranasinghe@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'General Physician', 'Mon,Tue,Wed,Thu,Fri', 'MBBS Colombo, 14 years experience');

INSERT INTO doctors (full_name, nic, date_of_birth, gender, phone, email, password, specialisation, working_days, bio)
VALUES ('Dr. S. Perera', '987654321V', '1985-07-22', 'female', '0723456789', 'perera@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'Paediatrician', 'Mon,Wed,Fri', 'MBBS DCH Sri Lanka, 9 years experience');

-- Insert receptionist
INSERT INTO receptionist (full_name, nic, date_of_birth, gender, phone, email, password)
VALUES ('Nishani Fernando', '456789123V', '1995-11-10', 'female', '0734567890', 'nishani@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C');

-- Insert seeded patients
INSERT INTO patients (full_name, nic, date_of_birth, gender, phone, email, password, medical_history, allergies, blood_group, emergency_contact)
VALUES ('Saman Kumara', '751234567V', '1975-05-12', 'male', '0779876543', 'saman@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'Hypertension diagnosed in 2020. On Enalapril.', 'Penicillin', 'O+', 'Kamal Kumara (Brother) - 0771112223');

INSERT INTO patients (full_name, nic, date_of_birth, gender, phone, email, password, medical_history, allergies, blood_group, emergency_contact)
VALUES ('Priyanti de Silva', '885432109V', '1988-09-20', 'female', '0714567890', 'priyanti@flowcare.lk',
'$2y$10$HI9QuD1N2ugR7NkB07wnMeUuNsW1RjzVXhA8EB67N39saRgIQRe6C', 'Asthma since childhood. Uses Albuterol inhaler.', 'Dust mites, Peanuts', 'A-', 'Rohan de Silva (Husband) - 0719998887');

-- Insert clinic settings
INSERT INTO clinic_settings (setting_key, setting_value) VALUES
('clinic_name', 'ASHINI Family Clinic Center'),
('clinic_address', 'No. 14, Bandarawela Road, Badulla, Uva Province'),
('clinic_phone', '055 222 4567'),
('clinic_email', 'ashinifamilyclinic@gmail.com'),
('open_time', '08:00'),
('close_time', '17:00'),
('open_days', 'Mon,Tue,Wed,Thu,Fri,Sat');