<?php

class Payment {
	private $conn;

	public function __construct($conn) {
		$this->conn = $conn;
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

	public function create($patient_id, $queue_id, $appointment_id, $doctor_id, $amount, $payment_method, $notes = '') {
		$payment_date = date('Y-m-d');
		
		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO payments (patient_id, queue_id, appointment_id, doctor_id, amount, payment_method, payment_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
		);

		if (!$stmt) {
			return false;
		}

		// Ensure nulls are handled correctly for appointment_id
		$appt_val = $appointment_id > 0 ? (int)$appointment_id : null;
		$doc_val = $doctor_id > 0 ? (int)$doctor_id : null;

		mysqli_stmt_bind_param(
			$stmt,
			"iiiidsss",
			$patient_id,
			$queue_id,
			$appt_val,
			$doc_val,
			$amount,
			$payment_method,
			$payment_date,
			$notes
		);

		$success = mysqli_stmt_execute($stmt);
		mysqli_stmt_close($stmt);

		return $success;
	}

	public function get_history($date = null) {
		if ($date) {
			return $this->fetchAll(
				"SELECT 
					p.id,
					p.patient_id,
					p.queue_id,
					p.appointment_id,
					p.doctor_id,
					p.amount,
					p.payment_method,
					p.payment_date,
					p.notes,
					p.created_at,
					pat.full_name AS patient_name,
					pat.nic AS patient_nic,
					pat.phone AS patient_phone,
					doc.full_name AS doctor_name
				FROM payments p
				INNER JOIN patients pat ON p.patient_id = pat.id
				INNER JOIN doctors doc ON p.doctor_id = doc.id
				WHERE p.payment_date = ?
				ORDER BY p.created_at DESC, p.id DESC",
				"s",
				[$date]
			);
		} else {
			return $this->fetchAll(
				"SELECT 
					p.id,
					p.patient_id,
					p.queue_id,
					p.appointment_id,
					p.doctor_id,
					p.amount,
					p.payment_method,
					p.payment_date,
					p.notes,
					p.created_at,
					pat.full_name AS patient_name,
					pat.nic AS patient_nic,
					pat.phone AS patient_phone,
					doc.full_name AS doctor_name
				FROM payments p
				INNER JOIN patients pat ON p.patient_id = pat.id
				INNER JOIN doctors doc ON p.doctor_id = doc.id
				ORDER BY p.created_at DESC, p.id DESC",
				"",
				[]
			);
		}
	}
}