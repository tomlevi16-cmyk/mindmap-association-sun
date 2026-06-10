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
let isPanMode = false;
let isSpacePressed = false;
let panModeBySpace = false;
let lastActiveMapTab = 'main';
let draggedGoalNodeKey = null;
let expandedGoalKeys = new Set();
let editingTimelineEventId = null;
let timelineLayoutMode = 'vertical';

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

// Migration helper: sets isGoal to true if any goal-related fields exist, else false
function migrateNodeData(nodes) {
  if (!Array.isArray(nodes)) return;
  nodes.forEach(node => {
    if (node.isGoal === undefined) {
      const hasGoalData = !!node.workPlan || !!node.grandGoal || !!node.milestoneGoal || !!node.monthlyGoal || !!node.weeklyGoal ||
                          (Array.isArray(node.weeklyTasks) && node.weeklyTasks.length > 0) ||
                          (Array.isArray(node.monthlyTasks) && node.monthlyTasks.length > 0);
      node.isGoal = hasGoalData;
    }
  });
}

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

  const savedTimelineLayout = localStorage.getItem('timeline_layout_mode');
  if (savedTimelineLayout) {
    timelineLayoutMode = savedTimelineLayout;
  }

  // Setup color grids in sidebar
  generateColorPickers();
  
  // Initialize Diagram
  initDiagram();

  // Setup Event Listeners for HTML UI Elements
  setupUIEventListeners();

  // Load data from DB persistent storage first, then switch to tab
  loadFromDB().finally(() => {
    // Populate myDiagram with loaded main model immediately
    if (myDiagram) {
      const saveKey = 'mindmap_auto_save_main';
      let savedModel = localStorage.getItem(saveKey) || localStorage.getItem('mindmap_auto_save');
      if (savedModel) {
        try {
          const loadedModel = go.Model.fromJson(savedModel);
          loadedModel.linkFromPortIdProperty = "fromPort";
          loadedModel.linkToPortIdProperty = "toPort";
          migrateNodeData(loadedModel.nodeDataArray);
          myDiagram.model = loadedModel;
        } catch (e) {
          console.error("Failed to load model on startup:", e);
        }
      }
    }

    const savedTab = localStorage.getItem('mindmap_active_tab') || 'main';
    switchTab(savedTab, false);

    // Sync with Libero assets dynamically
    syncLiberoLiquidAssets().catch(err => console.error("Libero sync error:", err));
  });
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
    "scrollMode": go.Diagram.InfiniteScroll,
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
        isShadowed: false,
        shadowBlur: 15,
        shadowOffset: new go.Point(0, 0),
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
            if (!node.data.isGoal) {
              myDiagram.startTransaction("set as goal");
              myDiagram.model.setDataProperty(node.data, "isGoal", true);
              myDiagram.commitTransaction("set as goal");
              updateSidebarInspector();
            }
            openWorkPlanModal(node);
          }
        }
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("text", "text"),
      new go.Binding("isShadowed", "isHighlighted"),
      new go.Binding("shadowColor", "stroke"),
      
      // Main Body of the node (draggable from here)
      $(go.Panel, "Auto",
        { name: "BODY" },
        new go.Binding("opacity", "completed", c => c ? 0.6 : 1.0),
        
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
        new go.Binding("stroke", "stroke"),
        new go.Binding("strokeWidth", "isHighlighted", h => h ? 5.0 : 2.5)),
        
        // Node text
        $(go.TextBlock, {
          margin: new go.Margin(12, 14, 12, 14),
          stroke: "#ffffff",
          editable: true,
          isMultiline: true,
          alignment: go.Spot.Center,
          textAlign: "center"
        },
        new go.Binding("stroke", "textColor", (c) => c || "#ffffff"),
        new go.Binding("font", "", (data) => {
          const size = data.fontSize || 14;
          const isBold = data.isBold ? "bold " : "";
          const isItalic = data.isItalic ? "italic " : "";
          return `${isBold}${isItalic}${size}px Rubik, Heebo, sans-serif`;
        }),
        new go.Binding("text").makeTwoWay())

      ),

      // Checkmark badge for completed nodes
      $(go.Panel, "Auto",
        {
          alignment: go.Spot.TopLeft,
          alignmentFocus: go.Spot.Center,
          visible: false
        },
        new go.Binding("visible", "completed"),
        $(go.Shape, "Circle", {
          width: 18, height: 18,
          fill: "#10b981", stroke: "#090d16", strokeWidth: 1.5
        }),
        $(go.TextBlock, "✓", {
          stroke: "#ffffff",
          font: "bold 11px sans-serif",
          alignment: go.Spot.Center
        })
      ),

      // Target badge for goal nodes (bullseye target icon)
      $(go.Panel, "Spot",
        {
          alignment: go.Spot.TopRight,
          alignmentFocus: go.Spot.Center,
          visible: false
        },
        new go.Binding("visible", "isGoal"),
        // Outer ring (dark background, white border)
        $(go.Shape, "Circle", {
          width: 22, height: 22,
          fill: "#090d16", stroke: "#ffffff", strokeWidth: 1.5
        }),
        // Inner target circle ring
        $(go.Shape, "Circle", {
          width: 12, height: 12,
          fill: "transparent", stroke: "#ffffff", strokeWidth: 1,
          alignment: go.Spot.Center
        }),
        // Central bullseye dot (white bullseye center dot)
        $(go.Shape, "Circle", {
          width: 5, height: 5,
          fill: "#ffffff", stroke: null,
          alignment: go.Spot.Center
        })
      ),

      // Hover ports for drawing connections
      $(go.Shape, "Circle", {
        name: "PORT_T",
        alignment: go.Spot.Top,
        width: 8, height: 8,
        fill: "#f5a623", stroke: null,
        portId: "T",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_B",
        alignment: go.Spot.Bottom,
        width: 8, height: 8,
        fill: "#f5a623", stroke: null,
        portId: "B",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_L",
        alignment: go.Spot.Left,
        width: 8, height: 8,
        fill: "#f5a623", stroke: null,
        portId: "L",
        fromLinkable: true, toLinkable: true,
        cursor: "pointer",
        opacity: 0
      }),
      $(go.Shape, "Circle", {
        name: "PORT_R",
        alignment: go.Spot.Right,
        width: 8, height: 8,
        fill: "#f5a623", stroke: null,
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

  // Custom Selection Adornment (Gold selection ring + (+) button to add child)
  myDiagram.nodeTemplate.selectionAdornmentTemplate =
    $(go.Adornment, "Spot",
      $(go.Panel, "Auto",
        $(go.Shape, { fill: null, stroke: "#f5a623", strokeWidth: 2.5 }),
        $(go.Placeholder)
      ),
      $(go.Panel, "Auto",
        { 
          alignment: go.Spot.TopRight, 
          click: addNodeAndLink,
          cursor: "pointer",
          toolTip: $(go.Adornment, "Auto",
            $(go.Shape, { fill: "#18181c", stroke: "#f5a623" }),
            $(go.TextBlock, "הוסף ענף ובן חדש", { margin: 6, stroke: "white", font: "11px Rubik, sans-serif" })
          )
        },
        $(go.Shape, "Circle", { width: 22, height: 22, fill: "#f5a623", stroke: null }),
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
  const textGrid = document.getElementById('textColorGrid');

  fillGrid.innerHTML = '';
  strokeGrid.innerHTML = '';
  linkGrid.innerHTML = '';
  if (textGrid) textGrid.innerHTML = '';

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

  // Text color picker options
  const textColors = [
    { color: '#ffffff', name: 'לבן' },
    { color: '#cbd5e1', name: 'אפור בהיר' },
    { color: '#090d16', name: 'שחור פחם' },
    { color: '#ffb300', name: 'זהב' },
    { color: '#10b981', name: 'ירוק' },
    { color: '#3b82f6', name: 'כחול' },
    { color: '#f43f5e', name: 'אדום' }
  ];

  if (textGrid) {
    textColors.forEach(item => {
      const opt = document.createElement('div');
      opt.className = 'color-option';
      opt.style.backgroundColor = item.color;
      opt.dataset.color = item.color;
      opt.title = item.name;
      if (item.color === '#ffffff') {
        opt.style.border = '1px solid rgba(255, 255, 255, 0.4)';
      }
      opt.addEventListener('click', () => selectNodeTextColor(item.color));
      textGrid.appendChild(opt);
    });
  }
}


// Sync selection to Sidebar Property inspector
function updateSidebarInspector() {
  const selectionText = document.getElementById('selectionText');
  const emptyState = document.getElementById('emptyInspectorState');
  const nodeEditor = document.getElementById('nodeEditorSection');
  const linkEditor = document.getElementById('linkEditorSection');
  
  const sel = myDiagram.selection;
  const selectedNodes = [];
  const selectedLinks = [];

  sel.each(part => {
    if (part instanceof go.Node) {
      selectedNodes.push(part);
    } else if (part instanceof go.Link) {
      selectedLinks.push(part);
    }
  });

  // Clear indeterminate states first to be safe
  ['fontBold', 'fontItalic', 'nodeCompleted', 'nodeHighlighted', 'nodeIsGoal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.indeterminate = false;
  });

  if (selectedNodes.length > 0) {
    emptyState.style.display = 'none';
    linkEditor.style.display = 'none';
    nodeEditor.style.display = 'block';

    if (selectedNodes.length === 1) {
      const part = selectedNodes[0];
      selectionText.innerText = part.data.key === 1 ? 'עריכת בועה ראשית (שורש)' : 'עריכת בועה נבחרת';
      
      // Load current properties to sidebar form
      const data = part.data;
      const textVal = document.getElementById('nodeTextVal');
      textVal.value = data.text || '';
      textVal.disabled = false;
      textVal.placeholder = 'הקלד טקסט...';

      document.getElementById('nodeFontSize').value = data.fontSize || 14;
      document.getElementById('fontSizeVal').innerText = `${data.fontSize || 14}px`;
      document.getElementById('fontBold').checked = !!data.isBold;
      document.getElementById('fontItalic').checked = !!data.isItalic;
      document.getElementById('nodeCompleted').checked = !!data.completed;
      document.getElementById('nodeHighlighted').checked = !!data.isHighlighted;
      document.getElementById('nodeIsGoal').checked = !!data.isGoal;
      
      // Show/hide openWorkPlanBtn based on isGoal
      document.getElementById('openWorkPlanBtn').style.display = data.isGoal ? 'flex' : 'none';
      
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

      // Highlight selected text color
      const textColor = data.textColor || '#ffffff';
      document.querySelectorAll('#textColorGrid .color-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === textColor);
      });


    } else {
      // Multi-node selection
      selectionText.innerText = `עריכת ${selectedNodes.length} בועות נבחרות`;

      const textVal = document.getElementById('nodeTextVal');
      textVal.value = '';
      textVal.disabled = true;
      textVal.placeholder = '(עריכת טקסט זמינה רק בבועית בודדת)';

      // Check for common properties
      const firstData = selectedNodes[0].data;
      let sameFontSize = true;
      let firstFontSize = firstData.fontSize || 14;

      let sameBold = true;
      let firstBold = !!firstData.isBold;

      let sameItalic = true;
      let firstItalic = !!firstData.isItalic;

      let sameCompleted = true;
      let firstCompleted = !!firstData.completed;

      let sameHighlighted = true;
      let firstHighlighted = !!firstData.isHighlighted;

      let sameIsGoal = true;
      let firstIsGoal = !!firstData.isGoal;

      let sameShape = true;
      let firstShape = firstData.shape || 'RoundedRectangle';

      let sameFill = true;
      let firstFill = firstData.fill;

      let sameStroke = true;
      let firstStroke = firstData.stroke;

      let sameTextColor = true;
      let firstTextColor = firstData.textColor || '#ffffff';

      for (let i = 1; i < selectedNodes.length; i++) {
        const d = selectedNodes[i].data;
        if ((d.fontSize || 14) !== firstFontSize) sameFontSize = false;
        if (!!d.isBold !== firstBold) sameBold = false;
        if (!!d.isItalic !== firstItalic) sameItalic = false;
        if (!!d.completed !== firstCompleted) sameCompleted = false;
        if (!!d.isHighlighted !== firstHighlighted) sameHighlighted = false;
        if (!!d.isGoal !== firstIsGoal) sameIsGoal = false;
        if ((d.shape || 'RoundedRectangle') !== firstShape) sameShape = false;
        if (d.fill !== firstFill) sameFill = false;
        if (d.stroke !== firstStroke) sameStroke = false;
        if ((d.textColor || '#ffffff') !== firstTextColor) sameTextColor = false;
      }


      // Font size display
      if (sameFontSize) {
        document.getElementById('nodeFontSize').value = firstFontSize;
        document.getElementById('fontSizeVal').innerText = `${firstFontSize}px`;
      } else {
        document.getElementById('nodeFontSize').value = 14;
        document.getElementById('fontSizeVal').innerText = 'ערכים שונים';
      }

      // Helper to set checkbox state
      const setCheckbox = (id, same, checked) => {
        const el = document.getElementById(id);
        if (same) {
          el.checked = checked;
          el.indeterminate = false;
        } else {
          el.checked = false;
          el.indeterminate = true;
        }
      };

      setCheckbox('fontBold', sameBold, firstBold);
      setCheckbox('fontItalic', sameItalic, firstItalic);
      setCheckbox('nodeCompleted', sameCompleted, firstCompleted);
      setCheckbox('nodeHighlighted', sameHighlighted, firstHighlighted);
      setCheckbox('nodeIsGoal', sameIsGoal, firstIsGoal);

      // Hide openWorkPlanBtn for multi-selection
      document.getElementById('openWorkPlanBtn').style.display = 'none';

      // Shapes
      document.querySelectorAll('.shape-btn').forEach(btn => {
        if (sameShape && btn.dataset.shape === firstShape) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Colors
      document.querySelectorAll('#fillColorGrid .color-option').forEach(opt => {
        if (sameFill && opt.dataset.fill === firstFill) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      document.querySelectorAll('#strokeColorGrid .color-option').forEach(opt => {
        if (sameStroke && opt.dataset.stroke === firstStroke) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      document.querySelectorAll('#textColorGrid .color-option').forEach(opt => {
        if (sameTextColor && opt.dataset.color === firstTextColor) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

    }
  } else if (selectedLinks.length > 0) {
    emptyState.style.display = 'none';
    nodeEditor.style.display = 'none';
    linkEditor.style.display = 'block';

    if (selectedLinks.length === 1) {
      const part = selectedLinks[0];
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
    } else {
      // Multi-link selection
      selectionText.innerText = `עריכת ${selectedLinks.length} קשרים נבחרים`;

      const firstData = selectedLinks[0].data;
      let sameWidth = true;
      let firstWidth = firstData.strokeWidth || 3;

      let sameStyle = true;
      let firstStyle = firstData.style || 'solid';

      let sameStroke = true;
      let firstStroke = firstData.stroke;

      for (let i = 1; i < selectedLinks.length; i++) {
        const d = selectedLinks[i].data;
        if ((d.strokeWidth || 3) !== firstWidth) sameWidth = false;
        if ((d.style || 'solid') !== firstStyle) sameStyle = false;
        if (d.stroke !== firstStroke) sameStroke = false;
      }

      if (sameWidth) {
        document.getElementById('linkWidth').value = firstWidth;
        document.getElementById('linkWidthVal').innerText = `${firstWidth}px`;
      } else {
        document.getElementById('linkWidth').value = 3;
        document.getElementById('linkWidthVal').innerText = 'ערכים שונים';
      }

      if (sameStyle) {
        document.getElementById('linkStyleSelect').value = firstStyle;
      } else {
        document.getElementById('linkStyleSelect').value = 'solid'; // default fallback
      }

      document.querySelectorAll('#linkColorGrid .color-option').forEach(opt => {
        if (sameStroke && opt.dataset.stroke === firstStroke) {
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
  
  myDiagram.startTransaction("change fontSize");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "fontSize", size);
    }
  });
  myDiagram.commitTransaction("change fontSize");
});

// Save Font Bold change
document.getElementById('fontBold').addEventListener('change', (e) => {
  myDiagram.startTransaction("change bold");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "isBold", e.target.checked);
    }
  });
  myDiagram.commitTransaction("change bold");
});

// Save Font Italic change
document.getElementById('fontItalic').addEventListener('change', (e) => {
  myDiagram.startTransaction("change italic");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "isItalic", e.target.checked);
    }
  });
  myDiagram.commitTransaction("change italic");
});

// Save Goal Completed change
document.getElementById('nodeCompleted').addEventListener('change', (e) => {
  myDiagram.startTransaction("change completed status");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "completed", e.target.checked);
    }
  });
  myDiagram.commitTransaction("change completed status");
  showToast(e.target.checked ? 'המשימות סומנו כבוצעו' : 'בוטל סימון המשימות כבוצעו', 'success');
});

