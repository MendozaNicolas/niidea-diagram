import React, { useState, useRef, useEffect } from 'react';

// SVG icons as components for a more professional look
const ExplorerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GitIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 11.10v.9c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.38 2.62l1.42-1.42C17.94 2.35 15.08 1 12 1 5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11v-.9l2 2V10h-4.1l2 2H21z"/>
  </svg>
);

const DiagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h6v6H3V3zm12 0h6v6h-6V3zm0 12h6v6h-6v-6zM3 15h6v6H3v-6zm3-9v3h3V6H6zm12 0v3h3V6h-3zm0 12v3h3v-3h-3zM6 18v-3h3v3H6z"/>
  </svg>
);

const DebugIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 8h-2.81c-.45-.8-1.07-1.5-1.82-2L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.25 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-4 4v3c0 .22-.03.47-.07.7l-.1.65-.37.65c-.72 1.24-2.04 2-3.46 2s-2.74-.77-3.46-2l-.37-.64-.1-.65C8.03 15.48 8 15.23 8 15v-4c0-.23.03-.48.07-.7l.1-.65.37-.65c.3-.52.72-.97 1.21-1.31l.57-.39.74-.18c.31-.08.63-.12.94-.12.32 0 .63.04.95.12l.68.16.61.42c.5.34.91.78 1.21 1.31l.38.65.1.65c.04.22.07.47.07.69v1zm-6 2h4v2h-4v-2zm0-4h4v2h-4v-2z"/>
  </svg>
);

const ExtensionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
  </svg>
);

const FolderIcon = ({ isOpen }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    {isOpen ? (
      <path d="M1.5 1H6l1.5 1.5h7V13H1.5V1zm0 3v8h11.5V4H7.5L6 2.5H1.5z"/>
    ) : (
      <path d="M1.5 1H6l1.5 1.5h7V13H1.5V1zm0 3v8h11.5V4H7.5L6 2.5H1.5z"/>
    )}
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.5 1H5.5l-4 4v9.5h12V1zM12 13H3V5.75L6.25 2.5H12V13z"/>
  </svg>
);

