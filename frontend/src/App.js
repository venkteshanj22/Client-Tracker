import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { 
  Building2, 
  Users, 
  Target, 
  Clock, 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  MessageSquare,
  CheckCircle,
  Calendar,
  Filter,
  Search,
  Download,
  Upload,
  User,
  Mail,
  Phone,
  DollarSign,
  MapPin,
  Briefcase,
  Hash,
  Archive,
  RefreshCw
} from "lucide-react";

// Import new components
import FileViewer from "./components/FileViewer";
import SearchAndFilter from "./components/SearchAndFilter";
import ClientTimeline from "./components/ClientTimeline";
import EnhancedKanban from "./components/EnhancedKanban";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Form validation utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Industry options with custom option
const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education', 
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Consulting',
  'Marketing',
  'Legal',
  'Construction',
  'Automotive',
  'Food & Beverage',
  'Entertainment',
  'Non-profit',
  'Government',
  'Transportation',
  'Energy',
  'Telecommunications',
  'Others'
];

// Navigation Component
const Navigation = ({ currentPage, setCurrentPage, currentUser, onNavigate }) => {
  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-white text-xl font-bold">ClientTracker CRM</h1>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('clients')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === 'clients'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => onNavigate('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === 'kanban'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                currentPage === 'tasks'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Tasks
            </button>
            {currentUser?.role === 'super_admin' && (
              <button
                onClick={() => onNavigate('users')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentPage === 'users'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                User Management
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Enhanced Dashboard Component with Navigation
const Dashboard = ({ user, stats, onNavigate }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Clients Card */}
        <div 
          onClick={() => onNavigate('clients')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold">{stats.total_clients}</p>
            </div>
            <Building2 className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Converted Clients Card */}
        <div 
          onClick={() => onNavigate('clients', { filter: 'converted' })}
          className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Converted</p>
              <p className="text-3xl font-bold">{stats?.clients_by_stage?.[5] || 0}</p>
            </div>
            <Target className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Dropped Clients Card */}
        <div 
          onClick={() => onNavigate('clients', { filter: 'dropped' })}
          className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Dropped</p>
              <p className="text-3xl font-bold">{stats.dropped_clients}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200" />
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div 
          onClick={() => onNavigate('tasks', { filter: 'pending' })}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Tasks</p>
              <p className="text-3xl font-bold">{stats.pending_tasks}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        {/* Overdue Tasks Card */}
        <div 
          onClick={() => onNavigate('tasks', { filter: 'overdue' })}
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Overdue</p>
              <p className="text-3xl font-bold">{stats.overdue_tasks}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total_clients}</p>
            <p className="text-sm text-gray-600">Total Clients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{((stats?.clients_by_stage?.[5] || 0) / stats.total_clients * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.pending_tasks}</p>
            <p className="text-sm text-gray-600">Active Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.total_users}</p>
            <p className="text-sm text-gray-600">Team Members</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Client Detail Modal with Timeline and Files
const ClientDetailModal = ({ client, onClose, onUpdate, currentUser, allUsers = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteAttachments, setNoteAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileDownload = (attachment) => {
    const downloadUrl = `${API}/download/${attachment.filename}`;
    window.open(downloadUrl, '_blank');
  };

  const handleNoteFileUpload = async (files) => {
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

      setNoteAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const removeNoteAttachment = (attachmentId) => {
    setNoteAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const addNote = async () => {
    if (!notes.trim()) return;
    
    setIsAddingNote(true);
    try {
      const noteResponse = await axios.post(`${API}/clients/${client.id}/notes`, 
        { text: notes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const noteId = noteResponse.data.note_id;

      if (noteAttachments.length > 0 && noteId) {
        for (const attachment of noteAttachments) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          
          await axios.post(`${API}/clients/${client.id}/notes/${noteId}/attachments`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }

      setNotes('');
      setNoteAttachments([]);
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleReactivateClient = async () => {
    if (window.confirm('Are you sure you want to reactivate this client?')) {
      try {
        await axios.put(`${API}/clients/${client.id}`, {
          is_dropped: false,
          drop_reason: null,
          stage: 1 // Reset to first contact
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        onUpdate();
      } catch (error) {
        console.error('Error reactivating client:', error);
        alert('Error reactivating client');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{client.company_name}</h2>
              <p className="text-blue-100 mt-1">{client.contact_person} • {client.email}</p>
              {client.is_dropped && (
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-5 h-5 text-red-300 mr-2" />
                  <span className="text-red-200">Dropped Client</span>
                  <button
                    onClick={handleReactivateClient}
                    className="ml-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reactivate
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'notes', 'files', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Industry</label>
                  <p className="text-gray-900">{client.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company Size</label>
                  <p className="text-gray-900">{client.company_size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Budget</label>
                  <p className="text-gray-900">
                    {client.budget 
                      ? `${client.budget_currency} ${new Intl.NumberFormat().format(client.budget)}`
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Requirements</label>
                  <p className="text-gray-900">{client.requirements || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(client.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Interaction</label>
                  <p className="text-gray-900">{new Date(client.last_interaction).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add New Note</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows="3"
                />
                
                {/* File attachment for notes */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files (Optional)</label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.zip,.rar,.7z"
                      onChange={(e) => handleNoteFileUpload(Array.from(e.target.files))}
                      className="hidden"
                      id="note-file-upload"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="note-file-upload" 
                      className={`cursor-pointer flex items-center justify-center py-2 ${uploading ? 'opacity-50' : ''}`}
                    >
                      <Upload className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Attach files'}
                      </span>
                    </label>
                  </div>

                  {noteAttachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {noteAttachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                          <span className="text-gray-700">{attachment.original_filename}</span>
                          <button
                            type="button"
                            onClick={() => removeNoteAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={addNote}
                  disabled={isAddingNote || !notes.trim()}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {client.notes?.length > 0 ? (
                  client.notes.map((note, index) => {
                    const isOldFormat = typeof note === 'string';
                    const noteText = isOldFormat ? note : note.text;
                    const noteAuthor = isOldFormat ? '' : note.author;
                    const noteTimestamp = isOldFormat ? '' : new Date(note.timestamp).toLocaleString();
                    const noteAttachments = isOldFormat ? [] : (note.attachments || []);

                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-gray-700 whitespace-pre-wrap flex-1">{noteText}</p>
                        </div>
                        
                        {!isOldFormat && (
                          <div className="text-xs text-gray-500 mb-2">
                            By {noteAuthor} • {noteTimestamp}
                          </div>
                        )}

                        {noteAttachments.length > 0 && (
                          <FileViewer 
                            attachments={noteAttachments}
                            onDownload={handleFileDownload}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 italic">No notes yet</p>
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <FileViewer 
                attachments={client.attachments || []}
                onDownload={handleFileDownload}
              />
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <ClientTimeline 
              client={client}
              users={allUsers}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Add Client Modal with Validation
const AddClientModal = ({ onClose, onAdd, bdes, currentUser }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: '',
    customIndustry: '',
    company_size: '',
    source: 'Direct',
    referrer_name: '',
    budget: '',
    budget_currency: 'USD',
    requirements: '',
    assigned_bde: currentUser.role === 'bde' ? currentUser.id : ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.company_name)) {
      newErrors.company_name = 'Company name is required';
    }

    if (!validateRequired(formData.contact_person)) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!validateRequired(formData.industry)) {
      newErrors.industry = 'Industry is required';
    }

    if (formData.industry === 'Others' && !validateRequired(formData.customIndustry)) {
      newErrors.customIndustry = 'Please specify the industry';
    }

    if (!validateRequired(formData.company_size)) {
      newErrors.company_size = 'Company size is required';
    }

    if (!validateRequired(formData.assigned_bde)) {
      newErrors.assigned_bde = 'Please assign a BDE';
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Please enter a valid budget amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        const formDataFile = new FormData();
        formDataFile.append('file', file);

        const response = await axios.post(`${API}/upload-file`, formDataFile, {
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare final form data
      const finalFormData = { ...formData };
      if (formData.industry === 'Others') {
        finalFormData.industry = formData.customIndustry;
      }
      delete finalFormData.customIndustry;

      // Convert budget to number if provided
      if (finalFormData.budget) {
        finalFormData.budget = parseFloat(finalFormData.budget);
      }

      const clientResponse = await axios.post(`${API}/clients`, finalFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const clientId = clientResponse.data.id;

      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const formDataFile = new FormData();
          formDataFile.append('file', attachment.file);
          
          await axios.post(`${API}/clients/${clientId}/attachments`, formDataFile, {
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
      console.error('Error creating client:', error);
      alert('Error creating client: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Add New Client</h2>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.company_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter company name"
                />
                {errors.company_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.contact_person ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter contact person name"
                />
                {errors.contact_person && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.industry ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Industry</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>

              {/* Custom Industry */}
              {formData.industry === 'Others' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Industry *
                  </label>
                  <input
                    type="text"
                    value={formData.customIndustry}
                    onChange={(e) => setFormData({...formData, customIndustry: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.customIndustry ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Specify industry"
                  />
                  {errors.customIndustry && (
                    <p className="text-red-500 text-sm mt-1">{errors.customIndustry}</p>
                  )}
                </div>
              )}

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size *
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => setFormData({...formData, company_size: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.company_size ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
                {errors.company_size && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_size}</p>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget *</label>
                <div className="flex">
                  <select
                    value={formData.budget_currency}
                    onChange={(e) => setFormData({...formData, budget_currency: e.target.value})}
                    className="p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className={`flex-1 p-3 border-t border-r border-b rounded-r-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.budget ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Budget amount"
                  />
                </div>
                {errors.budget && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                )}
              </div>

              {/* Assigned BDE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned BDE *
                </label>
                <select
                  value={formData.assigned_bde}
                  onChange={(e) => setFormData({...formData, assigned_bde: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.assigned_bde ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={currentUser.role === 'bde'}
                >
                  <option value="">Select BDE</option>
                  {bdes.map((bde) => (
                    <option key={bde.id} value={bde.id}>
                      {bde.name} ({bde.email})
                    </option>
                  ))}
                </select>
                {errors.assigned_bde && (
                  <p className="text-red-500 text-sm mt-1">{errors.assigned_bde}</p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe the client requirements..."
              />
            </div>

            {/* File Attachments Section */}
            <div>
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
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
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
                          <FileText className="w-4 h-4 text-gray-500 mr-2" />
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
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Enhanced Clients Page with Search and Filters
const ClientsPage = ({ currentUser, allUsers, onViewClient }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bdes, setBdes] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchBdes();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [clients, searchTerm, filters, sortBy, sortOrder]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchBdes = async () => {
    try {
      const response = await axios.get(`${API}/users/bdes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBdes(response.data);
    } catch (error) {
      console.error('Error fetching BDEs:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...clients];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'stage') {
          filtered = filtered.filter(client => client.stage === parseInt(value));
        } else if (key === 'budget_range') {
          const [min, max] = value.split('-').map(v => v.replace('+', ''));
          filtered = filtered.filter(client => {
            if (!client.budget) return false;
            if (max) return client.budget >= parseInt(min) && client.budget <= parseInt(max);
            return client.budget >= parseInt(min);
          });
        } else {
          filtered = filtered.filter(client => client[key] === value);
        }
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'last_interaction') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredClients(filtered);
  };

  const getFilterOptions = () => {
    const uniqueIndustries = [...new Set(clients.map(c => c.industry))];
    const uniqueCompanySizes = [...new Set(clients.map(c => c.company_size))];

    return {
      stages: [
        { value: 1, label: 'First Contact' },
        { value: 2, label: 'Technical Discussion' },
        { value: 3, label: 'Pricing Proposal' },
        { value: 4, label: 'Negotiation' },
        { value: 5, label: 'Converted Client' }
      ],
      industries: uniqueIndustries,
      companySizes: uniqueCompanySizes,
      bdes: bdes
    };
  };

  const getStageInfo = (stage) => {
    const stages = {
      1: { name: 'First Contact', color: 'bg-blue-500' },
      2: { name: 'Technical Discussion', color: 'bg-purple-500' },
      3: { name: 'Pricing Proposal', color: 'bg-yellow-500' },
      4: { name: 'Negotiation', color: 'bg-orange-500' },
      5: { name: 'Converted Client', color: 'bg-green-500' }
    };
    return stages[stage] || { name: 'Unknown', color: 'bg-gray-500' };
  };

  const getBdeName = (bdeId) => {
    const bde = bdes.find(b => b.id === bdeId);
    return bde ? bde.name : 'Unassigned';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
        }}
        filterOptions={getFilterOptions()}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned BDE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.company_name}</div>
                    <div className="text-sm text-gray-500">{client.contact_person}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStageInfo(client.stage).color}`}>
                      {getStageInfo(client.stage).name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.budget 
                      ? `${client.budget_currency} ${new Intl.NumberFormat().format(client.budget)}`
                      : 'Not specified'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getBdeName(client.assigned_bde)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewClient(client)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or add a new client.</p>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            fetchClients();
            setShowAddModal(false);
          }}
          bdes={bdes}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// Kanban Page with Enhanced Drag & Drop
const KanbanPage = ({ currentUser, allUsers, onViewClient }) => {
  const [clients, setClients] = useState([]);
  const [bdes, setBdes] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchBdes();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchBdes = async () => {
    try {
      const response = await axios.get(`${API}/users/bdes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBdes(response.data);
    } catch (error) {
      console.error('Error fetching BDEs:', error);
    }
  };

  const handleUpdateClient = async (clientId, updates) => {
    try {
      await axios.put(`${API}/clients/${clientId}`, updates, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchClients(); // Refresh clients
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
        <div className="text-sm text-gray-600">
          Total: {clients.length} clients
        </div>
      </div>

      <EnhancedKanban
        clients={clients}
        onUpdateClient={handleUpdateClient}
        onViewClient={onViewClient}
        bdes={bdes}
      />
    </div>
  );
};

// User Management Component (existing, but enhanced)
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'bde',
    phone: '',
    status: 'active'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`${API}/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${API}/users`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      fetchUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'bde', phone: '', status: 'active' });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please check if email already exists.');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      status: user.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API}/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', role: 'bde', phone: '', status: 'active' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bde">BDE</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Tasks Page (placeholder for now)
const TasksPage = ({ filter }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Tasks {filter && `- ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tasks Coming Soon</h3>
          <p className="text-gray-500">Task management functionality will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [pageFilter, setPageFilter] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [stats, setStats] = useState({
    total_clients: 0,
    dropped_clients: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    total_users: 0,
    clients_by_stage: {}
  });
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    // Simulate getting current user (in real app, this would come from authentication)
    setCurrentUser({ 
      id: 'user-1',
      role: 'super_admin', 
      name: 'Super Admin',
      email: 'admin@crm.com'
    });
    fetchStats();
    fetchAllUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleNavigate = (page, options = {}) => {
    setCurrentPage(page);
    setPageFilter(options.filter || null);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
  };

  const handleCloseClientDetail = () => {
    setSelectedClient(null);
  };

  const handleUpdateClient = () => {
    setSelectedClient(null);
    fetchStats(); // Refresh stats after update
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={currentUser} stats={stats} onNavigate={handleNavigate} />;
      case 'clients':
        return (
          <ClientsPage 
            currentUser={currentUser} 
            allUsers={allUsers}
            onViewClient={handleViewClient}
            filter={pageFilter}
          />
        );
      case 'kanban':
        return (
          <KanbanPage 
            currentUser={currentUser} 
            allUsers={allUsers}
            onViewClient={handleViewClient}
          />
        );
      case 'tasks':
        return <TasksPage filter={pageFilter} />;
      case 'users':
        return currentUser?.role === 'super_admin' ? <UserManagement /> : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access this page.</p>
          </div>
        );
      default:
        return <Dashboard user={currentUser} stats={stats} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App min-h-screen bg-gray-100">
      <BrowserRouter>
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {renderCurrentPage()}
        </main>

        {/* Client Detail Modal */}
        {selectedClient && (
          <ClientDetailModal
            client={selectedClient}
            onClose={handleCloseClientDetail}
            onUpdate={handleUpdateClient}
            currentUser={currentUser}
            allUsers={allUsers}
          />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;