<?php
/*
This file handles everything related to users - registering, logging in, and managing accounts.
We use a class so all user-related code lives in one place.

Since the users table has been split into: admin, doctors, receptionist, patients,
this class dynamically routes queries to the correct table based on user role or direct lookup.
*/

class User
{
	// This stores the database connection so all methods can use it
	private $conn;

	// This keeps the last error message so the caller can inspect why an action failed
	public $last_error = null;

	// Constructor: called when we do "new User($conn)"
	public function __construct($conn)
	{
		$this->conn = $conn;
	}

	// This helper runs a prepared SELECT query and returns the first matching row as an array
	private function fetchOne($sql, $types, $params)
	{
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			$this->last_error = mysqli_error($this->conn);
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		if (!mysqli_stmt_execute($stmt)) {
			$this->last_error = mysqli_stmt_error($stmt);
			mysqli_stmt_close($stmt);
			return false;
		}

		$result = mysqli_stmt_get_result($stmt);

		if (!$result) {
			$this->last_error = mysqli_stmt_error($stmt);
			mysqli_stmt_close($stmt);
			return false;
		}

		$row = mysqli_fetch_assoc($result);
		mysqli_stmt_close($stmt);

		return $row ?: false;
	}

	// This helper runs a prepared SELECT query and returns all matching rows as an array
	private function fetchAll($sql, $types, $params)
	{
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			$this->last_error = mysqli_error($this->conn);
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		if (!mysqli_stmt_execute($stmt)) {
			$this->last_error = mysqli_stmt_error($stmt);
			mysqli_stmt_close($stmt);
			return false;
		}

		$result = mysqli_stmt_get_result($stmt);

		if (!$result) {
			$this->last_error = mysqli_stmt_error($stmt);
			mysqli_stmt_close($stmt);
			return false;
		}

		$rows = mysqli_fetch_all($result, MYSQLI_ASSOC);
		mysqli_stmt_close($stmt);

		return $rows;
	}

	// This helper runs a prepared INSERT, UPDATE, or DELETE query and returns true or false
	private function executeQuery($sql, $types, $params)
	{
		$stmt = mysqli_prepare($this->conn, $sql);

		if (!$stmt) {
			$this->last_error = mysqli_error($this->conn);
			return false;
		}

		if ($types !== '' && !empty($params)) {
			mysqli_stmt_bind_param($stmt, $types, ...$params);
		}

		$executed = mysqli_stmt_execute($stmt);

		if (!$executed) {
			$this->last_error = mysqli_stmt_error($stmt);
			mysqli_stmt_close($stmt);
			return false;
		}

		mysqli_stmt_close($stmt);
		return true;
	}

	// Helper to resolve role to table name
	private function get_table_by_role($role)
	{
		if ($role === 'doctor') return 'doctors';
		if ($role === 'patient') return 'patients';
		if ($role === 'receptionist') return 'receptionist';
		return 'admin';
	}

	// This method creates a new user account in their corresponding table
	public function register($full_name, $nic, $date_of_birth, $gender, $phone, $email, $password, $role = 'patient')
	{
		$this->last_error = null;

		// 1. Check duplicate NIC/email across all 4 split tables
		$tables = ['admin', 'doctors', 'receptionist', 'patients'];
		foreach ($tables as $t) {
			$existing_user = $this->fetchOne("SELECT id FROM $t WHERE nic = ? LIMIT 1", "s", [$nic]);
			if ($existing_user) {
				$this->last_error = 'NIC already exists';
				return false;
			}
			if (!empty($email)) {
				$existing_email = $this->fetchOne("SELECT id FROM $t WHERE email = ? LIMIT 1", "s", [$email]);
				if ($existing_email) {
					$this->last_error = 'Email already exists';
					return false;
				}
			}
		}

		$hashed_password = password_hash($password, PASSWORD_DEFAULT);

		if (!$hashed_password) {
			$this->last_error = 'Password hashing failed';
			return false;
		}

		$target_table = $this->get_table_by_role($role);

		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO $target_table (full_name, nic, date_of_birth, gender, phone, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)"
		);

		if (!$stmt) {
			$this->last_error = mysqli_error($this->conn);
			return false;
		}

		$email_val = !empty($email) ? $email : null;
		mysqli_stmt_bind_param(
			$stmt,
			"sssssss",
			$full_name,
			$nic,
			$date_of_birth,
			$gender,
			$phone,
			$email_val,
			$hashed_password
		);

		try {
			if (!mysqli_stmt_execute($stmt)) {
				$this->last_error = mysqli_stmt_error($stmt);
				mysqli_stmt_close($stmt);
				return false;
			}
		} catch (mysqli_sql_exception $exception) {
			$errorMessage = $exception->getMessage();
			$lowerMessage = strtolower($errorMessage);

			if (str_contains($lowerMessage, 'email')) {
				$this->last_error = 'Email already exists';
			} elseif (str_contains($lowerMessage, 'nic')) {
				$this->last_error = 'NIC already exists';
			} else {
				$this->last_error = $errorMessage;
			}

			mysqli_stmt_close($stmt);
			return false;
		}

		$new_user_id = mysqli_insert_id($this->conn);
		mysqli_stmt_close($stmt);

