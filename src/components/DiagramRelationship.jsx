import React, { useState, useEffect, useRef } from 'react';

const DiagramRelationship = ({ relationship, columns, snapToGrid = true, gridSize = 20 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [relationshipType, setRelationshipType] = useState(relationship.type || 'one-to-many');
  const pathRef = useRef(null);
  
  // Find the source and target columns
  const fromColumn = columns.find(col => col.id === relationship.from.columnId);
  const toColumn = columns.find(col => col.id === relationship.to.columnId);
  
  // If either column doesn't exist, don't render
  if (!fromColumn || !toColumn) {
    return null;
  }
  
  // Find the related fields
  const fromField = fromColumn.fields.find(field => field.id === relationship.from.fieldId);
  const toField = toColumn.fields.find(field => field.id === relationship.to.fieldId);
  
  // If either field doesn't exist, don't render
  if (!fromField || !toField) {
    return null;
  }
  
  // Helper function for grid snapping
  const snapToGridPoint = (x, y) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };
  
  // Calculate field positions within the columns - more accurate calculation
  const getFieldPosition = (column, field) => {
    const fieldIndex = column.fields.findIndex(f => f.id === field.id);
    const fieldHeight = 35; // Approximate height of each field including padding
    const headerHeight = 45; // Approximate height of the column header including padding
    
    // Calculate all four sides of the column for potential connection points
    const left = {
      x: column.position.x,
      y: column.position.y + headerHeight + (fieldIndex * fieldHeight) + (fieldHeight / 2)
    };
    
    const right = {
      x: column.position.x + column.width,
      y: column.position.y + headerHeight + (fieldIndex * fieldHeight) + (fieldHeight / 2)
    };
    
    const top = {
      x: column.position.x + column.width / 2,
      y: column.position.y + headerHeight / 2 + (fieldIndex > 0 ? fieldIndex * fieldHeight / 2 : 0)
    };
    
    const bottom = {
      x: column.position.x + column.width / 2,
      y: column.position.y + headerHeight + (fieldIndex + 1) * fieldHeight
    };
    
    return { left, right, top, bottom };
  };
  
  const fromPositions = getFieldPosition(fromColumn, fromField);
  const toPositions = getFieldPosition(toColumn, toField);
  
  // Find the optimal connection points between two columns
  const getOptimalConnectionPoints = () => {
    const fromCenter = {
      x: fromColumn.position.x + fromColumn.width / 2,
      y: fromColumn.position.y + fromColumn.height / 2
    };
    
    const toCenter = {
      x: toColumn.position.x + toColumn.width / 2,
      y: toColumn.position.y + toColumn.height / 2
    };
    
    // Calculate distances between centers
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    
    let start, end;
    
    // Determine the optimal connection points based on relative positions
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal arrangement is more prominent
      if (dx > 0) {
        // Target is to the right
        start = fromPositions.right;
        end = toPositions.left;
      } else {
        // Target is to the left
        start = fromPositions.left;
        end = toPositions.right;
      }
    } else {
      // Vertical arrangement is more prominent
      if (dy > 0) {
        // Target is below
        start = fromPositions.bottom;
        end = toPositions.top;
      } else {
        // Target is above
        start = fromPositions.top;
        end = toPositions.bottom;
      }
    }
    
    // Apply grid snapping if enabled
    const snappedStart = snapToGridPoint(start.x, start.y);
    const snappedEnd = snapToGridPoint(end.x, end.y);
    
    return { 
      start: { x: snappedStart.x, y: snappedStart.y }, 
      end: { x: snappedEnd.x, y: snappedEnd.y } 
    };
  };
  
  const { start, end } = getOptimalConnectionPoints();
  
  // Calculate the direction and angle for the relationship line
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for a curved bezier that looks good at any orientation
  const calculateControlPoints = () => {
    // Determine if the connection is more horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    
    // Set base control point distance (based on distance between points)
    const baseControlLength = Math.min(100, distance * 0.4);
    
    // Calculate initial control points
    let cp1, cp2;
    
    if (isHorizontal) {
      cp1 = {
        x: start.x + Math.cos(angle) * baseControlLength,
        y: start.y + Math.sin(angle) * (baseControlLength * 0.2)
      };
      cp2 = {
        x: end.x - Math.cos(angle) * baseControlLength,
        y: end.y - Math.sin(angle) * (baseControlLength * 0.2)
      };
    } else {
      cp1 = {
        x: start.x + Math.sin(angle) * (baseControlLength * 0.2),
        y: start.y + Math.cos(angle) * baseControlLength
      };
      cp2 = {
        x: end.x - Math.sin(angle) * (baseControlLength * 0.2),
        y: end.y - Math.cos(angle) * baseControlLength
      };
    }
    
    // Apply grid snapping to control points too if enabled
    if (snapToGrid) {
      const snappedCp1 = snapToGridPoint(cp1.x, cp1.y);
      const snappedCp2 = snapToGridPoint(cp2.x, cp2.y);
      
      cp1 = { x: snappedCp1.x, y: snappedCp1.y };
      cp2 = { x: snappedCp2.x, y: snappedCp2.y };
    }
    
    return { cp1, cp2 };
  };
  
  const { cp1, cp2 } = calculateControlPoints();
  
  // Create the path for the relationship curve
  const path = `
    M ${start.x},${start.y}
    C ${cp1.x},${cp1.y}
      ${cp2.x},${cp2.y}
      ${end.x},${end.y}
  `;
  
  // Create a wider invisible path for easier hover detection
  const hitAreaPath = path;
  
  // Function to toggle between relationship types on click
  const cycleRelationshipType = (e) => {
    e.stopPropagation();
    
    const types = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];
    const currentIndex = types.indexOf(relationshipType);
    const nextIndex = (currentIndex + 1) % types.length;
    
    setRelationshipType(types[nextIndex]);
    
    // Here you would also update the relationship in your state management
    // For example: updateRelationship(relationship.id, { type: types[nextIndex] })
  };
  
  // Draw the appropriate cardinality markers based on relationship type
  const drawMarkers = () => {
    // Calculate positions for markers at both ends
    const markerDistanceFrom = 12; // Distance from the start point
    const markerDistanceTo = 12;   // Distance from the end point
    
    // Calculate the position for the "from" marker
    const fromAngle = Math.atan2(cp1.y - start.y, cp1.x - start.x);
    const fromMarkerX = start.x + markerDistanceFrom * Math.cos(fromAngle);
    const fromMarkerY = start.y + markerDistanceFrom * Math.sin(fromAngle);
    
    // Calculate the position for the "to" marker
    const toAngle = Math.atan2(end.y - cp2.y, end.x - cp2.x);
    const toMarkerX = end.x - markerDistanceTo * Math.cos(toAngle);
    const toMarkerY = end.y - markerDistanceTo * Math.sin(toAngle);
    
    // Snap these points to grid if enabled
    let snappedFromMarker = { x: fromMarkerX, y: fromMarkerY };
    let snappedToMarker = { x: toMarkerX, y: toMarkerY };
    
    if (snapToGrid) {
      snappedFromMarker = snapToGridPoint(fromMarkerX, fromMarkerY);
      snappedToMarker = snapToGridPoint(toMarkerX, toMarkerY);
    }
    
    // Perpendicular angles for drawing markers
    const fromPerpAngle = fromAngle + Math.PI / 2;
    const toPerpAngle = toAngle + Math.PI / 2;
    
    const markerSize = isHovered ? 10 : 8;
    
    // Draw different markers based on relationship type
    let fromMarker = null;
    let toMarker = null;
    
    // Helper to create line coordinates
    const getLineCoords = (center, angle, perpAngle, size) => {
      const coords = {
        x1: center.x + size * Math.cos(perpAngle),
        y1: center.y + size * Math.sin(perpAngle),
        x2: center.x - size * Math.cos(perpAngle),
        y2: center.y - size * Math.sin(perpAngle),
        forward: {
          x: center.x + size/2 * Math.cos(angle),
          y: center.y + size/2 * Math.sin(angle)
        }
      };
      
      // Apply grid snapping to these coordinates if enabled
      if (snapToGrid) {
        const snappedX1Y1 = snapToGridPoint(coords.x1, coords.y1);
        const snappedX2Y2 = snapToGridPoint(coords.x2, coords.y2);
        const snappedForward = snapToGridPoint(coords.forward.x, coords.forward.y);
        
        coords.x1 = snappedX1Y1.x;
        coords.y1 = snappedX1Y1.y;
        coords.x2 = snappedX2Y2.x;
        coords.y2 = snappedX2Y2.y;
        coords.forward.x = snappedForward.x;
        coords.forward.y = snappedForward.y;
      }
      
      return coords;
    };
    
    // From marker coordinates
    const fromCoords = getLineCoords(
      snappedFromMarker, 
      fromAngle, 
      fromPerpAngle, 
      markerSize
    );
    
    // To marker coordinates
    const toCoords = getLineCoords(
      snappedToMarker, 
      toAngle, 
      toPerpAngle, 
      markerSize
    );
    
    // Create markers based on relationship type
    switch(relationshipType) {
      case 'one-to-one':
        // One (|) on both sides
        fromMarker = (
          <path
            d={`M ${fromCoords.x1},${fromCoords.y1} L ${fromCoords.x2},${fromCoords.y2}`}
            stroke={isHovered ? "#1177bb" : "#666"}
            strokeWidth={isHovered ? 2 : 1.5}
          />
        );
        
        toMarker = (
          <path
            d={`M ${toCoords.x1},${toCoords.y1} L ${toCoords.x2},${toCoords.y2}`}
            stroke={isHovered ? "#1177bb" : "#666"}
            strokeWidth={isHovered ? 2 : 1.5}
          />
        );
        break;
        
      case 'one-to-many':
        // One (|) on from side, crow's foot on to side
        fromMarker = (
          <path
            d={`M ${fromCoords.x1},${fromCoords.y1} L ${fromCoords.x2},${fromCoords.y2}`}
            stroke={isHovered ? "#1177bb" : "#666"}
            strokeWidth={isHovered ? 2 : 1.5}
          />
        );
        
        toMarker = (
          <g>
            <path
              d={`
                M ${toCoords.x1},${toCoords.y1} 
                L ${end.x},${end.y} 
                L ${toCoords.x2},${toCoords.y2}
              `}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
            />
            <path
              d={`M ${snappedToMarker.x},${snappedToMarker.y} L ${end.x},${end.y}`}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
            />
          </g>
        );
        break;
        
      case 'many-to-one':
        // Crow's foot on from side, one (|) on to side
        fromMarker = (
          <g>
            <path
              d={`
                M ${fromCoords.x1},${fromCoords.y1} 
                L ${start.x},${start.y} 
                L ${fromCoords.x2},${fromCoords.y2}
              `}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
            />
            <path
              d={`M ${snappedFromMarker.x},${snappedFromMarker.y} L ${start.x},${start.y}`}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
            />
          </g>
        );
        
        toMarker = (
          <path
            d={`M ${toCoords.x1},${toCoords.y1} L ${toCoords.x2},${toCoords.y2}`}
            stroke={isHovered ? "#1177bb" : "#666"}
            strokeWidth={isHovered ? 2 : 1.5}
          />
        );
        break;
        
      case 'many-to-many':
        // Crow's foot on both sides
        fromMarker = (
          <g>
            <path
              d={`
                M ${fromCoords.x1},${fromCoords.y1} 
                L ${start.x},${start.y} 
                L ${fromCoords.x2},${fromCoords.y2}
              `}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
            />
            <path
              d={`M ${snappedFromMarker.x},${snappedFromMarker.y} L ${start.x},${start.y}`}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
            />
          </g>
        );
        
        toMarker = (
          <g>
            <path
              d={`
                M ${toCoords.x1},${toCoords.y1} 
                L ${end.x},${end.y} 
                L ${toCoords.x2},${toCoords.y2}
              `}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
            />
            <path
              d={`M ${snappedToMarker.x},${snappedToMarker.y} L ${end.x},${end.y}`}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
            />
          </g>
        );
        break;
        
      default:
        // Default to one-to-many if type is undefined
        fromMarker = (
          <path
            d={`M ${fromCoords.x1},${fromCoords.y1} L ${fromCoords.x2},${fromCoords.y2}`}
            stroke={isHovered ? "#1177bb" : "#666"}
            strokeWidth={isHovered ? 2 : 1.5}
          />
        );
        
        toMarker = (
          <g>
            <path
              d={`
                M ${toCoords.x1},${toCoords.y1} 
                L ${end.x},${end.y} 
                L ${toCoords.x2},${toCoords.y2}
              `}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
              fill="none"
            />
            <path
              d={`M ${snappedToMarker.x},${snappedToMarker.y} L ${end.x},${end.y}`}
              stroke={isHovered ? "#1177bb" : "#666"}
              strokeWidth={isHovered ? 2 : 1.5}
            />
          </g>
        );
    }
    
    return (
      <>
        {fromMarker}
        {toMarker}
      </>
    );
  };

  // Add a pulsating animation to highlight the connection when hovered
  const animationStyles = isHovered ? {
    filter: 'drop-shadow(0 0 3px rgba(17, 119, 187, 0.8))'
  } : {};
  
  // Get a human-readable label for the relationship type
  const getRelationshipLabel = () => {
    switch(relationshipType) {
      case 'one-to-one': return '1:1';
      case 'one-to-many': return '1:N';
      case 'many-to-one': return 'N:1';
      case 'many-to-many': return 'N:N';
      default: return '1:N';
    }
  };
  
  return (
    <svg 
      className="diagram-relationship" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: isHovered ? 5 : 1,
        pointerEvents: 'none',
        ...animationStyles
      }}
    >
      <g style={{ pointerEvents: 'all' }}>
        {/* Invisible wide path for easier hovering */}
        <path
          ref={pathRef}
          d={hitAreaPath}
          stroke="transparent"
          strokeWidth={15}
          fill="none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={cycleRelationshipType}
          style={{ cursor: 'pointer' }}
        />
        
        {/* Visible path */}
        <path
          d={path}
          stroke={isHovered ? "#1177bb" : "#666"}
          strokeWidth={isHovered ? 2.5 : 1.5}
          fill="none"
          strokeDasharray={relationship.optional ? '5,5' : 'none'}
          style={{ 
            transition: 'stroke 0.3s, stroke-width 0.3s',
            cursor: 'pointer',
            pointerEvents: 'none'
          }}
        />
        
        {/* Connection markers */}
        {drawMarkers()}
        
        {/* Field connection indicator dots */}
        <circle cx={start.x} cy={start.y} r={isHovered ? 4 : 3} 
          fill={isHovered ? "#1177bb" : "#666"} 
          style={{ transition: 'fill 0.3s, r 0.3s' }}
        />
        <circle cx={end.x} cy={end.y} r={isHovered ? 4 : 3} 
          fill={isHovered ? "#1177bb" : "#666"}
          style={{ transition: 'fill 0.3s, r 0.3s' }}
        />
        
        {/* Relationship information when hovered */}
        {isHovered && (
          <g>
            {/* Relationship type badge */}
            <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}>
              <rect 
                x="-65" 
                y="-18" 
                width="130" 
                height="36" 
                rx="5" 
                ry="5" 
                fill="rgba(20, 20, 20, 0.85)"
                stroke="#1177bb"
                strokeWidth="1.5"
              />
              <text 
                x="0" 
                y="-2" 
                textAnchor="middle" 
                fill="#fff" 
                fontSize="12"
                fontFamily="'Segoe UI', sans-serif"
                fontWeight="bold"
              >
                {`${fromField.name} → ${toField.name}`}
              </text>
              <text 
                x="0" 
                y="14" 
                textAnchor="middle" 
                fill="#1177bb" 
                fontSize="11"
                fontFamily="'Segoe UI', sans-serif"
              >
                {`${getRelationshipLabel()} (click to change)`}
              </text>
            </g>
            
            {/* Source field info */}
            <g transform={`translate(${start.x}, ${start.y - 20})`}>
              <rect 
                x="-50" 
                y="-15" 
                width="100" 
                height="20" 
                rx="3" 
                ry="3" 
                fill="rgba(20, 20, 20, 0.7)"
                stroke="#666"
                strokeWidth="1"
              />
              <text 
                x="0" 
                y="2" 
                textAnchor="middle" 
                fill="#fff" 
                fontSize="10"
                fontFamily="'Segoe UI', sans-serif"
              >
                {`${fromColumn.name}.${fromField.name}`}
              </text>
            </g>
            
            {/* Target field info */}
            <g transform={`translate(${end.x}, ${end.y - 20})`}>
              <rect 
                x="-50" 
                y="-15" 
                width="100" 
                height="20" 
                rx="3" 
                ry="3" 
                fill="rgba(20, 20, 20, 0.7)"
                stroke="#666"
                strokeWidth="1"
              />
              <text 
                x="0" 
                y="2" 
                textAnchor="middle" 
                fill="#fff" 
                fontSize="10"
                fontFamily="'Segoe UI', sans-serif"
              >
                {`${toColumn.name}.${toField.name}`}
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};

export default DiagramRelationship;