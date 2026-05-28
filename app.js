// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Global state variables
let myDiagram = null;
let currentTheme = 'dark';
let autoSaveTimeout = null;
let activeWorkPlanNode = null;
let activeTab = 'main';
let tempMonthlyTasks = [];
let tempWeeklyTasks = [];

// Curated modern HSL colors (Fill / Stroke pairs)
const colorPresets = [
  { fill: '#ffb300', stroke: '#ff8f00', name: 'זהב' },         // Gold (Root default)
  { fill: '#1e3a8a', stroke: '#3b82f6', name: 'כחול עמוק' },   // Dark Blue
  { fill: '#0369a1', stroke: '#0284c7', name: 'כחול שמיים' },  // Sky Blue
  { fill: '#065f46', stroke: '#10b981', name: 'ירוק אמרלד' },  // Emerald Green
  { fill: '#0f766e', stroke: '#14b8a6', name: 'טורקיז' },      // Teal
  { fill: '#7c2d12', stroke: '#ea580c', name: 'כתום תפוז' },   // Orange
  { fill: '#6b21a8', stroke: '#a855f7', name: 'סגול חציל' },   // Violet
  { fill: '#a21caf', stroke: '#d946ef', name: 'ורוד פוקסיה' }, // Fuchsia
  { fill: '#be123c', stroke: '#f43f5e', name: 'אדום ורד' },    // Rose
  { fill: '#b45309', stroke: '#f59e0b', name: 'ענבר' },        // Amber
  { fill: '#4338ca', stroke: '#6366f1', name: 'אינדיגו' },     // Indigo
  { fill: '#2d3748', stroke: '#4a5568', name: 'אפור כהה' }     // Gray (Leaves default)
];

