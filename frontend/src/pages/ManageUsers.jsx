// User management page for FlowCare.
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/helpers'

function ManageUsers() {
  // Retrieve the currently logged in administrator details.
  const { user: currentUser } = useAuth()

  // State variables for storing lists, statuses, search queries, and form fields.
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    nic: '',
    address: '',
    role: 'doctor',
    specialisation: '',
    working_days: [],
    working_time: ''
  })

  // This useEffect fetches staff users once when the component mounts.
  useEffect(() => {
    fetchStaff()
  }, [])

  // This useEffect automatically clears success alert messages after 3 seconds.
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Fetches the list of all staff accounts from the backend database.
  const fetchStaff = async () => {
    try {
      setError('')
      const res = await fetch('/api/admin/users.php', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setStaff(data.users)
      } else {
        setError('Failed to load staff.')
      }
    } catch (err) {
      setError('Failed to load staff.')
    } finally {
      setLoading(false)
    }
  }

  // Handles form submission to create a new doctor or receptionist account.
  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate that required fields are filled.
    if (!newUser.full_name || !newUser.email || !newUser.password || !newUser.phone || !newUser.nic || !newUser.address) {
      setError('Full name, email, password, phone, NIC, and address are required.')
      return
    }

    // Validate phone number format (must start with 07 and contain 10 digits)
    if (!/^07\d{8}$/.test(newUser.phone)) {
      setError('Phone number must start with 07 and contain 10 digits (e.g. 0771234567).')
      return
    }

    // Validate NIC format (9 digits + V/X or 12 digits)
    if (!/^(?:\d{9}[VvXx]|\d{12})$/.test(newUser.nic)) {
      setError('Invalid NIC format. Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).')
      return
    }

    // Validate password complexity
    const pwd = newUser.password
    const minLength = 8
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasDigit = /[0-9]/.test(pwd)
    const hasSpecial = /[!@#\$%\^&\*\(\)\-_=+\[\]{};:'"\\|,.<>\/?]/.test(pwd)

    if (
      pwd.length < minLength ||
      !hasUpper ||
      !hasLower ||
      !hasDigit ||
      !hasSpecial
    ) {
      setError(
        `Password must be at least ${minLength} characters and include uppercase, lowercase, a number, and a special character.`
      )
      return
    }

    // Validate doctor specialisation and working time if the doctor role is selected.
    if (newUser.role === 'doctor' && !newUser.specialisation) {
      setError('Doctor specialisation is required.')
      return
    }
    if (newUser.role === 'doctor' && !newUser.working_time) {
      setError('Doctor working time / hours is required.')
      return
    }

    try {
      const payload = {
        action: 'create',
        full_name: newUser.full_name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        nic: newUser.nic,
        address: newUser.address,
        role: newUser.role,
        specialisation: newUser.role === 'doctor' ? newUser.specialisation : '',
        working_days: newUser.role === 'doctor' ? newUser.working_days.join(',') : '',
        working_time: newUser.role === 'doctor' ? newUser.working_time : ''
      }

      const response = await fetch('/api/admin/users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })
      
      const data = await response.json()
      if (data.success) {
        setSuccess('Account created.')
        fetchStaff()
        setShowAddForm(false)
        setShowNewUserPassword(false)
        setNewUser({
          full_name: '',
          email: '',
          password: '',
          phone: '',
          nic: '',
          address: '',
          role: 'doctor',
          specialisation: '',
          working_days: [],
          working_time: ''
        })
      } else {
        setError(data.error || 'Failed to create user.')
      }
    } catch (err) {
      setError('Failed to connect to the server.')
    }
  }

  // Activates or deactivates a user account after requesting confirmation.
  const handleToggleStatus = async (userId, role, currentStatus) => {
    setError('')
    setSuccess('')

    // Request confirmation from the administrator before proceeding.
    const message = currentStatus === 'active' ? 'Deactivate this account?' : 'Activate this account?'
    if (!window.confirm(message)) return

    try {
      const response = await fetch('/api/admin/users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'toggle_status',
          user_id: userId,
          role: role
        }),
        credentials: 'include'
      })

      const data = await response.json()
      if (data.success) {
        fetchStaff()
        setSuccess('Status updated.')
      } else {
        setError(data.error || 'Failed to toggle status.')
      }
    } catch (err) {
      setError('Failed to update account status.')
    }
  }

  // Computes the filtered list of staff members based on selected tab and search query.
  const filteredStaff = staff.filter((member) => {
    // Filter out users based on the selected role tab.
    if (activeTab !== 'all' && member.role !== activeTab) {
      return false
    }
    // Filter out users who do not match the search query.
    const query = searchQuery.toLowerCase()
    const nameMatch = member.full_name ? member.full_name.toLowerCase().includes(query) : false
    const emailMatch = member.email ? member.email.toLowerCase().includes(query) : false
    return nameMatch || emailMatch
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Renders the left sidebar navigation */}
      <Sidebar role="admin" activePage="Staff" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* Header row containing title and add user trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-800">User Accounts</h1>
                <p className="text-sm text-gray-500">Manage doctors and receptionists</p>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setShowNewUserPassword(false)
                }}
                className="bg-[#1A73E8] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center font-medium cursor-pointer transition-colors"
              >
                <i className="ti ti-plus mr-2" />
                Add New User
              </button>
            </div>

            {/* Renders error alert block if an error message exists */}
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm flex items-center justify-between bg-red-50 text-red-700 border border-red-200">
                <div className="flex items-center gap-2">
                  <i className="ti ti-alert-circle text-base"></i>
                  <span>{error}</span>
                </div>
                <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold focus:outline-none cursor-pointer">
                  &times;
                </button>
              </div>
            )}

            {/* Renders success alert block if a success message exists */}
            {success && (
              <div className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 animate-fadeIn">
                <i className="ti ti-check text-base"></i>
                <span>{success}</span>
              </div>
            )}

            {/* Renders form card for adding new staff users conditionally */}
            {showAddForm && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold mb-4 text-gray-800">Add New Staff Account</h2>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                        placeholder="Dr. John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showNewUserPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                          aria-label={showNewUserPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showNewUserPassword ? 'ti ti-eye text-base' : 'ti ti-eye-off text-base'} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">At least 8 chars, uppercase, lowercase, number, symbol.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                        placeholder="0771234567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
                      <input
                        type="text"
                        value={newUser.nic}
                        onChange={(e) => setNewUser({ ...newUser, nic: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                        placeholder="e.g. 199912345678 or 991234567V"
                        required
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={newUser.address}
                        onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                        placeholder="e.g. No. 12, Ward Place, Colombo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 bg-white"
                        required
                      >
                        {/* Why not admin or patient: Administrators must be created directly in the database, and patients register via the public portal. */}
                        <option value="doctor">Doctor</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>

                    {/* Renders doctor-only specialized fields conditionally */}
                    {newUser.role === 'doctor' && (
                      <div className="col-span-1 md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Specialisation</label>
                          <input
                            type="text"
                            value={newUser.specialisation}
                            onChange={(e) => setNewUser({ ...newUser, specialisation: e.target.value })}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                            placeholder="e.g. Cardiologist, Pediatrician, General Practitioner"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Working Time / Hours</label>
                          <input
                            type="text"
                            value={newUser.working_time}
                            onChange={(e) => setNewUser({ ...newUser, working_time: e.target.value })}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                            placeholder="e.g. 08:00 AM - 04:00 PM, or Morning Shift"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                              const isChecked = newUser.working_days.includes(day)
                              return (
                                <label key={day} className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const days = isChecked
                                        ? newUser.working_days.filter((d) => d !== day)
                                        : [...newUser.working_days, day]
                                      setNewUser({ ...newUser, working_days: days })
                                    }}
                                    className="rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]"
                                  />
                                  <span>{day}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="bg-[#1A73E8] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                      Create Account
                    </button>
                     <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setShowNewUserPassword(false)
                      }}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter controls and search field container */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    activeTab === 'all'
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('doctor')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    activeTab === 'doctor'
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Doctors
                </button>
                <button
                  onClick={() => setActiveTab('receptionist')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    activeTab === 'receptionist'
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Receptionists
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Main staff table container */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              
              {/* Renders loading skeletons conditionally when loading is active */}
              {loading ? (
                <div className="p-6 space-y-3">
                  <div className="animate-pulse bg-gray-100 h-12 rounded" />
                  <div className="animate-pulse bg-gray-100 h-12 rounded" />
                  <div className="animate-pulse bg-gray-100 h-12 rounded" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {/* Renders empty state card conditionally when search/filter returns no records */}
                  <div className="text-gray-300 text-5xl mb-3">
                    <i className="ti ti-users" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-700">No staff accounts found</h3>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search keywords.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Renders active staff data table when records are available */}
                  <table className="table-auto w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Working Days</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStaff.map((member) => {
                        const isSelf = member.id === currentUser?.id
                        return (
                          <tr key={`${member.role}-${member.id}`} className="border-b border-gray-50 hover:bg-gray-50">
                            
                            {/* Avatar and Name cell */}
                            <td className="px-4 py-3 flex items-center gap-3">
                              <div className="bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center font-bold text-sm h-9 w-9 shrink-0">
                                {getInitials(member.full_name)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{member.full_name}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </td>

                            {/* Role indicator badge cell */}
                            <td className="px-4 py-3">
                              {member.role === 'doctor' ? (
                                <span className="bg-blue-50 text-[#1A73E8] rounded-full px-2.5 py-0.5 text-xs font-medium">
                                  Doctor
                                </span>
                              ) : (
                                <span className="bg-purple-50 text-purple-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                  Receptionist
                                </span>
                              )}
                            </td>

                             {/* Contact details cell */}
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-800">{member.phone || '—'}</div>
                              {member.address && <div className="text-xs text-gray-500">{member.address}</div>}
                              {member.nic && <div className="text-xs text-gray-400">NIC: {member.nic}</div>}
                            </td>

                            {/* Doctor working days cell */}
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {member.role === 'doctor' ? (
                                <div className="space-y-1">
                                  {member.working_days && (
                                    <div className="bg-gray-50 border border-gray-100 rounded px-2 py-1 inline-block">
                                      Days: {member.working_days}
                                    </div>
                                  )}
                                  {member.working_time && (
                                    <div className="text-xs text-gray-500 font-medium mt-1">
                                      Time: {member.working_time}
                                    </div>
                                  )}
                                </div>
                              ) : '—'}
                            </td>

                            {/* Current account status indicator cell */}
                            <td className="px-4 py-3">
                              {member.status === 'active' ? (
                                <span className="bg-green-50 text-green-700 rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]" />
                                  Active
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Row Action buttons cell */}
                            <td className="px-4 py-3 text-xs text-gray-400 space-x-2">
                              <button
                                className="ti ti-edit text-gray-400 hover:text-[#1A73E8] p-1 cursor-pointer transition-colors"
                                title="Edit inline placeholder"
                              />
                              <span>|</span>
                              {isSelf ? (
                                <span
                                  className="text-gray-300 cursor-not-allowed select-none"
                                  title="Cannot deactivate your own account"
                                >
                                  Deactivate
                                </span>
                              ) : member.status === 'active' ? (
                                <button
                                  onClick={() => handleToggleStatus(member.id, member.role, 'active')}
                                  className="text-[#E53935] hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(member.id, member.role, 'inactive')}
                                  className="text-[#2ECC71] hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                >
                                  Activate
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ManageUsers
