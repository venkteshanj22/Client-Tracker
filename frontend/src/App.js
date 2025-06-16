import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Users, 
  Building2, 
  Clock, 
  AlertCircle, 
  Plus,
  LogOut,
  User,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  FileText,
  Target,
  Settings,
  Link,
  MessageCircle,
  FolderPlus,
  Eye,
  Edit,
  Trash2,
  Table,
  LayoutDashboard,
  ChevronDown,
  Key
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Stage configuration
const STAGES = {
  1: { name: 'First Contact', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-800' },
  2: { name: 'Technical Discussion', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-800' },
  3: { name: 'Pricing Proposal', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-800' },
  4: { name: 'Negotiation', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-800' },
  5: { name: 'Converted Client', color: 'bg-green-100 border-green-300', textColor: 'text-green-800' }
};

// Currency options
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];

// Source options
const SOURCE_OPTIONS = [
  'Direct', 'Website', 'Referral', 'LinkedIn', 'Social Media', 
  'Advertisement', 'Cold Call', 'Email Campaign', 'Event'
];

// Draggable Client Card Component (for Kanban)
const ClientCard = ({ client, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stage = STAGES[client.stage];

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(client);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Drag handle */}
      <div 
        {...attributes}
        {...listeners}
        className="w-full cursor-move"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-gray-900 truncate">{client.company_name}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage?.color} ${stage?.textColor}`}>
            Stage {client.stage}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{client.contact_person}</p>
        <p className="text-xs text-gray-500 mb-2">{client.email}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{client.industry}</span>
          <span>{new Date(client.last_interaction).toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Click to view details button */}
      <button
        onClick={handleClick}
        className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 py-1 border-t border-gray-100"
      >
        View Details
      </button>
    </div>
  );
};

// Kanban Column Component
const KanbanColumn = ({ stage, clients, onClientClick }) => {
  const stageConfig = STAGES[stage];
  const { setNodeRef } = useDroppable({
    id: stage.toString(),
  });
  
  return (
    <div 
      ref={setNodeRef}
      className="bg-gray-50 rounded-lg p-4 min-h-[600px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{stageConfig.name}</h3>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
          {clients.length}
        </span>
      </div>
      
      <SortableContext items={clients.map(c => c.id)}>
        <div className="space-y-3">
          {clients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={onClientClick}
            />
          ))}
        </div>
      </SortableContext>
      
      {clients.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Building2 className="w-8 h-8 mx-auto mb-2" />
          <p>No clients in this stage</p>
        </div>
      )}
    </div>
  );
};

