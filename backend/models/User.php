<?php
/*
This file handles everything related to users - registering, logging in, and managing accounts.
We use a class so all user-related code lives in one place.

Prepared statements are used in every database query below so user input is treated as data,
not as SQL code. That helps prevent SQL injection attacks.
*/

class User {
	// This stores the database connection so all methods can use it
	private $conn;

	// This keeps the last error message so the caller can inspect why an action failed
	public $last_error = null;

	// Constructor: called when we do "new User($conn)"
	public function __construct($conn) {
		$this->conn = $conn;
	}

	// This helper runs a prepared SELECT query and returns the first matching row as an array
	private function fetchOne($sql, $types, $params) {
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
	private function fetchAll($sql, $types, $params) {
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
	private function executeQuery($sql, $types, $params) {
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

	// This method creates a new user account
	// It first checks if the NIC already exists, then hashes the password, then inserts the user
	public function register($full_name, $nic, $date_of_birth, $gender, $phone, $email, $password, $role = 'patient') {
		$this->last_error = null;

		$existing_user = $this->fetchOne(
			"SELECT id FROM users WHERE nic = ? LIMIT 1",
			"s",
			[$nic]
		);

		if ($existing_user) {
			$this->last_error = 'NIC already exists';
			return false;
		}

		if (!empty($email)) {
			$existing_email = $this->fetchOne(
				"SELECT id FROM users WHERE email = ? LIMIT 1",
				"s",
				[$email]
			);

			if ($existing_email) {
				$this->last_error = 'Email already exists';
				return false;
			}
		}

		$hashed_password = password_hash($password, PASSWORD_DEFAULT);

		if (!$hashed_password) {
			$this->last_error = 'Password hashing failed';
			return false;
		}

		$stmt = mysqli_prepare(
			$this->conn,
			"INSERT INTO users (full_name, nic, date_of_birth, gender, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
		);

		if (!$stmt) {
			$this->last_error = mysqli_error($this->conn);
			return false;
		}

		mysqli_stmt_bind_param(
			$stmt,
			"ssssssss",
			$full_name,
			$nic,
			$date_of_birth,
			$gender,
			$phone,
			$email,
			$hashed_password,
			$role
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

			if (str_contains($lowerMessage, "key 'email'") || str_contains($lowerMessage, 'users.email')) {
				$this->last_error = 'Email already exists';
			} elseif (str_contains($lowerMessage, "key 'nic'") || str_contains($lowerMessage, 'users.nic')) {
				$this->last_error = 'NIC already exists';
			} elseif ($exception->getCode() === 1062 && str_contains($lowerMessage, 'duplicate entry')) {
				$this->last_error = 'Duplicate user record';
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
	// It uses password_verify() to compare the plain password with the stored hashed password
	public function login($identifier, $password) {
		$this->last_error = null;

		$user = $this->fetchOne(
			"SELECT id, full_name, nic, email, password, role, status FROM users WHERE email = ? OR nic = ? LIMIT 1",
			"ss",
			[$identifier, $identifier]
		);

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
			'role' => $user['role'],
			'email' => $user['email'],
		];
	}

	// This method returns one user's data by their ID
	public function get_by_id($id) {
		$this->last_error = null;

		return $this->fetchOne(
			"SELECT id, full_name, nic, date_of_birth, gender, phone, email, role, status, created_at FROM users WHERE id = ? LIMIT 1",
			"i",
			[$id]
		);
	}

	// This method returns all users with a specific role, like all doctors or all patients
	public function get_all_by_role($role) {
		$this->last_error = null;

		return $this->fetchAll(
			"SELECT id, full_name, nic, date_of_birth, gender, phone, email, role, status, created_at FROM users WHERE role = ? ORDER BY full_name ASC",
			"s",
			[$role]
		);
	}

	// This method updates a user's basic details using a prepared statement
	public function update($id, $full_name, $phone, $email) {
		$this->last_error = null;

		return $this->executeQuery(
			"UPDATE users SET full_name = ?, phone = ?, email = ? WHERE id = ?",
			"sssi",
			[$full_name, $phone, $email, $id]
		);
	}

	// This method sets status = inactive instead of deleting the user so we keep their history in the database
	public function deactivate($id) {
		$this->last_error = null;

		return $this->executeQuery(
			"UPDATE users SET status = 'inactive' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method sets status = active again so the user can log in and use the system
	public function activate($id) {
		$this->last_error = null;

		return $this->executeQuery(
			"UPDATE users SET status = 'active' WHERE id = ?",
			"i",
			[$id]
		);
	}

	// This method verifies the old password first, then saves the new hashed password
	public function change_password($id, $old_password, $new_password) {
		$this->last_error = null;

		$user = $this->fetchOne(
			"SELECT password, status FROM users WHERE id = ? LIMIT 1",
			"i",
			[$id]
		);

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

		return $this->executeQuery(
			"UPDATE users SET password = ? WHERE id = ?",
			"si",
			[$hashed_new_password, $id]
		);
	}
}