// Save Goal Highlight change
document.getElementById('nodeHighlighted').addEventListener('change', (e) => {
  myDiagram.startTransaction("change highlighted status");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "isHighlighted", e.target.checked);
    }
  });
  myDiagram.commitTransaction("change highlighted status");
  showToast(e.target.checked ? 'הבועות סומנו כמודגשות' : 'בוטל סימון הבועות כמודגשות', 'success');
});

// Save Goal IsGoal change
document.getElementById('nodeIsGoal').addEventListener('change', (e) => {
  myDiagram.startTransaction("change isGoal status");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "isGoal", e.target.checked);
    }
  });
  myDiagram.commitTransaction("change isGoal status");
  showToast(e.target.checked ? 'הבועות הוגדרו כמטרות' : 'בוטלה הגדרת הבועות כמטרות', 'success');
  updateSidebarInspector();
});

// Handle Shape Selector button clicks
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const shape = btn.dataset.shape;
    
    // UI feedback
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    myDiagram.startTransaction("change shape");
    myDiagram.selection.each(part => {
      if (part instanceof go.Node) {
        myDiagram.model.setDataProperty(part.data, "shape", shape);
      }
    });
    myDiagram.commitTransaction("change shape");
  });
});

// Apply Color Swatch to selected node (fill & stroke coordinated)
function selectNodeColor(fill, stroke) {
  myDiagram.startTransaction("change color");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "fill", fill);
      myDiagram.model.setDataProperty(part.data, "stroke", stroke);
      
      // Also change child links color to match if desired (helps structure visibility)
      part.findLinksOutOf().each((link) => {
        myDiagram.model.setDataProperty(link.data, "stroke", stroke);
      });
    }
  });
  myDiagram.commitTransaction("change color");
  updateSidebarInspector();
}

// Change stroke only
function selectNodeStroke(stroke) {
  myDiagram.startTransaction("change stroke");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "stroke", stroke);
    }
  });
  myDiagram.commitTransaction("change stroke");
  updateSidebarInspector();
}

// Apply Text Color Swatch to selected node(s)
function selectNodeTextColor(color) {
  myDiagram.startTransaction("change text color");
  myDiagram.selection.each(part => {
    if (part instanceof go.Node) {
      myDiagram.model.setDataProperty(part.data, "textColor", color);
    }
  });
  myDiagram.commitTransaction("change text color");
  updateSidebarInspector();
}


// Change Link width
document.getElementById('linkWidth').addEventListener('input', (e) => {
  const width = parseFloat(e.target.value);
  document.getElementById('linkWidthVal').innerText = `${width}px`;

  myDiagram.startTransaction("change link width");
  myDiagram.selection.each(part => {
    if (part instanceof go.Link) {
      myDiagram.model.setDataProperty(part.data, "strokeWidth", width);
    }
  });
  myDiagram.commitTransaction("change link width");
});

// Change Link style dropdown
document.getElementById('linkStyleSelect').addEventListener('change', (e) => {
  const style = e.target.value;
  myDiagram.startTransaction("change link style");
  myDiagram.selection.each(part => {
    if (part instanceof go.Link) {
      myDiagram.model.setDataProperty(part.data, "style", style);
    }
  });
  myDiagram.commitTransaction("change link style");
});

// Change Link color from palette
function selectLinkColor(stroke) {
  myDiagram.startTransaction("change link color");
  myDiagram.selection.each(part => {
    if (part instanceof go.Link) {
      myDiagram.model.setDataProperty(part.data, "stroke", stroke);
    }
  });
  myDiagram.commitTransaction("change link color");
  updateSidebarInspector();
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
  const presetSelect = document.getElementById('presetSelect');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      loadPreset(e.target.value);
    });
  }

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

        migrateNodeData(newModel.nodeDataArray);
        myDiagram.model = newModel;

        // Reset the layout type select value to default ForceDirected since the layout is reset
        document.getElementById('layoutSelect').value = 'ForceDirected';
        
        // Force the layout to run once to arrange nodes (e.g. if they had no coordinates)
        myDiagram.layoutDiagram(true);
        myDiagram.commandHandler.zoomToFit();

        // Clear preset selector
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) presetSelect.value = '';
        showToast('המפה נטענה בהצלחה', 'success');

        // Save imported model to LocalStorage and DB
        const modelStr = newModel.toJson();
        const saveKey = 'mindmap_auto_save_main';
        localStorage.setItem(saveKey, modelStr);
        saveToDB('main', modelStr);
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

  document.getElementById('panModeBtn').addEventListener('click', () => {
    setPanMode(!isPanMode);
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
      const bgVal = currentTheme === 'dark' ? '#070709' : '#f1f5f9';
      
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
    document.getElementById('workPlanCurrentStatus'),
    document.getElementById('workPlanWebsiteLink'),
    document.getElementById('workPlanTargetValue'),
    document.getElementById('workPlanCurrentValue'),
    document.getElementById('workPlanUnit'),
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
      const newCurrentStatus = document.getElementById('workPlanCurrentStatus').value.trim();
      
      const newIsQuantitative = document.getElementById('workPlanIsQuantitative').checked;
      const newTargetValue = parseFloat(document.getElementById('workPlanTargetValue').value) || 0;
      const newCurrentValue = parseFloat(document.getElementById('workPlanCurrentValue').value) || 0;
      const newUnit = document.getElementById('workPlanUnit').value.trim();
      
      const newMonthlyGoal = document.getElementById('workPlanMonthlyGoal').value.trim();
      const newMonthlyGoalDate = document.getElementById('workPlanMonthlyDate').value;
      const newWeeklyGoal = document.getElementById('workPlanWeeklyGoal').value.trim();
      const newWeeklyGoalDate = document.getElementById('workPlanWeeklyDate').value;
      const newWorkPlan = workPlanTextArea.value;
      const newInsights = document.getElementById('workPlanInsights').value;
      const completed = document.getElementById('workPlanNodeCompleted').checked;
      const isHighlighted = document.getElementById('workPlanNodeHighlighted').checked;

      let newWebsiteLink = '';
      const websiteLinkEl = document.getElementById('workPlanWebsiteLink');
      if (websiteLinkEl) {
        newWebsiteLink = websiteLinkEl.value.trim();
        if (newWebsiteLink && !/^https?:\/\//i.test(newWebsiteLink)) {
          newWebsiteLink = 'https://' + newWebsiteLink;
        }
      }

      if (!newText) {
        showToast('שם המטרה לא יכול להיות ריק', 'warning');
        return;
      }

      myDiagram.startTransaction("עריכת תוכנית עבודה");
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "text", newText);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "grandGoal", newGrandGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "milestoneGoal", newMilestoneGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "currentStatus", newCurrentStatus);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "websiteLink", newWebsiteLink);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "isQuantitative", newIsQuantitative);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "targetValue", newTargetValue);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "currentValue", newCurrentValue);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "unit", newUnit);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "monthlyGoal", newMonthlyGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "monthlyGoalDate", newMonthlyGoalDate);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "weeklyGoal", newWeeklyGoal);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "weeklyGoalDate", newWeeklyGoalDate);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "monthlyTasks", tempMonthlyTasks);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "weeklyTasks", tempWeeklyTasks);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "workPlan", newWorkPlan);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "insights", newInsights);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "completed", completed);
      myDiagram.model.setDataProperty(activeWorkPlanNode.data, "isHighlighted", isHighlighted);
      myDiagram.commitTransaction("עריכת תוכנית עבודה");

      // Update sidebar in real-time
      updateSidebarInspector();

      // Refresh dashboards if active
      if (activeTab === 'goals') {
        renderGoalsDashboard();
      } else if (activeTab === 'tasks') {
        renderTasksDashboard();
      }

      showToast('תוכנית העבודה נשמרה בהצלחה', 'success');
      closeWorkPlanModal();
    });
  }

  // Go to Goal Details Page from Work Plan Modal
  const workPlanGoToPageBtn = document.getElementById('workPlanGoToPageBtn');
  if (workPlanGoToPageBtn) {
    workPlanGoToPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!activeWorkPlanNode) return;

      const nodeKey = activeWorkPlanNode.data.key;

      // Ensure the node is designated as a goal node
      if (!activeWorkPlanNode.data.isGoal) {
        myDiagram.startTransaction("הגדרת מטרה");
        myDiagram.model.setDataProperty(activeWorkPlanNode.data, "isGoal", true);
        myDiagram.commitTransaction("הגדרת מטרה");
      }

      // Save current modal inputs
      if (workPlanConfirmBtn) {
        workPlanConfirmBtn.click();
      }

      // If saving succeeded (modal was closed)
      if (workPlanModal && !workPlanModal.classList.contains('open')) {
        // Switch tab to 'goals' and open the single goal page
        switchTab('goals');
        openGoalPage(nodeKey);
      }
    });
  }

  // Setup Quantitative fields display listener
  const quantCheckListener = document.getElementById('workPlanIsQuantitative');
  if (quantCheckListener) {
    quantCheckListener.addEventListener('change', (e) => {
      const qFields = document.getElementById('quantitativeFields');
      if (qFields) qFields.style.display = e.target.checked ? 'grid' : 'none';
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
  const tabGoals = document.getElementById('tabGoals');
  const tabTasks = document.getElementById('tabTasks');
  if (tabMain) {
    tabMain.addEventListener('click', () => {
      if (activeTab !== 'main') {
        switchTab('main');
      }
    });
  }
  if (tabGoals) {
    tabGoals.addEventListener('click', () => {
      if (activeTab !== 'goals') {
        switchTab('goals');
      } else {
        closeGoalPage();
      }
    });
  }
  if (tabTasks) {
    tabTasks.addEventListener('click', () => {
      if (activeTab !== 'tasks') {
        switchTab('tasks');
      }
    });
  }

  // Dashboard filters and search input
  const mapFilter = document.getElementById('dashboardMapFilter');
  if (mapFilter) {
    mapFilter.addEventListener('change', renderTasksDashboard);
  }
  const statusFilter = document.getElementById('dashboardStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', renderTasksDashboard);
  }
  const searchInput = document.getElementById('dashboardSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderTasksDashboard);
  }
  const icsBtn = document.getElementById('dashboardIcsBtn');
  if (icsBtn) {
    icsBtn.addEventListener('click', exportTasksToIcs);
  }
  const copyBtn = document.getElementById('dashboardCopyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyTasksToClipboard);
  }

  // Single Goal Details Page & Timeline listeners
  const backBtn = document.getElementById('backToDashboardBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closeGoalPage);
  }

  const addEvtBtn = document.getElementById('addTimelineEventBtn');
  if (addEvtBtn) {
    addEvtBtn.addEventListener('click', () => {
      const form = document.getElementById('addTimelineEventForm');
      if (form) {
        if (form.style.display === 'none') {
          editingTimelineEventId = null;
          const titleIn = document.getElementById('timelineEventTitle');
          const dateIn = document.getElementById('timelineEventDate');
          const descIn = document.getElementById('timelineEventDesc');
          if (titleIn) titleIn.value = '';
          if (dateIn) dateIn.value = '';
          if (descIn) descIn.value = '';
          
          const formHeader = form.querySelector('h4');
          if (formHeader) formHeader.textContent = 'תת-מטרה חדשה';

          form.style.display = 'flex';
          if (titleIn) titleIn.focus();
        } else {
          cancelTimelineEventForm();
        }
      }
    });
  }

  const cancelEvtBtn = document.getElementById('cancelTimelineEventBtn');
  if (cancelEvtBtn) {
    cancelEvtBtn.addEventListener('click', cancelTimelineEventForm);
  }

  const saveEvtBtn = document.getElementById('saveTimelineEventBtn');
  if (saveEvtBtn) {
    saveEvtBtn.addEventListener('click', saveTimelineEvent);
  }

  const layoutVertBtn = document.getElementById('timelineLayoutVerticalBtn');
  const layoutHorizBtn = document.getElementById('timelineLayoutHorizontalBtn');
  if (layoutVertBtn && layoutHorizBtn) {
    layoutVertBtn.addEventListener('click', () => {
      setTimelineLayout('vertical');
    });
    layoutHorizBtn.addEventListener('click', () => {
      setTimelineLayout('horizontal');
    });
  }

  // Goal Page Free Text Plan autosave listener
  const freeTextPlan = document.getElementById('goalPageFreeTextPlan');
  if (freeTextPlan) {
    let saveTimeout = null;
    freeTextPlan.addEventListener('input', (e) => {
      const nodeKey = window.currentGoalPageNodeKey;
      if (!nodeKey) return;

      const nodeData = myDiagram.model.findNodeDataForKey(nodeKey);
      if (nodeData) {
        myDiagram.startTransaction("עדכון תוכנית חופשית");
        myDiagram.model.setDataProperty(nodeData, "workPlan", e.target.value);
        myDiagram.commitTransaction("עדכון תוכנית חופשית");
        scheduleAutoSave();

        // Show "Autosaved" text
        const statusSpan = document.getElementById('freeTextSaveStatus');
        if (statusSpan) {
          statusSpan.style.opacity = '1';
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            statusSpan.style.opacity = '0';
          }, 1500);
        }
      }
    });
  }

  // Keyboard navigation inside timeline event form
  const titleInput = document.getElementById('timelineEventTitle');
  if (titleInput) {
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTimelineEvent();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelTimelineEventForm();
      }
    });
  }
  const dateInput = document.getElementById('timelineEventDate');
  if (dateInput) {
    dateInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTimelineEvent();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelTimelineEventForm();
      }
    });
  }
  const descInput = document.getElementById('timelineEventDesc');
  if (descInput) {
    descInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTimelineEventForm();
      }
    });
  }
}