// Presets data models
const presets = {
  calmness: {
    nodes: [
      { key: 1, text: "למה רוגע היא\nמטרה בחיים?", fill: "#ffb300", stroke: "#ff8f00", fontSize: 16, isBold: true, shape: "RoundedRectangle" },
      { key: 2, text: "קבלת החלטות", fill: "#1e3a8a", stroke: "#3b82f6", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 21, text: "בחירה נכונה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 22, text: "הבנה עמוקה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 3, text: "פרודוקטיביות\nויצירתיות", fill: "#065f46", stroke: "#10b981", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 31, text: "חשיבה צלולה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 32, text: "מיקוד ופוקוס", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 33, text: "רעיונות חדשים", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 4, text: "שמחה מההווה", fill: "#7c2d12", stroke: "#ea580c", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 41, text: "הוקרת תודה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 42, text: "נוכחות (Presence)", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 43, text: "שלווה פנימית", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 5, text: "מערכות יחסים", fill: "#6b21a8", stroke: "#a855f7", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 51, text: "תקשורת בונה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 52, text: "סבלנות", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 53, text: "חמלה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 6, text: "בריאות נפשית\nוגופנית", fill: "#0f766e", stroke: "#14b8a6", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 61, text: "פחות מתח", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 62, text: "חוסן מול משברים", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" }
    ],
    links: [
      { from: 1, to: 2, stroke: "#3b82f6", strokeWidth: 3 }, { from: 2, to: 21, stroke: "#4a5568", strokeWidth: 2 }, { from: 2, to: 22, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 3, stroke: "#10b981", strokeWidth: 3 }, { from: 3, to: 31, stroke: "#4a5568", strokeWidth: 2 }, { from: 3, to: 32, stroke: "#4a5568", strokeWidth: 2 }, { from: 3, to: 33, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 4, stroke: "#ea580c", strokeWidth: 3 }, { from: 4, to: 41, stroke: "#4a5568", strokeWidth: 2 }, { from: 4, to: 42, stroke: "#4a5568", strokeWidth: 2 }, { from: 4, to: 43, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 5, stroke: "#a855f7", strokeWidth: 3 }, { from: 5, to: 51, stroke: "#4a5568", strokeWidth: 2 }, { from: 5, to: 52, stroke: "#4a5568", strokeWidth: 2 }, { from: 5, to: 53, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 6, stroke: "#14b8a6", strokeWidth: 3 }, { from: 6, to: 61, stroke: "#4a5568", strokeWidth: 2 }, { from: 6, to: 62, stroke: "#4a5568", strokeWidth: 2 }
    ]
  },
  goals: {
    nodes: [
      { key: 1, text: "התפתחות אישית\nומטרות בחיים", fill: "#6b21a8", stroke: "#a855f7", fontSize: 16, isBold: true, shape: "RoundedRectangle" },
      // Career
      { key: 2, text: "קריירה ולמידה", fill: "#0369a1", stroke: "#0284c7", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 21, text: "רכישת מקצוע מבוקש", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 22, text: "קריאת ספרים", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 23, text: "קורסים והסמכות", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      // Health
      { key: 3, text: "בריאות וכושר", fill: "#065f46", stroke: "#10b981", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 31, text: "ריצה 3 פעמים בשבוע", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 32, text: "תזונה מאוזנת", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 33, text: "שתיית מים מרובה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      // Mind
      { key: 4, text: "מיינדפולנס ונפש", fill: "#ffb300", stroke: "#ff8f00", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 41, text: "מדיטציה יומית", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 42, text: "כתיבת יומן תודות", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      // Social
      { key: 5, text: "משפחה וחברים", fill: "#be123c", stroke: "#f43f5e", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 51, text: "ארוחת שישי משפחתית", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 52, text: "מפגש שבועי עם חבר", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" }
    ],
    links: [
      { from: 1, to: 2, stroke: "#0284c7", strokeWidth: 3 }, { from: 2, to: 21, stroke: "#4a5568", strokeWidth: 2 }, { from: 2, to: 22, stroke: "#4a5568", strokeWidth: 2 }, { from: 2, to: 23, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 3, stroke: "#10b981", strokeWidth: 3 }, { from: 3, to: 31, stroke: "#4a5568", strokeWidth: 2 }, { from: 3, to: 32, stroke: "#4a5568", strokeWidth: 2 }, { from: 3, to: 33, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 4, stroke: "#ff8f00", strokeWidth: 3 }, { from: 4, to: 41, stroke: "#4a5568", strokeWidth: 2 }, { from: 4, to: 42, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 5, stroke: "#f43f5e", strokeWidth: 3 }, { from: 5, to: 51, stroke: "#4a5568", strokeWidth: 2 }, { from: 5, to: 52, stroke: "#4a5568", strokeWidth: 2 }
    ]
  },
  blank: {
    nodes: [
      { key: 1, text: "נושא מרכזי חדש\n(דאבל קליק לעריכה)", fill: "#ffb300", stroke: "#ff8f00", fontSize: 16, isBold: true, shape: "RoundedRectangle" }
    ],
    links: []
  },
  importance: {
    nodes: [
      { key: 1, text: "למה זה חשוב?", fill: "#ffb300", stroke: "#ff8f00", fontSize: 16, isBold: true, shape: "RoundedRectangle" },
      { key: 2, text: "בריאות הנפש", fill: "#1e3a8a", stroke: "#3b82f6", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 21, text: "מניעת שחיקה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 22, text: "שיפור השינה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 3, text: "קשרים חברתיים", fill: "#065f46", stroke: "#10b981", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 31, text: "הקשבה אמיתית", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 32, text: "פחות כעסים", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 4, text: "הצלחה בקריירה", fill: "#7c2d12", stroke: "#ea580c", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 41, text: "החלטות שקולות", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 42, text: "ריכוז גבוה", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 5, text: "איכות חיים", fill: "#6b21a8", stroke: "#a855f7", fontSize: 14, isBold: true, shape: "RoundedRectangle" },
      { key: 51, text: "ליהנות מהרגע", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" },
      { key: 52, text: "יציבות פנימית", fill: "#2d3748", stroke: "#4a5568", fontSize: 13, shape: "Ellipse" }
    ],
    links: [
      { from: 1, to: 2, stroke: "#3b82f6", strokeWidth: 3 }, { from: 2, to: 21, stroke: "#4a5568", strokeWidth: 2 }, { from: 2, to: 22, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 3, stroke: "#10b981", strokeWidth: 3 }, { from: 3, to: 31, stroke: "#4a5568", strokeWidth: 2 }, { from: 3, to: 32, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 4, stroke: "#ea580c", strokeWidth: 3 }, { from: 4, to: 41, stroke: "#4a5568", strokeWidth: 2 }, { from: 4, to: 42, stroke: "#4a5568", strokeWidth: 2 },
      { from: 1, to: 5, stroke: "#a855f7", strokeWidth: 3 }, { from: 5, to: 51, stroke: "#4a5568", strokeWidth: 2 }, { from: 5, to: 52, stroke: "#4a5568", strokeWidth: 2 }
    ]
  }
};

// Initialize Application
function initApp() {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('mindmap_theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  }

  // Setup color grids in sidebar
  generateColorPickers();
  
  // Initialize Diagram
  initDiagram();

  // Setup Event Listeners for HTML UI Elements
  setupUIEventListeners();

  // Load active tab and restore its data
  const savedTab = localStorage.getItem('mindmap_active_tab') || 'main';
  switchTab(savedTab, false);
}

// Helper to recursively collect descendants of a node for branch dragging
function addDescendants(node, set) {
  node.findTreeChildrenNodes().each((child) => {
    if (!set.has(child)) {
      set.add(child);
      addDescendants(child, set);
    }
  });
}

// Initialize GoJS Diagram
function initDiagram() {
  const $ = go.GraphObject.make;

  myDiagram = $(go.Diagram, "myDiagramDiv", {
    "undoManager.isEnabled": true,
    // Smooth scroll and zoom behavior
    "animationManager.duration": 300,
    "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
    // Support moving the entire subtree together when dragging a parent node
    "draggingTool.computeEffectiveCollection": function(parts) {
      const map = go.DraggingTool.prototype.computeEffectiveCollection.call(this, parts);
      const moveToggle = document.getElementById('moveBranchToggle');
      if (moveToggle && moveToggle.checked) {
        const descendants = new go.Set();
        parts.each((part) => {
          if (part instanceof go.Node) {
            addDescendants(part, descendants);
          }
        });
        descendants.each((node) => {
          if (!map.has(node)) {
            map.add(node, new go.DraggingInfo(node.location.copy()));
          }
        });
      }
      return map;
    },
    // Support creating a child node when dragging a link to empty space
    "linkingTool.doNoLink": function(fromnode, fromport) {
      const diagram = this.diagram;
      const mousePt = diagram.lastInput.documentPoint;
      
      diagram.startTransaction("drag add node");
      
      const parentColor = colorPresets.find(c => c.fill === fromnode.data.fill) || colorPresets[11];
      const newdata = { 
        text: "ענף חדש", 
        fill: fromnode.data.key === 1 ? parentColor.fill : "#2d3748", 
        stroke: fromnode.data.key === 1 ? parentColor.stroke : "#4a5568", 
        shape: "Ellipse",
        fontSize: 13,
        loc: go.Point.stringify(mousePt)
      };
      diagram.model.addNodeData(newdata);
      
      const newlink = { 
        from: fromnode.key, 
        to: newdata.key, 
        stroke: fromnode.data.key === 1 ? parentColor.stroke : "#4a5568", 
        strokeWidth: fromnode.data.key === 1 ? 2.5 : 2
      };
      diagram.model.addLinkData(newlink);
      
      diagram.commitTransaction("drag add node");
      
      const newnode = diagram.findNodeForData(newdata);
      if (newnode) {
        diagram.select(newnode);
      }
      
      showToast('נוצר ענף חדש בגרירה', 'success');
    },
    // Custom context menu override
    contextMenu: $(go.HTMLInfo, {
      show: showContextMenu,
      hide: hideContextMenu
    }),
    // Double click on background to create a new root node
    doubleClick: (e) => {
      const point = e.documentPoint;
      e.diagram.startTransaction("add root node");
      const newdata = { 
        text: "בועה חדשה", 
        fill: "#2d3748", 
        stroke: "#4a5568",
        shape: "RoundedRectangle",
        fontSize: 14,
        loc: go.Point.stringify(point) 
      };
      e.diagram.model.addNodeData(newdata);
      e.diagram.commitTransaction("add root node");
      
      const newnode = e.diagram.findNodeForData(newdata);
      if (newnode !== null) {
        e.diagram.select(newnode);
      }
      showToast('נוצרה בועה חדשה במיקום הלחיצה', 'success');
    },
    // Auto-arrange layout
    layout: $(go.ForceDirectedLayout, {
      defaultSpringLength: 70,
      defaultElectricalCharge: 150,
      isOngoing: false
    })
  });

  // Setup auto-save listener on model changes
  myDiagram.addModelChangedListener((e) => {
    if (e.isTransactionFinished) {
      scheduleAutoSave();
    }
  });

  // Node Template definition
  myDiagram.nodeTemplate =
    $(go.Node, "Spot",
      { 
        locationSpot: go.Spot.Center, 
        locationObjectName: "BODY",
        // Show/hide port handles on hover
        mouseEnter: (e, node) => {
          node.findObject("PORT_T").opacity = 1;
          node.findObject("PORT_B").opacity = 1;
          node.findObject("PORT_L").opacity = 1;
          node.findObject("PORT_R").opacity = 1;
        },
        mouseLeave: (e, node) => {
          node.findObject("PORT_T").opacity = 0;
          node.findObject("PORT_B").opacity = 0;
          node.findObject("PORT_L").opacity = 0;
          node.findObject("PORT_R").opacity = 0;
        },
        // Double click to open Work Plan modal
        doubleClick: (e, obj) => {
          const node = obj.part;
          if (node instanceof go.Node) {
            openWorkPlanModal(node);
          }
        }
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("text", "text"),
      
      // Main Body of the node (draggable from here)
      $(go.Panel, "Auto",
        { name: "BODY" },
        
        // Node shape
        $(go.Shape, "RoundedRectangle", {
          name: "SHAPE",
          parameter1: 20, // Rounded corners for rectangle
          strokeWidth: 2.5,
          fill: "#2D3748",
          stroke: "#4A5568"
        },
        new go.Binding("figure", "shape"),
        new go.Binding("fill", "fill"),
        new go.Binding("stroke", "stroke")),
        
        // Node text
        $(go.TextBlock, {
          margin: new go.Margin(12, 14, 12, 14),
          stroke: "#ffffff",
          editable: true,
          isMultiline: true,
          alignment: go.Spot.Center,
          textAlign: "center"
        },
        new go.Binding("font", "", (data) => {
          const size = data.fontSize || 14;
          const isBold = data.isBold ? "bold " : "";
          const isItalic = data.isItalic ? "italic " : "";
          return `${isBold}${isItalic}${size}px Rubik, Heebo, sans-serif`;
        }),
        new go.Binding("text").makeTwoWay())
      ),

      // Hover ports for drawing connections
      $(go.Shape, "Circle", {
        name: "PORT_T",
        alignment: go.Spot.Top,
        width: 8, height: 8,
        fill: "#38bdf8", stroke: null,
        portId: "T",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_B",
        alignment: go.Spot.Bottom,
        width: 8, height: 8,
        fill: "#38bdf8", stroke: null,
        portId: "B",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_L",
        alignment: go.Spot.Left,
        width: 8, height: 8,
        fill: "#38bdf8", stroke: null,
        portId: "L",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_R",
        alignment: go.Spot.Right,
        width: 8, height: 8,
        fill: "#38bdf8", stroke: null,
        portId: "R",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      })
    );

  // Context menu assigned directly to nodes too
  myDiagram.nodeTemplate.contextMenu = $(go.HTMLInfo, {
    show: showContextMenu,
    hide: hideContextMenu
  });

  // Curved link Template
  myDiagram.linkTemplate =
    $(go.Link, {
      relinkableFrom: true, relinkableTo: true,
      reshapable: true, resegmentable: true,
      curve: go.Link.Bezier,
      adjusting: go.Link.End
    },
      $(go.Shape, { strokeWidth: 3, stroke: "#4A5568" },
        new go.Binding("strokeWidth", "strokeWidth"),
        new go.Binding("stroke", "stroke"),
        new go.Binding("strokeDashArray", "style", (style) => {
          if (style === 'dashed') return [6, 4];
          if (style === 'dotted') return [2, 3];
          return null;
        })
      )
    );

  // Custom Selection Adornment (🔵 Blue selection ring + (+) button to add child)
  myDiagram.nodeTemplate.selectionAdornmentTemplate =
    $(go.Adornment, "Spot",
      $(go.Panel, "Auto",
        $(go.Shape, { fill: null, stroke: "#38bdf8", strokeWidth: 2.5 }),
        $(go.Placeholder)
      ),
      $(go.Panel, "Auto",
        { 
          alignment: go.Spot.TopRight, 
          click: addNodeAndLink,
          cursor: "pointer",
          toolTip: $(go.Adornment, "Auto",
            $(go.Shape, { fill: "#1e293b", stroke: "#38bdf8" }),
            $(go.TextBlock, "הוסף ענף ובן חדש", { margin: 6, stroke: "white", font: "11px Rubik, sans-serif" })
          )
        },
        $(go.Shape, "Circle", { width: 22, height: 22, fill: "#38bdf8", stroke: null }),
        $(go.TextBlock, "+", { font: "bold 16px sans-serif", stroke: "#090d16", alignment: go.Spot.Center })
      )
    );

  // Selection change listener to control sidebar inspector
  myDiagram.addDiagramListener("ChangedSelection", () => {
    updateSidebarInspector();
  });
}

// Function to add a child node from selection
function addNodeAndLink(e, obj) {
  const adornparent = obj.part;
  const node = adornparent.adornedPart;
  const thisdiagram = node.diagram;
  
  thisdiagram.startTransaction("add node and link");
  
  // Create child node using similar colors to parent but lighter stroke
  const isParentRoot = node.data.key === 1;
  const parentColor = colorPresets.find(c => c.fill === node.data.fill) || colorPresets[11];
  
  // Set default properties for child
  const newdata = { 
    text: "ענף חדש", 
    fill: isParentRoot ? parentColor.fill : "#2d3748", 
    stroke: isParentRoot ? parentColor.stroke : "#4a5568",
    shape: "Ellipse",
    fontSize: 13
  };
  
  // Position the new node slightly below and right/left of the parent to avoid stacking
  const parentLoc = node.location;
  const numChildren = node.findTreeChildrenNodes().count;
  const offsetX = (numChildren % 2 === 0 ? 1 : -1) * (60 + (numChildren * 10));
  const offsetY = 80 + (numChildren * 10);
  newdata.loc = go.Point.stringify(new go.Point(parentLoc.x + offsetX, parentLoc.y + offsetY));

  thisdiagram.model.addNodeData(newdata);
  
  // Link styles
  const newlink = { 
    from: node.key, 
    to: newdata.key, 
    stroke: isParentRoot ? parentColor.stroke : "#4a5568",
    strokeWidth: isParentRoot ? 2.5 : 2
  };
  thisdiagram.model.addLinkData(newlink);
  
  thisdiagram.commitTransaction("add node and link");
  
  const newnode = thisdiagram.findNodeForData(newdata);
  if (newnode !== null) {
    thisdiagram.select(newnode);
    // Pan to selection
    thisdiagram.commandHandler.scrollToPart(newnode);
  }
  showToast('ענף ובן נוספו בהצלחה', 'success');
}

// Generate color swatch picker controls in the HTML sidebar
function generateColorPickers() {
  const fillGrid = document.getElementById('fillColorGrid');
  const strokeGrid = document.getElementById('strokeColorGrid');
  const linkGrid = document.getElementById('linkColorGrid');

  fillGrid.innerHTML = '';
  strokeGrid.innerHTML = '';
  linkGrid.innerHTML = '';

  colorPresets.forEach((color, index) => {
    // Fill color options
    const fillOpt = document.createElement('div');
    fillOpt.className = 'color-option';
    fillOpt.style.backgroundColor = color.fill;
    fillOpt.dataset.fill = color.fill;
    fillOpt.dataset.stroke = color.stroke;
    fillOpt.title = color.name;
    fillOpt.addEventListener('click', () => selectNodeColor(color.fill, color.stroke));
    fillGrid.appendChild(fillOpt);

    // Stroke color options
    const strokeOpt = document.createElement('div');
    strokeOpt.className = 'color-option';
    strokeOpt.style.backgroundColor = color.stroke;
    strokeOpt.dataset.stroke = color.stroke;
    strokeOpt.title = color.name;
    strokeOpt.addEventListener('click', () => selectNodeStroke(color.stroke));
    strokeGrid.appendChild(strokeOpt);

    // Link color options
    const linkOpt = document.createElement('div');
    linkOpt.className = 'color-option';
    linkOpt.style.backgroundColor = color.stroke;
    linkOpt.dataset.stroke = color.stroke;
    linkOpt.title = color.name;
    linkOpt.addEventListener('click', () => selectLinkColor(color.stroke));
    linkGrid.appendChild(linkOpt);
  });
}

// Sync selection to Sidebar Property inspector
function updateSidebarInspector() {
  const selectionText = document.getElementById('selectionText');
  const emptyState = document.getElementById('emptyInspectorState');
  const nodeEditor = document.getElementById('nodeEditorSection');
  const linkEditor = document.getElementById('linkEditorSection');
  
  const sel = myDiagram.selection;

  if (sel.count === 1) {
    const part = sel.first();
    emptyState.style.display = 'none';

    if (part instanceof go.Node) {
      linkEditor.style.display = 'none';
      nodeEditor.style.display = 'block';
      selectionText.innerText = part.data.key === 1 ? 'עריכת בועה ראשית (שורש)' : 'עריכת בועה נבחרת';
      
      // Load current properties to sidebar form
      const data = part.data;
      document.getElementById('nodeTextVal').value = data.text || '';
      document.getElementById('nodeFontSize').value = data.fontSize || 14;
      document.getElementById('fontSizeVal').innerText = `${data.fontSize || 14}px`;
      document.getElementById('fontBold').checked = !!data.isBold;
      document.getElementById('fontItalic').checked = !!data.isItalic;
      
      // Highlight selected shape
      const currentShape = data.shape || 'RoundedRectangle';
      document.querySelectorAll('.shape-btn').forEach(btn => {
        if (btn.dataset.shape === currentShape) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Highlight selected fill and stroke colors
      document.querySelectorAll('#fillColorGrid .color-option').forEach(opt => {
        if (opt.dataset.fill === data.fill) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      document.querySelectorAll('#strokeColorGrid .color-option').forEach(opt => {
        if (opt.dataset.stroke === data.stroke) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

    } else if (part instanceof go.Link) {
      nodeEditor.style.display = 'none';
      linkEditor.style.display = 'block';
      selectionText.innerText = 'עריכת קשר / קו מקשר';

      const data = part.data;
      document.getElementById('linkWidth').value = data.strokeWidth || 3;
      document.getElementById('linkWidthVal').innerText = `${data.strokeWidth || 3}px`;
      document.getElementById('linkStyleSelect').value = data.style || 'solid';

      document.querySelectorAll('#linkColorGrid .color-option').forEach(opt => {
        if (opt.dataset.stroke === data.stroke) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }
  } else {
    // Multi-selection or no selection
    nodeEditor.style.display = 'none';
    linkEditor.style.display = 'none';
    emptyState.style.display = 'flex';
    selectionText.innerText = 'בחר רכיב במפה כדי לערוך אותו';
  }
}

// Save node Text Change from Sidebar
document.getElementById('nodeTextVal').addEventListener('input', (e) => {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change text");
    myDiagram.model.setDataProperty(node.data, "text", e.target.value);
    myDiagram.commitTransaction("change text");
  }
});

// Save Font Size change from Sidebar
document.getElementById('nodeFontSize').addEventListener('input', (e) => {
  const size = parseInt(e.target.value);
  document.getElementById('fontSizeVal').innerText = `${size}px`;
  
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change fontSize");
    myDiagram.model.setDataProperty(node.data, "fontSize", size);
    myDiagram.commitTransaction("change fontSize");
  }
});

// Save Font Bold change
document.getElementById('fontBold').addEventListener('change', (e) => {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change bold");
    myDiagram.model.setDataProperty(node.data, "isBold", e.target.checked);
    myDiagram.commitTransaction("change bold");
  }
});

// Save Font Italic change
document.getElementById('fontItalic').addEventListener('change', (e) => {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change italic");
    myDiagram.model.setDataProperty(node.data, "isItalic", e.target.checked);
    myDiagram.commitTransaction("change italic");
  }
});

// Handle Shape Selector button clicks
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const shape = btn.dataset.shape;
    
    // UI feedback
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const node = myDiagram.selection.first();
    if (node instanceof go.Node) {
      myDiagram.startTransaction("change shape");
      myDiagram.model.setDataProperty(node.data, "shape", shape);
      myDiagram.commitTransaction("change shape");
    }
  });
});

// Apply Color Swatch to selected node (fill & stroke coordinated)
function selectNodeColor(fill, stroke) {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change color");
    myDiagram.model.setDataProperty(node.data, "fill", fill);
    myDiagram.model.setDataProperty(node.data, "stroke", stroke);
    
    // Also change child links color to match if desired (helps structure visibility)
    node.findLinksOutOf().each((link) => {
      myDiagram.model.setDataProperty(link.data, "stroke", stroke);
    });

    myDiagram.commitTransaction("change color");

    // Re-highlight swatches
    updateSidebarInspector();
  }
}

// Change stroke only
function selectNodeStroke(stroke) {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    myDiagram.startTransaction("change stroke");
    myDiagram.model.setDataProperty(node.data, "stroke", stroke);
    myDiagram.commitTransaction("change stroke");
    updateSidebarInspector();
  }
}

// Change Link width
document.getElementById('linkWidth').addEventListener('input', (e) => {
  const width = parseFloat(e.target.value);
  document.getElementById('linkWidthVal').innerText = `${width}px`;

  const link = myDiagram.selection.first();
  if (link instanceof go.Link) {
    myDiagram.startTransaction("change link width");
    myDiagram.model.setDataProperty(link.data, "strokeWidth", width);
    myDiagram.commitTransaction("change link width");
  }
});

// Change Link style dropdown
document.getElementById('linkStyleSelect').addEventListener('change', (e) => {
  const style = e.target.value;
  const link = myDiagram.selection.first();
  if (link instanceof go.Link) {
    myDiagram.startTransaction("change link style");
    myDiagram.model.setDataProperty(link.data, "style", style);
    myDiagram.commitTransaction("change link style");
  }
});

// Change Link color from palette
function selectLinkColor(stroke) {
  const link = myDiagram.selection.first();
  if (link instanceof go.Link) {
    myDiagram.startTransaction("change link color");
    myDiagram.model.setDataProperty(link.data, "stroke", stroke);
    myDiagram.commitTransaction("change link color");
    updateSidebarInspector();
  }
}

// Add Node branch button from Sidebar form
document.getElementById('addNodeBranchBtn').addEventListener('click', () => {
  const node = myDiagram.selection.first();
  if (node instanceof go.Node) {
    // Add child using same helper
    addNodeAndLink(null, { part: { adornedPart: node } });
  }
});

// UI elements event bindings (Zoom, Undo/Redo, Presets, Export/Import)
function setupUIEventListeners() {
  // Preset selector
  document.getElementById('presetSelect').addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  // Export JSON
  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    openExportModal('json');
  });


  // Import JSON File
  document.getElementById('importJsonTrigger').addEventListener('click', () => {
    document.getElementById('importJsonInput').click();
  });

  document.getElementById('importJsonInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let newModel = null;
        let isNative = false;

        try {
          // 1. Try parsing as standard GoJS JSON Model
          const jsonObj = JSON.parse(text);
          if (jsonObj && (jsonObj.class || jsonObj.nodeDataArray)) {
            newModel = go.Model.fromJson(text);
            newModel.linkFromPortIdProperty = "fromPort";
            newModel.linkToPortIdProperty = "toPort";
            isNative = true;
          }
        } catch (e) {
          // Not standard JSON
        }

        if (!isNative) {
          // 2. Fallback: Parse as relaxed JS/HTML script
          const parsedData = parseImportedFile(text);
          
          let nodes = [];
          let links = [];

          if (Array.isArray(parsedData)) {
            // Format 1: Direct array of nodes
            nodes = parsedData;
          } else if (parsedData && typeof parsedData === 'object') {
            // Format 2 & 3: Standard GoJS Model or Custom nodes/links object
            nodes = parsedData.nodeDataArray || parsedData.nodes || [];
            links = parsedData.linkDataArray || parsedData.links || [];
          }

          if (!nodes || nodes.length === 0) {
            throw new Error("No nodes found in the imported file");
          }

          // Clean nodes & links to ensure keys exist
          nodes.forEach((n, index) => {
            if (n.key === undefined) {
              n.key = index + 1;
            }
          });

          // Explicitly construct a GraphLinksModel to ensure links render correctly
          newModel = new go.GraphLinksModel();
          newModel.linkFromPortIdProperty = "fromPort";
          newModel.linkToPortIdProperty = "toPort";
          newModel.nodeDataArray = nodes;
          newModel.linkDataArray = links;
        }

        if (!newModel) {
            throw new Error("Failed to create diagram model.");
        }

        myDiagram.model = newModel;

        // Reset the layout type select value to default ForceDirected since the layout is reset
        document.getElementById('layoutSelect').value = 'ForceDirected';
        
        // Force the layout to run once to arrange nodes (e.g. if they had no coordinates)
        myDiagram.layoutDiagram(true);
        myDiagram.commandHandler.zoomToFit();

        // Clear preset selector
        document.getElementById('presetSelect').value = '';
        showToast('המפה נטענה בהצלחה', 'success');
      } catch (err) {
        showToast('שגיאה: ' + err.message, 'error');
        console.error("Import error:", err);
      } finally {
        // Reset file input value to allow uploading same file again
        e.target.value = '';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Export PNG Image
  document.getElementById('exportPngBtn').addEventListener('click', () => {
    openExportModal('png');
  });


  // Floating Toolbar Actions
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    myDiagram.commandHandler.increaseZoom();
  });

  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    myDiagram.commandHandler.decreaseZoom();
  });

  document.getElementById('zoomFitBtn').addEventListener('click', () => {
    myDiagram.commandHandler.zoomToFit();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    myDiagram.commandHandler.undo();
  });

  document.getElementById('redoBtn').addEventListener('click', () => {
    myDiagram.commandHandler.redo();
  });

  document.getElementById('deleteNodeBtn').addEventListener('click', () => {
    deleteSelected();
  });

  // Help Modal Toggle
  const helpModal = document.getElementById('helpModal');
  document.getElementById('helpBtn').addEventListener('click', () => {
    helpModal.classList.add('open');
  });

  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    helpModal.classList.remove('open');
  });

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.remove('open');
    }
  });

  // Theme Toggle Button
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    toggleTheme();
  });

  // Global Layout Select configuration
  const layoutSelect = document.getElementById('layoutSelect');
  const springWrapper = document.getElementById('layoutAdjusters');
  const springSlider = document.getElementById('layoutForceSpring');
  const springSliderVal = document.getElementById('layoutSpringVal');
  const sliderLabel = document.getElementById('layoutSliderLabel');

  layoutSelect.addEventListener('change', (e) => {
    const layoutType = e.target.value;
    
    // Show/hide layout sliders based on type
    if (layoutType === 'ForceDirected') {
      springWrapper.style.display = 'block';
      sliderLabel.innerText = 'אורך הענפים';
      springSlider.min = '30';
      springSlider.max = '200';
      springSlider.value = myDiagram.layout.defaultSpringLength || 70;
      springSliderVal.innerText = springSlider.value;
    } else if (layoutType === 'Tree' || layoutType === 'TreeVertical' || layoutType === 'TreeHorizontal') {
      springWrapper.style.display = 'block';
      sliderLabel.innerText = 'מרווח בין עמודות';
      springSlider.min = '20';
      springSlider.max = '120';
      springSlider.value = 40;
      springSliderVal.innerText = springSlider.value;
    } else {
      springWrapper.style.display = 'none';
    }

    applyLayout(layoutType, parseInt(springSlider.value));
  });

  springSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    springSliderVal.innerText = val;
    applyLayout(layoutSelect.value, val);
  });

  document.getElementById('resetLayoutBtn').addEventListener('click', () => {
    applyLayout(layoutSelect.value, parseInt(springSlider.value));
    myDiagram.commandHandler.zoomToFit();
  });

  // Export Filename Modal Logic
  const exportModal = document.getElementById('exportModal');
  const exportFilenameInput = document.getElementById('exportFilenameInput');
  const exportModalTitle = document.getElementById('exportModalTitle');
  const exportCancelBtn = document.getElementById('exportCancelBtn');
  const exportConfirmBtn = document.getElementById('exportConfirmBtn');
  const exportModalCloseBtn = document.getElementById('exportModalCloseBtn');
  let pendingExportType = '';

  function openExportModal(type) {
    pendingExportType = type;
    
    // Determine default base filename from root node
    const rootNode = myDiagram.findNodeForKey(1);
    let defaultBaseName = 'mindmap';
    if (rootNode && rootNode.data && rootNode.data.text) {
      defaultBaseName = rootNode.data.text.replace(/[\n\r]/g, ' ')
                                          .replace(/[/\\?%*:|"<>]/g, '')
                                          .substring(0, 30)
                                          .trim();
    }
    if (!defaultBaseName) {
      defaultBaseName = 'mindmap';
    }

    exportFilenameInput.value = defaultBaseName;
    
    if (type === 'json') {
      exportModalTitle.textContent = 'בחר שם לקובץ ההגדרות (JSON):';
    } else {
      exportModalTitle.textContent = 'בחר שם לתמונת הייצוא (PNG):';
    }
    
    exportModal.classList.add('open');
    
    // Focus and select input text for quick editing
    setTimeout(() => {
      exportFilenameInput.focus();
      exportFilenameInput.select();
    }, 50);
  }

  function closeExportModal() {
    exportModal.classList.remove('open');
    pendingExportType = '';
  }

  exportCancelBtn.addEventListener('click', closeExportModal);
  exportModalCloseBtn.addEventListener('click', closeExportModal);
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
      closeExportModal();
    }
  });

  exportFilenameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      exportConfirmBtn.click();
    } else if (e.key === 'Escape') {
      closeExportModal();
    }
  });

  exportConfirmBtn.addEventListener('click', () => {
    let baseName = exportFilenameInput.value.replace(/[\n\r]/g, ' ')
                                            .replace(/[/\\?%*:|"<>]/g, '')
                                            .trim();
    if (!baseName) {
      baseName = 'mindmap';
    }

    if (pendingExportType === 'json') {
      const jsonStr = myDiagram.model.toJson();
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', baseName + '.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('קובץ ההגדרות יוצא בהצלחה', 'success');
      closeExportModal();
    } else if (pendingExportType === 'png') {
      // Draw canvas grid background if export calls for a dark theme background
      const bgVal = currentTheme === 'dark' ? '#0d1220' : '#f1f5f9';
      
      myDiagram.makeImageData({
        scale: 2,
        background: bgVal,
        maxSize: new go.Size(2000, 2000),
        returnType: "blob",
        callback: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', baseName + '.png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('תמונת המפה יוצאה והורדה בהצלחה', 'success');
          closeExportModal();
        }
      });
    }
  });

  // Open Work Plan Modal from Sidebar Button
  const openWorkPlanBtn = document.getElementById('openWorkPlanBtn');
  if (openWorkPlanBtn) {
    openWorkPlanBtn.addEventListener('click', () => {
      const selected = myDiagram.selection.first();
      if (selected instanceof go.Node) {
        openWorkPlanModal(selected);
      } else {
        showToast('אנא בחר בועה במפה תחילה', 'warning');
      }
    });
  }

  // Work Plan Modal Event Listeners
  const workPlanModal = document.getElementById('workPlanModal');
  const workPlanCancelBtn = document.getElementById('workPlanCancelBtn');
  const workPlanConfirmBtn = document.getElementById('workPlanConfirmBtn');
  const workPlanModalCloseBtn = document.getElementById('workPlanModalCloseBtn');
  const workPlanNodeTextInput = document.getElementById('workPlanNodeTextInput');
  const workPlanTextArea = document.getElementById('workPlanTextArea');

  if (workPlanCancelBtn) workPlanCancelBtn.addEventListener('click', closeWorkPlanModal);
  if (workPlanModalCloseBtn) workPlanModalCloseBtn.addEventListener('click', closeWorkPlanModal);
  if (workPlanModal) {
    workPlanModal.addEventListener('click', (e) => {
      if (e.target === workPlanModal) {
        closeWorkPlanModal();
      }
    });
  }

  const modalInputs = [
    workPlanNodeTextInput,
    document.getElementById('workPlanGrandGoal'),
    document.getElementById('workPlanMilestoneGoal'),
    document.getElementById('workPlanMonthlyGoal'),
    document.getElementById('workPlanWeeklyGoal')
  ];

  modalInputs.forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          workPlanConfirmBtn.click();
        } else if (e.key === 'Escape') {
          closeWorkPlanModal();
        }
      });
    }
  });

  const modalTextareas = [
    workPlanTextArea,
    document.getElementById('workPlanInsights')
  ];

  modalTextareas.forEach(textarea => {
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeWorkPlanModal();
        }
      });
    }
  });

  if (workPlanConfirmBtn) {
    workPlanConfirmBtn.addEventListener('click', () => {
      if (!activeWorkPlanNode) return;
      
      const newText = workPlanNodeTextInput.value.trim();
      const newGrandGoal = document.getElementById('workPlanGrandGoal').value.trim();
      const newMilestoneGoal = document.getElementById('workPlanMilestoneGoal').value.trim();
      const newMonthlyGoal = document.getElementById('workPlanMonthlyGoal').value.trim();
      const newWeeklyGoal = document.getElementById('workPlanWeeklyGoal').value.trim();
      const newWorkPlan = workPlanTextArea.value;
      const newInsights = document.getElementById('workPlanInsights').value;

      if (!newText) {
        showToast('שם המטרה לא יכול להיות ריק', 'warning');
        return;
      }

      myDiagram.startTransaction("עריכת תוכנית עבודה");
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "text", newText);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "grandGoal", newGrandGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "milestoneGoal", newMilestoneGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "monthlyGoal", newMonthlyGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "weeklyGoal", newWeeklyGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "monthlyTasks", tempMonthlyTasks);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "weeklyTasks", tempWeeklyTasks);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "workPlan", newWorkPlan);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "insights", newInsights);
      myDiagram.commitTransaction("עריכת תוכנית עבודה");

      // Update sidebar in real-time
      updateSidebarInspector();

      showToast('תוכנית העבודה נשמרה בהצלחה', 'success');
      closeWorkPlanModal();
    });
  }

  // Add task triggers
  const addMonthlyTaskBtn = document.getElementById('addMonthlyTaskBtn');
  const addWeeklyTaskBtn = document.getElementById('addWeeklyTaskBtn');
  const monthlyTaskInput = document.getElementById('monthlyTaskInput');
  const weeklyTaskInput = document.getElementById('weeklyTaskInput');

  if (addMonthlyTaskBtn) {
    addMonthlyTaskBtn.addEventListener('click', () => addWorkPlanTask('monthly'));
  }
  if (addWeeklyTaskBtn) {
    addWeeklyTaskBtn.addEventListener('click', () => addWorkPlanTask('weekly'));
  }
  if (monthlyTaskInput) {
    monthlyTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addWorkPlanTask('monthly');
      }
    });
  }
  if (weeklyTaskInput) {
    weeklyTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addWorkPlanTask('weekly');
      }
    });
  }

  // Bind Switch Tab Event Listeners
  const tabMain = document.getElementById('tabMain');
  const tabImportance = document.getElementById('tabImportance');
  if (tabMain) {
    tabMain.addEventListener('click', () => {
      if (activeTab !== 'main') {
        switchTab('main');
      }
    });
  }
  if (tabImportance) {
    tabImportance.addEventListener('click', () => {
      if (activeTab !== 'importance') {
        switchTab('importance');
      }
    });
  }
}

