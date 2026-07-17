<?php

class Appointment {
	private $conn;

	public function __construct($conn) {
		$this->conn = $conn;
	}

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

	public function check_slot_available($doctor_id, $appointment_date, $appointment_time) {
		$stmt = mysqli_prepare(
			$this->conn,
			"SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status IN ('confirmed', 'rescheduled', 'completed')"
		);
		if (!$stmt) {
			return false;
		}
		mysqli_stmt_bind_param($stmt, "iss", $doctor_id, $appointment_date, $appointment_time);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		$row = $result ? mysqli_fetch_assoc($result) : null;
		mysqli_stmt_close($stmt);
		return ($row && (int)$row['count'] === 0);
	}

	public function get_by_id($id) {
		return $this->fetchOne(
			"SELECT id, patient_id, doctor_id, appointment_date, appointment_time, visit_reason, notes, status, created_at, cancelled_at FROM appointments WHERE id = ? LIMIT 1",
			"i",
			[$id]
		);
	}

	public function create($patient_id, $doctor_id, $appointment_date, $appointment_time, $visit_reason, $notes = '', $patient_name = null) {
		if (!$this->check_slot_available($doctor_id, $appointment_date, $appointment_time)) {
			return false;
		}

		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO appointments (patient_id, patient_name, doctor_id, appointment_date, appointment_time, visit_reason, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')"
		);

		if (!$stmt) {
			return false;
		}

		mysqli_stmt_bind_param(
			$stmt,
			"isissss",
			$patient_id,
			$patient_name,
			$doctor_id,
			$appointment_date,
			$appointment_time,
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

	public function get_by_patient($patient_id) {
		return $this->fetchAll(
			"SELECT a.id, a.patient_id, COALESCE(a.patient_name, d.full_name) AS patient_name, a.doctor_id, a.appointment_date, a.appointment_time, a.appointment_time AS time_slot, a.visit_reason, a.notes, a.status, a.created_at, d.full_name AS doctor_name, d.phone AS doctor_phone, d.specialisation FROM appointments a INNER JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = ? ORDER BY a.created_at DESC, a.id DESC",
			"i",
			[$patient_id]
		);
	}

	public function get_by_doctor_and_date($doctor_id, $date) {
		return $this->fetchAll(
			"SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.appointment_time AS time_slot, a.visit_reason, a.notes, a.status, a.created_at, COALESCE(a.patient_name, u.full_name) AS patient_name, u.phone AS patient_phone FROM appointments a INNER JOIN patients u ON a.patient_id = u.id WHERE a.doctor_id = ? AND a.appointment_date = ? ORDER BY a.appointment_time ASC, a.id ASC",
			"is",
			[$doctor_id, $date]
		);
	}

	public function get_today_all($date = null) {
		$target_date = $date ?: date('Y-m-d');

		return $this->fetchAll(
			"SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.appointment_time AS time_slot, a.visit_reason, a.notes, a.status, a.created_at, COALESCE(a.patient_name, p.full_name) AS patient_name, p.nic AS patient_nic, p.phone AS patient_phone, d.full_name AS doctor_name, d.specialisation FROM appointments a INNER JOIN patients p ON a.patient_id = p.id INNER JOIN doctors d ON a.doctor_id = d.id WHERE a.appointment_date = ? ORDER BY a.appointment_time ASC, a.id ASC",
			"s",
			[$target_date]
		);
	}

	public function cancel($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
			"i",
			[$id]
		);
	}

	public function reschedule($id, $new_date, $new_appointment_time) {
		$appointment = $this->fetchOne(
			"SELECT doctor_id FROM appointments WHERE id = ? LIMIT 1",
			"i",
			[$id]
		);

		if ($appointment === false) {
			return false;
		}

		return $this->executeQuery(
			"UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'rescheduled' WHERE id = ?",
			"ssi",
			[$new_date, $new_appointment_time, $id]
		);
	}

	public function mark_no_show($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'no_show' WHERE id = ?",
			"i",
			[$id]
		);
	}

	public function mark_completed($id) {
		return $this->executeQuery(
			"UPDATE appointments SET status = 'completed' WHERE id = ?",
			"i",
			[$id]
		);
	}
}