// Toggle Canvas Panning (Hand) Mode
function setPanMode(enabled, bySpace = false) {
  isPanMode = enabled;
  panModeBySpace = enabled ? bySpace : false;

  const btn = document.getElementById('panModeBtn');
  if (btn) {
    if (enabled && !bySpace) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }

  if (myDiagram) {
    myDiagram.startTransaction("toggle pan mode");
    myDiagram.allowMove = !enabled;
    myDiagram.allowSelect = !enabled;
    // Set cursor feedback
    myDiagram.defaultCursor = enabled ? 'grab' : 'default';
    myDiagram.commitTransaction("toggle pan mode");
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

  migrateNodeData(nodes);

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
  const ctxToggleCompleted = document.getElementById('ctxToggleCompleted');
  const ctxToggleHighlight = document.getElementById('ctxToggleHighlight');
  const ctxToggleGoal = document.getElementById('ctxToggleGoal');
  const ctxDeleteNode = document.getElementById('ctxDeleteNode');

  if (obj !== null) {
    // Something clicked
    ctxAddNode.style.display = 'flex';
    ctxEditNode.style.display = 'flex';
    ctxDeleteNode.style.display = 'flex';

    if (obj instanceof go.Node) {
      const isGoal = !!obj.data.isGoal;
      
      // Only show Work Plan option if the node is defined as a goal
      ctxWorkPlan.style.display = isGoal ? 'flex' : 'none';
      ctxWorkPlan.onclick = () => {
        openWorkPlanModal(obj);
        hideContextMenu();
      };

      ctxToggleCompleted.style.display = 'flex';
      const isCompleted = !!obj.data.completed;
      document.getElementById('ctxToggleCompletedText').innerText = isCompleted ? 'בטל סימון כבוצע' : 'סמן כבוצע';
      ctxToggleCompleted.onclick = () => {
        diagram.startTransaction("toggle completed from context menu");
        diagram.model.setDataProperty(obj.data, "completed", !isCompleted);
        diagram.commitTransaction("toggle completed from context menu");
        updateSidebarInspector();
        hideContextMenu();
        showToast(!isCompleted ? 'המשימה/יעד סומנו כבוצעו' : 'בוטל סימון המשימה/יעד כבוצעו', 'success');
      };

      ctxToggleHighlight.style.display = 'flex';
      const isHighlighted = !!obj.data.isHighlighted;
      document.getElementById('ctxToggleHighlightText').innerText = isHighlighted ? 'בטל הדגשה' : 'הדגש בועה';
      ctxToggleHighlight.onclick = () => {
        diagram.startTransaction("toggle highlight from context menu");
        diagram.model.setDataProperty(obj.data, "isHighlighted", !isHighlighted);
        diagram.commitTransaction("toggle highlight from context menu");
        updateSidebarInspector();
        hideContextMenu();
        showToast(!isHighlighted ? 'הבועה סומנה כמודגשת' : 'בוטל סימון הבועה כמודגשת', 'success');
      };

      ctxToggleGoal.style.display = 'flex';
      document.getElementById('ctxToggleGoalText').innerText = isGoal ? 'בטל הגדרה כמטרה' : 'הגדר כמטרה';
      ctxToggleGoal.onclick = () => {
        diagram.startTransaction("toggle isGoal from context menu");
        diagram.model.setDataProperty(obj.data, "isGoal", !isGoal);
        diagram.commitTransaction("toggle isGoal from context menu");
        updateSidebarInspector();
        hideContextMenu();
        showToast(!isGoal ? 'הבועה הוגדרה כמטרה' : 'בוטלה הגדרת הבועה כמטרה', 'success');
      };
    } else {
      ctxWorkPlan.style.display = 'none';
      ctxToggleCompleted.style.display = 'none';
      ctxToggleHighlight.style.display = 'none';
      ctxToggleGoal.style.display = 'none';
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
    ctxToggleCompleted.style.display = 'none';
    ctxToggleHighlight.style.display = 'none';
    ctxToggleGoal.style.display = 'none';
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
      const saveKey = 'mindmap_auto_save_main';
      localStorage.setItem(saveKey, modelStr);
      localStorage.setItem('mindmap_active_tab', activeTab);
      saveToDB('main', modelStr);
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

  // Spacebar panning (when not typing)
  if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.hasAttribute('contenteditable')) {
    // Prevent scrolling page with space
    e.preventDefault();
    if (!isSpacePressed) {
      isSpacePressed = true;
      if (!isPanMode) {
        setPanMode(true, true);
      }
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    isSpacePressed = false;
    if (isPanMode && panModeBySpace) {
      setPanMode(false);
    }
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
  const currentStatusInput = document.getElementById('workPlanCurrentStatus');
  const monthlyGoalInput = document.getElementById('workPlanMonthlyGoal');
  const weeklyGoalInput = document.getElementById('workPlanWeeklyGoal');
  const textArea = document.getElementById('workPlanTextArea');
  const insightsArea = document.getElementById('workPlanInsights');

  titleInput.value = node.data.text || '';
  grandGoalInput.value = node.data.grandGoal || '';
  milestoneGoalInput.value = node.data.milestoneGoal || '';
  if (currentStatusInput) currentStatusInput.value = node.data.currentStatus || '';
  const websiteLinkInput = document.getElementById('workPlanWebsiteLink');
  if (websiteLinkInput) websiteLinkInput.value = node.data.websiteLink || '';
  
  const isQuant = !!node.data.isQuantitative;
  const quantCheck = document.getElementById('workPlanIsQuantitative');
  if (quantCheck) {
    quantCheck.checked = isQuant;
  }
  const qFields = document.getElementById('quantitativeFields');
  if (qFields) {
    qFields.style.display = isQuant ? 'grid' : 'none';
  }
  document.getElementById('workPlanTargetValue').value = node.data.targetValue !== undefined ? node.data.targetValue : '';
  document.getElementById('workPlanCurrentValue').value = node.data.currentValue !== undefined ? node.data.currentValue : '';
  document.getElementById('workPlanUnit').value = node.data.unit || '';
  
  monthlyGoalInput.value = node.data.monthlyGoal || '';
  document.getElementById('workPlanMonthlyDate').value = node.data.monthlyGoalDate || '';
  weeklyGoalInput.value = node.data.weeklyGoal || '';
  document.getElementById('workPlanWeeklyDate').value = node.data.weeklyGoalDate || '';
  textArea.value = node.data.workPlan || '';
  insightsArea.value = node.data.insights || '';
  document.getElementById('workPlanNodeCompleted').checked = !!node.data.completed;
  document.getElementById('workPlanNodeHighlighted').checked = !!node.data.isHighlighted;

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

// Switch between parallel mind map tabs and dashboards
function switchTab(tabId, saveCurrent = true) {
  if (saveCurrent && myDiagram && activeTab === 'main') {
    const currentModelStr = myDiagram.model.toJson();
    const currentSaveKey = 'mindmap_auto_save_main';
    localStorage.setItem(currentSaveKey, currentModelStr);
    saveToDB('main', currentModelStr);
  }

  activeTab = tabId;
  localStorage.setItem('mindmap_active_tab', tabId);
  if (tabId === 'main') {
    lastActiveMapTab = 'main';
  }

  // Update button active classes
  const tabMain = document.getElementById('tabMain');
  const tabGoals = document.getElementById('tabGoals');
  const tabTasks = document.getElementById('tabTasks');
  if (tabMain && tabGoals && tabTasks) {
    tabMain.classList.remove('active');
    tabGoals.classList.remove('active');
    tabTasks.classList.remove('active');
    if (tabId === 'main') {
      tabMain.classList.add('active');
    } else if (tabId === 'goals') {
      tabGoals.classList.add('active');
    } else if (tabId === 'tasks') {
      tabTasks.classList.add('active');
    }
  }

  if (tabId === 'tasks' || tabId === 'goals') {
    // Hide diagram area elements
    if (myDiagram) {
      document.getElementById('myDiagramDiv').style.display = 'none';
    }
    const hud = document.getElementById('hudToolbar');
    if (hud) hud.style.display = 'none';
    const sidebar = document.getElementById('inspectorSidebar');
    if (sidebar) sidebar.style.display = 'none';
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.gridTemplateColumns = '1fr';

    if (tabId === 'tasks') {
      if (document.getElementById('tasksDashboardDiv')) document.getElementById('tasksDashboardDiv').style.display = 'flex';
      if (document.getElementById('goalsDashboardDiv')) document.getElementById('goalsDashboardDiv').style.display = 'none';
      renderTasksDashboard();
    } else {
      if (document.getElementById('tasksDashboardDiv')) document.getElementById('tasksDashboardDiv').style.display = 'none';
      if (document.getElementById('goalsDashboardDiv')) document.getElementById('goalsDashboardDiv').style.display = 'flex';
      
      // Reset single goal page view to default when entering Goals tab
      const singlePage = document.getElementById('singleGoalPageDiv');
      if (singlePage) singlePage.style.display = 'none';
      const mainHeader = document.querySelector('#goalsDashboardDiv > .dashboard-header');
      if (mainHeader) mainHeader.style.display = 'flex';
      const gridContainer = document.getElementById('goalsGridContainer');
      if (gridContainer) gridContainer.style.display = 'grid';
      window.currentGoalPageNodeKey = null;

      renderGoalsDashboard();
      // Sync Libero assets dynamically when switching to Goals tab
      syncLiberoLiquidAssets().catch(err => console.error("Libero sync error:", err));
    }
  } else {
    // Hide single goal page view just in case
    const singlePage = document.getElementById('singleGoalPageDiv');
    if (singlePage) singlePage.style.display = 'none';
    window.currentGoalPageNodeKey = null;

    // Show diagram area elements (main tab)
    document.getElementById('myDiagramDiv').style.display = 'block';
    const hud = document.getElementById('hudToolbar');
    if (hud) hud.style.display = '';
    const sidebar = document.getElementById('inspectorSidebar');
    if (sidebar) sidebar.style.display = '';
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.style.gridTemplateColumns = '';
    
    if (document.getElementById('tasksDashboardDiv')) document.getElementById('tasksDashboardDiv').style.display = 'none';
    if (document.getElementById('goalsDashboardDiv')) document.getElementById('goalsDashboardDiv').style.display = 'none';

    // Load the model
    if (myDiagram) {
      const saveKey = 'mindmap_auto_save_main';
      let savedModel = localStorage.getItem(saveKey) || localStorage.getItem('mindmap_auto_save');

      if (savedModel) {
        try {
          const loadedModel = go.Model.fromJson(savedModel);
          loadedModel.linkFromPortIdProperty = "fromPort";
          loadedModel.linkToPortIdProperty = "toPort";
          migrateNodeData(loadedModel.nodeDataArray);
          myDiagram.model = loadedModel;
          myDiagram.layoutDiagram(true);
          myDiagram.commandHandler.zoomToFit();
        } catch (e) {
          console.error("Failed to load saved model, loading preset", e);
          loadPreset('calmness');
        }
      } else {
        loadPreset('calmness');
      }
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

// ----------------------------------------------------
// Centralized Tasks Dashboard Implementations
// ----------------------------------------------------

// Retrieve all weekly and monthly tasks from the active mind map
function getAllTasks() {
  const tasks = [];
  
  // Get main model data
  let mainNodeData = [];
  if (activeTab === 'main' && myDiagram) {
    mainNodeData = myDiagram.model.nodeDataArray;
  } else {
    let saved = localStorage.getItem('mindmap_auto_save_main') || localStorage.getItem('mindmap_auto_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        mainNodeData = parsed.nodeDataArray || [];
      } catch (e) {}
    } else {
      mainNodeData = presets.calmness.nodes;
    }
  }

  // Helper to extract tasks from a node data list
  const extract = (dataArray, source) => {
    dataArray.forEach(node => {
      if (node.isGoal !== true) return;
      const nodeKey = node.key;
      const nodeText = node.text || "בועה ללא שם";
      const nodeCompleted = !!node.completed;
      const nodeMonthlyGoalDate = node.monthlyGoalDate || "";
      const nodeWeeklyGoalDate = node.weeklyGoalDate || "";
      
      if (Array.isArray(node.monthlyTasks)) {
        node.monthlyTasks.forEach((t, index) => {
          tasks.push({
            id: `${source}|monthly|${nodeKey}|${index}`,
            type: 'monthly',
            source: source,
            nodeKey: nodeKey,
            nodeText: nodeText,
            nodeCompleted: nodeCompleted,
            nodeMonthlyGoalDate: nodeMonthlyGoalDate,
            taskIndex: index,
            text: t.text,
            completed: !!t.completed
          });
        });
      }
      
      if (Array.isArray(node.weeklyTasks)) {
        node.weeklyTasks.forEach((t, index) => {
          tasks.push({
            id: `${source}|weekly|${nodeKey}|${index}`,
            type: 'weekly',
            source: source,
            nodeKey: nodeKey,
            nodeText: nodeText,
            nodeCompleted: nodeCompleted,
            nodeWeeklyGoalDate: nodeWeeklyGoalDate,
            taskIndex: index,
            text: t.text,
            completed: !!t.completed
          });
        });
      }
    });
  };

  extract(mainNodeData, 'main');
  
  return tasks;
}

// Toggle a task's completion status from the dashboard view
function toggleDashboardTask(taskId, completed) {
  const parts = taskId.split('|');
  const source = parts[0];
  const type = parts[1];
  const nodeKey = parseInt(parts[2], 10);
  const taskIndex = parseInt(parts[3], 10);
  
  if (myDiagram && lastActiveMapTab === source) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node) {
      const taskList = type === 'monthly' ? node.monthlyTasks : node.weeklyTasks;
      if (taskList && taskList[taskIndex]) {
        myDiagram.startTransaction("toggle task from dashboard");
        const newList = JSON.parse(JSON.stringify(taskList));
        newList[taskIndex].completed = completed;
        myDiagram.model.setDataProperty(node, type === 'monthly' ? "monthlyTasks" : "weeklyTasks", newList);
        myDiagram.commitTransaction("toggle task from dashboard");
        
        // Update LocalStorage immediately
        const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
        localStorage.setItem(saveKey, myDiagram.model.toJson());
      }
    }
  } else {
    const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
    let saved = localStorage.getItem(saveKey);
    if (source === 'main' && !saved) {
      saved = localStorage.getItem('mindmap_auto_save');
    }
    
    if (!saved) {
      const presetData = source === 'main' ? presets.calmness : presets.importance;
      const model = new go.GraphLinksModel(presetData.nodes, presetData.links);
      saved = model.toJson();
    }
    
    if (saved) {
      try {
        const modelObj = JSON.parse(saved);
        const node = modelObj.nodeDataArray.find(n => n.key === nodeKey);
        if (node) {
          const taskList = type === 'monthly' ? node.monthlyTasks : node.weeklyTasks;
          if (taskList && taskList[taskIndex]) {
            taskList[taskIndex].completed = completed;
            localStorage.setItem(saveKey, JSON.stringify(modelObj));
          }
        }
      } catch (e) {
        console.error("Error toggling offline task", e);
      }
    }
  }
  
  renderTasksDashboard();
  renderGoalsDashboard();
}

// Delete a task directly from the dashboard view
function deleteDashboardTask(taskId) {
  if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;

  const parts = taskId.split('|');
  const source = parts[0];
  const type = parts[1];
  const nodeKey = parseInt(parts[2], 10);
  const taskIndex = parseInt(parts[3], 10);
  
  if (myDiagram && lastActiveMapTab === source) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node) {
      const taskList = type === 'monthly' ? node.monthlyTasks : node.weeklyTasks;
      if (taskList && taskList[taskIndex]) {
        myDiagram.startTransaction("delete task from dashboard");
        const newList = JSON.parse(JSON.stringify(taskList));
        newList.splice(taskIndex, 1);
        myDiagram.model.setDataProperty(node, type === 'monthly' ? "monthlyTasks" : "weeklyTasks", newList);
        myDiagram.commitTransaction("delete task from dashboard");
        
        const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
        localStorage.setItem(saveKey, myDiagram.model.toJson());
      }
    }
  } else {
    const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
    let saved = localStorage.getItem(saveKey);
    if (source === 'main' && !saved) {
      saved = localStorage.getItem('mindmap_auto_save');
    }
    
    if (!saved) {
      const presetData = source === 'main' ? presets.calmness : presets.importance;
      const model = new go.GraphLinksModel(presetData.nodes, presetData.links);
      saved = model.toJson();
    }
    
    if (saved) {
      try {
        const modelObj = JSON.parse(saved);
        const node = modelObj.nodeDataArray.find(n => n.key === nodeKey);
        if (node) {
          const taskList = type === 'monthly' ? node.monthlyTasks : node.weeklyTasks;
          if (taskList && taskList[taskIndex]) {
            taskList.splice(taskIndex, 1);
            localStorage.setItem(saveKey, JSON.stringify(modelObj));
          }
        }
      } catch (e) {
        console.error("Error deleting offline task", e);
      }
    }
  }
  
  renderTasksDashboard();
  renderGoalsDashboard();
  showToast('המשימה נמחקה בהצלחה', 'success');
}

// Toggle a Goal Node's completion status directly from the dashboard view
function toggleNodeCompletion(source, nodeKey, completed) {
  if (myDiagram && lastActiveMapTab === source) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node) {
      myDiagram.startTransaction("toggle node completion from dashboard");
      myDiagram.model.setDataProperty(node, "completed", completed);
      myDiagram.commitTransaction("toggle node completion from dashboard");
      
      const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
      localStorage.setItem(saveKey, myDiagram.model.toJson());
    }
  } else {
    const saveKey = source === 'main' ? 'mindmap_auto_save_main' : 'mindmap_auto_save_importance';
    let saved = localStorage.getItem(saveKey);
    if (source === 'main' && !saved) {
      saved = localStorage.getItem('mindmap_auto_save');
    }
    
    if (!saved) {
      const presetData = source === 'main' ? presets.calmness : presets.importance;
      const model = new go.GraphLinksModel(presetData.nodes, presetData.links);
      saved = model.toJson();
    }
    
    if (saved) {
      try {
        const modelObj = JSON.parse(saved);
        const node = modelObj.nodeDataArray.find(n => n.key === nodeKey);
        if (node) {
          node.completed = completed;
          localStorage.setItem(saveKey, JSON.stringify(modelObj));
        }
      } catch (e) {
        console.error("Error toggling offline node completion", e);
      }
    }
  }
  
  renderTasksDashboard();
  renderGoalsDashboard();
  showToast(completed ? 'בועת היעד סומנה כבוצעה' : 'בוטל סימון בועת היעד כבוצעה', 'success');
}

// Navigate to the target node's tab, select, and center it on canvas
function jumpToNode(source, nodeKey) {
  // Switch to the correct tab first
  switchTab(source, true);
  
  // Wait for model swap to render, then select & center node
  setTimeout(() => {
    if (myDiagram) {
      const node = myDiagram.findNodeForKey(nodeKey);
      if (node) {
        myDiagram.select(node);
        myDiagram.centerRect(node.actualBounds);
      }
    }
  }, 150);
}

// Render the aggregated tasks on the dashboard with filters & stats
function renderTasksDashboard() {
  const allTasks = getAllTasks();
  
  const mapFilter = document.getElementById('dashboardMapFilter').value;
  const statusFilter = document.getElementById('dashboardStatusFilter').value;
  const searchQuery = document.getElementById('dashboardSearchInput').value.trim().toLowerCase();
  
  // Filter list
  const filteredTasks = allTasks.filter(task => {
    if (mapFilter !== 'all' && task.source !== mapFilter) return false;
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery) && !task.nodeText.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  const monthlyTasks = filteredTasks.filter(t => t.type === 'monthly');
  const weeklyTasks = filteredTasks.filter(t => t.type === 'weekly');
  
  // Calculate statistics matching the map filter
  const mapFilteredAllTasks = allTasks.filter(t => mapFilter === 'all' || t.source === mapFilter);
  
  const allMonthly = mapFilteredAllTasks.filter(t => t.type === 'monthly');
  const completedMonthly = allMonthly.filter(t => t.completed);
  const allWeekly = mapFilteredAllTasks.filter(t => t.type === 'weekly');
  const completedWeekly = allWeekly.filter(t => t.completed);

  // Update Statistics UI
  const monthlyStatsNum = document.getElementById('monthlyStatsNum');
  if (monthlyStatsNum) monthlyStatsNum.textContent = `${completedMonthly.length}/${allMonthly.length}`;
  const monthlyBar = document.getElementById('monthlyStatsBar');
  if (monthlyBar) {
    const monthlyPct = allMonthly.length > 0 ? (completedMonthly.length / allMonthly.length) * 100 : 0;
    monthlyBar.style.width = `${monthlyPct}%`;
  }

  const weeklyStatsNum = document.getElementById('weeklyStatsNum');
  if (weeklyStatsNum) weeklyStatsNum.textContent = `${completedWeekly.length}/${allWeekly.length}`;
  const weeklyBar = document.getElementById('weeklyStatsBar');
  if (weeklyBar) {
    const weeklyPct = allWeekly.length > 0 ? (completedWeekly.length / allWeekly.length) * 100 : 0;
    weeklyBar.style.width = `${weeklyPct}%`;
  }

  // Render columns
  renderDashboardList('dashboardMonthlyList', monthlyTasks);
  renderDashboardList('dashboardWeeklyList', weeklyTasks);
}

function renderDashboardList(containerId, tasks) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="no-tasks-placeholder">
        <span>אין משימות להצגה</span>
      </div>
    `;
    return;
  }
  
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'dashboard-task-item';
    
    // Left: checkbox and task text
    const left = document.createElement('div');
    left.className = 'task-item-left';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      toggleDashboardTask(task.id, checkbox.checked);
    });
    
    const span = document.createElement('span');
    span.className = `task-text ${task.completed ? 'completed' : ''}`;
    span.textContent = task.text;
    
    left.appendChild(checkbox);
    left.appendChild(span);
    
    // Right: node badge, source tab label, delete button
    const right = document.createElement('div');
    right.className = 'task-item-right';
    
    // Origin Node Badge Wrapper (checkbox + badge)
    const nodeBadgeWrapper = document.createElement('div');
    nodeBadgeWrapper.className = 'node-link-badge';
    nodeBadgeWrapper.style.display = 'flex';
    nodeBadgeWrapper.style.alignItems = 'center';
    nodeBadgeWrapper.style.gap = '6px';
    nodeBadgeWrapper.style.padding = '3px 8px';
    
    // Goal node completed checkbox
    const nodeCheckbox = document.createElement('input');
    nodeCheckbox.type = 'checkbox';
    nodeCheckbox.checked = task.nodeCompleted;
    nodeCheckbox.title = task.nodeCompleted ? 'בועת היעד סומנה כבוצעה. לחץ לביטול' : 'לחץ כדי לסמן את בועת היעד כבוצעה';
    nodeCheckbox.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent triggering jumpToNode
    });
    nodeCheckbox.addEventListener('change', () => {
      toggleNodeCompletion(task.source, task.nodeKey, nodeCheckbox.checked);
    });
    
    // Origin Node Badge text
    const nodeBadge = document.createElement('span');
    nodeBadge.style.maxWidth = '100px';
    nodeBadge.style.overflow = 'hidden';
    nodeBadge.style.textOverflow = 'ellipsis';
    nodeBadge.style.whiteSpace = 'nowrap';
    nodeBadge.title = `לחץ כדי לעבור לבועה: ${task.nodeText}`;
    nodeBadge.textContent = task.nodeText;
    if (task.nodeCompleted) {
      nodeBadge.style.textDecoration = 'line-through';
      nodeBadge.style.opacity = '0.7';
    }
    nodeBadge.addEventListener('click', () => {
      jumpToNode(task.source, task.nodeKey);
    });
    
    nodeBadgeWrapper.appendChild(nodeCheckbox);
    nodeBadgeWrapper.appendChild(nodeBadge);
    
    // Goal target date badge
    let dateBadge = null;
    const targetDate = task.type === 'monthly' ? task.nodeMonthlyGoalDate : task.nodeWeeklyGoalDate;
    if (targetDate) {
      const parts = targetDate.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        dateBadge = document.createElement('span');
        dateBadge.className = 'date-badge';
        dateBadge.innerHTML = `📅 יעד: ${formattedDate}`;
      }
    }
    
    const sourceBadge = document.createElement('span');
    const sourceLabel = task.source === 'main' ? 'ראשי' : 'חשיבות';
    sourceBadge.className = `source-badge ${task.source}`;
    sourceBadge.textContent = sourceLabel;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'מחק משימה';
    deleteBtn.addEventListener('click', () => {
      deleteDashboardTask(task.id);
    });
    
    if (dateBadge) {
      right.appendChild(dateBadge);
    }
    right.appendChild(nodeBadgeWrapper);
    right.appendChild(sourceBadge);
    right.appendChild(deleteBtn);
    
    item.appendChild(left);
    item.appendChild(right);
    
    container.appendChild(item);
  });
}

// Parse key safely helper
function parseGoalNodeKey(val) {
  if (val === null || val === undefined) return val;
  const num = Number(val);
  return isNaN(num) ? val : num;
}

// Reorder goal nodes order index and persist
function reorderGoalNodes(fromKeyStr, toKeyStr) {
  if (!myDiagram) return;

  const fromKey = parseGoalNodeKey(fromKeyStr);
  const toKey = parseGoalNodeKey(toKeyStr);

  const mainNodeData = myDiagram.model.nodeDataArray;
  const goalNodes = mainNodeData.filter(node => node.isGoal === true);

  // Sort according to current order to find exact index positions
  goalNodes.sort((a, b) => {
    const orderA = a.dashboardOrder !== undefined ? a.dashboardOrder : 99999;
    const orderB = b.dashboardOrder !== undefined ? b.dashboardOrder : 99999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.key || 0) - (b.key || 0);
  });

  const fromIndex = goalNodes.findIndex(n => n.key === fromKey);
  const toIndex = goalNodes.findIndex(n => n.key === toKey);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

  // Move element
  const [draggedNode] = goalNodes.splice(fromIndex, 1);
  goalNodes.splice(toIndex, 0, draggedNode);

  // Apply new indices via GoJS model transaction
  myDiagram.startTransaction("reorder goals");
  goalNodes.forEach((node, idx) => {
    myDiagram.model.setDataProperty(node, "dashboardOrder", idx);
  });
  myDiagram.commitTransaction("reorder goals");

  // Force auto-save to local storage and DB
  const currentModelStr = myDiagram.model.toJson();
  localStorage.setItem('mindmap_auto_save_main', currentModelStr);
  saveToDB('main', currentModelStr);

  // Re-render
  renderGoalsDashboard();
}

// Render the aggregated goals dashboard with progress and stats
function renderGoalsDashboard() {
  // Get main model data
  let mainNodeData = [];
  if (myDiagram && myDiagram.model) {
    mainNodeData = myDiagram.model.nodeDataArray;
  } else {
    let saved = localStorage.getItem('mindmap_auto_save_main') || localStorage.getItem('mindmap_auto_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        mainNodeData = parsed.nodeDataArray || [];
      } catch (e) {}
    } else {
      mainNodeData = presets.calmness.nodes;
    }
  }

  // Filter goal nodes
  const goalNodes = mainNodeData.filter(node => node.isGoal === true);

  // Sort goal nodes by dashboardOrder
  goalNodes.sort((a, b) => {
    const orderA = a.dashboardOrder !== undefined ? a.dashboardOrder : 99999;
    const orderB = b.dashboardOrder !== undefined ? b.dashboardOrder : 99999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.key || 0) - (b.key || 0);
  });

  // Statistics calculation
  const totalGoals = goalNodes.length;
  const completedGoals = goalNodes.filter(node => !!node.completed).length;
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  goalNodes.forEach(node => {
    if (Array.isArray(node.monthlyTasks)) {
      totalTasks += node.monthlyTasks.length;
      completedTasks += node.monthlyTasks.filter(t => !!t.completed).length;
    }
    if (Array.isArray(node.weeklyTasks)) {
      totalTasks += node.weeklyTasks.length;
      completedTasks += node.weeklyTasks.filter(t => !!t.completed).length;
    }
    if (Array.isArray(node.timelineEvents)) {
      totalTasks += node.timelineEvents.length;
      completedTasks += node.timelineEvents.filter(e => !!e.completed).length;
    }
  });

  // Update Stats UI
  const goalsTotalNum = document.getElementById('goalsTotalNum');
  if (goalsTotalNum) goalsTotalNum.textContent = totalGoals;

  const goalsCompletedNum = document.getElementById('goalsCompletedNum');
  if (goalsCompletedNum) goalsCompletedNum.textContent = `${completedGoals}/${totalGoals}`;

  const goalsCompletedBar = document.getElementById('goalsCompletedBar');
  if (goalsCompletedBar) {
    const goalsCompletedPct = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    goalsCompletedBar.style.width = `${goalsCompletedPct}%`;
  }

  const goalsTasksProgressNum = document.getElementById('goalsTasksProgressNum');
  if (goalsTasksProgressNum) {
    const tasksPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    goalsTasksProgressNum.textContent = `${tasksPct}% (${completedTasks}/${totalTasks})`;
  }

  const goalsTasksProgressBar = document.getElementById('goalsTasksProgressBar');
  if (goalsTasksProgressBar) {
    const tasksPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    goalsTasksProgressBar.style.width = `${tasksPct}%`;
  }

  // Render Grid Cards
  const container = document.getElementById('goalsGridContainer');
  if (!container) return;
  container.innerHTML = '';

  if (goalNodes.length === 0) {
    container.innerHTML = `
      <div class="no-goals-message glass-panel">
        <h3>🎯 אין מטרות פעילות להצגה</h3>
        <p>כדי להגדיר מטרה במערכת, לחץ לחיצה כפולה על בועה כלשהי במפת המוח כדי לפתוח את תוכנית העבודה שלה, או סמן את "הגדר כבועת יעד / מטרה" בלוח המידע הצדדי.</p>
      </div>
    `;
    return;
  }

  goalNodes.forEach(node => {
    const card = document.createElement('div');
    card.className = 'goal-card glass-panel';
    card.style.borderRight = `5px solid var(--accent-color)`;

    // Make card draggable/droppable
    card.setAttribute('data-key', node.key);
    card.draggable = false;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      draggedGoalNodeKey = node.key;
      card.classList.add('dragging');
      const gridContainer = document.getElementById('goalsGridContainer');
      if (gridContainer) gridContainer.classList.add('dragging-active');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(node.key));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      card.draggable = false;
      const gridContainer = document.getElementById('goalsGridContainer');
      if (gridContainer) gridContainer.classList.remove('dragging-active');
      
      const allCards = document.querySelectorAll('.goal-card');
      allCards.forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    card.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (draggedGoalNodeKey !== null && draggedGoalNodeKey !== node.key) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetKey = node.key;
      if (draggedGoalNodeKey !== null && draggedGoalNodeKey !== targetKey) {
        reorderGoalNodes(draggedGoalNodeKey, targetKey);
      }
    });

    // Double click event to open dedicated goal page
    card.addEventListener('dblclick', (e) => {
      if (e.target.closest('input, button, a, svg, path')) {
        return;
      }
      openGoalPage(node.key);
    });

    // Header section
    const header = document.createElement('div');
    header.className = 'goal-card-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'goal-card-header-left';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'goal-card-drag-handle';
    dragHandle.innerHTML = '⠿';
    dragHandle.title = 'גרור לשינוי סדר המטרות';
    
    dragHandle.addEventListener('mousedown', () => {
      card.draggable = true;
    });
    dragHandle.addEventListener('mouseup', () => {
      card.draggable = false;
    });

    const goalCompletedCheck = document.createElement('input');
    goalCompletedCheck.type = 'checkbox';
    goalCompletedCheck.className = 'goal-card-completed-check';
    goalCompletedCheck.checked = !!node.completed;
    goalCompletedCheck.title = 'סמן מטרה זו כהושלמה/בוצעה';
    goalCompletedCheck.addEventListener('change', () => {
      toggleNodeCompletion('main', node.key, goalCompletedCheck.checked);
    });

    const title = document.createElement('h3');
    title.className = `goal-card-title ${node.completed ? 'completed' : ''}`;
    title.textContent = node.text || "בועה ללא שם";
    title.title = node.text || "בועה ללא שם";

    const titlePageBtn = document.createElement('button');
    titlePageBtn.className = 'goal-title-page-btn';
    titlePageBtn.innerHTML = '📄';
    titlePageBtn.title = 'פתח עמוד מטרה';
    titlePageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openGoalPage(node.key);
    });

    headerLeft.appendChild(dragHandle);
    headerLeft.appendChild(goalCompletedCheck);
    headerLeft.appendChild(title);
    headerLeft.appendChild(titlePageBtn);

    // Calculate tasks progress percentage
    let nodeTotalTasks = 0;
    let nodeCompletedTasks = 0;
    if (Array.isArray(node.monthlyTasks)) {
      nodeTotalTasks += node.monthlyTasks.length;
      nodeCompletedTasks += node.monthlyTasks.filter(t => !!t.completed).length;
    }
    if (Array.isArray(node.weeklyTasks)) {
      nodeTotalTasks += node.weeklyTasks.length;
      nodeCompletedTasks += node.weeklyTasks.filter(t => !!t.completed).length;
    }
    if (Array.isArray(node.timelineEvents)) {
      nodeTotalTasks += node.timelineEvents.length;
      nodeCompletedTasks += node.timelineEvents.filter(e => !!e.completed).length;
    }
    const progPct = nodeTotalTasks > 0 ? Math.round((nodeCompletedTasks / nodeTotalTasks) * 100) : 0;

    // Badge status in percentage
    const badge = document.createElement('span');
    badge.className = `goal-card-badge ${node.completed ? 'completed' : ''}`;
    
    if (node.isQuantitative) {
      const targetVal = parseFloat(node.targetValue) || 0;
      const currentVal = parseFloat(node.currentValue) || 0;
      const quantPct = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 0;
      badge.textContent = `${quantPct}% מושלם`;
      if (quantPct === 100) {
        badge.classList.add('completed');
      }
    } else if (nodeTotalTasks > 0) {
      badge.textContent = `${progPct}% מושלם`;
      if (progPct === 100) {
        badge.classList.add('completed');
      }
    } else {
      badge.textContent = node.completed ? '✓ הושלמה' : 'פעילה';
    }

    // Toggle details button
    const isInitiallyExpanded = expandedGoalKeys.has(node.key);
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'goal-card-toggle-btn';
    toggleBtn.innerHTML = '▼';
    if (isInitiallyExpanded) {
      toggleBtn.classList.add('expanded');
      toggleBtn.title = 'הסתר פרטים';
      card.classList.add('expanded');
    } else {
      toggleBtn.title = 'הצג פרטים';
    }

    const headerRight = document.createElement('div');
    headerRight.className = 'goal-card-header-right';
    headerRight.appendChild(badge);

    // If website link is set, render a shortcut button directly in the header
    if (node.websiteLink) {
      let linkUrl = node.websiteLink.trim();
      if (linkUrl) {
        if (!/^https?:\/\//i.test(linkUrl)) {
          linkUrl = 'https://' + linkUrl;
        }
        
        const headerLink = document.createElement('a');
        headerLink.href = linkUrl;
        headerLink.target = '_blank';
        headerLink.className = 'goal-header-link';
        headerLink.title = 'פתח קישור לאתר: ' + linkUrl;
        headerLink.innerHTML = `<svg style="width:12px; height:12px; fill:var(--accent-color); display:inline-block; transition: fill 0.2s;" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
        headerLink.style.display = 'inline-flex';
        headerLink.style.alignItems = 'center';
        headerLink.style.justifyContent = 'center';
        headerLink.style.width = '24px';
        headerLink.style.height = '24px';
        headerLink.style.borderRadius = '50%';
        headerLink.style.background = 'rgba(255, 171, 0, 0.1)';
        headerLink.style.border = '1px solid rgba(255, 171, 0, 0.2)';
        headerLink.style.transition = 'all 0.2s';
        
        headerLink.addEventListener('mouseenter', () => {
          headerLink.style.background = 'var(--accent-color)';
          headerLink.querySelector('svg').style.fill = '#090d16';
        });
        headerLink.addEventListener('mouseleave', () => {
          headerLink.style.background = 'rgba(255, 171, 0, 0.1)';
          headerLink.querySelector('svg').style.fill = 'var(--accent-color)';
        });
        headerLink.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
        headerRight.appendChild(headerLink);
      }
    }

    headerRight.appendChild(toggleBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    card.appendChild(header);

    // Calculate overall completion percentage for the main progress bar
    let overallPct = 0;
    if (node.isQuantitative) {
      const targetVal = parseFloat(node.targetValue) || 0;
      const currentVal = parseFloat(node.currentValue) || 0;
      overallPct = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 0;
    } else if (nodeTotalTasks > 0) {
      overallPct = progPct;
    } else {
      overallPct = node.completed ? 100 : 0;
    }

    // Create overall progress bar visible at all times (collapsed and expanded)
    const mainProgress = document.createElement('div');
    mainProgress.className = 'goal-card-main-progress';
    mainProgress.title = `התקדמות כוללת: ${overallPct}%`;
    
    const mainProgressBar = document.createElement('div');
    mainProgressBar.className = 'goal-card-main-progress-bar';
    mainProgressBar.style.width = `${overallPct}%`;
    if (overallPct === 100) {
      mainProgressBar.classList.add('completed');
    }
    
    mainProgress.appendChild(mainProgressBar);
    card.appendChild(mainProgress);

    // Create the collapsible details container
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'goal-card-details';
    if (isInitiallyExpanded) {
      detailsContainer.classList.add('expanded');
    }

    // Click to toggle expand/collapse
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = detailsContainer.classList.toggle('expanded');
      card.classList.toggle('expanded', isExpanded);
      toggleBtn.classList.toggle('expanded', isExpanded);
      toggleBtn.title = isExpanded ? 'הסתר פרטים' : 'הצג פרטים';
      
      if (isExpanded) {
        expandedGoalKeys.add(node.key);
      } else {
        expandedGoalKeys.delete(node.key);
      }
    });


    // Body section (Structured Goals)
    const body = document.createElement('div');
    body.className = 'goal-card-body';

    const addGoalDetail = (icon, label, value, date) => {
      const item = document.createElement('div');
      item.className = 'goal-detail-item';
      
      const lbl = document.createElement('div');
      lbl.className = 'goal-detail-label';
      lbl.innerHTML = `${icon} <strong>${label}:</strong>`;
      
      const val = document.createElement('div');
      val.className = 'goal-detail-val';
      let text = value || 'לא הוגדר';
      if (date) {
        const dateParts = date.split('-');
        if (dateParts.length === 3) {
          text += ` <span style="font-size: 0.75rem; color: var(--accent-color); font-weight: bold;">[יעד: ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}]</span>`;
        }
      }
      val.innerHTML = text;
      
      item.appendChild(lbl);
      item.appendChild(val);
      body.appendChild(item);
    };

    addGoalDetail('🏆', 'מטרת על', node.grandGoal);
    addGoalDetail('📍', 'מטרת ביניים', node.milestoneGoal);
    
    // Clean up currentStatus display in quantitative vs general status
    if (node.isQuantitative) {
      const targetVal = parseFloat(node.targetValue) || 0;
      const currentVal = parseFloat(node.currentValue) || 0;
      const formattedTarget = targetVal.toLocaleString();
      const formattedCurrent = currentVal.toLocaleString();
      const unitStr = node.unit || '';
      addGoalDetail('📌', 'סטטוס כמותי', `${formattedCurrent} מתוך ${formattedTarget} ${unitStr}`);
    } else {
      addGoalDetail('📌', 'סטטוס נוכחי', node.currentStatus);
    }
    
    addGoalDetail('📅', 'יעד חודשי', node.monthlyGoal, node.monthlyGoalDate);
    addGoalDetail('⚡', 'יעד שבועי', node.weeklyGoal, node.weeklyGoalDate);

    if (node.websiteLink) {
      let linkUrl = node.websiteLink.trim();
      if (linkUrl) {
        if (!/^https?:\/\//i.test(linkUrl)) {
          linkUrl = 'https://' + linkUrl;
        }
        addGoalDetail('🔗', 'קישור לאתר', `<a href="${linkUrl}" target="_blank" class="goal-card-link-btn"><svg style="width:14px; height:14px; fill:currentColor; vertical-align:middle; margin-left:4px;" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>פתח קישור</a>`);
      }
    }

    detailsContainer.appendChild(body);

    // Render Quantitative Goal Progress Bar (if active)
    if (node.isQuantitative) {
      const targetVal = parseFloat(node.targetValue) || 0;
      const currentVal = parseFloat(node.currentValue) || 0;
      const quantPct = targetVal > 0 ? Math.min(Math.round((currentVal / targetVal) * 100), 100) : 0;
      const unitStr = node.unit || '';

      const quantDiv = document.createElement('div');
      quantDiv.className = 'goal-card-progress quantitative-progress';
      quantDiv.style.marginTop = '10px';
      quantDiv.style.marginBottom = '10px';
      quantDiv.style.padding = '12px';
      quantDiv.style.borderRadius = 'var(--border-radius-sm)';
      quantDiv.style.background = 'rgba(255, 179, 0, 0.04)';
      quantDiv.style.border = '1px dashed rgba(255, 179, 0, 0.2)';

      const qHeader = document.createElement('div');
      qHeader.className = 'goal-progress-header';
      const formattedTarget = targetVal.toLocaleString();
      const formattedCurrent = currentVal.toLocaleString();
      qHeader.innerHTML = `
        <span style="color: var(--accent-color); font-weight: bold;">📊 התקדמות יעד כמותי:</span>
        <strong>${formattedCurrent} / ${formattedTarget} ${unitStr} (${quantPct}%)</strong>
      `;

      const qBg = document.createElement('div');
      qBg.className = 'stat-progress-bg';
      
      const qBar = document.createElement('div');
      qBar.className = 'stat-progress-bar';
      qBar.style.width = `${quantPct}%`;
      qBar.style.background = 'linear-gradient(90deg, var(--accent-color) 0%, #10b981 100%)';

      qBg.appendChild(qBar);
      quantDiv.appendChild(qHeader);
      quantDiv.appendChild(qBg);
      detailsContainer.appendChild(quantDiv);
    }

    const progressDiv = document.createElement('div');
    progressDiv.className = 'goal-card-progress';

    const progHeader = document.createElement('div');
    progHeader.className = 'goal-progress-header';
    
    progHeader.innerHTML = `
      <span>משימות יעד:</span>
      <strong>${nodeCompletedTasks}/${nodeTotalTasks} (${progPct}%)</strong>
    `;

    const progBg = document.createElement('div');
    progBg.className = 'stat-progress-bg';
    
    const progBar = document.createElement('div');
    progBar.className = 'stat-progress-bar';
    progBar.style.width = `${progPct}%`;
    if (node.completed || (nodeTotalTasks > 0 && nodeCompletedTasks === nodeTotalTasks)) {
      progBar.style.background = '#10b981';
    }

    progBg.appendChild(progBar);
    progressDiv.appendChild(progHeader);
    progressDiv.appendChild(progBg);
    detailsContainer.appendChild(progressDiv);

    // Tasks checklist section inside the card
    const tasksSection = document.createElement('div');
    tasksSection.className = 'goal-card-tasks-checklist';
    
    // Monthly Tasks Header & List
    if (Array.isArray(node.monthlyTasks) && node.monthlyTasks.length > 0) {
      const monthlyHeader = document.createElement('h4');
      monthlyHeader.className = 'goal-tasks-subheader';
      monthlyHeader.innerHTML = '📅 משימות חודשיות';
      tasksSection.appendChild(monthlyHeader);
      
      node.monthlyTasks.forEach((task, index) => {
        const item = document.createElement('label');
        item.className = `goal-task-check-item ${task.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!task.completed;
        
        const taskId = `main|monthly|${node.key}|${index}`;
        checkbox.addEventListener('change', () => {
          toggleDashboardTask(taskId, checkbox.checked);
        });
        
        const span = document.createElement('span');
        span.textContent = task.text;
        
        item.appendChild(checkbox);
        item.appendChild(span);
        tasksSection.appendChild(item);
      });
    }

    // Weekly Tasks Header & List
    if (Array.isArray(node.weeklyTasks) && node.weeklyTasks.length > 0) {
      const weeklyHeader = document.createElement('h4');
      weeklyHeader.className = 'goal-tasks-subheader';
      weeklyHeader.innerHTML = '⚡ משימות שבועיות';
      tasksSection.appendChild(weeklyHeader);
      
      node.weeklyTasks.forEach((task, index) => {
        const item = document.createElement('label');
        item.className = `goal-task-check-item ${task.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!task.completed;
        
        const taskId = `main|weekly|${node.key}|${index}`;
        checkbox.addEventListener('change', () => {
          toggleDashboardTask(taskId, checkbox.checked);
        });
        
        const span = document.createElement('span');
        span.textContent = task.text;
        
        item.appendChild(checkbox);
        item.appendChild(span);
        tasksSection.appendChild(item);
      });
    }

    if (tasksSection.children.length > 0) {
      detailsContainer.appendChild(tasksSection);
    }

    // Footer containing Jump to Node, Edit, and Page buttons
    const footer = document.createElement('div');
    footer.className = 'goal-card-footer';

    const pageBtn = document.createElement('button');
    pageBtn.className = 'btn btn-sm btn-page';
    pageBtn.innerHTML = '📄 עמוד מטרה';
    pageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openGoalPage(node.key);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-edit';
    editBtn.innerHTML = '✏️ ערוך מטרה';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (myDiagram) {
        const actualNode = myDiagram.findNodeForKey(node.key);
        if (actualNode) {
          openWorkPlanModal(actualNode);
        }
      }
    });

    const navBtn = document.createElement('button');
    navBtn.className = 'btn btn-sm btn-nav';
    navBtn.innerHTML = '🔍 נווט לבועה במפה';
    navBtn.addEventListener('click', () => {
      jumpToNode('main', node.key);
    });

    footer.appendChild(pageBtn);
    footer.appendChild(editBtn);
    footer.appendChild(navBtn);
    detailsContainer.appendChild(footer);

    card.appendChild(detailsContainer);


    container.appendChild(card);
  });
}