// Function to delete selected node or link
function deleteSelected() {
  const sel = myDiagram.selection;
  if (sel.count > 0) {
    // Prevent deleting the main root node to protect core structure
    const hasRoot = sel.any(part => part instanceof go.Node && part.data.key === 1);
    if (hasRoot) {
      showToast('לא ניתן למחוק את הבועה המרכזית (שורש)', 'warning');
      return;
    }

    myDiagram.startTransaction("delete elements");
    myDiagram.commandHandler.deleteSelection();
    myDiagram.commitTransaction("delete elements");
    showToast('הרכיב נמחק בהצלחה', 'success');
  } else {
    showToast('אנא בחר רכיב במפה תחילה', 'warning');
  }
}

// Apply layout type to GoJS canvas
function applyLayout(type, factor) {
  const $ = go.GraphObject.make;
  myDiagram.startTransaction("change layout");

  if (type === 'ForceDirected') {
    myDiagram.layout = $(go.ForceDirectedLayout, {
      defaultSpringLength: factor,
      defaultElectricalCharge: factor * 2,
      isOngoing: false
    });
  } else if (type === 'Tree') {
    // Vertically pointing down tree
    myDiagram.layout = $(go.TreeLayout, {
      angle: 90,
      layerSpacing: factor,
      nodeSpacing: 25,
      arrangement: go.TreeLayout.ArrangementHorizontal,
      isOngoing: false
    });
  } else if (type === 'TreeHorizontal') {
    // Left-to-right (Hebrew: usually right-to-left layout makes sense, but Tree angle 180 is leftwards, 0 is rightwards)
    // For Hebrew mindmap, branching leftwards (angle 180) fits RTL! Let's use 180
    myDiagram.layout = $(go.TreeLayout, {
      angle: 180,
      layerSpacing: factor,
      nodeSpacing: 25,
      isOngoing: false
    });
  } else if (type === 'Circular') {
    myDiagram.layout = $(go.CircularLayout, {
      radius: factor * 1.8,
      spacing: 15,
      isOngoing: false
    });
  } else if (type === 'Radial') {
    // Simulating radial layout using a wide force-directed configuration
    myDiagram.layout = $(go.ForceDirectedLayout, {
      defaultSpringLength: factor * 1.2,
      defaultElectricalCharge: factor * 3,
      infinityDistance: 1000,
      isOngoing: false
    });
  }

  myDiagram.commitTransaction("change layout");
}