// Table View Component
const TableView = ({ clients, bdes, onView, onEdit, onDelete, currentUser }) => {
  const activeClients = clients.filter(c => !c.is_dropped);
  const droppedClients = clients.filter(c => c.is_dropped);

  const getBdeName = (bdeId) => {
    const bde = bdes.find(b => b.id === bdeId);
    return bde ? bde.name : 'Unknown';
  };

  const ClientTable = ({ clients, title, showDropReason = false }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title} ({clients.length})</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BDE Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              {showDropReason && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop Reason</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client, index) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{client.company_name}</div>
                    <div className="text-sm text-gray-500">{client.contact_person}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    {client.source || 'Direct'}
                    {client.source === 'Referral' && client.referrer_name && (
                      <div className="text-xs text-gray-400">by {client.referrer_name}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getBdeName(client.assigned_bde)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGES[client.stage]?.color} ${STAGES[client.stage]?.textColor}`}>
                    {STAGES[client.stage]?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.budget ? `${client.budget_currency} ${client.budget?.toLocaleString()}` : '-'}
                </td>
                {showDropReason && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.drop_reason || '-'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(client)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit Client"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={() => onDelete(client)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Building2 className="w-8 h-8 mx-auto mb-2" />
            <p>No {title.toLowerCase()} found</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <ClientTable clients={activeClients} title="Active Clients" />
      <ClientTable clients={droppedClients} title="Dropped Clients" showDropReason={true} />
    </div>
  );
};

// Login Component
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      onLogin(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const initSuperAdmin = async () => {
    try {
      const response = await axios.post(`${API}/auth/init-super-admin`);
      alert(`Super Admin Created!\nEmail: ${response.data.email}\nPassword: ${response.data.password}`);
    } catch (error) {
      if (error.response?.status === 400) {
        alert('Super admin already exists');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Tracker CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={initSuperAdmin}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Initialize Super Admin (First Time Setup)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ user, stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <Building2 className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_clients}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <Target className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Converted</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.clients_by_stage?.[5] || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Dropped</p>
            <p className="text-2xl font-bold text-gray-900">{stats.dropped_clients}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <Clock className="w-8 h-8 text-yellow-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-gray-900">{stats.overdue_tasks}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Profile Modal
const UserProfileModal = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      await axios.put(`${API}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local storage with new user data
      const userData = JSON.parse(localStorage.getItem('user'));
      userData.name = profileData.name;
      userData.email = profileData.email;
      localStorage.setItem('user', JSON.stringify(userData));
      
      alert('Profile updated successfully');
      setIsEditing(false);
      onUpdate(); // Refresh parent data
    } catch (error) {
      alert(error.response?.data?.detail || 'Error updating profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {['profile', 'password'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({ name: user.name, email: user.email });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Client Detail Modal with Tasks and Notes tabs
const ClientDetailModal = ({ client, onClose, onUpdate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    assigned_to: currentUser.id
  });
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
      fetchAllUsers();
    }
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const clientTasks = response.data.filter(t => t.client_id === client.id);
      setTasks(clientTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API}/users/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addNote = async () => {
    if (!notes.trim()) return;
    
    setIsAddingNote(true);
    try {
      await axios.post(`${API}/clients/${client.id}/notes`, 
        { text: notes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNotes('');
      onUpdate(); // Refresh data
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    setIsAddingTask(true);
    try {
      await axios.post(`${API}/tasks`, 
        {
          ...newTask,
          client_id: client.id,
          deadline: new Date(newTask.deadline).toISOString()
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNewTask({ title: '', description: '', deadline: '', assigned_to: currentUser.id });
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const updateStage = async (newStage) => {
    try {
      await axios.put(`${API}/clients/${client.id}`, 
        { stage: newStage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      onUpdate(); // Refresh data
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const markAsDropped = async () => {
    const reason = prompt('Reason for dropping this client:');
    if (!reason) return;

    try {
      await axios.put(`${API}/clients/${client.id}`, 
        { is_dropped: true, drop_reason: reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      onUpdate(); // Refresh data
      onClose();
    } catch (error) {
      console.error('Error dropping client:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{client.company_name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {['overview', 'notes', 'tasks'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Person</p>
                      <p className="font-medium">{client.contact_person}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{client.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium">{client.industry}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium">{client.source || 'Direct'}</p>
                    {client.source === 'Referral' && client.referrer_name && (
                      <p className="text-xs text-gray-500">Referred by: {client.referrer_name}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-medium">
                      {client.budget ? `${client.budget_currency} ${client.budget?.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Current Stage</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {Object.entries(STAGES).map(([stageNum, stage]) => (
                        <button
                          key={stageNum}
                          onClick={() => updateStage(parseInt(stageNum))}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            client.stage == stageNum 
                              ? `${stage.color} ${stage.textColor}` 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {stageNum}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {client.requirements && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{client.requirements}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={markAsDropped}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Mark as Dropped
                </button>
                
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              {/* Add Note */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add New Note</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows="3"
                />
                <button
                  onClick={addNote}
                  disabled={isAddingNote || !notes.trim()}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List - Latest first */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {client.notes?.length > 0 ? (
                  client.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No notes yet</p>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              {/* Add Task */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Add New Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                    <input
                      type="datetime-local"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                    <select
                      value={newTask.assigned_to}
                      onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows="2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={addTask}
                      disabled={isAddingTask || !newTask.title.trim() || !newTask.deadline}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isAddingTask ? 'Adding...' : 'Add Task'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const assignedUser = allUsers.find(u => u.id === task.assigned_to);
                    return (
                      <div key={task.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Assigned to: {assignedUser?.name || 'Unknown'} | 
                              Deadline: {new Date(task.deadline).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'done' ? 'bg-green-100 text-green-800' :
                            task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 italic">No tasks yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Notification System Component (with Slack Integration)
const NotificationSystem = ({ user, onUpdate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);

  const sendTestNotification = async () => {
    setIsTestingSlack(true);
    try {
      // Create a test client to trigger notification
      await axios.post(`${API}/clients`, {
        company_name: `Test Notification ${new Date().getTime()}`,
        contact_person: "Test User",
        email: "test@example.com",
        phone: "+1-555-0000",
        industry: "Testing",
        company_size: "1-10",
        source: "Direct",
        requirements: "Testing Slack notifications",
        assigned_bde: user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('🎉 Test notification sent to Slack! Check your channel.');
      onUpdate(); // Refresh to show the test client
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    } finally {
      setIsTestingSlack(false);
    }
  };

  if (!showNotifications) {
    return (
      <button
        onClick={() => setShowNotifications(true)}
        className="text-gray-600 hover:text-gray-900 flex items-center"
      >
        <MessageCircle className="w-5 h-5 mr-1" />
        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full ml-1">
          Slack Connected
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Slack Notifications</h2>
          <button
            onClick={() => setShowNotifications(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center text-green-600 mb-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Slack Integration Active</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">Automatic Notifications Enabled:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>🎉 New client added</li>
              <li>📈 Client stage updates</li>
              <li>📝 Notes and tasks added</li>
              <li>❌ Client dropped</li>
              <li>✏️ Client information edited</li>
              <li>🗑️ Client deleted</li>
            </ul>
          </div>
          
          <button
            onClick={sendTestNotification}
            disabled={isTestingSlack}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isTestingSlack ? 'Sending Test...' : 'Send Test Notification'}
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            Notifications are sent to your configured Slack channel
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = ({ onClose, onUpdate, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'bde'
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    name: '',
    role: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API}/auth/register`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setFormData({ email: '', name: '', password: '', role: 'bde' });
      setShowAddUser(false);
      fetchUsers();
      onUpdate();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.detail || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.put(`${API}/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setEditingUser(null);
      setEditFormData({ email: '', name: '', role: '', is_active: true });
      fetchUsers();
      onUpdate();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.detail || 'Error updating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      alert('Cannot delete your own account');
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${user.name}" (${user.email})?\n\nThis action cannot be undone and will:\n- Remove the user from the system\n- Delete tasks created by this user\n\nNote: Users with assigned clients or tasks cannot be deleted.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      fetchUsers(); // Refresh users list
      onUpdate(); // Refresh parent data
      alert(`User ${user.name} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.detail || 'Error deleting user');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </button>
          </div>

          {showAddUser && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="bde">BDE</option>
                    {currentUser.role === 'super_admin' && <option value="admin">Admin</option>}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 mr-2"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  {currentUser.role === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    {currentUser.role === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentUser.role === 'super_admin' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ User Deletion Rules:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Cannot delete users with assigned clients</li>
                <li>• Cannot delete users with assigned tasks</li>
                <li>• Cannot delete your own account</li>
                <li>• Deleting a user will remove all tasks they created</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="bde">BDE</option>
                  {currentUser.role === 'super_admin' && <option value="admin">Admin</option>}
                  {currentUser.role === 'super_admin' && editingUser.id === currentUser.id && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  required
                  value={editFormData.is_active}
                  onChange={(e) => setEditFormData({...editFormData, is_active: e.target.value === 'true'})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Client Modal
const EditClientModal = ({ client, onClose, onUpdate, bdes }) => {
  const [formData, setFormData] = useState({
    company_name: client.company_name,
    contact_person: client.contact_person,
    email: client.email,
    phone: client.phone,
    industry: client.industry,
    company_size: client.company_size,
    source: client.source || 'Direct',
    referrer_name: client.referrer_name || '',
    budget: client.budget || '',
    budget_currency: client.budget_currency || 'USD',
    requirements: client.requirements || '',
    assigned_bde: client.assigned_bde
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await axios.post(`${API}/clients/${client.id}/attachments`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAttachments(prev => [...prev, ...response.data]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId) => {
    try {
      await axios.delete(`${API}/clients/${client.id}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (error) {
      console.error('Error removing attachment:', error);
      alert('Error removing attachment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.put(`${API}/clients/${client.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      onUpdate();
      onClose();
      alert('Client updated successfully!');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error updating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Client</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {SOURCE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {formData.source === 'Referral' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Name</label>
                <input
                  type="text"
                  value={formData.referrer_name}
                  onChange={(e) => setFormData({...formData, referrer_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Who referred this client?"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size *</label>
              <select
                required
                value={formData.company_size}
                onChange={(e) => setFormData({...formData, company_size: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <div className="flex">
                <select
                  value={formData.budget_currency}
                  onChange={(e) => setFormData({...formData, budget_currency: e.target.value})}
                  className="w-20 p-2 border border-gray-300 rounded-l-lg"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || ''})}
                  className="flex-1 p-2 border border-gray-300 rounded-r-lg"
                  placeholder="Budget amount"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign BDE *</label>
              <select
                required
                value={formData.assigned_bde}
                onChange={(e) => setFormData({...formData, assigned_bde: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select BDE...</option>
                {bdes.map(bde => (
                  <option key={bde.id} value={bde.id}>{bde.name} ({bde.email})</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Describe the client requirements..."
              />
            </div>

            {/* File Attachments Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.zip,.rar,.7z"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`cursor-pointer flex flex-col items-center justify-center py-4 ${uploading ? 'opacity-50' : ''}`}
                >
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, DOCX, Images, Videos, etc. (Max 50MB each)
                  </span>
                </label>
              </div>

              {/* Display uploaded files */}
              {attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm text-gray-700">{attachment.original_filename}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Client Modal
const AddClientModal = ({ onClose, onAdd, bdes, currentUser }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: '',
    company_size: '',
    source: 'Direct',
    referrer_name: '',
    budget: '',
    budget_currency: 'USD',
    requirements: '',
    assigned_bde: currentUser.role === 'bde' ? currentUser.id : '' // Auto-populate if BDE
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files) => {
    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/upload-file`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        uploadedFiles.push({
          ...response.data,
          file: file
        });
      }

      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create client first
      const clientResponse = await axios.post(`${API}/clients`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const clientId = clientResponse.data.id;

      // Add attachments to the client if any
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          
          await axios.post(`${API}/clients/${clientId}/attachments`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }
      
      onAdd();
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error adding client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {SOURCE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {formData.source === 'Referral' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Name</label>
                <input
                  type="text"
                  value={formData.referrer_name}
                  onChange={(e) => setFormData({...formData, referrer_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Who referred this client?"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size *</label>
              <select
                required
                value={formData.company_size}
                onChange={(e) => setFormData({...formData, company_size: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <div className="flex">
                <select
                  value={formData.budget_currency}
                  onChange={(e) => setFormData({...formData, budget_currency: e.target.value})}
                  className="w-20 p-2 border border-gray-300 rounded-l-lg"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value) || ''})}
                  className="flex-1 p-2 border border-gray-300 rounded-r-lg"
                  placeholder="Budget amount"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign BDE *</label>
              <select
                required
                value={formData.assigned_bde}
                onChange={(e) => setFormData({...formData, assigned_bde: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={currentUser.role === 'bde'} // Disable if current user is BDE
              >
                <option value="">Select BDE...</option>
                {bdes.map(bde => (
                  <option key={bde.id} value={bde.id}>{bde.name} ({bde.email})</option>
                ))}
              </select>
              {currentUser.role === 'bde' && (
                <p className="text-xs text-gray-500 mt-1">Automatically assigned to you</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Describe the client requirements..."
              />
            </div>

            {/* File Attachments Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.zip,.rar,.7z"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`cursor-pointer flex flex-col items-center justify-center py-4 ${uploading ? 'opacity-50' : ''}`}
                >
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, DOCX, Images, Videos, etc. (Max 50MB each)
                  </span>
                </label>
              </div>

              {/* Display uploaded files */}
              {attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm text-gray-700">{attachment.original_filename}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [bdes, setBdes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeView, setActiveView] = useState('table');
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [clientsRes, statsRes, bdesRes] = await Promise.all([
        axios.get(`${API}/clients`, { headers }),
        axios.get(`${API}/dashboard/stats`, { headers }),
        axios.get(`${API}/users/bdes`, { headers })
      ]);

      setClients(clientsRes.data);
      setStats(statsRes.data);
      setBdes(bdesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (tokenData) => {
    localStorage.setItem('token', tokenData.access_token);
    localStorage.setItem('user', JSON.stringify(tokenData.user));
    setUser(tokenData.user);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setClients([]);
    setStats({});
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeClient = clients.find(c => c.id === active.id);
    const newStage = parseInt(over.id);

    if (activeClient && activeClient.stage !== newStage) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API}/clients/${activeClient.id}`, 
          { stage: newStage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setClients(prev => prev.map(c => 
          c.id === activeClient.id ? { ...c, stage: newStage } : c
        ));
        
        fetchData();
      } catch (error) {
        console.error('Error updating client stage:', error);
      }
    }
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Are you sure you want to delete ${client.company_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/clients/${client.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      fetchData(); // Refresh data
      alert('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Group clients by stage for Kanban view
  const clientsByStage = {};
  for (let stage = 1; stage <= 5; stage++) {
    clientsByStage[stage] = clients.filter(c => c.stage === stage && !c.is_dropped);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Client Tracker CRM</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </button>
              
              {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </button>
              )}
              
              <NotificationSystem user={user} onUpdate={fetchData} />
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserProfile(true)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <Dashboard user={user} stats={stats} />

        {/* View Toggle */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveView('table')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'table'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Table className="w-4 h-4 inline mr-2" />
                Table View
              </button>
              <button
                onClick={() => setActiveView('kanban')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'kanban'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Kanban Board
              </button>
            </nav>
          </div>
        </div>

        {/* Table View */}
        {activeView === 'table' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <TableView
              clients={clients}
              bdes={bdes}
              onView={setSelectedClient}
              onEdit={setEditingClient}
              onDelete={handleDeleteClient}
              currentUser={user}
            />
          </div>
        )}

        {/* Kanban View */}
        {activeView === 'kanban' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Pipeline</h2>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {Object.entries(STAGES).map(([stage, config]) => (
                  <div key={stage} id={stage}>
                    <KanbanColumn
                      stage={parseInt(stage)}
                      clients={clientsByStage[stage] || []}
                      onClientClick={setSelectedClient}
                    />
                  </div>
                ))}
              </div>
            </DndContext>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={fetchData}
          currentUser={user}
        />
      )}

      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onUpdate={fetchData}
          bdes={bdes}
        />
      )}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={fetchData}
          bdes={bdes}
          currentUser={user}
        />
      )}

      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
          onUpdate={fetchData}
          currentUser={user}
        />
      )}

      {showUserProfile && (
        <UserProfileModal
          user={user}
          onClose={() => setShowUserProfile(false)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default App;