const SideBar = ({ 
  onCollapse, 
  onWidthChange, 
  onAddTable,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onResetView,
  snapToGrid,
  zoomLevel
}) => {
    // State for active section
    const [activeSection, setActiveSection] = useState('explorer');
    // State for sidebar visibility
    const [sidebarVisible, setSidebarVisible] = useState(true);
    // State for sidebar width
    const [sidebarWidth, setSidebarWidth] = useState(250);
    // Minimum width before auto-collapsing
    const minSidebarWidth = 100;
    // State to track if we're currently resizing
    const [isResizing, setIsResizing] = useState(false);
    // Ref for resize handling
    const sidebarRef = useRef(null);

    // Handle section click
    const handleSectionClick = (sectionId) => {
        if (activeSection === sectionId && sidebarVisible) {
            // Toggle sidebar visibility if clicking the active section
            setSidebarVisible(false);
            // Notify parent component
            onCollapse && onCollapse(true);
            // Send width 0 when collapsed
            onWidthChange && onWidthChange(0);
        } else {
            setActiveSection(sectionId);
            setSidebarVisible(true);
            // Notify parent component
            onCollapse && onCollapse(false);
            // Send current width when expanded
            onWidthChange && onWidthChange(sidebarWidth);
        }
    };

    // Notify parent component when sidebar visibility changes
    useEffect(() => {
        onCollapse && onCollapse(!sidebarVisible);
        // When visibility changes, notify about width
        
        if (!sidebarVisible) {
            onWidthChange && onWidthChange(0);
        } else {
            onWidthChange && onWidthChange(sidebarWidth);
        }
    }, [sidebarVisible, sidebarWidth, onCollapse, onWidthChange]);

    // Handle resizing
    const handleMouseDown = (e) => {
        // Only handle left mouse button
        if (e.button !== 0) return;
        
        e.preventDefault();
        
        // Get initial positions and measurements
        const startX = e.clientX;
        const startWidth = sidebarRef.current.getBoundingClientRect().width;
        
        // Set resizing state
        setIsResizing(true);

        // Create mouse move handler
        const handleMouseMove = (e) => {
            // Calculate new width based on mouse movement
            const newWidth = Math.max(minSidebarWidth, startWidth + e.clientX - startX);
            
            if (newWidth > minSidebarWidth) {
                setSidebarWidth(newWidth);
                // Notify parent about width change in real-time
                onWidthChange && onWidthChange(newWidth);
            } else {
                setSidebarVisible(false);
                // Notify parent that width is 0
                onWidthChange && onWidthChange(0);
            }
        };

        // Create mouse up handler
        const handleMouseUp = () => {
            // End resizing state
            setIsResizing(false);
            
            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        // Set cursor style
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        
        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Define sidebar sections with icons
    const sections = [
        { id: 'explorer', icon: ExplorerIcon, title: 'Explorer' },
        { id: 'diagram', icon: DiagramIcon, title: 'Diagram Tools' },
        { id: 'search', icon: SearchIcon, title: 'Search' },
        { id: 'git', icon: GitIcon, title: 'Source Control' },
        { id: 'extensions', icon: ExtensionIcon, title: 'Extensions' }
    ];

    // Mock folder structure for explorer
    const [explorerItems] = useState([
        {
            name: 'src',
            type: 'folder',
            expanded: true,
            children: [
                { name: 'components', type: 'folder', expanded: true, 
                  children: [
                    { name: 'sidebar.jsx', type: 'file' },
                    { name: 'titlebar.jsx', type: 'file' }
                  ] 
                },
                { name: 'App.jsx', type: 'file' },
                { name: 'main.jsx', type: 'file' },
                { name: 'App.css', type: 'file' },
                { name: 'index.css', type: 'file' }
            ]
        },
        {
            name: 'public',
            type: 'folder',
            expanded: false,
            children: [
                { name: 'vite.svg', type: 'file' }
            ]
        }
    ]);

    // Recursive component to render file tree
    const renderTree = (items) => {
        return (
            <ul className="file-tree">
                {items.map((item, index) => (
                    <li key={index} className={`tree-item ${item.type}`}>
                        <div className="tree-item-content">
                            <span className="item-icon">
                                {item.type === 'folder' ? 
                                  <FolderIcon isOpen={item.expanded} /> : 
                                  <FileIcon />}
                            </span>
                            <span className="item-name">{item.name}</span>
                        </div>
                        {item.children && item.expanded && renderTree(item.children)}
                    </li>
                ))}
            </ul>
        );
    };

    // Render content based on active section
    const renderContent = () => {
        switch (activeSection) {
            case 'explorer':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>EXPLORER</span>
                        </div>
                        <div className="explorer-container">
                            {renderTree(explorerItems)}
                        </div>
                    </div>
                );
            case 'diagram':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>DIAGRAM TOOLS</span>
                        </div>
                        <div className="diagram-tools">
                            <div className="tool-group">
                                <h3>Tables</h3>
                                <button className="sidebar-btn" onClick={onAddTable}>
                                    <span className="btn-icon">+</span> Add Table
                                </button>
                            </div>
                            
                            <div className="tool-group">
                                <h3>View</h3>
                                <div className="zoom-controls">
                                    <button className="sidebar-btn" onClick={onZoomIn}>
                                        <span className="btn-icon">+</span> Zoom In
                                    </button>
                                    <button className="sidebar-btn" onClick={onZoomOut}>
                                        <span className="btn-icon">-</span> Zoom Out
                                    </button>
                                    <div className="zoom-level-indicator">
                                        Current: {zoomLevel}%
                                    </div>
                                    <button className="sidebar-btn" onClick={onResetView}>
                                        <span className="btn-icon">↺</span> Reset View
                                    </button>
                                </div>
                            </div>
                            
                            <div className="tool-group">
                                <h3>Settings</h3>
                                <div className="setting-row">
                                    <label className="setting-label">
                                        <input 
                                            type="checkbox" 
                                            checked={snapToGrid} 
                                            onChange={onToggleGrid}
                                        />
                                        <span>Snap to Grid</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'search':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>SEARCH</span>
                        </div>
                        <div className="search-container">
                            <input type="text" placeholder="Search" className="search-input" />
                            <div className="search-results">
                                <p>Type to search in files</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>{sections.find(s => s.id === activeSection)?.title.toUpperCase()}</span>
                        </div>
                        <p className="placeholder-text">Content for {sections.find(s => s.id === activeSection)?.title}</p>
                    </div>
                );
        }
    };

    return (
        <div className={`vscode-sidebar ${!sidebarVisible ? 'collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}>
            <div className="activity-bar">
                {sections.map(section => {
                    const IconComponent = section.icon;
                    return (
                        <div 
                            key={section.id}
                            className={`activity-icon ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => handleSectionClick(section.id)}
                            title={section.title}
                        >
                            <IconComponent />
                        </div>
                    );
                })}
            </div>
            {sidebarVisible && (
                <div className="sidebar-container">
                    <div 
                        className="sidebar-content"
                        ref={sidebarRef}
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        {renderContent()}
                    </div>
                    <div 
                        className="sidebar-resizer" 
                        onMouseDown={handleMouseDown}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default SideBar;