// Load a selected Preset Map
function loadPreset(key) {
  const preset = presets[key];
  if (!preset) return;

  // Clone structures so presets are not permanently modified in memory
  const nodes = JSON.parse(JSON.stringify(preset.nodes));
  const links = JSON.parse(JSON.stringify(preset.links));

  const newModel = new go.GraphLinksModel(nodes, links);
  newModel.linkFromPortIdProperty = "fromPort";
  newModel.linkToPortIdProperty = "toPort";
  
  // Note: Do NOT wrap myDiagram.model assignment in a transaction.
  myDiagram.model = newModel;

  // Sync the preset selector dropdown
  const selectElem = document.getElementById('presetSelect');
  if (selectElem) {
    let match = false;
    for (let i = 0; i < selectElem.options.length; i++) {
      if (selectElem.options[i].value === key) {
        selectElem.value = key;
        match = true;
        break;
      }
    }
    if (!match) {
      selectElem.value = '';
    }
  }
  
  // Force reset layout switcher options to default ForceDirected
  document.getElementById('layoutSelect').value = 'ForceDirected';
  document.getElementById('layoutForceSpring').value = 70;
  document.getElementById('layoutSpringVal').innerText = 70;
  document.getElementById('layoutAdjusters').style.display = 'block';
  document.getElementById('layoutSliderLabel').innerText = 'אורך הענפים';
  
  applyLayout('ForceDirected', 70);

  // Center camera and zoom to fit
  setTimeout(() => {
    myDiagram.commandHandler.zoomToFit();
    myDiagram.contentAlignment = go.Spot.Center;
  }, 100);

  let presetName = 'מפה חדשה';
  if (selectElem && selectElem.selectedIndex >= 0) {
    presetName = selectElem.options[selectElem.selectedIndex].text;
  }
  showToast(`המפה "${presetName}" נטענה`, 'success');
}

