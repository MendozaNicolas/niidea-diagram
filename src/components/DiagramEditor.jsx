import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import DiagramColumn from './DiagramColumn';
import DiagramRelationship from './DiagramRelationship';

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

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    addColumn: (x, y) => addColumn(x, y),
    handleZoomIn: () => handleZoom('in'),
    handleZoomOut: () => handleZoom('out'),
    resetView,
    toggleSnapToGrid,
    getZoomLevel: () => zoomLevel,
    getSnapToGrid: () => snapToGrid
  }));

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

    setColumns([...columns, newColumn]);
    setNextId(nextId + 1);
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
      
      // Clear drag state
      setIsDragging(false);
      setDraggedColumn(null);
      setDragImage(null);
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
  }, [isDragging, isConnecting, isPanning, zoomLevel, panOffset, snapToGrid]);

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
      <div className="toolbar">
        <button onClick={() => addColumn(50 + panOffset.x, 50 + panOffset.y)}>
          <span className="btn-icon">+</span> Add Table
        </button>
        <button onClick={() => handleZoom('in')}>
          <span className="btn-icon">+</span> Zoom In
        </button>
        <button onClick={() => handleZoom('out')}>
          <span className="btn-icon">-</span> Zoom Out
        </button>
        <button onClick={resetView}>
          <span className="btn-icon">↺</span> Reset View
        </button>
        <button 
          className={snapToGrid ? 'active' : ''}
          onClick={toggleSnapToGrid} 
          title={snapToGrid ? 'Turn off snap to grid' : 'Turn on snap to grid'}
        >
          <span className="btn-icon">⌗</span> Grid Snap
        </button>
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
      
      {/* Zoom level indicator */}
      <div className="diagram-zoom-controls">
        <div className="zoom-btn" onClick={() => handleZoom('out')}>−</div>
        <div className="zoom-level">{zoomLevel}%</div>
        <div className="zoom-btn" onClick={() => handleZoom('in')}>+</div>
      </div>
      
      {/* Mini-map for navigation */}
      <div className="diagram-minimap">
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
    </div>
  );
});

export default DiagramEditor;