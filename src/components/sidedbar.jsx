import React, { useState, useRef, useEffect } from 'react';
// Import icons from react-icons library
import { 
  FiFolder, 
  FiFolderPlus, 
  FiFile, 
  FiSearch, 
  FiPlus, 
  FiMinus, 
  FiRefreshCw, 
  FiCheck,
  FiGrid,
  FiClock,
  FiRotateCcw,
  FiRotateCw
} from 'react-icons/fi';
import { 
  BiTable, 
  BiCodeBlock, 
  BiGitBranch, 
  BiCog,
  BiHistory
} from 'react-icons/bi';
import { 
  VscFiles, 
  VscSearch, 
  VscSourceControl, 
  VscExtensions,
  VscDebug,
  VscHistory
} from 'react-icons/vsc';
import { TbTableOptions } from 'react-icons/tb';
import { RiZoomInLine, RiZoomOutLine } from 'react-icons/ri';
import { useHistory } from '../context/HistoryContext';

// Replace SVG components with react-icons 
const ExplorerIcon = () => <VscFiles size={24} />;
const SearchIcon = () => <VscSearch size={24} />;
const GitIcon = () => <VscSourceControl size={24} />;
const DiagramIcon = () => <TbTableOptions size={24} />;
const DebugIcon = () => <VscDebug size={24} />; // Changed from VscDebugAlt2 to VscDebug
const ExtensionIcon = () => <VscExtensions size={24} />;
const HistoryIcon = () => <VscHistory size={24} />;

const FolderIcon = ({ isOpen }) => (
  isOpen ? <FiFolderPlus size={16} color="#e8ab3f" /> : <FiFolder size={16} color="#e8ab3f" />
);

const FileIcon = () => <FiFile size={16} color="#75beff" />;

