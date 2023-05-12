function isSameSign(num1, num2)
{
    return ((num1 >= 0 && num2 >= 0) || (num1 < 0 && num2 < 0));
}

class Canvas
{
    setup(divID, _width, _height, color = white)
    {
        this.color = color;
        this.drawn = false;
        this.canvasParent = document.getElementById(divID);
        this.canvas = createCanvas(_width, _height);
        this.outerLayer = createGraphics(_width, _height);
        this.zoom = { zoom : 1, zoomX : 0, zoomY : 0, delta : 0, zoomSensitivity : 0.001, zoomMin : 0.1, zoomMax : Math.max(_width, _height) / 25};
        this.translate = { x : 0, y : 0};
        this.origin = { x : 0, y : 0};
        this.layers = [this.canvas, this.outerLayer];
        this.layers.forEach(layer =>
        {
            layer.parent(divID);
            layer.position(0, 0, "absolute");
            layer.show();
        });
        this.canvasDiv = document.getElementById(this.canvas.id());
        this.canvasRect = this.canvasDiv.getBoundingClientRect();
        background(color.r, color.g, color.b, color.a);
        this.instruments = [new Select("Select", this.outerLayer),
                            new Marker("Marker", new Thickness(1, 5), new Color(0, 0, 0, 255)), 
                            new Fill("Fill", 0.3), 
                            new Pencil("Pencil", new Thickness(1, 5), new Color(0, 0, 0, 255)),
                            new Eraser("Eraser", new Thickness(10, 100))];
        this.setInstrument("Marker");
        this.canvas.loadPixels();
    }

    applyLayersStyle(style)
    {
        this.layers.forEach(layer =>
        {
            layer.style(style);
        });
    }

    setOrigin(x, y)
    {
        this.origin.x = x;
        this.origin.y = y;
        this.applyLayersStyle("transform-origin: " + x.toString() + "px " + y.toString() + "px;");
    }

    setTranslate(x, y)
    {
        this.translate.x = x;
        this.translate.y = y;
        this.applyLayersStyle("translate: " + x.toString() + "px " + y.toString() + "px;");
    }

    addTranslate(x, y)
    {
        this.translate.x += x;
        this.translate.y += y;
        this.setTranslate(this.translate.x, this.translate.y);
    }

    setZoom(zoom)
    {
        this.zoom.zoom = zoom;
        this.applyLayersStyle("scale: " + zoom.toString() + ";");
    }

    zoomByMouseWheel(event)
    {
        let mouse = canvas.getMouseByEvent(event);
    
        this.addTranslate((mouse.x - this.zoom.zoomX) * (this.zoom.zoom - 1), (mouse.y - this.zoom.zoomY) * (this.zoom.zoom - 1));

        this.zoom.zoomX = mouse.x;
        this.zoom.zoomY = mouse.y;
        this.setOrigin(this.zoom.zoomX, this.zoom.zoomY);

        this.zoom.delta = event.delta * this.zoom.zoomSensitivity * this.zoom.zoom;
        this.zoom.zoom -= this.zoom.delta;
        this.zoom.zoom = constrain(this.zoom.zoom, this.zoom.zoomMin, this.zoom.zoomMax);
        this.setZoom(this.zoom.zoom);
    }

    getMouseByEvent(event)
    {
        this.canvasRect = this.canvasDiv.getBoundingClientRect();
        return {x : (event.clientX - this.canvasRect.left) / this.zoom.zoom, y : (event.clientY - this.canvasRect.top) / this.zoom.zoom };
    }

    getMouse()
    {
        return { x : mouseX / this.zoom.zoom, y : mouseY / this.zoom.zoom };
    }

    getMouseConstrained()
    {
        let mouse = this.getMouse();
        return {x : constrain(mouse.x, 0, width), y : constrain(mouse.y, 0, height)};
    }

    getPMouse()
    {
        return { x : pmouseX / this.zoom.zoom, y : pmouseY / this.zoom.zoom };
    }

    getMouseDelta()
    {
        let mouse = this.getMouse();
        let pMouse = this.getPMouse();
        return {x : mouse.x - pMouse.x, y : mouse.y - pMouse.y};
    }

    getMouseDeltaByEvent(event)
    {
        return {x : event.movementX / this.zoom.zoom, y : event.movementY / this.zoom.zoom};
    }

    setInstrument(name)
    {
        this.instruments.forEach(instrument =>
        {
            if(instrument.name == name) 
            {
                this.instrument = instrument;
            }
        });
    }

    mouseInCanvas()
    {
        let rect = this.canvasDiv.getBoundingClientRect();
        let parentRect = this.canvasParent.getBoundingClientRect();
        let dy = Math.min(0, (rect.top - parentRect.top) / this.zoom.zoom);
        let dY = Math.max(0, (rect.bottom - parentRect.bottom) / this.zoom.zoom);
        let dx = Math.min(0, (rect.left - parentRect.left) / this.zoom.zoom);
        let dX = Math.max(0, (rect.right - parentRect.right) / this.zoom.zoom);
        let mouse = this.getMouse();
        return (mouse.x + dx >= 0 && mouse.x + dX <= width && mouse.y + dy >= 0 && mouse.y + dY <= height);
    }

    drawCheck()
    {
        if(!mouseIsPressed) return false;
        if(mouseButton != LEFT) return false;
        if(!this.mouseInCanvas()) return false;
        return true;
    }
}

let canvas = new Canvas();

function setup()
{
    canvas.setup("Canvas", 800, 600);
    Array.from(document.getElementsByClassName("Mode")).forEach(button =>
    {
        button.addEventListener("click", () =>
        {
            canvas.setInstrument(button.id);
        });
    });
}

function draw()
{
    canvas.outerLayer.clear();
    
    if (canvas.drawCheck())
    {
        canvas.drawn = true;
        canvas.instrument.use();
    }

    canvas.instrument.drawEachFrame();
}

function mouseReleased()
{
    canvas.instrument.mouseReleased();
    if(canvas.drawn)
    {
        canvas.drawn = false;
        loadPixels();
    }
}

function mouseDragged(event)
{
    canvas.instrument.mouseDragged(event);
}

function mousePressed()
{
    canvas.instrument.mousePressed();
}

function mouseWheel(event)
{
    if(!keyIsDown(CONTROL)) return;
    canvas.zoomByMouseWheel(event);
    event.preventDefault();
}