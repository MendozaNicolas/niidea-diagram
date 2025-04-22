import { useState, useRef, useEffect } from 'react'
import './App.css'
import TitleBar from './components/titlebar'
import SideBar from './components/sidedbar'  // Correctly matching the actual filename
import DiagramEditor from './components/DiagramEditor'
import { HistoryProvider } from './context/HistoryContext'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Track the sidebar width for dynamic content positioning
  const [sidebarWidth, setSidebarWidth] = useState(250)
  // State for diagram editor features that need to be shared with sidebar
  const [zoomLevel, setZoomLevel] = useState(100)
  const [snapToGrid, setSnapToGrid] = useState(true)
  
  // Reference to the diagram editor
  const diagramEditorRef = useRef(null)
  
  // Activity bar width (constant)
  const activityBarWidth = 48;

  // Handler for sidebar collapse state changes
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed)
  }
  
  // Handler for sidebar width changes
  const handleSidebarWidthChange = (width) => {
    setSidebarWidth(width)
  }
  
  // Function to add a new table through the sidebar
  const handleAddTable = () => {
    if (diagramEditorRef.current) {
      // Add the table in a good position considering current view
      diagramEditorRef.current.addColumn(100, 100)
    }
  }
  
  // Function to toggle grid snap
  const handleToggleGrid = () => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.toggleSnapToGrid()
    }
  }
  
  // Function to handle zoom in
  const handleZoomIn = () => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.handleZoomIn()
    }
  }
  
  // Function to handle zoom out
  const handleZoomOut = () => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.handleZoomOut()
    }
  }
  
  // Function to reset diagram view
  const handleResetView = () => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.resetView()
    }
  }
  
  // Handler for zoom level changes in diagram
  const handleZoomChange = (newZoomLevel) => {
    setZoomLevel(newZoomLevel)
  }
  
  // Handler for snap to grid changes in diagram
  const handleSnapToGridChange = (newSnapToGrid) => {
    setSnapToGrid(newSnapToGrid)
  }

  // Function to handle undo action from sidebar
  const handleUndoAction = (action) => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.undoAction();
    }
  }
  
  // Function to handle redo action from sidebar
  const handleRedoAction = (action) => {
    if (diagramEditorRef.current) {
      diagramEditorRef.current.redoAction();
    }
  }
  
  // Function to handle history navigation
  const handleHistoryNavigation = (navigationResult) => {
    if (diagramEditorRef.current && navigationResult) {
      // Apply a series of actions (either undo or redo)
      if (navigationResult.direction === 'undo') {
        // Apply all undo actions in sequence
        navigationResult.actions.forEach(action => {
          diagramEditorRef.current.applyUndoAction(action);
        });
      } else if (navigationResult.direction === 'redo') {
        // Apply all redo actions in sequence
        navigationResult.actions.forEach(action => {
          if (action.type === 'create') {
            if (action.entity === 'table') {
              diagramEditorRef.current.applyRedoCreateTable(action.tableData);
            }
          } else if (action.type === 'delete') {
            // Handle delete
          } else if (action.type === 'move') {
            // Handle move
          } else if (action.type === 'update') {
            // Handle update
          } else if (action.type === 'add') {
            // Handle add
          }
        });
      }
    }
  }

  return (
    <HistoryProvider>
      <div className="vscode-app">
        <TitleBar />
        <SideBar 
          onCollapse={handleSidebarCollapse} 
          onWidthChange={handleSidebarWidthChange}
          onAddTable={handleAddTable}
          onToggleGrid={handleToggleGrid}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          snapToGrid={snapToGrid}
          zoomLevel={zoomLevel}
          onUndoAction={handleUndoAction}
          onRedoAction={handleRedoAction}
          onHistoryNavigation={handleHistoryNavigation}
        />
        <div 
          className="app-content"
          style={{ 
            marginLeft: sidebarCollapsed ? 
              `${activityBarWidth}px` : 
              `${activityBarWidth + sidebarWidth}px` 
          }}
        >
          <DiagramEditor 
            ref={diagramEditorRef}
            onZoomChange={handleZoomChange}
            onSnapToGridChange={handleSnapToGridChange}
          />
        </div>
      </div>
    </HistoryProvider>
  )
}

export default App
