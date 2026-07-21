<?php
/*
This file handles consultation records created after a patient is seen by a doctor.
It keeps consultation data in one class so saving and reading records stays simple.
*/

class Consultation {
	// This stores the database connection so every method can use it
	private $conn;

	// Constructor: called when we do "new Consultation($conn)"
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

	// This method saves the doctor's notes after a consultation and returns the new consultation ID
	public function save($queue_id, $patient_id, $doctor_id, $notes, $diagnosis, $referral = null) {
		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO consultations (queue_id, patient_id, doctor_id, notes, diagnosis, referral) VALUES (?, ?, ?, ?, ?, ?)"
		);

		if (!$stmt) {
			return false;
		}

		mysqli_stmt_bind_param(
			$stmt,
			"iiisss",
			$queue_id,
			$patient_id,
			$doctor_id,
			$notes,
			$diagnosis,
			$referral
		);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$consultation_id = mysqli_insert_id($this->conn);
		mysqli_stmt_close($stmt);

		return $consultation_id > 0 ? (int) $consultation_id : false;
	}

	// This method gets all consultations for one patient, newest first
	// It joins the doctors table so we can show the doctor's name
	public function get_by_patient($patient_id) {
		return $this->fetchAll(
			"SELECT c.id, c.queue_id, c.patient_id, c.doctor_id, c.notes, c.diagnosis, c.referral, c.created_at, u.full_name AS doctor_name, u.phone AS doctor_phone FROM consultations c INNER JOIN doctors u ON c.doctor_id = u.id WHERE c.patient_id = ? ORDER BY c.created_at DESC, c.id DESC",
			"i",
			[$patient_id]
		);
	}

	// This method gets consultations for one doctor, optionally filtered by date
	public function get_by_doctor($doctor_id, $date = null) {
		if ($date === null) {
			return $this->fetchAll(
				"SELECT c.id, c.queue_id, c.patient_id, c.doctor_id, c.notes, c.diagnosis, c.referral, c.created_at, u.full_name AS patient_name, u.phone AS patient_phone, u.nic AS patient_nic, u.gender, u.date_of_birth FROM consultations c INNER JOIN patients u ON c.patient_id = u.id WHERE c.doctor_id = ? ORDER BY c.created_at DESC, c.id DESC",
				"i",
				[$doctor_id]
			);
		}

		return $this->fetchAll(
			"SELECT c.id, c.queue_id, c.patient_id, c.doctor_id, c.notes, c.diagnosis, c.referral, c.created_at, u.full_name AS patient_name, u.phone AS patient_phone, u.nic AS patient_nic, u.gender, u.date_of_birth FROM consultations c INNER JOIN patients u ON c.patient_id = u.id WHERE c.doctor_id = ? AND DATE(c.created_at) = ? ORDER BY c.created_at DESC, c.id DESC",
			"is",
			[$doctor_id, $date]
		);
	}

	// This method returns one consultation by its ID
	public function get_single($id) {
		return $this->fetchOne(
			"SELECT c.id, c.queue_id, c.patient_id, c.doctor_id, c.notes, c.diagnosis, c.referral, c.created_at, p.full_name AS patient_name, d.full_name AS doctor_name FROM consultations c INNER JOIN patients p ON c.patient_id = p.id INNER JOIN doctors d ON c.doctor_id = d.id WHERE c.id = ? LIMIT 1",
			"i",
			[$id]
		);
	}
}