// Copy selected/filtered tasks to clipboard formatted for iPhone Reminders
function copyTasksToClipboard() {
  const allTasks = getAllTasks();
  
  const mapFilter = document.getElementById('dashboardMapFilter').value;
  const statusFilter = document.getElementById('dashboardStatusFilter').value;
  const searchQuery = document.getElementById('dashboardSearchInput').value.trim().toLowerCase();
  
  const filteredTasks = allTasks.filter(task => {
    if (mapFilter !== 'all' && task.source !== mapFilter) return false;
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery) && !task.nodeText.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  if (filteredTasks.length === 0) {
    showToast('אין משימות להעתקה בהתאם לסינון הנוכחי', 'warning');
    return;
  }

  let text = '';
  const monthly = filteredTasks.filter(t => t.type === 'monthly');
  const weekly = filteredTasks.filter(t => t.type === 'weekly');
  
  if (monthly.length > 0) {
    text += `📅 משימות חודשיות:\n`;
    monthly.forEach(t => {
      const status = t.completed ? '✓' : ' ';
      const source = t.source === 'main' ? 'ראשי' : 'חשיבות';
      let dateStr = '';
      if (t.nodeMonthlyGoalDate) {
        const parts = t.nodeMonthlyGoalDate.split('-');
        if (parts.length === 3) {
          dateStr = ` [יעד: ${parts[2]}/${parts[1]}/${parts[0]}]`;
        }
      }
      text += `- [${status}] ${t.text} (מטרה: ${t.nodeText}) [שמש: ${source}]${dateStr}\n`;
    });
    text += `\n`;
  }
  
  if (weekly.length > 0) {
    text += `⚡ משימות שבועיות:\n`;
    weekly.forEach(t => {
      const status = t.completed ? '✓' : ' ';
      const source = t.source === 'main' ? 'ראשי' : 'חשיבות';
      let dateStr = '';
      if (t.nodeWeeklyGoalDate) {
        const parts = t.nodeWeeklyGoalDate.split('-');
        if (parts.length === 3) {
          dateStr = ` [יעד: ${parts[2]}/${parts[1]}/${parts[0]}]`;
        }
      }
      text += `- [${status}] ${t.text} (מטרה: ${t.nodeText}) [שמש: ${source}]${dateStr}\n`;
    });
  }

  navigator.clipboard.writeText(text.trim()).then(() => {
    showToast('הרשימה הועתקה ללוח! הדבק אותה ישירות באפליקציית התזכורות באייפון', 'success');
  }).catch(err => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text.trim();
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('הרשימה הועתקה ללוח! הדבק אותה ישירות באפליקציית התזכורות באייפון', 'success');
    } catch (e) {
      showToast('שגיאה בהעתקת הרשימה', 'danger');
    }
    document.body.removeChild(textarea);
  });
}