// HTML Custom Context Menu bindings and display triggers
function showContextMenu(obj, diagram, tool) {
  const contextMenu = document.getElementById('contextMenu');
  const point = diagram.lastInput.viewPoint;

  // Position at mouse coords
  contextMenu.style.left = point.x + 'px';
  contextMenu.style.top = (point.y + 70) + 'px'; // add header height offset
  contextMenu.style.display = 'flex';

  // Toggle options based on what is selected
  const ctxAddNode = document.getElementById('ctxAddNode');
  const ctxEditNode = document.getElementById('ctxEditNode');
  const ctxWorkPlan = document.getElementById('ctxWorkPlan');
  const ctxDeleteNode = document.getElementById('ctxDeleteNode');

  if (obj !== null) {
    // Something clicked
    ctxAddNode.style.display = 'flex';
    ctxEditNode.style.display = 'flex';
    ctxDeleteNode.style.display = 'flex';

    if (obj instanceof go.Node) {
      ctxWorkPlan.style.display = 'flex';
      ctxWorkPlan.onclick = () => {
        openWorkPlanModal(obj);
        hideContextMenu();
      };
    } else {
      ctxWorkPlan.style.display = 'none';
    }

    // Click handler adjustments
    ctxAddNode.onclick = () => {
      addNodeAndLink(null, { part: { adornedPart: obj } });
      hideContextMenu();
    };

    ctxEditNode.onclick = () => {
      diagram.commandHandler.editTextBlock();
      hideContextMenu();
    };

    ctxDeleteNode.onclick = () => {
      deleteSelected();
      hideContextMenu();
    };
  } else {
    // Clicked background
    ctxAddNode.style.display = 'none';
    ctxEditNode.style.display = 'none';
    ctxWorkPlan.style.display = 'none';
    ctxDeleteNode.style.display = 'none';
  }
}