		return $new_user_id > 0 ? $new_user_id : false;
	}

	// This method checks if the email or NIC and password are correct
	public function login($identifier, $password)
	{
		$this->last_error = null;
		$user = null;
		$role = null;

		$tables = ['admin', 'doctors', 'receptionist', 'patients'];
		foreach ($tables as $t) {
			$user = $this->fetchOne(
				"SELECT id, full_name, nic, email, password, status FROM $t WHERE email = ? OR nic = ? LIMIT 1",
				"ss",
				[$identifier, $identifier]
			);
			if ($user) {
				if ($t === 'doctors') $role = 'doctor';
				elseif ($t === 'patients') $role = 'patient';
				else $role = $t;
				break;
			}
		}

		if (!$user) {
			$this->last_error = 'User not found';
			return false;
		}

		if ($user['status'] !== 'active') {
			$this->last_error = 'User is inactive';
			return false;
		}

		if (!password_verify($password, $user['password'])) {
			$this->last_error = 'Incorrect password';
			return false;
		}

		return [
			'id' => (int) $user['id'],
			'full_name' => $user['full_name'],
			'role' => $role,
			'email' => $user['email'],
		];
	}

	// This method returns one user's data by their ID
	public function get_by_id($id, $role = null)
	{
		$this->last_error = null;

		if ($role) {
			$table = $this->get_table_by_role($role);
			return $this->fetchOne(
				"SELECT *, '$role' AS role FROM $table WHERE id = ? LIMIT 1",
				"i",
				[$id]
			);
		}

		$tables = ['admin', 'doctors', 'receptionist', 'patients'];
		foreach ($tables as $t) {
			$role_name = ($t === 'doctors') ? 'doctor' : (($t === 'patients') ? 'patient' : $t);
			$res = $this->fetchOne(
				"SELECT *, '$role_name' AS role FROM $t WHERE id = ? LIMIT 1",
				"i",
				[$id]
			);
			if ($res) {
				return $res;
			}
		}

		return false;
	}

	// This method returns all users with a specific role
	public function get_all_by_role($role)
	{
		$this->last_error = null;
		$table = $this->get_table_by_role($role);
		return $this->fetchAll(
			"SELECT *, '$role' AS role FROM $table ORDER BY full_name ASC",
			"",
			[]
		);
	}

	// This method updates a user's basic details
	public function update($id, $full_name, $phone, $email, $role = null)
	{
		$this->last_error = null;

		if ($role === null) {
			$user = $this->get_by_id($id);
			if (!$user) {
				$this->last_error = "User not found";
				return false;
			}
			$role = $user['role'];
		}

		$table = $this->get_table_by_role($role);
		return $this->executeQuery(
			"UPDATE $table SET full_name = ?, phone = ?, email = ? WHERE id = ?",
			"sssi",
			[$full_name, $phone, $email, $id]
		);
	}

	// This method sets status = inactive
	public function deactivate($id, $role = null)
	{
		$this->last_error = null;

		if ($role === null) {
			$user = $this->get_by_id($id);
			if (!$user) return false;
			$role = $user['role'];
		}

		$table = $this->get_table_by_role($role);
		return $this->executeQuery(
			"UPDATE $table SET status = 'inactive' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method sets status = active again
	public function activate($id, $role = null)
	{
		$this->last_error = null;

		if ($role === null) {
			$user = $this->get_by_id($id);
			if (!$user) return false;
			$role = $user['role'];
		}

		$table = $this->get_table_by_role($role);
		return $this->executeQuery(
			"UPDATE $table SET status = 'active' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method verifies the old password first, then saves the new hashed password
	public function change_password($id, $old_password, $new_password, $role = null)
	{
		$this->last_error = null;

		$user = $this->get_by_id($id, $role);
		if (!$user) {
			$this->last_error = 'User not found';
			return false;
		}

		if ($user['status'] !== 'active') {
			$this->last_error = 'User is inactive';
			return false;
		}

		if (!password_verify($old_password, $user['password'])) {
			$this->last_error = 'Old password is incorrect';
			return false;
		}

		$hashed_new_password = password_hash($new_password, PASSWORD_DEFAULT);

		if (!$hashed_new_password) {
			$this->last_error = 'Password hashing failed';
			return false;
		}

		$table = $this->get_table_by_role($user['role']);
		return $this->executeQuery(
			"UPDATE $table SET password = ? WHERE id = ?",
			"si",
			[$hashed_new_password, $id]
		);
	}

	// This method updates a patient's personal and medical details
	public function update_patient_profile($id, $full_name, $phone, $email, $gender, $date_of_birth, $medical_history, $allergies, $blood_group, $emergency_contact)
	{
		$this->last_error = null;

		// Check if email already exists for another user in any of the tables
		$tables = ['admin', 'doctors', 'receptionist', 'patients'];
		if (!empty($email)) {
			foreach ($tables as $t) {
				$existing = $this->fetchOne("SELECT id FROM $t WHERE email = ? AND NOT (id = ? AND '$t' = 'patients') LIMIT 1", "si", [$email, $id]);
				if ($existing) {
					$this->last_error = 'Email already exists';
					return false;
				}
			}
		}

		$sql = "UPDATE patients SET 
					full_name = ?, 
					phone = ?, 
					email = ?, 
					gender = ?, 
					date_of_birth = ?, 
					medical_history = ?, 
					allergies = ?, 
					blood_group = ?, 
					emergency_contact = ? 
				WHERE id = ?";
		
		return $this->executeQuery($sql, "sssssssssi", [
			$full_name,
			$phone,
			$email,
			$gender,
			$date_of_birth,
			$medical_history,
			$allergies,
			$blood_group,
			$emergency_contact,
			$id
		]);
	}
}
?>