// Export tasks as a .ics (iCalendar) file with VTODOs for iOS Reminders import
function exportTasksToIcs() {
  const allTasks = getAllTasks();
  
  const mapFilter = document.getElementById('dashboardMapFilter').value;
  const statusFilter = document.getElementById('dashboardStatusFilter').value;
  const searchQuery = document.getElementById('dashboardSearchInput').value.trim().toLowerCase();
  
  const filteredTasks = allTasks.filter(task => {
    if (mapFilter !== 'all' && task.source !== mapFilter) return false;
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery) && !task.nodeText.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  if (filteredTasks.length === 0) {
    showToast('אין משימות לייצוא בהתאם לסינון הנוכחי', 'warning');
    return;
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Antigravity//Mindmap Tasks//EN',
    'CALSCALE:GREGORIAN'
  ];

  filteredTasks.forEach((t) => {
    icsContent.push('BEGIN:VTODO');
    icsContent.push(`UID:${t.source}-${t.type}-${t.nodeKey}-${t.taskIndex}@mindmap`);
    
    // Status
    if (t.completed) {
      icsContent.push('STATUS:COMPLETED');
    } else {
      icsContent.push('STATUS:NEEDS-ACTION');
    }
    
    // Summary & Description
    icsContent.push(`SUMMARY:${t.text}`);
    const sourceLabel = t.source === 'main' ? 'ראשי' : 'למה זה חשוב';
    icsContent.push(`DESCRIPTION:מטרה: ${t.nodeText} | שמש: ${sourceLabel}`);
    
    // Due Date (if target date is set)
    const targetDate = t.type === 'monthly' ? t.nodeMonthlyGoalDate : t.nodeWeeklyGoalDate;
    if (targetDate) {
      const cleanDate = targetDate.replace(/-/g, '');
      if (cleanDate.length === 8) {
        icsContent.push(`DUE;VALUE=DATE:${cleanDate}`);
      }
    }
    
    icsContent.push('END:VTODO');
  });

  icsContent.push('END:VCALENDAR');
  
  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Try to use Web Share API first on iOS so the user can directly send/share it to Reminders
  if (navigator.share && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    try {
      const file = new File([blob], "tasks.ics", { type: "text/calendar" });
      navigator.share({
        files: [file],
        title: 'משימות מ-Horizon',
        text: 'ייצוא משימות לתזכורות באייפון'
      }).then(() => {
        showToast('הקובץ שותף בהצלחה', 'success');
      }).catch(err => {
        triggerDownload(url, "tasks.ics");
      });
      return;
    } catch (e) {
      triggerDownload(url, "tasks.ics");
    }
  } else {
    triggerDownload(url, "tasks.ics");
  }
}

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('קובץ תזכורות (.ics) הורד בהצלחה', 'success');
}