function hideContextMenu() {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.style.display = 'none';
}

// Close context menu on page click outside
window.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu-item') && !e.target.closest('#myDiagramDiv')) {
    hideContextMenu();
  }
});

// Toggle Page theme (Dark / Light)
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mindmap_theme', theme);

  const themeBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeToggleIcon');

  if (theme === 'light') {
    // Switch to Sun icon
    themeIcon.innerHTML = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.38.39-1.02 0-1.41z"/>`;
    themeBtn.style.color = '#e2ba16';
  } else {
    // Switch to Moon shape
    themeIcon.innerHTML = `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>`;
    themeBtn.style.color = '';
  }

  // Force diagram redraw to sync panel background colors if cached
  if (myDiagram) {
    // Redraw grid shape stroke colors
    const $ = go.GraphObject.make;
    const gridColor = theme === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)';
    
    myDiagram.grid = $(go.Panel, "Grid",
      $(go.Shape, "LineH", { stroke: gridColor, strokeWidth: 0.5 }),
      $(go.Shape, "LineH", { stroke: gridColor, strokeWidth: 1, interval: 10 }),
      $(go.Shape, "LineV", { stroke: gridColor, strokeWidth: 0.5 }),
      $(go.Shape, "LineV", { stroke: gridColor, strokeWidth: 1, interval: 10 })
    );
    myDiagram.requestUpdate();
  }
}

