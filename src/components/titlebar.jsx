import React, { useState, useEffect, useRef } from 'react';

const TitleBar = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const menuRef = useRef(null);

    // Handle clicks outside the menu to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        // Add event listener when a dropdown is open
        if (activeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    const handleMenuClick = (menu) => {
        if (activeDropdown === menu) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(menu);
        }
    };

    const handleMenuHover = (menu) => {
        // Only switch between dropdowns if one is already open
        if (activeDropdown && activeDropdown !== menu) {
            setActiveDropdown(menu);
        }
    };

    return (
        <div className="titlebar">
            <div className="menu-section" ref={menuRef}>
                <div className="app-icon"></div>
                
                <div 
                    className="menu-item-container" 
                    onMouseEnter={() => handleMenuHover('file')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'file' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('file')}
                    >
                        File
                    </div>
                    {activeDropdown === 'file' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">New File</div>
                            <div className="dropdown-item">New Window</div>
                            <div className="dropdown-item">Open File...</div>
                            <div className="dropdown-item">Open Folder...</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Save</div>
                            <div className="dropdown-item">Save As...</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Exit</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('edit')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'edit' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('edit')}
                    >
                        Edit
                    </div>
                    {activeDropdown === 'edit' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Undo</div>
                            <div className="dropdown-item">Redo</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Cut</div>
                            <div className="dropdown-item">Copy</div>
                            <div className="dropdown-item">Paste</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Find</div>
                            <div className="dropdown-item">Replace</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('selection')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'selection' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('selection')}
                    >
                        Selection
                    </div>
                    {activeDropdown === 'selection' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Select All</div>
                            <div className="dropdown-item">Expand Selection</div>
                            <div className="dropdown-item">Shrink Selection</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Copy Line Up</div>
                            <div className="dropdown-item">Copy Line Down</div>
                            <div className="dropdown-item">Move Line Up</div>
                            <div className="dropdown-item">Move Line Down</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('view')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'view' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('view')}
                    >
                        View
                    </div>
                    {activeDropdown === 'view' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Command Palette</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Explorer</div>
                            <div className="dropdown-item">Search</div>
                            <div className="dropdown-item">Source Control</div>
                            <div className="dropdown-item">Run and Debug</div>
                            <div className="dropdown-item">Extensions</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('go')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'go' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('go')}
                    >
                        Go
                    </div>
                    {activeDropdown === 'go' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Back</div>
                            <div className="dropdown-item">Forward</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Go to File...</div>
                            <div className="dropdown-item">Go to Symbol...</div>
                            <div className="dropdown-item">Go to Line/Column...</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('run')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'run' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('run')}
                    >
                        Run
                    </div>
                    {activeDropdown === 'run' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Start Debugging</div>
                            <div className="dropdown-item">Start Without Debugging</div>
                            <div className="dropdown-item">Stop Debugging</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Add Configuration...</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('terminal')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'terminal' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('terminal')}
                    >
                        Terminal
                    </div>
                    {activeDropdown === 'terminal' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">New Terminal</div>
                            <div className="dropdown-item">Split Terminal</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Run Task...</div>
                            <div className="dropdown-item">Configure Tasks...</div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="menu-item-container"
                    onMouseEnter={() => handleMenuHover('help')}
                >
                    <div 
                        className={`menu-item ${activeDropdown === 'help' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('help')}
                    >
                        Help
                    </div>
                    {activeDropdown === 'help' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-item">Welcome</div>
                            <div className="dropdown-item">Documentation</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item">Check for Updates...</div>
                            <div className="dropdown-item">About</div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="search-section">
                <div className="search-bar">
                    <svg className="search-icon" viewBox="0 0 16 16">
                        <path d="M11.7 10.3c.9-1.2 1.4-2.6 1.4-4.2 0-3.9-3.1-7.1-7-7.1S-1 2.2-1 6.1s3.1 7.1 7 7.1c1.6 0 3.1-.5 4.2-1.4l3 3c.2.2.5.3.7.3s.5-.1.7-.3c.4-.4.4-1 0-1.4l-3-3zM6 11.1c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="currentColor"></path>
                    </svg>
                    <input type="text" placeholder="Search" />
                </div>
            </div>
            
            <div className="controls-section">
                <div className="panel-controls">
                    <div className="panel-control">
                        <svg viewBox="0 0 16 16" className="panel-icon">
                            <path d="M14 5v9H2V5h12zm0-1H2a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1zm0-3v2H2V1h12zm0-1H2a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1V1a1 1 0 00-1-1z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <div className="panel-control">
                        <svg viewBox="0 0 16 16" className="panel-icon">
                            <path d="M1 2h14v2H1zm0 3h14v2H1zm0 3h14v2H1zm0 3h14v2H1z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <div className="panel-control">
                        <svg viewBox="0 0 16 16" className="panel-icon">
                            <path d="M1.5 1h13l.5.5v13l-.5.5h-13l-.5-.5v-13l.5-.5zM2 2v12h12V2H2zm6 9a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"></path>
                        </svg>
                    </div>
                </div>
                <div className="window-controls">
                    <div className="window-control minimize"></div>
                    <div className="window-control maximize"></div>
                    <div className="window-control close"></div>
                </div>
            </div>
        </div>
    );
};

export default TitleBar;