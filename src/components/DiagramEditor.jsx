import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import DiagramColumn from './DiagramColumn';
import DiagramRelationship from './DiagramRelationship';
import { useHistory } from '../context/HistoryContext';

const DiagramEditor = forwardRef((props, ref) => {
  const [columns, setColumns] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [nextId, setNextId] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [dragImage, setDragImage] = useState(null);
  const [dragLastPos, setDragLastPos] = useState({ x: 0, y: 0 });
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const dragTimer = useRef(null);
  const editorRef = useRef(null);
  const contentRef = useRef(null);
  const columnRefs = useRef({});
  const startDragPosition = useRef(null);
  
  // Get history context methods
  const { createAction, undo, redo, canUndo, canRedo } = useHistory();

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    addColumn: (x, y) => addColumn(x, y),
    handleZoomIn: () => handleZoom('in'),
    handleZoomOut: () => handleZoom('out'),
    resetView,
    toggleSnapToGrid,
    getZoomLevel: () => zoomLevel,
    getSnapToGrid: () => snapToGrid,
    undoAction: handleUndo,
    redoAction: handleRedo,
    canUndo: canUndo,
    canRedo: canRedo,
    applyUndoAction, // Expose the applyUndoAction method for use from sidebar
    applyRedoCreateTable: (tableData) => {
      setColumns(prevColumns => [...prevColumns, tableData]);
    }
  }));

  // Function to handle undo - now using continuous undo
  const handleUndo = useCallback(() => {
    const action = undo();
    if (!action) return;
    
    // Apply the reverse action based on action type
    if (!action) return;
    
    // Apply the action directly here instead of calling applyUndoAction to avoid circular dependency
    switch (action.type) {
      case 'create':
        if (action.entity === 'table') {
          setColumns(prevColumns => prevColumns.filter(col => col.id !== action.tableId));
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => prevRels.filter(rel => rel.id !== action.relationshipId));
        }
        break;
      
      case 'delete':
        if (action.entity === 'table') {
          setColumns(prevColumns => [...prevColumns, action.tableData]);
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { ...col, fields: [...col.fields, action.fieldData] }
                : col
            )
          );
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => [...prevRels, action.relationshipData]);
        }
        break;
      
      case 'move':
        setColumns(prevColumns => 
          prevColumns.map(col => 
            col.id === action.tableId
              ? { ...col, position: action.previousPosition }
              : col
          )
        );
        break;
      
      case 'update':
        if (action.entity === 'table') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { ...col, ...action.previousData }
                : col
            )
          );
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.map(field => 
                      field.id === action.fieldId
                        ? { ...field, ...action.previousData }
                        : field
                    )
                  }
                : col
            )
          );
        }
        break;
      
      case 'add':
        if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.filter(field => field.id !== action.fieldId)
                  }
                : col
            )
          );
        }
        break;
      
      default:
        console.log('Unknown action type for undo:', action.type);
    }

    return action;
  }, [undo, setColumns, setRelationships]);
  
  // Apply an undo action
  const applyUndoAction = useCallback((action) => {
    if (!action) return;
    
    // Apply the reverse action based on action type
    switch (action.type) {
      case 'create':
        if (action.entity === 'table') {
          setColumns(prevColumns => prevColumns.filter(col => col.id !== action.tableId));
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => prevRels.filter(rel => rel.id !== action.relationshipId));
        }
        break;
      
      case 'delete':
        if (action.entity === 'table') {
          setColumns(prevColumns => [...prevColumns, action.tableData]);
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { ...col, fields: [...col.fields, action.fieldData] }
                : col
            )
          );
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => [...prevRels, action.relationshipData]);
        }
        break;
      
      case 'move':
        setColumns(prevColumns => 
          prevColumns.map(col => 
            col.id === action.tableId
              ? { ...col, position: action.previousPosition }
              : col
          )
        );
        break;
      
      case 'update':
        if (action.entity === 'table') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { ...col, ...action.previousData }
                : col
            )
          );
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.map(field => 
                      field.id === action.fieldId
                        ? { ...field, ...action.previousData }
                        : field
                    )
                  }
                : col
            )
          );
        }
        break;
      
      case 'add':
        if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.filter(field => field.id !== action.fieldId)
                  }
                : col
            )
          );
        }
        break;
      
      default:
        console.log('Unknown action type for undo:', action.type);
    }
  }, []);

  // Function to handle redo
  const handleRedo = useCallback(() => {
    const action = redo();
    if (!action) return;

    // Apply the action based on action type
    switch (action.type) {
      case 'create':
        if (action.entity === 'table') {
          setColumns(prevColumns => [...prevColumns, action.tableData]);
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => [...prevRels, action.relationshipData]);
        }
        break;
      
      case 'delete':
        if (action.entity === 'table') {
          setColumns(prevColumns => prevColumns.filter(col => col.id !== action.tableId));
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.filter(field => field.id !== action.fieldId)
                  }
                : col
            )
          );
        } else if (action.entity === 'relationship') {
          setRelationships(prevRels => prevRels.filter(rel => rel.id !== action.relationshipId));
        }
        break;
      
      case 'move':
        setColumns(prevColumns => 
          prevColumns.map(col => 
            col.id === action.tableId
              ? { ...col, position: action.newPosition }
              : col
          )
        );
        break;
      
      case 'update':
        if (action.entity === 'table') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { ...col, ...action.newData }
                : col
            )
          );
        } else if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: col.fields.map(field => 
                      field.id === action.fieldId
                        ? { ...field, ...action.newData }
                        : field
                    )
                  }
                : col
            )
          );
        }
        break;
      
      case 'add':
        if (action.entity === 'field') {
          setColumns(prevColumns => 
            prevColumns.map(col => 
              col.id === action.tableId
                ? { 
                    ...col, 
                    fields: [...col.fields, action.fieldData]
                  }
                : col
            )
          );
        }
        break;
      
      default:
        console.log('Unknown action type for redo:', action.type);
    }
  }, [redo]);

  // Function to handle continuous undo through entire history
  const handleContinuousUndo = () => {
    const action = undo();
    if (!action) return;
    
    // Apply the undo action
    applyUndoAction(action);
  };

  // Function to add a new column to the diagram
  const addColumn = (x = 50, y = 50) => {
    // Default coords if none provided
    const posX = x || 50 + panOffset.x;
    const posY = y || 50 + panOffset.y;
    
    // Adjust position based on zoom and pan
    const adjustedX = (posX - panOffset.x) / (zoomLevel / 100);
    const adjustedY = (posY - panOffset.y) / (zoomLevel / 100);
    
    // Snap to grid if enabled
    const snappedX = snapToGrid ? Math.round(adjustedX / gridSize) * gridSize : adjustedX;
    const snappedY = snapToGrid ? Math.round(adjustedY / gridSize) * gridSize : adjustedY;
    
    const newColumn = {
      id: `column-${nextId}`,
      name: `Table ${nextId}`,
      fields: [
        { id: `field-${nextId}-1`, name: 'id', type: 'int', isPrimary: true },
        { id: `field-${nextId}-2`, name: 'name', type: 'string', isPrimary: false }
      ],
      position: { x: snappedX, y: snappedY },
      width: 200,
      height: 150,
      zIndex: columns.length // Set z-index based on creation order
    };

    // Add to state
    setColumns([...columns, newColumn]);
    setNextId(nextId + 1);
    
    // Record action in history
    createAction('create', 'table', {
      tableId: newColumn.id,
      name: newColumn.name,
      tableData: newColumn
    });
  };

  // Function to handle double click on the canvas to add a new column
  const handleCanvasDoubleClick = (e) => {
    if (e.target === editorRef.current || e.target === contentRef.current) {
      // Get position relative to the editor
      const rect = editorRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addColumn(x, y);
    }
  };

  // Function to start dragging a column
  const startDragging = (columnId, e) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    // Clear any existing drag timer
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
    }

    // Save the initial position for history tracking
    startDragPosition.current = { ...column.position };

    // Get exact mouse position in client coordinates
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Get editor element's bounding rectangle
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the editor
    const mouseRelativeX = mouseX - editorRect.left;
    const mouseRelativeY = mouseY - editorRect.top;
    
    // Calculate the offset from mouse to the top-left corner of the column
    // This is the critical fix - we calculate the exact position accounting for zoom and pan
    const scaledColumnX = column.position.x * (zoomLevel / 100) + panOffset.x;
    const scaledColumnY = column.position.y * (zoomLevel / 100) + panOffset.y;
    
    const offsetX = mouseRelativeX - scaledColumnX;
    const offsetY = mouseRelativeY - scaledColumnY;
    
    setIsDragging(true);
    setDraggedColumn(columnId);
    setDragOffset({
      x: offsetX,
      y: offsetY
    });
    
    // Record the last drag position for velocity calculation
    setDragLastPos({
      x: mouseX,
      y: mouseY,
      time: Date.now()
    });
    
    // Create drag ghost for visual feedback
    if (columnRefs.current[columnId]) {
      const dragEl = columnRefs.current[columnId];
      setDragImage({
        width: dragEl.offsetWidth,
        height: dragEl.offsetHeight
      });
    }

    // Bring the dragged column to the front by updating its z-index
    const highestZIndex = Math.max(...columns.map(col => col.zIndex || 0)) + 1;
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, zIndex: highestZIndex } : col
    ));
    
    e.stopPropagation();
  };

  // Function to handle mouse move while dragging
  const handleMouseMove = (e) => {
    if (isDragging && draggedColumn) {
      const editorRect = editorRef.current.getBoundingClientRect();
      const currentTime = Date.now();
      
      // Get current mouse position relative to the editor
      const mouseX = e.clientX - editorRect.left;
      const mouseY = e.clientY - editorRect.top;
      
      // Calculate new position in diagram coordinates
      // This is the fixed calculation that prevents the downward shift
      const newX = (mouseX - dragOffset.x - panOffset.x) / (zoomLevel / 100);
      const newY = (mouseY - dragOffset.y - panOffset.y) / (zoomLevel / 100);
      
      // Apply snapping if enabled
      let finalX = newX;
      let finalY = newY;
      if (snapToGrid) {
        finalX = Math.round(newX / gridSize) * gridSize;
        finalY = Math.round(newY / gridSize) * gridSize;
      }

      // Store position and time for inertia calculations
      setDragLastPos({
        x: e.clientX,
        y: e.clientY,
        time: currentTime,
        diagramX: finalX,
        diagramY: finalY
      });

      // Update the column position
      setColumns(columns.map(col => 
        col.id === draggedColumn 
          ? { ...col, position: { x: finalX, y: finalY } } 
          : col
      ));
      
      // Add subtle magnetic snap when getting close to aligning with other tables
      if (!snapToGrid) {
        applyMagneticSnap(finalX, finalY);
      }
      
      // Prevent default behavior to avoid text selection while dragging
      e.preventDefault();
      
    } else if (isPanning) {
      const dx = e.clientX - startPanPos.x;
      const dy = e.clientY - startPanPos.y;
      
      setPanOffset({
        x: panOffset.x + dx,
        y: panOffset.y + dy
      });
      
      setStartPanPos({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  // Function to apply magnetic snap when tables are close to aligning
  const applyMagneticSnap = (newX, newY) => {
    const column = columns.find(col => col.id === draggedColumn);
    if (!column) return;

    const snapThreshold = 10; // pixels within which snapping occurs
    const magneticColumns = columns.filter(col => col.id !== draggedColumn);
    
    let shouldSnapX = false;
    let shouldSnapY = false;
    let snapX = newX;
    let snapY = newY;
    
    // Check alignment with other columns
    for (const otherCol of magneticColumns) {
      // Horizontal center alignment
      const otherCenterX = otherCol.position.x + otherCol.width / 2;
      const currentCenterX = newX + column.width / 2;
      if (Math.abs(otherCenterX - currentCenterX) < snapThreshold) {
        snapX = otherCol.position.x + otherCol.width / 2 - column.width / 2;
        shouldSnapX = true;
      }
      
      // Vertical center alignment
      const otherCenterY = otherCol.position.y + otherCol.height / 2;
      const currentCenterY = newY + column.height / 2;
      if (Math.abs(otherCenterY - currentCenterY) < snapThreshold) {
        snapY = otherCol.position.y + otherCol.height / 2 - column.height / 2;
        shouldSnapY = true;
      }
      
      // Left edge alignment
      if (Math.abs(otherCol.position.x - newX) < snapThreshold) {
        snapX = otherCol.position.x;
        shouldSnapX = true;
      }
      
      // Right edge alignment
      if (Math.abs(otherCol.position.x + otherCol.width - (newX + column.width)) < snapThreshold) {
        snapX = otherCol.position.x + otherCol.width - column.width;
        shouldSnapX = true;
      }
      
      // Top edge alignment
      if (Math.abs(otherCol.position.y - newY) < snapThreshold) {
        snapY = otherCol.position.y;
        shouldSnapY = true;
      }
      
      // Bottom edge alignment
      if (Math.abs(otherCol.position.y + otherCol.height - (newY + column.height)) < snapThreshold) {
        snapY = otherCol.position.y + otherCol.height - column.height;
        shouldSnapY = true;
      }
    }
    
    // Apply snap if needed
    if (shouldSnapX || shouldSnapY) {
      setColumns(columns.map(col => 
        col.id === draggedColumn 
          ? { ...col, position: { 
              x: shouldSnapX ? snapX : newX, 
              y: shouldSnapY ? snapY : newY 
            } } 
          : col
      ));
    }
  };

  // Function to apply inertia after dragging
  const applyInertia = () => {
    const lastPos = dragLastPos;
    if (!lastPos || !lastPos.time) return;
    
    const timeDiff = Date.now() - lastPos.time;
    if (timeDiff > 100) return; // Don't apply inertia if too much time has passed
    
    const draggedCol = columns.find(col => col.id === draggedColumn);
    if (!draggedCol) return;
    
    // Calculate velocity
    const velocityFactor = 0.95; // Dampening factor
    let velocityX = velocityFactor;
    let velocityY = velocityFactor;
    
    // Set up inertia animation
    let frameCount = 0;
    const maxFrames = 20;
    
    const animateInertia = () => {
      if (frameCount >= maxFrames) return;
      
      const newX = draggedCol.position.x + velocityX * (1 - frameCount / maxFrames);
      const newY = draggedCol.position.y + velocityY * (1 - frameCount / maxFrames);
      
      setColumns(cols => cols.map(col => 
        col.id === draggedColumn 
          ? { ...col, position: { 
              x: snapToGrid ? Math.round(newX / gridSize) * gridSize : newX, 
              y: snapToGrid ? Math.round(newY / gridSize) * gridSize : newY 
            } } 
          : col
      ));
      
      frameCount++;
      requestAnimationFrame(animateInertia);
    };
    
    animateInertia();
  };

  // Function to start panning the canvas
  const startPanning = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt+Left click
      setIsPanning(true);
      setStartPanPos({
        x: e.clientX,
        y: e.clientY
      });
      e.preventDefault();
    }
  };

  // Function to stop panning
  const stopPanning = () => {
    setIsPanning(false);
  };

  // Function to stop dragging
  const stopDragging = () => {
    if (isDragging) {
      // Apply inertia effect for smoother dragging experience
      applyInertia();
      
      // Record position change in history if position actually changed
      if (startDragPosition.current && draggedColumn) {
        const currentColumn = columns.find(col => col.id === draggedColumn);
        if (currentColumn) {
          const originalPosition = startDragPosition.current;
          const newPosition = currentColumn.position;
          
          // Only record if position actually changed
          if (originalPosition.x !== newPosition.x || originalPosition.y !== newPosition.y) {
            createAction('move', 'table', {
              tableId: draggedColumn,
              name: currentColumn.name,
              previousPosition: originalPosition,
              newPosition: newPosition
            });
          }
        }
      }
      
      // Clear drag state
      setIsDragging(false);
      setDraggedColumn(null);
      setDragImage(null);
      startDragPosition.current = null;
    }
  };

  // Toggle snap to grid
  const toggleSnapToGrid = () => {
    setSnapToGrid(!snapToGrid);
    
    // If a callback is provided from parent component, call it
    if (props.onToggleGrid) {
      props.onToggleGrid(!snapToGrid);
    }
  };

  // Register column ref
  const registerColumnRef = (id, element) => {
    if (element) {
      columnRefs.current[id] = element;
    }
  };

  // Column hover handlers
  const handleColumnMouseEnter = (columnId) => {
    if (!isDragging) {
      setHoveredColumn(columnId);
    }
  };
  
  const handleColumnMouseLeave = () => {
    setHoveredColumn(null);
  };

  // Function to handle zoom in/out
  const handleZoom = (direction) => {
    setZoomLevel(prevZoom => {
      const newZoom = direction === 'in' 
        ? Math.min(prevZoom + 10, 200) 
        : Math.max(prevZoom - 10, 30);
      
      // If a callback is provided from parent component, call it
      if (props.onZoomChange) {
        props.onZoomChange(newZoom);
      }
      
      return newZoom;
    });
  };

  // Function to reset zoom and pan
  const resetView = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
    
    // If a callback is provided from parent component, call it
    if (props.onZoomChange) {
      props.onZoomChange(100);
    }
  };

  // Function to start creating a relationship
  const startConnection = (columnId, fieldId) => {
    setIsConnecting(true);
    setConnectionStart({ columnId, fieldId });
  };

  // Function to complete a relationship connection
  const completeConnection = (columnId, fieldId) => {
    if (!isConnecting || !connectionStart) return;
    
    // Don't connect to the same column or field
    if (connectionStart.columnId === columnId && connectionStart.fieldId === fieldId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }
    
    const newRelationship = {
      id: `rel-${relationships.length + 1}`,
      from: { columnId: connectionStart.columnId, fieldId: connectionStart.fieldId },
      to: { columnId, fieldId },
      type: 'one-to-many' // Default relationship type
    };
    
    setRelationships([...relationships, newRelationship]);
    setIsConnecting(false);
    setConnectionStart(null);
  };

  // Function to cancel a connection
  const cancelConnection = () => {
    setIsConnecting(false);
    setConnectionStart(null);
  };

  // Function to update a column's name or fields
  const updateColumn = (columnId, updates) => {
    const originalColumn = columns.find(col => col.id === columnId);
    if (!originalColumn) return;

    // Check if we are updating the name
    if (updates.name && updates.name !== originalColumn.name) {
      // Record the name change in history
      createAction('update', 'table', {
        tableId: columnId,
        name: updates.name,
        previousData: { name: originalColumn.name },
        newData: { name: updates.name }
      });
    }
    
    // Check if we are updating fields
    if (updates.fields) {
      const originalFields = originalColumn.fields;
      const newFields = updates.fields;
      
      // If field count decreased, a field was deleted
      if (newFields.length < originalFields.length) {
        const deletedField = originalFields.find(
          originalField => !newFields.some(newField => newField.id === originalField.id)
        );
        
        if (deletedField) {
          createAction('delete', 'field', {
            tableId: columnId,
            fieldId: deletedField.id,
            name: deletedField.name,
            fieldData: deletedField,
            table: originalColumn.name
          });
        }
      }
      
      // If field count increased, a field was added
      else if (newFields.length > originalFields.length) {
        const addedField = newFields.find(
          newField => !originalFields.some(originalField => originalField.id === newField.id)
        );
        
        if (addedField) {
          createAction('add', 'field', {
            tableId: columnId,
            fieldId: addedField.id,
            name: addedField.name,
            fieldData: addedField,
            table: originalColumn.name
          });
        }
      }
      
      // Check for field updates (name or type changes)
      else {
        for (let i = 0; i < newFields.length; i++) {
          const newField = newFields[i];
          const originalField = originalFields.find(field => field.id === newField.id);
          
          if (originalField) {
            // Check if field name changed
            if (newField.name !== originalField.name) {
              createAction('update', 'field', {
                tableId: columnId,
                fieldId: newField.id,
                name: newField.name,
                previousData: { name: originalField.name },
                newData: { name: newField.name },
                table: originalColumn.name
              });
            }
            
            // Check if field type changed
            else if (newField.type !== originalField.type) {
              createAction('update', 'field', {
                tableId: columnId,
                fieldId: newField.id,
                name: newField.name,
                previousData: { type: originalField.type },
                newData: { type: newField.type },
                table: originalColumn.name
              });
            }
            
            // Check if primary key status changed
            else if (newField.isPrimary !== originalField.isPrimary) {
              createAction('update', 'field', {
                tableId: columnId,
                fieldId: newField.id,
                name: newField.name,
                previousData: { isPrimary: originalField.isPrimary },
                newData: { isPrimary: newField.isPrimary },
                table: originalColumn.name
              });
            }
          }
        }
      }
    }

    // Apply updates to columns
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
  };

  // Function to delete a column
  const deleteColumn = (columnId) => {
    // Remove the column
    setColumns(columns.filter(col => col.id !== columnId));
    
    // Remove relationships connected to this column
    setRelationships(relationships.filter(rel => 
      rel.from.columnId !== columnId && rel.to.columnId !== columnId
    ));
  };

  // Function to calculate minimap viewport dimensions
  const calculateMinimapViewport = () => {
    if (!editorRef.current || columns.length === 0) {
      return { left: 0, top: 0, width: '100%', height: '100%' };
    }

    // Calculate bounds of all columns to determine diagram size
    const bounds = columns.reduce((acc, col) => {
      const right = col.position.x + col.width;
      const bottom = col.position.y + col.height;
      
      return {
        minX: Math.min(acc.minX, col.position.x),
        minY: Math.min(acc.minY, col.position.y),
        maxX: Math.max(acc.maxX, right),
        maxY: Math.max(acc.maxY, bottom)
      };
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    // Adjust for diagram content exceeding viewport
    const diagramWidth = bounds.maxX - bounds.minX + 200; // Add padding
    const diagramHeight = bounds.maxY - bounds.minY + 200; // Add padding
    
    // Calculate viewport dimensions as percentage of total diagram size
    const viewportWidth = Math.min(100, 100 * (editorRef.current.clientWidth / diagramWidth) / (zoomLevel / 100));
    const viewportHeight = Math.min(100, 100 * (editorRef.current.clientHeight / diagramHeight) / (zoomLevel / 100));

    // Calculate viewport position
    const viewportLeft = Math.max(0, 100 * ((panOffset.x / (zoomLevel / 100) - bounds.minX) / diagramWidth));
    const viewportTop = Math.max(0, 100 * ((panOffset.y / (zoomLevel / 100) - bounds.minY) / diagramHeight));

    return {
      left: `${viewportLeft}%`,
      top: `${viewportTop}%`,
      width: `${viewportWidth}%`,
      height: `${viewportHeight}%`
    };
  };

  // Add event listeners for mouse up outside the component and keyboard shortcuts
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        stopDragging();
      }
      if (isPanning) {
        stopPanning();
      }
    };
    
    const handleKeyDown = (e) => {
      // ESC key to cancel connection
      if (e.key === 'Escape' && isConnecting) {
        cancelConnection();
      }
      
      // Space + drag to pan
      if (e.key === ' ' && !isPanning) {
        document.body.style.cursor = 'grab';
      }
      
      // CTRL + 0 to reset view
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        resetView();
        e.preventDefault();
      }
      
      // CTRL + '+' to zoom in
      if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        handleZoom('in');
        e.preventDefault();
      }
      
      // CTRL + '-' to zoom out
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        handleZoom('out');
        e.preventDefault();
      }
      
      // Handle undo/redo
      if (e.key.toLowerCase() === 'z') {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          // CTRL + Z for undo
          handleUndo();
          e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          // CTRL + SHIFT + Z for redo
          handleRedo();
          e.preventDefault();
        }
      }
      
      // CTRL + Y for redo
      if (e.key.toLowerCase() === 'y' && (e.ctrlKey || e.metaKey)) {
        handleRedo();
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        document.body.style.cursor = 'default';
      }
    };
    
    // Handle wheel events for zooming
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoom('in');
        } else {
          handleZoom('out');
        }
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    editorRef.current?.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      editorRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, isConnecting, isPanning, zoomLevel, panOffset, snapToGrid, handleUndo, handleRedo, cancelConnection, resetView]); // Added missing dependencies

  // Use effect to notify parent of state changes
  useEffect(() => {
    if (props.onSnapToGridChange) {
      props.onSnapToGridChange(snapToGrid);
    }
  }, [snapToGrid, props.onSnapToGridChange]);

  useEffect(() => {
    if (props.onZoomChange) {
      props.onZoomChange(zoomLevel);
    }
  }, [zoomLevel, props.onZoomChange]);

  // Content transform style based on zoom and pan
  const contentStyle = {
    transform: `scale(${zoomLevel / 100}) translate(${panOffset.x / (zoomLevel / 100)}px, ${panOffset.y / (zoomLevel / 100)}px)`,
    transformOrigin: '0 0',
    width: 'fit-content',
    height: 'fit-content',
    minWidth: '100%',
    minHeight: '100%',
  };

  return (
    <div 
      className="diagram-editor"
      ref={editorRef}
      onDoubleClick={handleCanvasDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseDown={startPanning}
    >
      <div className="enhanced-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => addColumn(50 + panOffset.x, 50 + panOffset.y)}>
            <span className="btn-icon">+</span> Add Table
          </button>
        </div>
        
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => handleZoom('in')}>
            <span className="btn-icon">+</span> Zoom In
          </button>
          <button className="toolbar-btn" onClick={() => handleZoom('out')}>
            <span className="btn-icon">−</span> Zoom Out
          </button>
          <button className="toolbar-btn" onClick={resetView}>
            <span className="btn-icon">↺</span> Reset View
          </button>
        </div>
        
        <div className="toolbar-group">
          <button 
            className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
            onClick={toggleSnapToGrid} 
            title={snapToGrid ? 'Turn off snap to grid' : 'Turn on snap to grid'}
          >
            <span className="btn-icon">⌗</span> Grid Snap
          </button>
        </div>

        <div className="toolbar-info">
          <span className="info-item">Zoom: {zoomLevel}%</span>
        </div>
      </div>
      
      <div 
        className="diagram-content"
        ref={contentRef}
        style={contentStyle}
      >
        {/* Grid overlay when snap is enabled */}
        {snapToGrid && (
          <div className="grid-overlay" style={{ 
            backgroundSize: `${gridSize}px ${gridSize}px`,
            opacity: isDragging ? 0.3 : 0.1
          }}></div>
        )}
        
        {columns.map(column => (
          <DiagramColumn
            key={column.id}
            column={column}
            onDragStart={startDragging}
            onFieldConnectionStart={startConnection}
            onFieldConnectionComplete={completeConnection}
            onUpdate={updateColumn}
            onDelete={deleteColumn}
            isConnecting={isConnecting}
            connectionStart={connectionStart}
            isDragged={draggedColumn === column.id}
            isHovered={hoveredColumn === column.id}
            registerRef={(el) => registerColumnRef(column.id, el)}
            onMouseEnter={() => handleColumnMouseEnter(column.id)}
            onMouseLeave={handleColumnMouseLeave}
          />
        ))}
        
        {relationships.map(relationship => (
          <DiagramRelationship
            key={relationship.id}
            relationship={relationship}
            columns={columns}
          />
        ))}
        
        {/* Ghost drag image for visualizing drag */}
        {isDragging && dragImage && (
          <div className="drag-ghost" style={{
            width: `${dragImage.width}px`,
            height: `${dragImage.height}px`,
            left: `${(dragLastPos.x - editorRef.current.getBoundingClientRect().left) - dragOffset.x}px`,
            top: `${(dragLastPos.y - editorRef.current.getBoundingClientRect().top) - dragOffset.y}px`,
            transform: `scale(${zoomLevel / 100})`,
            opacity: 0.3,
            pointerEvents: 'none'
          }}></div>
        )}
      </div>
      
      {isConnecting && (
        <div className="connection-tip">
          Click on a field to connect, or ESC to cancel
        </div>
      )}
      
      {/* Mini-map for navigation */}
      <div className="diagram-minimap">
        <div className="minimap-title">Navigator</div>
        <div className="minimap-content">
          <div 
            className="minimap-viewport" 
            style={calculateMinimapViewport()}
          ></div>
        </div>
      </div>
      
      {/* Alignment guides */}
      {isDragging && !snapToGrid && (
        <div className="alignment-guides"></div>
      )}
      
      {/* Enhanced keyboard shortcuts help tooltip */}
      <div className="keyboard-shortcuts-hint">
        <div className="hint-icon">?</div>
        <div className="hint-tooltip">
          <h3>Keyboard Shortcuts</h3>
          <ul>
            <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo last action</li>
            <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo action</li>
            <li><kbd>Ctrl</kbd> + <kbd>+/-</kbd> - Zoom in/out</li>
            <li><kbd>Ctrl</kbd> + <kbd>0</kbd> - Reset view</li>
            <li><kbd>Alt</kbd> + <kbd>Click+Drag</kbd> - Pan canvas</li>
            <li><kbd>Esc</kbd> - Cancel connection</li>
            <li><kbd>Double-click</kbd> - Create new table</li>
          </ul>
        </div>
      </div>
    </div>
  );
});

export default DiagramEditor;