function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  showToast(currentTheme === 'dark' ? 'עבר למצב כהה' : 'עבר למצב בהיר', 'info');
}

// Schedule autosave with debounce
function scheduleAutoSave() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    if (myDiagram) {
      const modelStr = myDiagram.model.toJson();
      const saveKey = activeTab === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
      localStorage.setItem(saveKey, modelStr);
      localStorage.setItem('mindmap_active_tab', activeTab);
    }
  }, 1000); // 1-second debounce delay
}

// Custom Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.2s reverse forwards';
    setTimeout(() => {
      if (toast.parentNode) container.removeChild(toast);
    }, 200);
  }, 3500);
}

// Bind keyboard shortcuts directly
window.addEventListener('keydown', (e) => {
  // Delete key deletes selection (unless typing in textbox/textarea)
  if (e.key === 'Delete' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    deleteSelected();
  }
});

// Helper: Try to parse uploaded file in multiple formats (JSON, JS snippet, HTML page)
function parseImportedFile(text) {
  text = text.trim();
  
  // 1. Try parsing as standard JSON first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Standard JSON failed, try parsing as JS/HTML snippet
  }

  // 2. Check if we can extract array declarations by keywords
  const nodesString = findAndExtractArray(text, 'nodeDataArray') || findAndExtractArray(text, 'nodes');
  const linksString = findAndExtractArray(text, 'linkDataArray') || findAndExtractArray(text, 'links');

  if (nodesString) {
    try {
      const nodesData = parseRelaxedJson(nodesString);
      const linksData = linksString ? parseRelaxedJson(linksString) : [];
      return {
        nodeDataArray: nodesData,
        linkDataArray: linksData
      };
    } catch (err) {
      console.error("Failed to parse extracted JS arrays", err);
    }
  }

  // 3. Try parsing the entire text as a single relaxed JSON structure
  return parseRelaxedJson(text);
}

