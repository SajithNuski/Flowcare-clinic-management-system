<?php
/*
This file handles appointment booking and appointment status updates.
We keep the appointment logic in one class so it is easier to reuse and test.
*/

class Appointment {
	// This stores the database connection so every method can use it
	private $conn;

	// Constructor: called when we do "new Appointment($conn)"
	public function __construct($conn) {
		$this->conn = $conn;
	}

	// This helper runs a prepared SELECT query and returns the first matching row
	private function fetchOne($sql, $types, $params) {
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$result = mysqli_stmt_get_result($stmt);

		if (!$result) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$row = mysqli_fetch_assoc($result);
		mysqli_stmt_close($stmt);

		return $row ?: false;
	}

	// This helper runs a prepared SELECT query and returns all matching rows
	private function fetchAll($sql, $types, $params) {
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$result = mysqli_stmt_get_result($stmt);

		if (!$result) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$rows = mysqli_fetch_all($result, MYSQLI_ASSOC);
		mysqli_stmt_close($stmt);

		return $rows;
	}

	// This helper runs a prepared INSERT, UPDATE, or DELETE query
	private function executeQuery($sql, $types, $params) {
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		$executed = mysqli_stmt_execute($stmt);
		mysqli_stmt_close($stmt);

		return $executed;
	}

	// This method checks if a doctor has already booked the given slot on the given date
	public function check_slot_available($doctor_id, $appointment_date, $time_slot) {
		$slot = $this->fetchOne(
			"SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status IN ('confirmed', 'rescheduled', 'completed', 'no_show') LIMIT 1",
			"iss",
			[$doctor_id, $appointment_date, $time_slot]
		);

		return $slot === false;
	}

	// This method creates a new appointment after making sure the slot is free first
	public function create($patient_id, $doctor_id, $appointment_date, $time_slot, $visit_reason, $notes = '') {
		if (!$this->check_slot_available($doctor_id, $appointment_date, $time_slot)) {
			return false;
		}

		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, visit_reason, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed')"
		);

		if (!$stmt) {
			return false;
		}

		mysqli_stmt_bind_param(
			$stmt,
			"iissss",
			$patient_id,
			$doctor_id,
			$appointment_date,
			$time_slot,
			$visit_reason,
			$notes
		);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$appointment_id = mysqli_insert_id($this->conn);
		mysqli_stmt_close($stmt);

		return $appointment_id > 0 ? (int) $appointment_id : false;
	}

	// This method gets all appointments for one patient, newest first
	// It joins doctors so we can show the doctor's name to the patient
	public function get_by_patient($patient_id) {
		return $this->fetchAll(
			"SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.time_slot, a.visit_reason, a.notes, a.status, a.created_at, d.full_name AS doctor_name, d.phone AS doctor_phone, d.specialisation FROM appointments a INNER JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ? ORDER BY a.created_at DESC, a.id DESC",
			"i",
			[$patient_id]
		);
	}

	// This method gets all appointments for a specific doctor on a specific date
	public function get_by_doctor_and_date($doctor_id, $date) {
		return $this->fetchAll(
			"SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.time_slot, a.visit_reason, a.notes, a.status, a.created_at, u.full_name AS patient_name, u.phone AS patient_phone FROM appointments a INNER JOIN patients u ON a.patient_id = u.id WHERE a.doctor_id = ? AND a.appointment_date = ? ORDER BY a.time_slot ASC, a.id ASC",
			"is",
			[$doctor_id, $date]
		);
	}

	// This method gets all appointments for a specific date (or today if null) across all doctors
	// It is useful for the receptionist dashboard
	public function get_today_all($date = null) {
		$target_date = $date ?: date('Y-m-d');

		return $this->fetchAll(
			"SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.time_slot, a.visit_reason, a.notes, a.status, a.created_at, p.full_name AS patient_name, p.phone AS patient_phone, d.full_name AS doctor_name, d.specialisation FROM appointments a INNER JOIN patients p ON a.patient_id = p.id INNER JOIN doctors d ON a.doctor_id = d.id WHERE a.appointment_date = ? ORDER BY a.time_slot ASC, a.id ASC",
			"s",
			[$target_date]
		);
	}

	// This method sets the appointment status to cancelled
	public function cancel($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'cancelled' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method changes the appointment date and time, then marks it as rescheduled
	public function reschedule($id, $new_date, $new_time_slot) {
		$appointment = $this->fetchOne(
			"SELECT doctor_id FROM appointments WHERE id = ? LIMIT 1",
			"i",
			[$id]
		);

		if ($appointment === false) {
			return false;
		}

		$slot_taken = $this->fetchOne(
			"SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND id <> ? AND status IN ('confirmed', 'rescheduled', 'completed', 'no_show') LIMIT 1",
			"issi",
			[$appointment['doctor_id'], $new_date, $new_time_slot, $id]
		);

		if ($slot_taken !== false) {
			return false;
		}

		return $this->executeQuery(
			"UPDATE appointments SET appointment_date = ?, time_slot = ?, status = 'rescheduled' WHERE id = ?",
			"ssi",
			[$new_date, $new_time_slot, $id]
		);
	}

	// This method sets the appointment status to no_show
	public function mark_no_show($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'no_show' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method sets the appointment status to completed
	public function mark_completed($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'completed' WHERE id = ?",
			"i",
			[$id]
		);
	}
}