import { useState, useRef, useEffect } from 'react'
import './App.css'
import TitleBar from './components/titlebar'
import SideBar from './components/sidedbar'
import DiagramEditor from './components/DiagramEditor'

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

  return (
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
  )
}

export default App
