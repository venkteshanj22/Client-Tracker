import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar,
  Eye,
  FileText,
  MessageSquare
} from 'lucide-react';

// Optimized client card component
const ClientCard = React.memo(({ client, onView, bdes, isDragging = false }) => {
  const getBdeName = (bdeId) => {
    const bde = bdes.find(b => b.id === bdeId);
    return bde ? bde.name : 'Unassigned';
  };

  const formatBudget = (budget, currency = 'USD') => {
    if (!budget) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const getDaysActive = (createdAt) => {
    return Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  };

  const getNotesCount = (notes) => {
    return Array.isArray(notes) ? notes.length : 0;
  };

  const getAttachmentsCount = (attachments) => {
    return Array.isArray(attachments) ? attachments.length : 0;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
      isDragging ? 'opacity-50 rotate-3 scale-105' : ''
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {client.company_name}
          </h3>
          <p className="text-xs text-gray-600 mt-1 flex items-center">
            <User className="w-3 h-3 mr-1" />
            {client.contact_person}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(client);
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center">
          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
        
        <div className="flex items-center">
          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{client.phone}</span>
        </div>
        
        <div className="flex items-center">
          <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="font-medium text-green-600">
            {formatBudget(client.budget, client.budget_currency)}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Assigned to: <span className="font-medium">{getBdeName(client.assigned_bde)}</span>
          </span>
          <div className="flex items-center text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{getDaysActive(client.created_at)}d</span>
          </div>
        </div>
        
        {/* Activity indicators */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {getNotesCount(client.notes) > 0 && (
              <div className="flex items-center text-blue-600">
                <MessageSquare className="w-3 h-3 mr-1" />
                <span className="text-xs">{getNotesCount(client.notes)}</span>
              </div>
            )}
            
            {getAttachmentsCount(client.attachments) > 0 && (
              <div className="flex items-center text-green-600">
                <FileText className="w-3 h-3 mr-1" />
                <span className="text-xs">{getAttachmentsCount(client.attachments)}</span>
              </div>
            )}
          </div>
          
          <span className="text-xs text-gray-400">
            {client.industry}
          </span>
        </div>
      </div>
    </div>
  );
});

// Sortable wrapper for client card
const SortableClientCard = ({ client, onView, bdes }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: client.id,
    data: {
      type: 'client',
      client
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms ease',
    zIndex: isDragging ? 1000 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <ClientCard 
        client={client} 
        onView={onView} 
        bdes={bdes} 
        isDragging={isDragging}
      />
    </div>
  );
};

// Kanban column component
const KanbanColumn = React.memo(({ stage, clients, onView, bdes, title, color }) => {
  const stageClients = useMemo(() => 
    clients.filter(client => client.stage === stage),
    [clients, stage]
  );

  const clientIds = useMemo(() => 
    stageClients.map(client => client.id),
    [stageClients]
  );

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {stageClients.length}
          </span>
        </div>
      </div>
      
      <SortableContext items={clientIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-80">
          {stageClients.map((client) => (
            <SortableClientCard
              key={client.id}
              client={client}
              onView={onView}
              bdes={bdes}
            />
          ))}
          
          {stageClients.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No clients in this stage</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
});

// Main enhanced kanban component
const EnhancedKanban = ({ clients, onUpdateClient, onViewClient, bdes }) => {
  const [activeClient, setActiveClient] = useState(null);

  // Optimized sensors for better touch and mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const stages = [
    { id: 1, title: 'First Contact', color: 'bg-blue-500' },
    { id: 2, title: 'Technical Discussion', color: 'bg-purple-500' },
    { id: 3, title: 'Pricing Proposal', color: 'bg-yellow-500' },
    { id: 4, title: 'Negotiation', color: 'bg-orange-500' },
    { id: 5, title: 'Converted Client', color: 'bg-green-500' }
  ];

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const client = clients.find(c => c.id === active.id);
    setActiveClient(client);
  }, [clients]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveClient(null);

    if (!over) return;

    const activeClient = clients.find(c => c.id === active.id);
    if (!activeClient) return;

    // Determine the new stage based on the drop zone
    let newStage;
    
    if (over.data.current?.type === 'column') {
      newStage = over.data.current.stage;
    } else if (over.data.current?.type === 'client') {
      const overClient = clients.find(c => c.id === over.id);
      newStage = overClient?.stage;
    }

    if (newStage && newStage !== activeClient.stage) {
      onUpdateClient(activeClient.id, { stage: newStage });
    }
  }, [clients, onUpdateClient]);

  const handleDragCancel = useCallback(() => {
    setActiveClient(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <KanbanColumn
              stage={stage.id}
              title={stage.title}
              color={stage.color}
              clients={clients}
              onView={onViewClient}
              bdes={bdes}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeClient && (
          <ClientCard
            client={activeClient}
            onView={() => {}}
            bdes={bdes}
            isDragging={true}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default EnhancedKanban;