// Save active tab mindmap model string to database
function saveToDB(tabId, modelStr) {
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId: tabId, model: modelStr })
  })
  .then(res => {
    if (!res.ok) throw new Error();
    console.log("Saved to database successfully");
  })
  .catch(err => {
    console.error("Failed to save to DB:", err);
  });
}

// Load mindmap data from database on startup
function loadFromDB() {
  return fetch('/api/load')
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(dbData => {
      if (dbData.main) {
        localStorage.setItem('mindmap_auto_save_main', dbData.main);
      }
      console.log("Loaded data from DB successfully");
    })
    .catch(err => {
      console.log("Failed to load from DB, using LocalStorage");
    });
}

// Sync liquid assets value from Libero Firebase project
async function syncLiberoLiquidAssets() {
  try {
    const API_KEY = 'AIzaSyC-r8CfozRW9d5Vdvr4S6Uhic3m-oR4eLM';
    const PROJECT_ID = 'libero-6e823';
    const UID = 'J9e1YnJtdxQgyMvK1e2TC5qpBsK2';

    // 1. Sign in anonymously
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    const authData = await authRes.json();
    const idToken = authData.idToken;
    if (!idToken) {
      throw new Error('Failed to get anonymous authentication token from Firebase Auth');
    }

    // 2. Fetch financial document from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${UID}/data/financial`;
    const dataRes = await fetch(firestoreUrl, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!dataRes.ok) {
      const errText = await dataRes.text();
      throw new Error(`Firestore query failed: ${dataRes.status} ${errText}`);
    }

    const doc = await dataRes.json();
    
    // Parse assets list and compute liquid sum (isLocked === false)
    const assetsRaw = doc.fields?.assets?.arrayValue?.values || [];
    let liquidSum = 0;
    
    assetsRaw.forEach((item) => {
      const fields = item.mapValue?.fields;
      if (!fields) return;
      
      const valStr = fields.value ? (fields.value.integerValue || fields.value.doubleValue || '0') : '0';
      const value = parseFloat(valStr);
      const isLocked = fields.isLocked ? fields.isLocked.booleanValue : false;
      
      if (!isLocked) {
        liquidSum += value;
      }
    });

    // Check if we found assets and if the value is different from the target node currentValue
    if (liquidSum > 0 && myDiagram) {
      let updated = false;
      myDiagram.startTransaction("sync libero liquid assets");
      
      myDiagram.model.nodeDataArray.forEach((nodeData) => {
        // Target specifically node key -16 or any goal node displaying 9,000,000 as the targetValue
        if (nodeData.key === -16 || nodeData.text === '9,000,000' || nodeData.targetValue === 9000000) {
          if (nodeData.currentValue !== liquidSum) {
            myDiagram.model.setDataProperty(nodeData, "currentValue", liquidSum);
            updated = true;
          }
        }
      });
      
      myDiagram.commitTransaction("sync libero liquid assets");
      
      if (updated) {
        // Save the updated model immediately to LocalStorage and db.json
        const currentModelStr = myDiagram.model.toJson();
        localStorage.setItem('mindmap_auto_save_main', currentModelStr);
        saveToDB('main', currentModelStr);
        
        // Re-render dashboard views
        if (activeTab === 'goals') {
          renderGoalsDashboard();
        }
        console.log(`Synced Tom's Libero liquid assets: ${liquidSum} ₪`);
      }
    }
  } catch (err) {
    console.error("Libero assets sync error:", err);
  }
}