// Helper: Find index of matching bracket ']' by counting depth and ignoring string ranges
function extractArray(text, startIndex) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    // Handle string ranges to avoid matching inside text nodes
    if ((char === '"' || char === "'" || char === "`") && text[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    if (!inString) {
      if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }
  return null;
}

// Helper: Locates keyword and extracts brackets range
function findAndExtractArray(text, keyword) {
  const regex = new RegExp(keyword + '\\s*=\\s*\\[', 'i');
  const match = text.match(regex);
  if (match) {
    const startIndex = match.index + match[0].length - 1; // start index of '['
    return extractArray(text, startIndex);
  }
  return null;
}

// Helper: Converts unquoted keys, trailing commas, and single-quoted strings to valid JSON and parses it
function parseRelaxedJson(text) {
  // Remove line and block comments
  let cleaned = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  
  // Remove trailing semicolons and whitespace
  cleaned = cleaned.trim().replace(/;$/, '');

  // Convert single quotes to double quotes
  let jsonLike = cleaned.replace(/'/g, '"');

  // Quote unquoted object keys (e.g. key: 1 -> "key": 1)
  jsonLike = jsonLike.replace(/([\{,]\s*)(\w+)\s*:/g, '$1"$2":');

  // Remove trailing commas in arrays/objects (e.g. [1, 2, ] -> [1, 2])
  jsonLike = jsonLike.replace(/,\s*([\}\]])/g, '$1');

  return JSON.parse(jsonLike);
}

// Open Work Plan Modal for a node
function openWorkPlanModal(node) {
  if (!(node instanceof go.Node)) return;
  activeWorkPlanNode = node;

  const modal = document.getElementById('workPlanModal');
  const titleInput = document.getElementById('workPlanNodeTextInput');
  const grandGoalInput = document.getElementById('workPlanGrandGoal');
  const milestoneGoalInput = document.getElementById('workPlanMilestoneGoal');
  const monthlyGoalInput = document.getElementById('workPlanMonthlyGoal');
  const weeklyGoalInput = document.getElementById('workPlanWeeklyGoal');
  const textArea = document.getElementById('workPlanTextArea');
  const insightsArea = document.getElementById('workPlanInsights');

  titleInput.value = node.data.text || '';
  grandGoalInput.value = node.data.grandGoal || '';
  milestoneGoalInput.value = node.data.milestoneGoal || '';
  monthlyGoalInput.value = node.data.monthlyGoal || '';
  weeklyGoalInput.value = node.data.weeklyGoal || '';
  textArea.value = node.data.workPlan || '';
  insightsArea.value = node.data.insights || '';

  // Copy tasks into temporary in-memory arrays
  tempMonthlyTasks = Array.isArray(node.data.monthlyTasks) ? JSON.parse(JSON.stringify(node.data.monthlyTasks)) : [];
  tempWeeklyTasks = Array.isArray(node.data.weeklyTasks) ? JSON.parse(JSON.stringify(node.data.weeklyTasks)) : [];

  // Render lists dynamically
  renderTaskList('monthly');
  renderTaskList('weekly');

  modal.classList.add('open');

  setTimeout(() => {
    textArea.focus();
  }, 50);
}

// Close Work Plan Modal
function closeWorkPlanModal() {
  const modal = document.getElementById('workPlanModal');
  modal.classList.remove('open');
  activeWorkPlanNode = null;
}

// Switch between parallel mind map tabs
function switchTab(tabId, saveCurrent = true) {
  if (saveCurrent && myDiagram) {
    const currentModelStr = myDiagram.model.toJson();
    const currentSaveKey = activeTab === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
    localStorage.setItem(currentSaveKey, currentModelStr);
  }

  activeTab = tabId;
  localStorage.setItem('mindmap_active_tab', tabId);

  // Update button active classes
  const tabMain = document.getElementById('tabMain');
  const tabImportance = document.getElementById('tabImportance');
  if (tabMain && tabImportance) {
    if (tabId === 'main') {
      tabMain.classList.add('active');
      tabImportance.classList.remove('active');
    } else {
      tabMain.classList.remove('active');
      tabImportance.classList.add('active');
    }
  }

  // Load the model
  if (myDiagram) {
    const saveKey = tabId === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
    let savedModel = localStorage.getItem(saveKey);
    
    // For main tab, fallback to old key 'mindmap_auto_save' for backwards compatibility
    if (tabId === 'main' && !savedModel) {
      savedModel = localStorage.getItem('mindmap_auto_save');
    }

    if (savedModel) {
      try {
        const loadedModel = go.Model.fromJson(savedModel);
        loadedModel.linkFromPortIdProperty = "fromPort";
        loadedModel.linkToPortIdProperty = "toPort";
        myDiagram.model = loadedModel;
        myDiagram.layoutDiagram(true);
        myDiagram.commandHandler.zoomToFit();
      } catch (e) {
        console.error("Failed to load saved model, loading preset", e);
        loadPreset(tabId === 'main' ? 'calmness' : 'importance');
      }
    } else {
      // Load default presets
      loadPreset(tabId === 'main' ? 'calmness' : 'importance');
    }
  }
}

// Render dynamic task lists inside the Work Plan modal
function renderTaskList(type) {
  const container = document.getElementById(type === 'monthly' ? 'monthlyTasksList' : 'weeklyTasksList');
  if (!container) return;
  container.innerHTML = '';
  
  const list = type === 'monthly' ? tempMonthlyTasks : tempWeeklyTasks;
  
  if (list.length === 0) {
    container.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">אין משימות ברשימה</span>`;
    return;
  }
  
  list.forEach((task, index) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.justifyContent = 'space-between';
    item.style.background = 'var(--bg-secondary)';
    item.style.border = '1px solid var(--border-glass)';
    item.style.padding = '4px 8px';
    item.style.borderRadius = 'var(--border-radius-sm)';
    item.style.gap = '8px';
    
    // Checkbox and text wrapper
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = '8px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.style.accentColor = 'var(--accent-color)';
    checkbox.style.cursor = 'pointer';
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      renderTaskList(type);
    });
    
    const span = document.createElement('span');
    span.textContent = task.text;
    span.style.fontSize = '0.8rem';
    if (task.completed) {
      span.style.textDecoration = 'line-through';
      span.style.color = 'var(--text-secondary)';
    } else {
      span.style.color = 'var(--text-primary)';
    }
    
    leftSide.appendChild(checkbox);
    leftSide.appendChild(span);
    
    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.color = 'var(--danger-color)';
    deleteBtn.style.border = 'none';
    deleteBtn.style.fontSize = '1.1rem';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.padding = '0 4px';
    deleteBtn.addEventListener('click', () => {
      list.splice(index, 1);
      renderTaskList(type);
    });
    
    item.appendChild(leftSide);
    item.appendChild(deleteBtn);
    
    container.appendChild(item);
  });
}

// Add task to temporary work plan lists
function addWorkPlanTask(type) {
  const input = document.getElementById(type === 'monthly' ? 'monthlyTaskInput' : 'weeklyTaskInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  const list = type === 'monthly' ? tempMonthlyTasks : tempWeeklyTasks;
  list.push({ text: text, completed: false });
  input.value = '';
  renderTaskList(type);
}
