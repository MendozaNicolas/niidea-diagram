import React, { useState, useEffect, useRef } from 'react';

const DiagramColumn = ({
  column,
  onDragStart,
  onFieldConnectionStart,
  onFieldConnectionComplete,
  onUpdate,
  onDelete,
  isConnecting,
  connectionStart,
  isDragged,
  isHovered,
  registerRef,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(column.name);
  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState({ name: '', type: 'string', isPrimary: false });
  const columnRef = useRef(null);

  // Register ref for parent component
  useEffect(() => {
    if (columnRef.current) {
      registerRef?.(columnRef.current);
    }
  }, [registerRef]);

  // Position styling with z-index for proper stacking
  const style = {
    position: 'absolute',
    left: `${column.position.x}px`,
    top: `${column.position.y}px`,
    width: `${column.width}px`,
    minHeight: `${column.height}px`,
    zIndex: column.zIndex || 1,
    transition: isDragged ? 'none' : 'box-shadow 0.3s ease, transform 0.2s ease',
    boxShadow: isDragged 
      ? '0 12px 24px rgba(0, 0, 0, 0.7)' 
      : isHovered 
        ? '0 8px 20px rgba(0, 0, 0, 0.6)' 
        : '0 4px 12px rgba(0, 0, 0, 0.4)',
    transform: isDragged ? 'scale(1.01)' : isHovered ? 'scale(1.005)' : 'scale(1.0)'
  };

  // Handle name edit
  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const saveNameEdit = () => {
    onUpdate(column.id, { name: editingName });
    setIsEditing(false);
  };

  // Field management
  const handleAddField = () => {
    setAddingField(true);
  };

  const saveNewField = () => {
    if (!newField.name.trim()) return;
    
    const newFieldId = `field-${column.id}-${Date.now()}`;
    const updatedFields = [
      ...column.fields, 
      { ...newField, id: newFieldId }
    ];
    
    onUpdate(column.id, { fields: updatedFields });
    setAddingField(false);
    setNewField({ name: '', type: 'string', isPrimary: false });
  };

  const cancelAddField = () => {
    setAddingField(false);
    setNewField({ name: '', type: 'string', isPrimary: false });
  };

  const deleteField = (fieldId, e) => {
    if (e) e.stopPropagation();
    const updatedFields = column.fields.filter(field => field.id !== fieldId);
    onUpdate(column.id, { fields: updatedFields });
  };

  const updateFieldName = (fieldId, newName) => {
    const updatedFields = column.fields.map(field => 
      field.id === fieldId ? { ...field, name: newName } : field
    );
    onUpdate(column.id, { fields: updatedFields });
  };

  const updateFieldType = (fieldId, newType) => {
    const updatedFields = column.fields.map(field => 
      field.id === fieldId ? { ...field, type: newType } : field
    );
    onUpdate(column.id, { fields: updatedFields });
  };

  const toggleFieldPrimary = (fieldId, e) => {
    if (e) e.stopPropagation();
    const updatedFields = column.fields.map(field => 
      field.id === fieldId ? { ...field, isPrimary: !field.isPrimary } : field
    );
    onUpdate(column.id, { fields: updatedFields });
  };

  // Relationship connection handling
  const handleFieldConnectionClick = (fieldId, e) => {
    if (e) e.stopPropagation();
    
    if (isConnecting) {
      onFieldConnectionComplete(column.id, fieldId);
    } else {
      onFieldConnectionStart(column.id, fieldId);
    }
  };

  // This is used to show visual indicator for the source field
  const isConnectionSource = (fieldId) => {
    return isConnecting && 
      connectionStart && 
      connectionStart.columnId === column.id && 
      connectionStart.fieldId === fieldId;
  };

  // This handles creating connections when in connection mode and clicking on a field
  const handleFieldClick = (fieldId, e) => {
    if (isConnecting && !isConnectionSource(fieldId)) {
      e.stopPropagation();
      onFieldConnectionComplete(column.id, fieldId);
    }
  };

  // Drag start handler with proper event handling
  const handleDragStart = (e) => {
    e.preventDefault(); // Prevent default browser drag behavior - this prevents the table shifting down
    e.stopPropagation();
    
    // Apply a nice visual effect when starting drag
    if (columnRef.current) {
      columnRef.current.classList.add('dragging');
      
      // Create ripple effect to show drag started
      const ripple = document.createElement('div');
      ripple.className = 'drag-ripple';
      columnRef.current.appendChild(ripple);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        if (columnRef.current && ripple.parentNode === columnRef.current) {
          columnRef.current.removeChild(ripple);
        }
      }, 400);
    }
    
    // Start drag operation immediately with no delay to prevent visual shift
    onDragStart(column.id, e);
  };

  return (
    <div 
      className={`diagram-column ${isDragged ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
      ref={columnRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className="column-header"
        onMouseDown={handleDragStart}
      >
        {isEditing ? (
          <div className="edit-name">
            <input 
              type="text" 
              value={editingName} 
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={saveNameEdit}
              onKeyDown={(e) => e.key === 'Enter' && saveNameEdit()}
              autoFocus
            />
          </div>
        ) : (
          <div className="column-title" onDoubleClick={startEditing}>
            {column.name}
          </div>
        )}
        <div className="column-actions">
          <button className="delete-btn" onClick={() => onDelete(column.id)}>×</button>
        </div>
      </div>
      
      <div className="column-fields">
        {column.fields.map(field => (
          <div 
            key={field.id} 
            className={`field ${field.isPrimary ? 'primary' : ''} ${isConnectionSource(field.id) ? 'connecting' : ''} ${isConnecting ? 'connection-mode' : ''}`}
            onClick={(e) => handleFieldClick(field.id, e)}
          >
            <div className="field-keyicon" onClick={(e) => toggleFieldPrimary(field.id, e)}>
              {field.isPrimary && <span className="key-symbol">🔑</span>}
            </div>
            <div className="field-name" onClick={(e) => isConnecting && e.stopPropagation()}>
              <input 
                type="text" 
                value={field.name} 
                onChange={(e) => updateFieldName(field.id, e.target.value)}
                onClick={(e) => isConnecting && e.stopPropagation()}
              />
            </div>
            <div className="field-type" onClick={(e) => isConnecting && e.stopPropagation()}>
              <select 
                value={field.type} 
                onChange={(e) => updateFieldType(field.id, e.target.value)}
                onClick={(e) => isConnecting && e.stopPropagation()}
              >
                <option value="int">int</option>
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="date">date</option>
                <option value="text">text</option>
                <option value="float">float</option>
              </select>
            </div>
            <div className="field-actions">
              <button 
                className="connect-btn" 
                onClick={(e) => handleFieldConnectionClick(field.id, e)}
                title={isConnecting ? "Cancel connection" : "Connect to another field"}
              >
                {isConnectionSource(field.id) ? '⟲' : '↔'}
              </button>
              <button 
                className="delete-field" 
                onClick={(e) => deleteField(field.id, e)}
                title="Delete field"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        {addingField ? (
          <div className="add-field-form">
            <input 
              type="text" 
              placeholder="Field Name"
              value={newField.name}
              onChange={(e) => setNewField({...newField, name: e.target.value})}
              autoFocus
            />
            <select 
              value={newField.type}
              onChange={(e) => setNewField({...newField, type: e.target.value})}
            >
              <option value="int">int</option>
              <option value="string">string</option>
              <option value="boolean">boolean</option>
              <option value="date">date</option>
              <option value="text">text</option>
              <option value="float">float</option>
            </select>
            <label>
              <input 
                type="checkbox" 
                checked={newField.isPrimary}
                onChange={(e) => setNewField({...newField, isPrimary: e.target.checked})}
              />
              Primary
            </label>
            <div className="field-form-actions">
              <button onClick={saveNewField}>Add</button>
              <button onClick={cancelAddField}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="add-field" onClick={handleAddField}>
            + Add Field
          </div>
        )}
      </div>
      
      {/* Drag handle indicator */}
      <div className="drag-handle-indicator">
        <div className="drag-handle-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default DiagramColumn;