// Dedicated Goal Details Page and Timeline Helper Functions

function openGoalPage(nodeKey) {
  let node = null;
  if (myDiagram && myDiagram.model) {
    node = myDiagram.model.findNodeDataForKey(nodeKey);
  }
  if (!node) {
    let saved = localStorage.getItem('mindmap_auto_save_main') || localStorage.getItem('mindmap_auto_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        node = (parsed.nodeDataArray || []).find(n => n.key === nodeKey);
      } catch (e) {}
    }
  }
  if (!node) {
    showToast('לא נמצאו נתוני מטרה', 'error');
    return;
  }

  window.currentGoalPageNodeKey = nodeKey;

  // Hide the main dashboard header and cards grid
  const mainHeader = document.querySelector('#goalsDashboardDiv > .dashboard-header');
  if (mainHeader) mainHeader.style.display = 'none';

  const gridContainer = document.getElementById('goalsGridContainer');
  if (gridContainer) gridContainer.style.display = 'none';

  // Show the single goal page div
  const singlePage = document.getElementById('singleGoalPageDiv');
  if (singlePage) singlePage.style.display = 'flex';

  // Render the goal details and timeline
  renderGoalPage(node);
}

function closeGoalPage() {
  window.currentGoalPageNodeKey = null;

  const singlePage = document.getElementById('singleGoalPageDiv');
  if (singlePage) singlePage.style.display = 'none';

  const mainHeader = document.querySelector('#goalsDashboardDiv > .dashboard-header');
  if (mainHeader) mainHeader.style.display = 'flex';

  const gridContainer = document.getElementById('goalsGridContainer');
  if (gridContainer) gridContainer.style.display = 'grid';

  // Rerender goals dashboard
  renderGoalsDashboard();
}

function renderGoalPage(node) {
  const pageTitle = document.getElementById('goalPageTitle');
  if (pageTitle) {
    pageTitle.textContent = node.text || "מטרה ללא שם";
  }

  // Populate free text plan
  const freeTextPlan = document.getElementById('goalPageFreeTextPlan');
  if (freeTextPlan) {
    freeTextPlan.value = node.workPlan || '';
  }

  renderGoalPageDetails(node);
  renderGoalTimeline(node);
  setTimelineLayout(timelineLayoutMode);

  // Calculate completions
  let totalTasks = 0;
  let completedTasks = 0;
  if (Array.isArray(node.monthlyTasks)) {
    totalTasks += node.monthlyTasks.length;
    completedTasks += node.monthlyTasks.filter(t => !!t.completed).length;
  }
  if (Array.isArray(node.weeklyTasks)) {
    totalTasks += node.weeklyTasks.length;
    completedTasks += node.weeklyTasks.filter(t => !!t.completed).length;
  }
  if (Array.isArray(node.timelineEvents)) {
    totalTasks += node.timelineEvents.length;
    completedTasks += node.timelineEvents.filter(e => !!e.completed).length;
  }
  
  const tasksPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (node.completed ? 100 : 0);

  const pctText = document.getElementById('goalPageTasksPct');
  if (pctText) {
    pctText.textContent = `${tasksPct}% (${completedTasks}/${totalTasks})`;
  }

  const progressBar = document.getElementById('goalPageTasksBar');
  if (progressBar) {
    progressBar.style.width = `${tasksPct}%`;
  }
}

