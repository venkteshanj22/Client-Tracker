import React from 'react';
import { 
  User, 
  MessageSquare, 
  FileText, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  TrendingUp
} from 'lucide-react';

const ClientTimeline = ({ client, users = [] }) => {
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStageInfo = (stage) => {
    const stages = {
      1: { name: 'First Contact', color: 'bg-blue-500', icon: User },
      2: { name: 'Technical Discussion', color: 'bg-purple-500', icon: MessageSquare },
      3: { name: 'Pricing Proposal', color: 'bg-yellow-500', icon: FileText },
      4: { name: 'Negotiation', color: 'bg-orange-500', icon: TrendingUp },
      5: { name: 'Converted Client', color: 'bg-green-500', icon: CheckCircle }
    };
    return stages[stage] || { name: 'Unknown', color: 'bg-gray-500', icon: Clock };
  };

  // Generate timeline events
  const generateTimelineEvents = () => {
    const events = [];

    // Client creation event
    events.push({
      id: 'created',
      type: 'created',
      title: 'Client Added',
      description: `${client.company_name} was added to the CRM`,
      timestamp: client.created_at,
      user: getUserName(client.created_by || client.assigned_bde),
      icon: User,
      color: 'bg-blue-500'
    });

    // Stage progression events
    if (client.stage > 1) {
      for (let stage = 2; stage <= client.stage; stage++) {
        const stageInfo = getStageInfo(stage);
        events.push({
          id: `stage-${stage}`,
          type: 'stage_change',
          title: `Moved to ${stageInfo.name}`,
          description: `Client progressed to ${stageInfo.name} stage`,
          timestamp: client.last_interaction, // This would ideally be tracked per stage
          user: getUserName(client.assigned_bde),
          icon: stageInfo.icon,
          color: stageInfo.color
        });
      }
    }

    // Notes events
    if (client.notes && client.notes.length > 0) {
      client.notes.forEach((note, index) => {
        if (typeof note === 'object') {
          events.push({
            id: `note-${note.id || index}`,
            type: 'note',
            title: 'Note Added',
            description: note.text.substring(0, 100) + (note.text.length > 100 ? '...' : ''),
            timestamp: note.timestamp,
            user: note.author,
            icon: MessageSquare,
            color: 'bg-indigo-500',
            hasAttachments: note.attachments && note.attachments.length > 0
          });
        }
      });
    }

    // File attachment events
    if (client.attachments && client.attachments.length > 0) {
      client.attachments.forEach((attachment, index) => {
        events.push({
          id: `attachment-${attachment.id || index}`,
          type: 'attachment',
          title: 'File Attached',
          description: `${attachment.original_filename} was uploaded`,
          timestamp: attachment.uploaded_at,
          user: getUserName(attachment.uploaded_by),
          icon: FileText,
          color: 'bg-green-600'
        });
      });
    }

    // Sort events by timestamp (newest first)
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const timelineEvents = generateTimelineEvents();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Client Timeline</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Journey from {formatDate(client.created_at)} to present</span>
        </div>
      </div>

      {/* Current Stage Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${getStageInfo(client.stage).color} flex items-center justify-center text-white`}>
              {React.createElement(getStageInfo(client.stage).icon, { className: "w-4 h-4" })}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Current Stage</h4>
              <p className="text-sm text-gray-600">{getStageInfo(client.stage).name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Assigned to: {getUserName(client.assigned_bde)}
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {formatRelativeTime(client.last_interaction)}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="relative">
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No timeline events available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-4 top-10 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                {/* Event icon */}
                <div className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white flex-shrink-0 z-10`}>
                  {React.createElement(event.icon, { className: "w-4 h-4" })}
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        {event.title}
                        {event.hasAttachments && (
                          <FileText className="w-3 h-3 ml-1 text-gray-400" />
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>By {event.user}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(event.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {formatDate(event.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Timeline Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Events</p>
            <p className="font-medium">{timelineEvents.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Days Active</p>
            <p className="font-medium">
              {Math.floor((new Date() - new Date(client.created_at)) / (1000 * 60 * 60 * 24))}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Current Stage</p>
            <p className="font-medium">{getStageInfo(client.stage).name}</p>
          </div>
          <div>
            <p className="text-gray-500">Progress</p>
            <p className="font-medium">{Math.round((client.stage / 5) * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTimeline;