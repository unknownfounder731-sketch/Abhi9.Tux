// Enhanced Tux Paint Web Application JavaScript

class EnhancedTuxPaint {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        this.canvasViewport = document.getElementById('canvasViewport');
        
        // Drawing state
        this.isDrawing = false;
        this.currentTool = 'paint';
        this.currentColor = '#000000';
        this.currentBgColor = '#FFFFFF';
        this.brushSize = 10;
        this.opacity = 100;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        
        // Tool-specific settings
        this.currentBrush = 'round';
        this.currentShape = 'circle';
        this.currentSelection = 'rectangle';
        this.currentGradient = 'linear';
        this.currentFont = 'Arial';
        this.fontSize = 24;
        
        // Canvas settings
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.gridVisible = false;
        this.rulersVisible = false;
        
        // Layer system
        this.layers = [];
        this.activeLayerIndex = 0;
        this.layerIdCounter = 0;
        
        // History system
        this.history = [];
        this.historyStep = -1;
        this.maxHistorySteps = 50;
        
        // Selection system
        this.selection = null;
        this.selectionActive = false;
        
        // Imported images
        this.importedImages = [];
        this.selectedImage = null;
        
        // Touch/gesture support
        this.lastTouchDistance = 0;
        this.touchStartTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeCanvas();
        this.createInitialLayer();
        this.updateUI();
        this.showTuxMessage("Welcome to Enhanced Tux Paint! Try importing an image or exploring the new tools!");
    }
    
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e.target.closest('.tool-btn')));
        });
        
        // Panel tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPanel(e.target));
        });
        
        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectColor(e.target));
        });
        
        // Canvas events - Mouse
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Canvas events - Touch
        this.setupTouchEvents();
        
        // Zoom and pan controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomFit').addEventListener('click', () => this.zoomToFit());
        
        // Canvas controls
        document.getElementById('toggleGrid').addEventListener('click', () => this.toggleGrid());
        document.getElementById('toggleRulers').addEventListener('click', () => this.toggleRulers());
        document.getElementById('canvasSettings').addEventListener('click', () => this.showCanvasSettings());
        
        // Range controls
        document.getElementById('brushSize').addEventListener('input', (e) => this.updateBrushSize(e.target.value));
        document.getElementById('opacity').addEventListener('input', (e) => this.updateOpacity(e.target.value));
        
        // File operations
        document.getElementById('fileInput').addEventListener('change', (e) => this.loadFile(e));
        document.getElementById('importInput').addEventListener('change', (e) => this.importImages(e));
        
        // Text controls
        document.getElementById('acceptText').addEventListener('click', () => this.acceptText());
        document.getElementById('cancelText').addEventListener('click', () => this.cancelText());
        document.getElementById('fontSize').addEventListener('input', (e) => this.updateFontSize(e.target.value));
        
        // Color tools
        document.getElementById('colorPicker').addEventListener('click', () => this.openColorPicker());
        document.getElementById('swapColors').addEventListener('click', () => this.swapColors());
        
        // Layer controls
        document.getElementById('addLayer').addEventListener('click', () => this.addLayer());
        document.getElementById('deleteLayer').addEventListener('click', () => this.deleteLayer());
        document.getElementById('duplicateLayer').addEventListener('click', () => this.duplicateLayer());
        
        // Modal controls
        this.setupModalEvents();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Canvas resize handles
        this.setupCanvasResizeHandles();
        
        // Drag and drop for images
        this.setupDragAndDrop();
        
        // Tux mascot
        document.getElementById('tuxMascot').addEventListener('click', () => this.showRandomTip());
    }
    
    setupTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touches = e.touches;
            
            if (touches.length === 1) {
                const touch = touches[0];
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            } else if (touches.length === 2) {
                this.handlePinchStart(e);
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touches = e.touches;
            
            if (touches.length === 1) {
                const touch = touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.canvas.dispatchEvent(mouseEvent);
            } else if (touches.length === 2) {
                this.handlePinchMove(e);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0) {
                const mouseEvent = new MouseEvent('mouseup', {});
                this.canvas.dispatchEvent(mouseEvent);
            }
        });
    }
    
    handlePinchStart(e) {
        const touches = e.touches;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
    
    handlePinchMove(e) {
        const touches = e.touches;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.lastTouchDistance > 0) {
            const scale = distance / this.lastTouchDistance;
            if (scale > 1.1) {
                this.zoomIn();
                this.lastTouchDistance = distance;
            } else if (scale < 0.9) {
                this.zoomOut();
                this.lastTouchDistance = distance;
            }
        }
    }
    
    setupDragAndDrop() {
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                this.importImageFiles(imageFiles, e.clientX, e.clientY);
            }
        });
    }
    
    initializeCanvas() {
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateCanvasTransform();
    }
    
    createInitialLayer() {
        const layer = {
            id: this.layerIdCounter++,
            name: 'Background',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            canvas: document.createElement('canvas'),
            isBackground: true
        };
        
        layer.canvas.width = this.canvas.width;
        layer.canvas.height = this.canvas.height;
        const ctx = layer.canvas.getContext('2d');
        ctx.fillStyle = this.currentBgColor;
        ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
        
        this.layers.push(layer);
        this.activeLayerIndex = 0;
        this.updateLayersPanel();
        this.saveState();
    }
    
    selectTool(btn) {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const toolId = btn.dataset.tool;
        
        // Handle special tools
        switch(toolId) {
            case 'undo': this.undo(); return;
            case 'redo': this.redo(); return;
            case 'new': this.newCanvas(); return;
            case 'save': this.saveCanvas(); return;
            case 'import': this.importImage(); return;
            case 'export': this.showExportDialog(); return;
        }
        
        this.currentTool = toolId;
        this.updateToolOptions();
        this.setCursor();
        this.clearSelection();
    }
    
    switchPanel(btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.panel-content').forEach(p => p.classList.add('hidden'));
        
        const panelId = btn.dataset.panel + 'Panel';
        document.getElementById(panelId).classList.remove('hidden');
    }
    
    updateToolOptions() {
        const selectorContent = document.getElementById('selectorContent');
        const selectorTitle = document.getElementById('selectorTitle');
        
        // Clear existing content
        selectorContent.innerHTML = '';
        
        switch(this.currentTool) {
            case 'paint':
            case 'eraser':
                selectorTitle.textContent = 'Brushes';
                this.createBrushOptions(selectorContent);
                break;
            case 'selection':
                selectorTitle.textContent = 'Selection';
                this.createSelectionOptions(selectorContent);
                break;
            case 'gradient':
                selectorTitle.textContent = 'Gradients';
                this.createGradientOptions(selectorContent);
                break;
            case 'shapes':
                selectorTitle.textContent = 'Shapes';
                this.createShapeOptions(selectorContent);
                break;
            case 'text':
                selectorTitle.textContent = 'Text';
                this.createTextOptions(selectorContent);
                break;
            case 'stamp':
                selectorTitle.textContent = 'Stamps';
                this.createStampOptions(selectorContent);
                break;
            case 'magic':
                selectorTitle.textContent = 'Magic';
                this.createMagicOptions(selectorContent);
                break;
            default:
                selectorTitle.textContent = 'Options';
                break;
        }
    }
    
    createBrushOptions(container) {
        const brushes = [
            {type: 'round', name: 'Round', icon: '●'},
            {type: 'square', name: 'Square', icon: '■'},
            {type: 'calligraphy', name: 'Calligraphy', icon: '✒️'},
            {type: 'spray', name: 'Spray', icon: '💨'},
            {type: 'texture', name: 'Texture', icon: '🎨'}
        ];
        
        brushes.forEach(brush => {
            const btn = document.createElement('button');
            btn.className = `selector-btn ${brush.type === this.currentBrush ? 'active' : ''}`;
            btn.innerHTML = `<span class="tool-icon">${brush.icon}</span><span>${brush.name}</span>`;
            btn.addEventListener('click', () => {
                this.currentBrush = brush.type;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    createSelectionOptions(container) {
        const selections = [
            {type: 'rectangle', name: 'Rectangle', icon: '⬜'},
            {type: 'ellipse', name: 'Ellipse', icon: '⭕'},
            {type: 'freeform', name: 'Freeform', icon: '✏️'},
            {type: 'magic_wand', name: 'Magic Wand', icon: '🪄'},
            {type: 'color_range', name: 'Color Range', icon: '🎯'}
        ];
        
        selections.forEach(selection => {
            const btn = document.createElement('button');
            btn.className = `selector-btn ${selection.type === this.currentSelection ? 'active' : ''}`;
            btn.innerHTML = `<span class="tool-icon">${selection.icon}</span><span>${selection.name}</span>`;
            btn.addEventListener('click', () => {
                this.currentSelection = selection.type;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    createGradientOptions(container) {
        const gradients = [
            {type: 'linear', name: 'Linear', icon: '📏'},
            {type: 'radial', name: 'Radial', icon: '⭕'},
            {type: 'angular', name: 'Angular', icon: '🌀'},
            {type: 'diamond', name: 'Diamond', icon: '💎'},
            {type: 'reflected', name: 'Reflected', icon: '🪞'}
        ];
        
        gradients.forEach(gradient => {
            const btn = document.createElement('button');
            btn.className = `selector-btn ${gradient.type === this.currentGradient ? 'active' : ''}`;
            btn.innerHTML = `<span class="tool-icon">${gradient.icon}</span><span>${gradient.name}</span>`;
            btn.addEventListener('click', () => {
                this.currentGradient = gradient.type;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    createShapeOptions(container) {
        const shapes = [
            {type: 'circle', name: 'Circle', icon: '⭕'},
            {type: 'rectangle', name: 'Rectangle', icon: '⬛'},
            {type: 'triangle', name: 'Triangle', icon: '🔺'},
            {type: 'star', name: 'Star', icon: '⭐'},
            {type: 'heart', name: 'Heart', icon: '💖'},
            {type: 'polygon', name: 'Polygon', icon: '⬡'}
        ];
        
        shapes.forEach(shape => {
            const btn = document.createElement('button');
            btn.className = `selector-btn ${shape.type === this.currentShape ? 'active' : ''}`;
            btn.innerHTML = `<span class="tool-icon">${shape.icon}</span><span>${shape.name}</span>`;
            btn.addEventListener('click', () => {
                this.currentShape = shape.type;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    createTextOptions(container) {
        const fonts = ['Arial', 'Times New Roman', 'Comic Sans MS', 'Impact', 'Courier New'];
        
        fonts.forEach(font => {
            const btn = document.createElement('button');
            btn.className = `selector-btn ${font === this.currentFont ? 'active' : ''}`;
            btn.textContent = font;
            btn.style.fontFamily = font;
            btn.addEventListener('click', () => {
                this.currentFont = font;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    createStampOptions(container) {
        const categories = [
            {name: 'Animals', stamps: ['🐕', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨']},
            {name: 'Nature', stamps: ['🌳', '🌲', '🌺', '🌻', '🌈', '⭐', '☀️', '🌙']},
            {name: 'Objects', stamps: ['🏠', '🚗', '✈️', '🚂', '⚽', '🎈', '🎂', '🎁']}
        ];
        
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'stamp-category';
            
            const title = document.createElement('h4');
            title.textContent = category.name;
            categoryDiv.appendChild(title);
            
            const grid = document.createElement('div');
            grid.className = 'stamp-grid';
            
            category.stamps.forEach(stamp => {
                const btn = document.createElement('button');
                btn.className = 'selector-btn';
                btn.textContent = stamp;
                btn.addEventListener('click', () => {
                    this.currentStamp = stamp;
                    container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                grid.appendChild(btn);
            });
            
            categoryDiv.appendChild(grid);
            container.appendChild(categoryDiv);
        });
    }
    
    createMagicOptions(container) {
        const effects = [
            {type: 'blur', name: 'Blur', icon: '🌫️'},
            {type: 'sharpen', name: 'Sharpen', icon: '🔍'},
            {type: 'emboss', name: 'Emboss', icon: '🏔️'},
            {type: 'rainbow', name: 'Rainbow', icon: '🌈'},
            {type: 'sparkle', name: 'Sparkle', icon: '✨'},
            {type: 'vintage', name: 'Vintage', icon: '📸'},
            {type: 'neon', name: 'Neon', icon: '💡'},
            {type: 'oil_paint', name: 'Oil Paint', icon: '🎨'}
        ];
        
        effects.forEach(effect => {
            const btn = document.createElement('button');
            btn.className = 'selector-btn';
            btn.innerHTML = `<span class="tool-icon">${effect.icon}</span><span>${effect.name}</span>`;
            btn.addEventListener('click', () => {
                this.currentMagicEffect = effect.type;
                container.querySelectorAll('.selector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    startDrawing(e) {
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.isDrawing = true;
        
        // Check if clicking on imported image
        if (this.checkImageSelection(pos.x, pos.y)) {
            return;
        }
        
        switch(this.currentTool) {
            case 'paint':
            case 'eraser':
                this.beginBrushStroke(pos);
                break;
            case 'selection':
                this.beginSelection(pos);
                break;
            case 'gradient':
                this.beginGradient(pos);
                break;
            case 'fill':
                this.floodFill(pos.x, pos.y);
                break;
            case 'stamp':
                this.placeStamp(pos.x, pos.y);
                break;
            case 'text':
                this.showTextInput(pos.x, pos.y);
                break;
            case 'clone':
                this.beginClone(pos);
                break;
            case 'healing':
                this.beginHealing(pos);
                break;
            case 'magic':
                this.applyMagicEffect(pos.x, pos.y);
                break;
            case 'zoom':
                this.zoomAtPoint(pos.x, pos.y, e.shiftKey ? 0.8 : 1.25);
                break;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        switch(this.currentTool) {
            case 'paint':
            case 'eraser':
                this.continueBrushStroke(pos);
                break;
            case 'selection':
                this.updateSelection(pos);
                break;
            case 'gradient':
                this.updateGradientPreview(pos);
                break;
            case 'lines':
                this.updateLinePreview(pos);
                break;
            case 'shapes':
                this.updateShapePreview(pos);
                break;
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        switch(this.currentTool) {
            case 'paint':
            case 'eraser':
                this.endBrushStroke();
                break;
            case 'selection':
                this.endSelection();
                break;
            case 'gradient':
                this.applyGradient();
                break;
            case 'lines':
                this.drawLine();
                break;
            case 'shapes':
                this.drawShape();
                break;
        }
        
        this.saveState();
    }
    
    beginBrushStroke(pos) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const ctx = layer.canvas.getContext('2d');
        ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.globalAlpha = this.opacity / 100;
        ctx.strokeStyle = this.currentColor;
        ctx.fillStyle = this.currentColor;
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    continueBrushStroke(pos) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const ctx = layer.canvas.getContext('2d');
        
        switch(this.currentBrush) {
            case 'round':
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                break;
            case 'square':
                ctx.fillRect(pos.x - this.brushSize/2, pos.y - this.brushSize/2, this.brushSize, this.brushSize);
                break;
            case 'spray':
                this.drawSpray(ctx, pos.x, pos.y);
                break;
            default:
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                break;
        }
        
        this.compositeToCanvas();
    }
    
    endBrushStroke() {
        this.compositeToCanvas();
    }
    
    drawSpray(ctx, x, y) {
        for (let i = 0; i < 20; i++) {
            const offsetX = (Math.random() - 0.5) * this.brushSize;
            const offsetY = (Math.random() - 0.5) * this.brushSize;
            ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
    }
    
    floodFill(x, y) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const ctx = layer.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        const targetColor = this.getPixelColor(imageData, Math.floor(x), Math.floor(y));
        const fillColor = this.hexToRgb(this.currentColor);
        
        if (this.colorsMatch(targetColor, fillColor)) return;
        
        this.floodFillArea(imageData, Math.floor(x), Math.floor(y), targetColor, fillColor);
        ctx.putImageData(imageData, 0, 0);
        this.compositeToCanvas();
    }
    
    floodFillArea(imageData, x, y, targetColor, fillColor) {
        const stack = [{x, y}];
        const visited = new Set();
        
        while (stack.length > 0) {
            const {x: px, y: py} = stack.pop();
            const key = `${px},${py}`;
            
            if (visited.has(key) || px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) {
                continue;
            }
            
            const currentColor = this.getPixelColor(imageData, px, py);
            if (!this.colorsMatch(currentColor, targetColor)) continue;
            
            visited.add(key);
            this.setPixelColor(imageData, px, py, fillColor);
            
            stack.push({x: px + 1, y: py}, {x: px - 1, y: py}, {x: px, y: py + 1}, {x: px, y: py - 1});
        }
    }
    
    getPixelColor(imageData, x, y) {
        const index = (y * imageData.width + x) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }
    
    setPixelColor(imageData, x, y, color) {
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = 255;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 0, b: 0};
    }
    
    colorsMatch(a, b) {
        return Math.abs(a.r - b.r) < 5 && Math.abs(a.g - b.g) < 5 && Math.abs(a.b - b.b) < 5;
    }
    
    importImage() {
        document.getElementById('importInput').click();
    }
    
    importImages(e) {
        const files = Array.from(e.target.files);
        this.importImageFiles(files, 100, 100);
    }
    
    importImageFiles(files, x = 100, y = 100) {
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const importedImage = {
                            id: Date.now() + index,
                            img: img,
                            x: x + (index * 20),
                            y: y + (index * 20),
                            width: img.width,
                            height: img.height,
                            rotation: 0,
                            opacity: 1,
                            selected: false
                        };
                        
                        // Scale down if too large
                        const maxSize = 400;
                        if (img.width > maxSize || img.height > maxSize) {
                            const scale = Math.min(maxSize / img.width, maxSize / img.height);
                            importedImage.width = img.width * scale;
                            importedImage.height = img.height * scale;
                        }
                        
                        this.importedImages.push(importedImage);
                        this.renderImportedImages();
                        this.showTuxMessage("Image imported! Click and drag to move, use handles to resize.");
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    renderImportedImages() {
        this.compositeToCanvas();
    }
    
    checkImageSelection(x, y) {
        for (let i = this.importedImages.length - 1; i >= 0; i--) {
            const img = this.importedImages[i];
            if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height) {
                this.selectImage(img);
                return true;
            }
        }
        this.deselectAllImages();
        return false;
    }
    
    selectImage(image) {
        this.importedImages.forEach(img => img.selected = false);
        image.selected = true;
        this.selectedImage = image;
        this.renderImportedImages();
    }
    
    deselectAllImages() {
        this.importedImages.forEach(img => img.selected = false);
        this.selectedImage = null;
        this.renderImportedImages();
    }
    
    getActiveLayer() {
        return this.layers[this.activeLayerIndex];
    }
    
    addLayer() {
        const layer = {
            id: this.layerIdCounter++,
            name: `Layer ${this.layers.length}`,
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            canvas: document.createElement('canvas')
        };
        
        layer.canvas.width = this.canvas.width;
        layer.canvas.height = this.canvas.height;
        
        this.layers.push(layer);
        this.activeLayerIndex = this.layers.length - 1;
        this.updateLayersPanel();
        this.compositeToCanvas();
    }
    
    deleteLayer() {
        if (this.layers.length <= 1) return;
        
        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length - 1);
        this.updateLayersPanel();
        this.compositeToCanvas();
    }
    
    duplicateLayer() {
        const sourceLayer = this.getActiveLayer();
        if (!sourceLayer) return;
        
        const layer = {
            id: this.layerIdCounter++,
            name: sourceLayer.name + ' Copy',
            visible: true,
            opacity: sourceLayer.opacity,
            blendMode: sourceLayer.blendMode,
            canvas: document.createElement('canvas')
        };
        
        layer.canvas.width = sourceLayer.canvas.width;
        layer.canvas.height = sourceLayer.canvas.height;
        layer.canvas.getContext('2d').drawImage(sourceLayer.canvas, 0, 0);
        
        this.layers.splice(this.activeLayerIndex + 1, 0, layer);
        this.activeLayerIndex++;
        this.updateLayersPanel();
    }
    
    updateLayersPanel() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${index === this.activeLayerIndex ? 'active' : ''}`;
            
            layerItem.innerHTML = `
                <div class="layer-thumbnail"></div>
                <div class="layer-info">
                    <div class="layer-name">${layer.name}</div>
                </div>
                <div class="layer-controls-inline">
                    <button class="layer-visibility" data-layer="${index}">
                        ${layer.visible ? '👁️' : '🙈'}
                    </button>
                </div>
            `;
            
            layerItem.addEventListener('click', () => {
                this.activeLayerIndex = index;
                this.updateLayersPanel();
            });
            
            const visibilityBtn = layerItem.querySelector('.layer-visibility');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this.updateLayersPanel();
                this.compositeToCanvas();
            });
            
            layersList.appendChild(layerItem);
        });
    }
    
    compositeToCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render layers
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.globalCompositeOperation = layer.blendMode;
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        
        // Render imported images
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.importedImages.forEach(img => {
            this.ctx.save();
            this.ctx.globalAlpha = img.opacity;
            this.ctx.translate(img.x + img.width/2, img.y + img.height/2);
            this.ctx.rotate(img.rotation * Math.PI / 180);
            this.ctx.drawImage(img.img, -img.width/2, -img.height/2, img.width, img.height);
            this.ctx.restore();
            
            // Draw selection handles if selected
            if (img.selected) {
                this.drawImageHandles(img);
            }
        });
    }
    
    drawImageHandles(img) {
        const handleSize = 8;
        const handles = [
            {x: img.x, y: img.y, cursor: 'nw-resize'},
            {x: img.x + img.width, y: img.y, cursor: 'ne-resize'},
            {x: img.x, y: img.y + img.height, cursor: 'sw-resize'},
            {x: img.x + img.width, y: img.y + img.height, cursor: 'se-resize'}
        ];
        
        this.ctx.fillStyle = '#1FB8CD';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            this.ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        });
        
        // Rotation handle
        const rotHandle = {x: img.x + img.width/2, y: img.y - 20};
        this.ctx.beginPath();
        this.ctx.arc(rotHandle.x, rotHandle.y, handleSize/2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        
        // Save layer states and imported images
        const state = {
            layers: this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                imageData: layer.canvas.toDataURL()
            })),
            importedImages: JSON.parse(JSON.stringify(this.importedImages.map(img => ({
                ...img,
                imgSrc: img.img.src
            }))))
        };
        
        this.history.push(state);
        
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
            this.historyStep--;
        }
        
        this.updateHistoryPanel();
    }
    
    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
        }
    }
    
    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
        }
    }
    
    restoreState() {
        if (!this.history[this.historyStep]) return;
        
        const state = this.history[this.historyStep];
        
        // Restore layers
        this.layers = [];
        state.layers.forEach(layerData => {
            const layer = {
                id: layerData.id,
                name: layerData.name,
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode,
                canvas: document.createElement('canvas')
            };
            
            layer.canvas.width = this.canvas.width;
            layer.canvas.height = this.canvas.height;
            
            const img = new Image();
            img.onload = () => {
                layer.canvas.getContext('2d').drawImage(img, 0, 0);
                this.compositeToCanvas();
            };
            img.src = layerData.imageData;
            
            this.layers.push(layer);
        });
        
        // Restore imported images
        this.importedImages = [];
        state.importedImages.forEach(imgData => {
            const img = new Image();
            img.onload = () => {
                const importedImage = {
                    ...imgData,
                    img: img
                };
                delete importedImage.imgSrc;
                this.importedImages.push(importedImage);
                this.compositeToCanvas();
            };
            img.src = imgData.imgSrc;
        });
        
        this.updateLayersPanel();
        this.updateHistoryPanel();
    }
    
    updateHistoryPanel() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.history.forEach((state, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${index === this.historyStep ? 'active' : ''}`;
            historyItem.innerHTML = `
                <div class="history-thumbnail"></div>
                <div>Step ${index + 1}</div>
            `;
            
            historyItem.addEventListener('click', () => {
                this.historyStep = index;
                this.restoreState();
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    setupModalEvents() {
        // Canvas settings modal
        document.getElementById('canvasSettings').addEventListener('click', () => {
            document.getElementById('canvasModal').classList.remove('hidden');
        });
        
        document.getElementById('cancelCanvas').addEventListener('click', () => {
            document.getElementById('canvasModal').classList.add('hidden');
        });
        
        document.getElementById('applyCanvas').addEventListener('click', () => {
            this.applyCanvasSettings();
        });
        
        // Export modal
        document.getElementById('doExport').addEventListener('click', () => {
            this.exportCanvas();
        });
        
        document.getElementById('cancelExport').addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('hidden');
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
            });
        });
    }
    
    showExportDialog() {
        document.getElementById('exportModal').classList.remove('hidden');
    }
    
    exportCanvas() {
        const format = document.getElementById('exportFormat').value;
        const scale = parseFloat(document.getElementById('exportScale').value);
        const quality = document.getElementById('exportQuality').value / 100;
        
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width * scale;
        exportCanvas.height = this.canvas.height * scale;
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCtx.scale(scale, scale);
        exportCtx.drawImage(this.canvas, 0, 0);
        
        let dataURL;
        if (format === 'jpg') {
            dataURL = exportCanvas.toDataURL('image/jpeg', quality);
        } else {
            dataURL = exportCanvas.toDataURL(`image/${format}`);
        }
        
        const link = document.createElement('a');
        link.download = `tux-paint-drawing.${format}`;
        link.href = dataURL;
        link.click();
        
        document.getElementById('exportModal').classList.add('hidden');
    }
    
    updateBrushSize(value) {
        this.brushSize = parseInt(value);
        document.getElementById('brushSizeDisplay').textContent = value + 'px';
    }
    
    updateOpacity(value) {
        this.opacity = parseInt(value);
        document.getElementById('opacityDisplay').textContent = value + '%';
    }
    
    updateFontSize(value) {
        this.fontSize = parseInt(value);
        document.getElementById('fontSizeDisplay').textContent = value + 'px';
    }
    
    selectColor(btn) {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentColor = btn.dataset.color;
        this.updateCurrentColors();
    }
    
    updateCurrentColors() {
        document.getElementById('currentColor').style.backgroundColor = this.currentColor;
        document.getElementById('currentBgColor').style.backgroundColor = this.currentBgColor;
    }
    
    swapColors() {
        const temp = this.currentColor;
        this.currentColor = this.currentBgColor;
        this.currentBgColor = temp;
        this.updateCurrentColors();
    }
    
    openColorPicker() {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.currentColor;
        input.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.updateCurrentColors();
        });
        input.click();
    }
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.25, 5);
        this.updateCanvasTransform();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom * 0.8, 0.1);
        this.updateCanvasTransform();
    }
    
    zoomToFit() {
        const containerRect = this.canvasWrapper.getBoundingClientRect();
        const scaleX = (containerRect.width - 40) / this.canvas.width;
        const scaleY = (containerRect.height - 40) / this.canvas.height;
        this.zoom = Math.min(scaleX, scaleY, 1);
        this.updateCanvasTransform();
    }
    
    updateCanvasTransform() {
        this.canvas.style.transform = `scale(${this.zoom})`;
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        const gridOverlay = document.getElementById('gridOverlay');
        gridOverlay.classList.toggle('visible', this.gridVisible);
        document.getElementById('toggleGrid').classList.toggle('active', this.gridVisible);
    }
    
    setCursor() {
        this.canvas.className = `canvas-${this.currentTool}`;
    }
    
    showTuxMessage(message) {
        const tuxSpeech = document.getElementById('tuxSpeech');
        tuxSpeech.textContent = message;
        tuxSpeech.classList.remove('hidden');
        
        setTimeout(() => {
            tuxSpeech.classList.add('hidden');
        }, 3000);
    }
    
    showRandomTip() {
        const tips = [
            "Try dragging and dropping images onto the canvas!",
            "Use Ctrl+Z to undo and Ctrl+Y to redo.",
            "The zoom tool lets you zoom in and out of your artwork.",
            "Create layers to organize your artwork better.",
            "Use the selection tools to work on specific areas.",
            "The healing brush can fix imperfections seamlessly.",
            "Try the magic effects for artistic filters!",
            "You can resize the canvas using the handles when zoomed out.",
            "Import multiple images at once for collages!"
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.showTuxMessage(randomTip);
    }
    
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveCanvas();
                    break;
                case 'n':
                    e.preventDefault();
                    this.newCanvas();
                    break;
            }
        }
        
        // Tool shortcuts
        switch(e.key) {
            case 'b': this.selectToolByType('paint'); break;
            case 'e': this.selectToolByType('eraser'); break;
            case 's': this.selectToolByType('selection'); break;
            case 'g': this.selectToolByType('gradient'); break;
            case 't': this.selectToolByType('text'); break;
            case 'z': this.selectToolByType('zoom'); break;
        }
    }
    
    selectToolByType(toolType) {
        const toolBtn = document.querySelector(`[data-tool="${toolType}"]`);
        if (toolBtn) {
            this.selectTool(toolBtn);
        }
    }
    
    newCanvas() {
        if (confirm('Create a new canvas? This will clear your current work.')) {
            this.layers = [];
            this.importedImages = [];
            this.history = [];
            this.historyStep = -1;
            this.createInitialLayer();
            this.compositeToCanvas();
        }
    }
    
    saveCanvas() {
        const link = document.createElement('a');
        link.download = 'enhanced-tux-paint-drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    updateUI() {
        this.updateCurrentColors();
        this.updateLayersPanel();
        this.updateToolOptions();
        this.setCursor();
    }
    
    setupCanvasResizeHandles() {
        // Implementation for canvas resize handles would go here
        // This is a complex feature that would require additional event handling
    }
    
    clearSelection() {
        this.selection = null;
        this.selectionActive = false;
        const selectionOverlay = document.getElementById('selectionOverlay');
        selectionOverlay.innerHTML = '';
    }
    
    // Placeholder methods for advanced tools
    beginSelection(pos) { /* Selection tool implementation */ }
    updateSelection(pos) { /* Selection update implementation */ }
    endSelection() { /* End selection implementation */ }
    
    beginGradient(pos) { /* Gradient tool implementation */ }
    updateGradientPreview(pos) { /* Gradient preview implementation */ }
    applyGradient() { /* Apply gradient implementation */ }
    
    beginClone(pos) { /* Clone tool implementation */ }
    beginHealing(pos) { /* Healing tool implementation */ }
    
    updateLinePreview(pos) { /* Line preview implementation */ }
    updateShapePreview(pos) { /* Shape preview implementation */ }
    drawLine() { /* Draw line implementation */ }
    drawShape() { /* Draw shape implementation */ }
    
    applyMagicEffect(x, y) { 
        this.showTuxMessage("Magic effects are brewing! ✨");
        // Magic effects implementation
    }
    
    zoomAtPoint(x, y, scale) {
        this.zoom = Math.max(0.1, Math.min(5, this.zoom * scale));
        this.updateCanvasTransform();
    }
    
    showTextInput(x, y) {
        const textInput = document.getElementById('textInput');
        textInput.classList.remove('hidden');
        textInput.style.left = x + 'px';
        textInput.style.top = y + 'px';
        document.getElementById('textContent').focus();
        this.textX = x;
        this.textY = y;
    }
    
    acceptText() {
        const textarea = document.getElementById('textContent');
        const text = textarea.value.trim();
        
        if (text) {
            const layer = this.getActiveLayer();
            if (layer) {
                const ctx = layer.canvas.getContext('2d');
                ctx.font = `${this.fontSize}px ${this.currentFont}`;
                ctx.fillStyle = this.currentColor;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                const lines = text.split('\n');
                lines.forEach((line, index) => {
                    ctx.fillText(line, this.textX, this.textY + (index * this.fontSize * 1.2));
                });
                
                this.compositeToCanvas();
                this.saveState();
            }
        }
        
        this.cancelText();
    }
    
    cancelText() {
        document.getElementById('textInput').classList.add('hidden');
        document.getElementById('textContent').value = '';
    }
    
    placeStamp(x, y) {
        const layer = this.getActiveLayer();
        if (layer && this.currentStamp) {
            const ctx = layer.canvas.getContext('2d');
            ctx.font = `${this.brushSize * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.currentColor;
            ctx.fillText(this.currentStamp, x, y);
            
            this.compositeToCanvas();
            this.saveState();
        }
    }
    
    applyCanvasSettings() {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);
        const bgColor = document.getElementById('canvasBackground').value;
        
        // Resize canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Resize all layers
        this.layers.forEach(layer => {
            const oldCanvas = layer.canvas;
            layer.canvas = document.createElement('canvas');
            layer.canvas.width = width;
            layer.canvas.height = height;
            
            const ctx = layer.canvas.getContext('2d');
            if (layer.isBackground) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(oldCanvas, 0, 0);
        });
        
        this.currentBgColor = bgColor;
        this.compositeToCanvas();
        this.saveState();
        
        document.getElementById('canvasModal').classList.add('hidden');
        this.showTuxMessage("Canvas resized successfully!");
    }
}

// Initialize the enhanced application
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedTuxPaint = new EnhancedTuxPaint();
});