const SideBar = ({ 
  onCollapse, 
  onWidthChange, 
  onAddTable,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onResetView,
  snapToGrid,
  zoomLevel,
  onUndoAction,
  onRedoAction,
  onHistoryNavigation
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
    
    // Get history context
    const { actions, currentPosition, undo, redo, canUndo, canRedo, goToHistoryPosition } = useHistory();

    // Handle undo action
    const handleUndo = () => {
        if (canUndo) {
            const action = undo();
            if (action && onUndoAction) {
                onUndoAction(action);
            }
        }
    };

    // Handle redo action
    const handleRedo = () => {
        if (canRedo) {
            const action = redo();
            if (action && onRedoAction) {
                onRedoAction(action);
            }
        }
    };

    // Handle going to a specific history position
    const handleGoToHistoryPosition = (position) => {
        const result = goToHistoryPosition(position);
        if (result && onHistoryNavigation) {
            onHistoryNavigation(result);
        }
    };

    // Helper function to get action icon
    const getActionIcon = (type) => {
        switch (type) {
            case 'create':
                return <FiPlus size={14} className="history-action-icon create" />;
            case 'add':
                return <FiPlus size={14} className="history-action-icon add" />;
            case 'delete':
                return <FiMinus size={14} className="history-action-icon delete" />;
            case 'update':
                return <FiRefreshCw size={14} className="history-action-icon update" />;
            default:
                return <FiClock size={14} className="history-action-icon" />;
        }
    };

    // Helper function to get action description
    const getActionDescription = (action) => {
        switch (action.type) {
            case 'create':
                return `Created ${action.entity} "${action.name}"`;
            case 'add':
                return `Added ${action.entity} "${action.name}" to ${action.table}`;
            case 'delete':
                return `Deleted ${action.entity} "${action.name}"`;
            case 'update':
                return `Updated ${action.entity} "${action.name}"`;
            case 'relationship':
                return `Created relationship ${action.from} → ${action.to}`;
            default:
                return `Unknown action on ${action.entity}`;
        }
    };

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
        { id: 'history', icon: HistoryIcon, title: 'History' },
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
                    { name: 'titlebar.jsx', type: 'file' },
                    { name: 'DiagramEditor.jsx', type: 'file' },
                    { name: 'DiagramColumn.jsx', type: 'file' },
                    { name: 'DiagramRelationship.jsx', type: 'file' }
                  ] 
                },
                { name: 'assets', type: 'folder', expanded: false,
                  children: [
                    { name: 'react.svg', type: 'file' },
                    { name: 'fonts', type: 'folder', expanded: false,
                      children: [
                        { name: 'Montserrat-Regular.ttf', type: 'file' }
                      ]
                    }
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

    // Toggle folder expanded/collapsed state
    const toggleFolder = (path, itemName) => {
        console.log(`Toggle folder: ${itemName}`);
    };

    // Recursive component to render file tree
    const renderTree = (items) => {
        return (
            <ul className="file-tree">
                {items.map((item, index) => (
                    <li key={index} className={`tree-item ${item.type}`}>
                        <div 
                            className="tree-item-content"
                            onClick={() => item.type === 'folder' ? toggleFolder(index, item.name) : null}
                        >
                            <span className="item-icon">
                                {item.type === 'folder' ? 
                                  <FolderIcon isOpen={item.expanded} /> : 
                                  <FileIcon />}
                            </span>
                            <span className="item-name">{item.name}</span>
                            {item.type === 'folder' && (
                                <span className="folder-arrow">
                                    {item.expanded ? '▾' : '▸'}
                                </span>
                            )}
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
                            <div className="section-actions">
                                <button className="icon-button" title="New File">
                                    <FiFile size={14} />
                                </button>
                                <button className="icon-button" title="New Folder">
                                    <FiFolder size={14} />
                                </button>
                            </div>
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
                            <div className="section-actions">
                                <button className="icon-button" title="Add Table" onClick={onAddTable}>
                                    <BiTable size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="diagram-tools">
                            <div className="tool-group">
                                <h3>
                                    <BiTable className="tool-group-icon" />
                                    Tables
                                </h3>
                                <button className="sidebar-btn modern-btn" onClick={onAddTable}>
                                    <FiPlus className="btn-icon" /> Add Table
                                </button>
                            </div>
                            
                            <div className="tool-group">
                                <h3>
                                    <RiZoomInLine className="tool-group-icon" />
                                    View
                                </h3>
                                <div className="zoom-controls">
                                    <button className="sidebar-btn modern-btn" onClick={onZoomIn}>
                                        <RiZoomInLine className="btn-icon" /> Zoom In
                                    </button>
                                    <button className="sidebar-btn modern-btn" onClick={onZoomOut}>
                                        <RiZoomOutLine className="btn-icon" /> Zoom Out
                                    </button>
                                    <div className="zoom-level-indicator">
                                        <div className="zoom-level-track">
                                            <div 
                                                className="zoom-level-fill" 
                                                style={{width: `${Math.min(100, zoomLevel / 2)}%`}}
                                            ></div>
                                        </div>
                                        <span>{zoomLevel}%</span>
                                    </div>
                                    <button className="sidebar-btn modern-btn" onClick={onResetView}>
                                        <FiRefreshCw className="btn-icon" /> Reset View
                                    </button>
                                </div>
                            </div>
                            
                            <div className="tool-group">
                                <h3>
                                    <BiCog className="tool-group-icon" />
                                    Settings
                                </h3>
                                <div className="setting-row">
                                    <label className="modern-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked={snapToGrid} 
                                            onChange={onToggleGrid}
                                        />
                                        <span className="checkmark">
                                            {snapToGrid && <FiCheck size={12} />}
                                        </span>
                                        <span className="setting-label-text">
                                            <FiGrid className="setting-icon" />
                                            Snap to Grid
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>HISTORY</span>
                            <div className="section-actions">
                                <button 
                                    className="icon-button" 
                                    title="Undo (Ctrl+Z)" 
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                >
                                    <FiRotateCcw size={14} />
                                </button>
                                <button 
                                    className="icon-button" 
                                    title="Redo (Ctrl+Y)" 
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                >
                                    <FiRotateCw size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="history-controls">
                            <button 
                                className={`history-btn ${!canUndo ? 'disabled' : ''}`} 
                                onClick={handleUndo}
                                disabled={!canUndo}
                            >
                                <FiRotateCcw size={14} /> Undo
                                <span className="history-keyboard-shortcut">Ctrl+Z</span>
                            </button>
                            <button 
                                className={`history-btn ${!canRedo ? 'disabled' : ''}`}
                                onClick={handleRedo}
                                disabled={!canRedo}
                            >
                                <FiRotateCw size={14} /> Redo
                                <span className="history-keyboard-shortcut">Ctrl+Y</span>
                            </button>
                        </div>
                        
                        <div className="history-filter">
                            <input 
                                type="text" 
                                placeholder="Filter actions..." 
                                aria-label="Filter history actions" 
                            />
                        </div>
                        
                        <div className="history-container">
                            {actions.length > 0 ? (
                                <>
                                    <div className="history-timeline"></div>
                                    {actions.length > 0 && actions[0].timestamp.includes('AM') && (
                                        <div className="history-group-header">
                                            <span>Morning</span>
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    <ul className="history-list">
                                        {actions.map((action, index) => (
                                            <li 
                                                key={action.id} 
                                                className={`history-item ${index < currentPosition ? 'active' : 'future'}`}
                                                onClick={() => handleGoToHistoryPosition(index + 1)}
                                            >
                                                <div className="history-item-icon">
                                                    {getActionIcon(action.type)}
                                                </div>
                                                <div className="history-item-details">
                                                    <span className="history-item-description">
                                                        {getActionDescription(action)}
                                                        <span className={`history-action-badge badge-${action.type}`}>
                                                            {action.type}
                                                        </span>
                                                    </span>
                                                    <span className="history-item-timestamp">
                                                        {action.timestamp}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div className="history-empty">
                                    <div className="history-empty-icon">
                                        <BiHistory size={32} />
                                    </div>
                                    <div className="history-empty-text">
                                        <p>No actions recorded yet</p>
                                        <p>Actions will appear here as you make changes to your diagram</p>
                                    </div>
                                </div>
                            )}
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
                            <div className="search-input-container">
                                <FiSearch className="search-icon-input" />
                                <input type="text" placeholder="Search" className="search-input" />
                            </div>
                            <div className="search-options">
                                <label className="search-option">
                                    <input type="checkbox" />
                                    <span>Case Sensitive</span>
                                </label>
                                <label className="search-option">
                                    <input type="checkbox" />
                                    <span>Whole Word</span>
                                </label>
                            </div>
                            <div className="search-results">
                                <p>Type to search in files</p>
                            </div>
                        </div>
                    </div>
                );
            case 'git':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>SOURCE CONTROL</span>
                            <div className="section-actions">
                                <button className="icon-button" title="Refresh">
                                    <FiRefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="git-container">
                            <div className="git-status">
                                <BiGitBranch size={16} className="git-branch-icon" />
                                <span className="git-branch-name">main</span>
                            </div>
                            <p className="git-message">No changes detected in workspace.</p>
                        </div>
                    </div>
                );
            case 'extensions':
                return (
                    <div className="section-content">
                        <div className="section-header">
                            <span>EXTENSIONS</span>
                        </div>
                        <div className="extensions-container">
                            <div className="search-input-container">
                                <FiSearch className="search-icon-input" />
                                <input type="text" placeholder="Search Extensions" className="search-input" />
                            </div>
                            <div className="extension-list">
                                <div className="extension-item">
                                    <div className="extension-icon">Db</div>
                                    <div className="extension-details">
                                        <span className="extension-name">Database Diagram Generator</span>
                                        <span className="extension-publisher">Database Tools</span>
                                    </div>
                                </div>
                                <div className="extension-item">
                                    <div className="extension-icon">Er</div>
                                    <div className="extension-details">
                                        <span className="extension-name">ER Diagram Preview</span>
                                        <span className="extension-publisher">Database Tools</span>
                                    </div>
                                </div>
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