function renderGoalPageDetails(node) {
  const detailsDiv = document.getElementById('goalPageDetails');
  if (!detailsDiv) return;
  detailsDiv.innerHTML = '';

  const addGoalDetail = (icon, label, value, date) => {
    const item = document.createElement('div');
    item.className = 'goal-detail-item';
    
    const lbl = document.createElement('div');
    lbl.className = 'goal-detail-label';
    lbl.innerHTML = `${icon} <strong>${label}:</strong>`;
    
    const val = document.createElement('div');
    val.className = 'goal-detail-val';
    let text = value || 'לא הוגדר';
    if (date) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        text += ` <span style="font-size: 0.75rem; color: var(--accent-color); font-weight: bold;">[יעד: ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}]</span>`;
      }
    }
    val.innerHTML = text;
    
    item.appendChild(lbl);
    item.appendChild(val);
    detailsDiv.appendChild(item);
  };

  addGoalDetail('🏆', 'מטרת על', node.grandGoal);
  addGoalDetail('📍', 'מטרת ביניים', node.milestoneGoal);
  
  if (node.isQuantitative) {
    const targetVal = parseFloat(node.targetValue) || 0;
    const currentVal = parseFloat(node.currentValue) || 0;
    const formattedTarget = targetVal.toLocaleString();
    const formattedCurrent = currentVal.toLocaleString();
    const unitStr = node.unit || '';
    addGoalDetail('📌', 'סטטוס כמותי', `${formattedCurrent} מתוך ${formattedTarget} ${unitStr}`);
  } else {
    addGoalDetail('📌', 'סטטוס נוכחי', node.currentStatus);
  }
  
  addGoalDetail('📅', 'יעד חודשי', node.monthlyGoal, node.monthlyGoalDate);
  addGoalDetail('⚡', 'יעד שבועי', node.weeklyGoal, node.weeklyGoalDate);

  if (node.websiteLink) {
    let linkUrl = node.websiteLink.trim();
    if (linkUrl) {
      if (!/^https?:\/\//i.test(linkUrl)) {
        linkUrl = 'https://' + linkUrl;
      }
      addGoalDetail('🔗', 'קישור לאתר', `<a href="${linkUrl}" target="_blank" class="goal-card-link-btn"><svg style="width:14px; height:14px; fill:currentColor; vertical-align:middle; margin-left:4px;" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>פתח קישור</a>`);
    }
  }
}

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function renderGoalTimeline(node) {
  const list = document.getElementById('timelineEventsList');
  if (!list) return;
  list.innerHTML = '';

  const events = Array.isArray(node.timelineEvents) ? [...node.timelineEvents] : [];
  
  // Sort chronologically
  events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  if (events.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-secondary); background: rgba(255,255,255,0.01); border: 1px dashed var(--border-glass); border-radius: 12px; margin-top: 10px;">
        <p style="margin: 0; font-size: 0.9rem;">אין תת-מטרות או אירועים בציר הזמן למטרה זו.</p>
        <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--accent-color);">לחץ על "הוסף תת-מטרה" כדי להתחיל לתכנן את ציר הזמן שלך!</p>
      </div>
    `;
    return;
  }

  events.forEach(event => {
    const item = document.createElement('div');
    item.className = `timeline-item ${event.completed ? 'completed' : ''}`;

    const dot = document.createElement('div');
    dot.className = `timeline-dot ${event.completed ? 'completed' : ''}`;

    const content = document.createElement('div');
    content.className = 'timeline-content';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.flexWrap = 'wrap';
    header.style.gap = '8px';

    const title = document.createElement('h4');
    title.style.margin = '0';
    title.style.fontSize = '1.05rem';
    title.style.fontWeight = '700';
    title.style.color = '#ffffff';
    title.textContent = event.title;

    const dateSpan = document.createElement('span');
    dateSpan.style.fontSize = '0.75rem';
    dateSpan.style.color = 'var(--accent-color)';
    dateSpan.style.fontWeight = 'bold';
    dateSpan.textContent = event.date ? formatDateHebrew(event.date) : 'ללא תאריך';

    header.appendChild(title);
    header.appendChild(dateSpan);
    content.appendChild(header);

    if (event.desc) {
      const desc = document.createElement('p');
      desc.style.margin = '4px 0 8px 0';
      desc.style.fontSize = '0.85rem';
      desc.style.color = 'var(--text-secondary)';
      desc.style.lineHeight = '1.4';
      desc.textContent = event.desc;
      content.appendChild(desc);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '8px';
    actions.style.marginTop = '8px';
    actions.style.borderTop = '1px solid rgba(255,255,255,0.05)';
    actions.style.paddingTop = '8px';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm';
    toggleBtn.style.background = 'rgba(255,255,255,0.05)';
    toggleBtn.style.border = '1px solid var(--border-glass)';
    toggleBtn.style.padding = '4px 8px';
    toggleBtn.style.borderRadius = '6px';
    toggleBtn.style.fontSize = '0.75rem';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.gap = '4px';
    toggleBtn.innerHTML = `<span>${event.completed ? '❌ סמן כלא בוצע' : '✓ סמן כבוצע'}</span>`;
    toggleBtn.addEventListener('click', () => {
      toggleTimelineEvent(node.key, event.id);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm';
    editBtn.style.background = 'rgba(245,166,35,0.08)';
    editBtn.style.border = '1px solid rgba(245,166,35,0.2)';
    editBtn.style.color = 'var(--accent-color)';
    editBtn.style.padding = '4px 8px';
    editBtn.style.borderRadius = '6px';
    editBtn.style.fontSize = '0.75rem';
    editBtn.style.display = 'flex';
    editBtn.style.alignItems = 'center';
    editBtn.style.gap = '4px';
    editBtn.innerHTML = `<span>✏️ ערוך</span>`;
    editBtn.addEventListener('click', () => {
      openEditTimelineEvent(node.key, event.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm';
    deleteBtn.style.background = 'rgba(239,68,68,0.08)';
    deleteBtn.style.border = '1px solid rgba(239,68,68,0.2)';
    deleteBtn.style.color = '#f87171';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.borderRadius = '6px';
    deleteBtn.style.fontSize = '0.75rem';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.gap = '4px';
    deleteBtn.innerHTML = `<span>🗑️ מחק</span>`;
    deleteBtn.addEventListener('click', () => {
      deleteTimelineEvent(node.key, event.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    content.appendChild(actions);

    item.appendChild(dot);
    item.appendChild(content);

    list.appendChild(item);
  });
}

function openEditTimelineEvent(nodeKey, eventId) {
  if (myDiagram && myDiagram.model) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node && Array.isArray(node.timelineEvents)) {
      const event = node.timelineEvents.find(evt => evt.id === eventId);
      if (event) {
        editingTimelineEventId = eventId;
        
        const form = document.getElementById('addTimelineEventForm');
        const titleInput = document.getElementById('timelineEventTitle');
        const dateInput = document.getElementById('timelineEventDate');
        const descInput = document.getElementById('timelineEventDesc');
        
        if (titleInput) titleInput.value = event.title;
        if (dateInput) dateInput.value = event.date || '';
        if (descInput) descInput.value = event.desc || '';
        
        const formHeader = form ? form.querySelector('h4') : null;
        if (formHeader) formHeader.textContent = 'עריכת תת-מטרה';
        
        if (form) {
          form.style.display = 'flex';
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }
}

function editTimelineEvent(nodeKey, eventId, title, date, desc) {
  if (myDiagram && myDiagram.model) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node && Array.isArray(node.timelineEvents)) {
      myDiagram.startTransaction('edit timeline event');
      const updatedEvents = node.timelineEvents.map(evt => {
        if (evt.id === eventId) {
          return { ...evt, title: title.trim(), date: date || '', desc: desc.trim() || '' };
        }
        return evt;
      });
      myDiagram.model.setDataProperty(node, 'timelineEvents', updatedEvents);
      myDiagram.commitTransaction('edit timeline event');
      
      renderGoalPage(node);
      showToast('תת-המטרה עודכנה בהצלחה', 'success');
    }
  }
}

function addTimelineEvent(nodeKey, title, date, desc) {
  if (!title.trim()) {
    showToast('נא להזין שם לתת-המטרה', 'warning');
    return;
  }

  if (myDiagram && myDiagram.model) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node) {
      myDiagram.startTransaction('add timeline event');
      
      const events = Array.isArray(node.timelineEvents) ? [...node.timelineEvents] : [];
      const newEvent = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        date: date || '',
        desc: desc.trim() || '',
        completed: false
      };
      
      events.push(newEvent);
      myDiagram.model.setDataProperty(node, 'timelineEvents', events);
      myDiagram.commitTransaction('add timeline event');

      renderGoalPage(node);
      showToast('תת-המטרה נוספה בהצלחה', 'success');
    }
  }
}

function toggleTimelineEvent(nodeKey, eventId) {
  if (myDiagram && myDiagram.model) {
    const node = myDiagram.model.findNodeDataForKey(nodeKey);
    if (node && Array.isArray(node.timelineEvents)) {
      myDiagram.startTransaction('toggle timeline event');
      const updatedEvents = node.timelineEvents.map(evt => {
        if (evt.id === eventId) {
          return { ...evt, completed: !evt.completed };
        }
        return evt;
      });
      myDiagram.model.setDataProperty(node, 'timelineEvents', updatedEvents);
      myDiagram.commitTransaction('toggle timeline event');
      
      renderGoalPage(node);
    }
  }
}

function deleteTimelineEvent(nodeKey, eventId) {
  if (confirm('האם אתה בטוח שברצונך למחוק תת-מטרה זו?')) {
    if (myDiagram && myDiagram.model) {
      const node = myDiagram.model.findNodeDataForKey(nodeKey);
      if (node && Array.isArray(node.timelineEvents)) {
        myDiagram.startTransaction('delete timeline event');
        const updatedEvents = node.timelineEvents.filter(evt => evt.id !== eventId);
        myDiagram.model.setDataProperty(node, 'timelineEvents', updatedEvents);
        myDiagram.commitTransaction('delete timeline event');
        
        renderGoalPage(node);
        showToast('תת-המטרה נמחקה', 'info');
      }
    }
  }
}

function saveTimelineEvent() {
  const nodeKey = window.currentGoalPageNodeKey;
  if (nodeKey === null || nodeKey === undefined) return;

  const titleInput = document.getElementById('timelineEventTitle');
  const dateInput = document.getElementById('timelineEventDate');
  const descInput = document.getElementById('timelineEventDesc');

  if (!titleInput) return;

  const title = titleInput.value.trim();
  const date = dateInput ? dateInput.value : '';
  const desc = descInput ? descInput.value.trim() : '';

  if (!title) {
    showToast('נא להזין שם לתת-המטרה', 'warning');
    return;
  }

  if (editingTimelineEventId) {
    editTimelineEvent(nodeKey, editingTimelineEventId, title, date, desc);
  } else {
    addTimelineEvent(nodeKey, title, date, desc);
  }

  // Clear and hide form
  titleInput.value = '';
  if (dateInput) dateInput.value = '';
  if (descInput) descInput.value = '';
  editingTimelineEventId = null;
  
  const form = document.getElementById('addTimelineEventForm');
  if (form) {
    form.style.display = 'none';
    const formHeader = form.querySelector('h4');
    if (formHeader) formHeader.textContent = 'תת-מטרה חדשה';
  }
}

function cancelTimelineEventForm() {
  const titleInput = document.getElementById('timelineEventTitle');
  const dateInput = document.getElementById('timelineEventDate');
  const descInput = document.getElementById('timelineEventDesc');
  
  if (titleInput) titleInput.value = '';
  if (dateInput) dateInput.value = '';
  if (descInput) descInput.value = '';
  
  editingTimelineEventId = null;

  const form = document.getElementById('addTimelineEventForm');
  if (form) {
    form.style.display = 'none';
    const formHeader = form.querySelector('h4');
    if (formHeader) formHeader.textContent = 'תת-מטרה חדשה';
  }
}

function setTimelineLayout(mode) {
  timelineLayoutMode = mode;
  localStorage.setItem('timeline_layout_mode', mode);
  
  const container = document.querySelector('.timeline-container');
  const vertBtn = document.getElementById('timelineLayoutVerticalBtn');
  const horizBtn = document.getElementById('timelineLayoutHorizontalBtn');
  const indicator = document.getElementById('timelineDirectionIndicator');
  
  if (indicator) {
    if (mode === 'horizontal') {
      indicator.textContent = '(סדר כרונולוגי מימין לשמאל ◀)';
    } else {
      indicator.textContent = '(סדר כרונולוגי מלמעלה למטה ⬇️)';
    }
  }
  
  if (container) {
    if (mode === 'horizontal') {
      container.classList.add('horizontal');
    } else {
      container.classList.remove('horizontal');
    }
  }
  
  if (vertBtn && horizBtn) {
    if (mode === 'horizontal') {
      horizBtn.style.background = 'var(--accent-color)';
      horizBtn.style.color = '#090d16';
      horizBtn.classList.add('active');
      
      vertBtn.style.background = 'transparent';
      vertBtn.style.color = 'var(--text-secondary)';
      vertBtn.classList.remove('active');
    } else {
      vertBtn.style.background = 'var(--accent-color)';
      vertBtn.style.color = '#090d16';
      vertBtn.classList.add('active');
      
      horizBtn.style.background = 'transparent';
      horizBtn.style.color = 'var(--text-secondary)';
      horizBtn.classList.remove('active');
    }
  }
}



