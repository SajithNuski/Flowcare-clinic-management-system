<?php
/*
This file handles everything related to the queue - adding patients, tracking positions, and updating queue status.
We keep these actions in one class so the queue logic stays organized and easy to reuse.
*/

class Queue {
	// This stores the database connection so every method can use it
	private $conn;

	// Constructor: called when we do "new Queue($conn)"
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

	// This method adds a patient to today's queue
	// Step 1: count how many queue entries already exist for this doctor and date
	// Step 2: new queue number = current count + 1
	// Step 3: insert the new queue entry
	// Step 4: return the new queue ID and queue number
	public function add_to_queue($patient_id, $doctor_id, $date) {
		$existing = $this->fetchOne(
			"SELECT COUNT(*) AS total FROM queue WHERE doctor_id = ? AND date = ?",
			"is",
			[$doctor_id, $date]
		);

		if ($existing === false) {
			return false;
		}

		$queue_number = ((int) $existing['total']) + 1;

		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO queue (patient_id, doctor_id, queue_number, date, status) VALUES (?, ?, ?, ?, 'waiting')"
		);

		if (!$stmt) {
			return false;
		}

		mysqli_stmt_bind_param($stmt, "iiis", $patient_id, $doctor_id, $queue_number, $date);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			return false;
		}

		$queue_id = mysqli_insert_id($this->conn);
		mysqli_stmt_close($stmt);

		return [
			'queue_id' => (int) $queue_id,
			'queue_number' => (int) $queue_number,
		];
	}

	// This method gets all waiting patients for a doctor on a specific date
	// It joins the patients table so we can show the patient's name and phone number
	public function get_live_queue($doctor_id, $date) {
		return $this->fetchAll(
			"SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, u.full_name AS patient_name, u.phone AS patient_phone FROM queue q INNER JOIN patients u ON q.patient_id = u.id WHERE q.doctor_id = ? AND q.date = ? AND q.status = 'waiting' ORDER BY q.queue_number ASC",
			"is",
			[$doctor_id, $date]
		);
	}

	// This method gets doctor queue with patient info and appointment times
	public function get_doctor_queue($doctor_id, $date, $all = false) {
		$status_clause = $all ? "" : "AND q.status IN ('waiting', 'in_consultation')";
		$sql = "SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, q.completed_time, u.full_name AS patient_name, u.phone AS patient_phone, u.nic AS patient_nic, u.date_of_birth, u.gender, a.appointment_time, p.appointment_id FROM queue q INNER JOIN patients u ON q.patient_id = u.id LEFT JOIN payments p ON q.id = p.queue_id LEFT JOIN appointments a ON p.appointment_id = a.id WHERE q.doctor_id = ? AND q.date = ? {$status_clause} GROUP BY q.id ORDER BY q.queue_number ASC";
		return $this->fetchAll($sql, "is", [$doctor_id, $date]);
	}

	// This method gets the live waiting queue for all doctors on a given date
	// It joins the patients table and the doctors table so the receptionist can see doctor and patient details together
	public function get_live_queue_all($date) {
		return $this->fetchAll(
			"SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, u.full_name AS patient_name, u.phone AS patient_phone, d.full_name AS doctor_name, d.specialisation FROM queue q INNER JOIN patients u ON q.patient_id = u.id INNER JOIN doctors d ON q.doctor_id = d.id WHERE q.date = ? AND q.status = 'waiting' ORDER BY q.doctor_id ASC, q.queue_number ASC",
			"s",
			[$date]
		);
	}

	// This method gets the full queue (all statuses) for all doctors on a given date
	// It joins the patients table, doctors table, and LEFT JOINs payments and appointments to get appointment slot time
	public function get_full_queue_all($date) {
		return $this->fetchAll(
			"SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, q.completed_time, u.full_name AS patient_name, u.phone AS patient_phone, d.full_name AS doctor_name, d.specialisation, a.appointment_time FROM queue q INNER JOIN patients u ON q.patient_id = u.id INNER JOIN doctors d ON q.doctor_id = d.id LEFT JOIN payments p ON q.id = p.queue_id LEFT JOIN appointments a ON p.appointment_id = a.id WHERE q.date = ? ORDER BY q.doctor_id ASC, q.queue_number ASC",
			"s",
			[$date]
		);
	}

	// This method gets one patient's queue entry for today and also calculates their position
	// Position means how many waiting patients are still ahead of them
	public function get_my_queue_status($patient_id, $date) {
		$queue_row = $this->fetchOne(
			"SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, q.completed_time, u.full_name AS patient_name, u.phone AS patient_phone FROM queue q INNER JOIN patients u ON q.patient_id = u.id WHERE q.patient_id = ? AND q.date = ? ORDER BY q.id DESC LIMIT 1",
			"is",
			[$patient_id, $date]
		);

		if ($queue_row === false) {
			return false;
		}

		$ahead = $this->fetchOne(
			"SELECT COUNT(*) AS total FROM queue WHERE doctor_id = ? AND date = ? AND queue_number < ? AND status = 'waiting'",
			"isi",
			[$queue_row['doctor_id'], $date, $queue_row['queue_number']]
		);

		if ($ahead === false) {
			return false;
		}

		$queue_row['position'] = (int) $ahead['total'];
		return $queue_row;
	}

	// This method finds the next waiting patient for a doctor today and moves them into consultation
	public function call_next($doctor_id) {
		$today = date('Y-m-d');

		$next_patient = $this->fetchOne(
			"SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, u.full_name AS patient_name, u.phone AS patient_phone 
			 FROM queue q 
			 INNER JOIN patients u ON q.patient_id = u.id 
			 LEFT JOIN payments p ON q.id = p.queue_id 
			 LEFT JOIN appointments a ON p.appointment_id = a.id 
			 WHERE q.doctor_id = ? AND q.date = ? AND q.status = 'waiting' 
			 ORDER BY 
			   CASE WHEN a.appointment_time IS NOT NULL AND a.appointment_time != '' THEN 0 ELSE 1 END ASC,
			   a.appointment_time ASC,
			   q.queue_number ASC 
			 LIMIT 1",
			"is",
			[$doctor_id, $today]
		);

		if ($next_patient === false) {
			return false;
		}

		$updated = $this->executeQuery(
			"UPDATE queue SET status = 'in_consultation' WHERE id = ?",
			"i",
			[$next_patient['queue_id']]
		);

		if (!$updated) {
			return false;
		}

		$next_patient['status'] = 'in_consultation';
		return $next_patient;
	}

	// This method marks a queue entry as completed and stores the time it was finished
	public function mark_complete($queue_id) {
		return $this->executeQuery(
			"UPDATE queue SET status = 'completed', completed_time = NOW() WHERE id = ?",
			"i",
			[$queue_id]
		);
	}

	// This method marks a queue entry as no-show
	public function mark_no_show($queue_id) {
		return $this->executeQuery(
			"UPDATE queue SET status = 'no_show' WHERE id = ?",
			"i",
			[$queue_id]
		);
	}

	// This method returns a summary of today's queue counts
	// It shows how many patients are total, waiting, in consultation, completed, and no-show
	public function get_today_summary($date) {
		$summary = $this->fetchOne(
			"SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END), 0) AS waiting, COALESCE(SUM(CASE WHEN status = 'in_consultation' THEN 1 ELSE 0 END), 0) AS in_consultation, COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed, COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0) AS no_show FROM queue WHERE date = ?",
			"s",
			[$date]
		);

		if ($summary === false) {
			return false;
		}

		return [
			'total' => (int) $summary['total'],
			'waiting' => (int) $summary['waiting'],
			'in_consultation' => (int) $summary['in_consultation'],
			'completed' => (int) $summary['completed'],
			'no_show' => (int) $summary['no_show'],
		];
	}

	// This method calculates the average wait time in minutes for completed queue entries on a date
	public function calculate_avg_wait($date) {
		$result = $this->fetchOne(
			"SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, check_in_time, completed_time)), 2) AS avg_wait_minutes FROM queue WHERE date = ? AND status = 'completed' AND completed_time IS NOT NULL",
			"s",
			[$date]
		);

		if ($result === false) {
			return false;
		}

		if ($result['avg_wait_minutes'] === null) {
			return null;
		}

		return (float) $result['avg_wait_minutes'];
	}
}