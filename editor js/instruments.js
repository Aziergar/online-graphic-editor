class Color
{
    constructor(r, g, b, a = 255)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    isEqual(color, deviation = 0)
    {
        if (Math.abs(this.r - color.r) / 255 > deviation) return false;
        if (Math.abs(this.g - color.g) / 255 > deviation) return false;
        if (Math.abs(this.b - color.b) / 255 > deviation) return false;
        if (Math.abs(this.a - color.a) / 255 > deviation) return false;
        return true;
    }

    toRGB()
    {
        let ratio = this.a / 255;
        if(ratio == 1) return this;
        return new Color(Math.round(this.r * ratio + 255 * (1 - ratio)),
                         Math.round(this.g * ratio + 255 * (1 - ratio)),
                         Math.round(this.b * ratio + 255 * (1 - ratio)), 255);
    }

    stringify()
    {
        return "rgba(" + this.r.toString() + ", " + this.g.toString() + ", " + this.b.toString() + ", " + this.a.toString() + ")";
    }
}

let black = new Color(0, 0, 0);
let white = new Color(255, 255, 255);

class Canvas
{
    setup(divID, _width, _height, color = white)
    {
        this.color = color;
        this.drawn = false;
        this.canvasParent = createDiv();
        this.canvasParent.parent(divID);
        this.canvasParent.size(_width, _height);
        this.canvasParent.style("overflow: hidden");
        this.canvas = createCanvas(_width, _height);
        this.outerLayer = createGraphics(_width, _height);
        this.zoom = { zoom : 1, zoomX : 0, zoomY : 0, delta : 0, zoomSensitivity : 0.001, zoomMin : 0.1, zoomMax : Math.max(_width, _height) / 25};
        this.translate = { x : 0, y : 0};
        this.origin = { x : 0, y : 0};
        this.layers = [this.canvas, this.outerLayer];
        this.layers.forEach(layer =>
        {
            layer.parent(this.canvasParent);
            layer.position(0, 0, "absolute");
            layer.show();
        });
        this.layers = [this.canvasParent];
        this.canvasRect = this.canvas.elt.getBoundingClientRect();
        background(color.r, color.g, color.b, color.a);
        this.instruments = [new SelectImage("SelectImage", this.outerLayer),
                            new Text("Text", this.outerLayer),
                            new Marker("Marker", new Thickness(1, 5), new Color(0, 0, 0, 255)), 
                            new Fill("Fill", 0.3), 
                            new Pencil("Pencil", new Thickness(1, 5), new Color(0, 0, 0, 255)),
                            new Eraser("Eraser", new Thickness(10, 100))];
        this.setInstrument("Marker");
        this.canvas.loadPixels();
    }

    addLayer(element)
    {
        this.layers.push(element);
        element.parent(this.canvasParent);
        this.layers = [this.canvasParent];
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
        this.layers.forEach(layer =>
        {
                layer.style("transform-origin: " + (x - layer.position().x).toString() + "px " + (y - layer.position().y).toString() + "px;");
        });
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
        this.canvasRect = this.canvas.elt.getBoundingClientRect();
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
        let rect = this.canvasParent.elt.getBoundingClientRect();
        let parentRect = this.canvasParent.parent().getBoundingClientRect();
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

class Thickness
{
    constructor(min, max, delta = 1)
    {
        this.min = min;
        this.max = max;
        this.delta = delta;
    }
}

class Instrument
{
    constructor(name, thickness, color = black)
    {
        this.color = color;
        this.name = name;
        this.thickness = thickness.min;
        this.thicknessRange = thickness;
    }

    applyForLine(func)
    {
        let current = createVector(canvas.getPMouse().x, canvas.getPMouse().y);
        let end = createVector(canvas.getMouse().x, canvas.getMouse().y);
        let delta = p5.Vector.sub(end, current);
        delta.normalize();
        while(!current.equals(end))
        {
            if(p5.Vector.sub(end, current).dot(delta) < 0) return;
            func(current.x, current.y, this.color, this.thickness);
            current.add(delta);
        }
        func(current.x, current.y, this.color, this.thickness);
    }

    mousePressed(){}
    mouseReleased(){}
    mouseDragged(event){}

    drawEachFrame(){}
}

class Pencil extends Instrument
{
    draw(x, y, col, thickness)
    {
        x = Math.round(x);
        y = Math.round(y);
        let d = pixelDensity();
        let area = [];
        if(col.a < 255)
        {
            area = copyArea(0, 0, thickness * d, thickness * d);
            copyPasteArea(Math.max((x - thickness / 2) * d, 0), Math.max((y - thickness / 2) * d, 0), 0, 0, thickness * d, thickness * d);
            for(let i = 0; i < thickness; i++)
            {
                for(let j = 0; j < thickness; j++)
                {
                    setPixelColor(i, j, col, false, false);
                }
            }
        }
        else
        {
            for(let i = 0; i < thickness; i++)
            {
                setPixelColor(0, i, col, true, false);
                setPixelColor(thickness - 1, i, col, true, false);
                setPixelColor(i, 0, col, true, false);
                setPixelColor(i, thickness - 1, col, true, false);
            }
        }
        updatePixels(x - thickness / 2, y - thickness / 2, thickness, thickness);
        if(col.a == 255)
        {
            rectMode(CENTER);
            fill(color(col.r, col.g, col.b, col.a));
            noStroke();
            rect(x, y, thickness, thickness);
        }
        else pasteArea(0, 0, thickness * d, thickness * d, area);
    }

    use()
    {
        this.applyForLine(this.draw);
    }
}

class Eraser extends Pencil
{
    constructor(name, thickness)
    {
        super(name, thickness, canvas.color);
    }
}

class Marker extends Instrument
{
    use()
    {
        strokeWeight(this.thickness);
        stroke(color(this.color.r, this.color.g, this.color.b, this.color.a));
        line(canvas.getPMouse().x, canvas.getPMouse().y, canvas.getMouse().x, canvas.getMouse().y);
    }
}

class Fill extends Instrument
{
    constructor(name, deviation = 0, color = black)
    {
        super(name, new Thickness(0, 0, 0), color);
        this.deviation = deviation;
    }

    static FillLine = class
    {
        constructor(x, y, color)
        {
            this.x1 = x;
            this.x2 = x;
            this.y = y;
            this.color = color;
        }
    
        draw()
        {
            for(let x = this.x1; x <= this.x2; x++)
            {
                setPixelColor(x, this.y, this.color);
            }
        }
    }

    fillByLines(x, y)
    {
        x = Math.trunc(x);
        y = Math.trunc(y);
        let iterations = 0;
        let d = pixelDensity();
        let stack = [];
        stack.push(new Fill.FillLine(x * d, y * d, this.color));

        let filler = this;
        function createIntervals(line, deltaY)
        {
            let newInterval = true;
            let y = line.y + deltaY;
            if(y == height * d * (0.5 + 0.5 * deltaY)) return;
            for(let x = line.x1; x <= line.x2; x++)
            {
                if(getPixelColor(x, y).isEqual(filler.baseColor, filler.deviation))
                {
                    if(newInterval)
                    {
                        stack.push(new Fill.FillLine(x, y, filler.color));
                        newInterval = false;
                    }
                    else
                    {
                        stack[stack.length - 1].x2 = x;
                    }
                }
                else newInterval = true;
            }
        }

        while(stack.length != 0)
        {
            iterations++;
            if(iterations > 10000) return;
            let line = stack.pop();

            while(line.x1 > 0 && getPixelColor(line.x1 - 1, line.y).isEqual(this.baseColor, this.deviation))
            {
                line.x1--;
            }

            while(line.x2 < width * d - 1 && getPixelColor(line.x2 + 1, line.y).isEqual(this.baseColor, this.deviation))
            {
                line.x2++;
            }

            line.draw();

            createIntervals(line,  1);
            createIntervals(line, -1);
        }
    }

    use()
    {
        loadPixels();
        this.baseColor = getPixelColor(canvas.getMouse().x * pixelDensity(), canvas.getMouse().y * pixelDensity());
        if(this.baseColor.isEqual(this.color, this.deviation)) return;
        this.fillByLines(canvas.getMouse().x, canvas.getMouse().y);
        updatePixels();
    }
}

class Select extends Instrument
{
    constructor(name, layer)
    {
        super(name, new Thickness(0, 0, 0), canvas.color);
        this.layer = layer;
        this.point1 = null;
        this.point2 = null;
        this.area = new DashedLine(layer);
        this.selected = false;
        this.movePositions = ["INSIDE", "LEFT", "RIGHT", "TOP", "BOTTOM"];
        this.scalePositions = ["LEFT-CENTER", "RIGHT-CENTER", "TOP-CENTER", "BOTTOM-CENTER", "LEFT-TOP", "RIGHT-TOP", "LEFT-BOTTOM", "RIGHT-BOTTOM"];
    }

    onSelect()
    {
        this.img = new Img(this.point1, this.point2, this.color);
    }
    onDeselect() {}
    onFlip() {}
    onDraw()
    {
        let rect = this.img.getRect(this.point1, this.point2);
        this.img.x = rect.x;
        this.img.y = rect.y;
        this.img.w = rect.w;
        this.img.h = rect.h;
        this.img.drawn = true;
    }

    mouseDragged(event)
    {
        if(!this.img)
        {
            let mouse = canvas.getMouseConstrained();
            this.point2 = createVector(mouse.x, mouse.y);
        }
        else
        {
            let mouseDelta = canvas.getMouseDeltaByEvent(event);
            mouseDelta = createVector(mouseDelta.x, mouseDelta.y);
            if(this.movePositions.includes(this.dragPosition))
            {
                this.point1.add(mouseDelta);
                this.point2.add(mouseDelta);       
            }
            else if(this.scalePositions.includes(this.dragPosition))
            {
                let dragPositions = [["RIGHT", "LEFT"], ["BOTTOM", "TOP"]];
                let sizes = [this.img.w, this.img.h];
                let deltas = [mouseDelta.x, mouseDelta.y];
                let axes = ["X", "Y"];
                for(let i = 0; i < dragPositions.length; i++)
                {
                    for(let j = 0; j < dragPositions[i].length; j++)
                    {
                        if(this.dragPosition.includes(dragPositions[i][j])
                            && sizes[i] + deltas[i] * Math.pow(-1, j) < Math.abs(deltas[i]))
                            {
                                this.dragPosition = this.dragPosition.replace(dragPositions[i][j], 
                                    dragPositions[i][(j + 1) % dragPositions[i].length]);
                                this.onFlip(axes[i]);
                            }
                    }
                }
                this.img.resizeByDelta(mouseDelta.x, mouseDelta.y, this.dragPosition);
                this.point1 = createVector(this.img.x, this.img.y);
                this.point2 = createVector(this.img.x + this.img.w, this.img.y + this.img.h);
            }
        }
    }

    mousePressed()
    {
        if(!this.img || !this.img.mouseOver())
        {
            if(this.img) this.onDeselect();
            this.selected = false;
            let mouse = canvas.getMouseConstrained();
            this.point1 = createVector(mouse.x, mouse.y);
            this.img = null;
        }
        else this.dragPosition = this.img.mouseOver();
    }

    mouseReleased()
    {
        if(!this.selected)
        {
            this.selected = true;
            let mouse = canvas.getMouseConstrained();
            this.point2 = createVector(mouse.x, mouse.y);
            if(this.point1.x == this.point2.x || this.point1.y == this.point2.y) this.selected = false;
            else this.onSelect();
        }
    }

    use()
    {
        if(!this.selected)
        {
            let mouse = canvas.getMouseConstrained();
            this.area.drawRect(this.point1, createVector(mouse.x, mouse.y));
        }
    }

    drawEachFrame()
    {
        if(this.selected)
        {
            this.onDraw();
            this.area.patternOffset += deltaTime / 40;
            this.area.drawRect(this.point1, this.point2);
            this.layer.push();
            this.layer.rectMode(CENTER);
            this.layer.stroke(0);
            this.layer.strokeWeight(constrain(1 / canvas.zoom.zoom, 1, 100));
            this.layer.fill(color(255, 255, 255, 100));
            let width = constrain(10 / canvas.zoom.zoom, 4, 100);
            this.layer.rect(this.img.x, this.img.y, width);
            this.layer.rect(this.img.x, this.img.y + this.img.h, width);
            this.layer.rect(this.img.x + this.img.w, this.img.y, width);
            this.layer.rect(this.img.x + this.img.w, this.img.y + this.img.h, width);
            this.layer.rect(this.img.x, this.img.y + this.img.h / 2, width);
            this.layer.rect(this.img.x + this.img.w / 2, this.img.y, width);
            this.layer.rect(this.img.x + this.img.w, this.img.y + this.img.h / 2, width);
            this.layer.rect(this.img.x + this.img.w / 2, this.img.y + this.img.h, width);
            this.layer.pop();
        }
    }
}

class SelectImage extends Select
{
    onSelect()
    {
        this.img = new Img(this.point1, this.point2, canvas.canvas);
        let img = new Img(this.point1, this.point2, this.color);
        img.draw(canvas.canvas, this.point1, this.point2);
    }

    onDeselect()
    {
        this.img.draw(canvas.canvas, this.point1, this.point2);
    }

    onFlip(axis)
    {
        this.img.flip(axis);
    }

    onDraw()
    {
        this.img.draw(this.layer, this.point1, this.point2);
    }
}

class Text extends Select
{
    constructor(name, layer, color = black, bold = false, italic = false, fontSize = 14, font = "Arial")
    {
        super(name, layer);
        this.style = NORMAL;
        if(bold && italic) this.style = BOLDITALIC;
        else if(bold) this.style = BOLD;
        else if(italic) this.style = ITALIC;
        this.fontSize = fontSize;
        this.fontColor = color;
        this.font = font;
        this.movePositions = ["LEFT", "RIGHT", "TOP", "BOTTOM"];
        this.textArea = createElement("textarea");
        canvas.addLayer(this.textArea);
        this.textArea.style("background: transparent");
        this.textArea.style("border: none");
        this.textArea.style("outline: none");
        this.textArea.style("resize: none");
        this.textArea.style("overflow: hidden");
        this.textArea.style("font-size", fontSize);
        this.textArea.style("font-family", font);
        this.textArea.style("color: " + this.fontColor.stringify());
        this.textArea.style("font-style:", italic ? "italic" : "normal");
        this.textArea.style("font-weight:", bold ? "bold" : "normal");
        this.textArea.hide();
    }

    onSelect()
    {
        super.onSelect();
        this.textArea.show();
    }

    onDeselect()
    {
        push();
        textSize(this.fontSize);
        textFont(this.font);
        textStyle(this.style);
        textWrap(WORD);
        fill(color(this.fontColor.r, this.fontColor.g, this.fontColor.b, this.fontColor.a));
        strokeWeight(0);
        let dx = parseFloat(this.textArea.style("padding"));
        let dy = dx + 2;
        let content = this.textArea.value();
        let line = "";
        let dh = 0;
        for(let i = 0; i <= content.length; i++)
        {
            let wrap = false;
            if(textWidth(line.slice(line.lastIndexOf(" "))) > this.img.w - dx * 2) wrap = true;
            if(i == content.length || content[i] == "\n" || wrap)
            {
                text(line, this.img.x + dx, this.img.y + dy + dh, this.img.w, this.img.h - dh);
                dh += this.fontSize;
                line = "";
                if(wrap && i < content.length) line += content[i];
            }
            else line += content[i];
        }
        pop();
        this.textArea.hide();
        this.textArea.value("");
    }

    onDraw()
    {
        super.onDraw();
        this.textArea.position(this.img.x, this.img.y);
        let h = this.textArea.elt.scrollHeight >= this.textArea.elt.clientHeight ? this.textArea.elt.scrollHeight : this.img.h;
        h = Math.max(h, this.img.h);
        h = this.img.h;
        this.textArea.size(this.img.w, h);
    }
}

class DashedLinePattern
{
    constructor()
    {
        this.intervals = [];
    }

    addInterval(color, length)
    {
        this.intervals.push({color: color, length: length});
    }

    getLength()
    {
        let length = 0;
        this.intervals.forEach(interval =>
        {
            length += interval.length;
        });
        return length;
    }

    resize(length)
    {
        let ratio = this.getLength() / length;
        this.interals.forEach(interval =>
        {
            interval.length *= ratio;
        });
    }
}

standartDashedLinePattern = new DashedLinePattern;
standartDashedLinePattern.addInterval(black, 10);
standartDashedLinePattern.addInterval(white, 10);

class DashedLine
{
    constructor(layer, weight = 1, patternOffset = 0, pattern = standartDashedLinePattern)
    {
        this.layer = layer;
        this.weight = weight;
        this.pattern = pattern;
        this.calculatePatternOffset(patternOffset);
    }
    
    calculatePatternOffset(patternOffset)
    {
        let length = this.pattern.getLength();
        this.patternOffset = patternOffset % length;
        if(this.patternOffset < 0) this.patternOffset = length + this.patternOffset;
    }

    connectVertices(vertice1, vertice2)
    {
        let path = p5.Vector.sub(vertice2, vertice1);
        let direction = p5.Vector.normalize(path);
        let distance = path.mag();

        let offset = this.patternOffset;
        let i;

        for(i = 0; i < this.pattern.intervals.length; i++)
        {
            if(offset > this.pattern.intervals[i].length)
            {
                offset -= this.pattern.intervals[i].length;
            }
            else break;
        }
        if(i == this.pattern.intervals.length) i--;

        while(distance > 0)
        {
            let length = Math.min(this.pattern.intervals[i].length - offset, distance);
            let color = this.pattern.intervals[i].color;

            this.layer.stroke(color.r, color.g, color.b, color.a);
            vertice2 = p5.Vector.add(vertice1, p5.Vector.mult(direction, length));
            this.layer.line(vertice1.x, vertice1.y, vertice2.x, vertice2.y);
            vertice1 = vertice2;
            distance -= length;
            this.patternOffset += length;
            offset = 0;
            i++;
            i %= this.pattern.intervals.length;
        }
        this.patternOffset %= this.pattern.getLength();
    }

    drawShape(vertices)
    {
        this.calculatePatternOffset(this.patternOffset);
        this.layer.strokeCap(SQUARE);
        this.layer.strokeWeight(this.weight);
        let startOffset = this.patternOffset;

        for(let i = 0; i < vertices.length - 1; i++)
        {
            this.connectVertices(vertices[i], vertices[i + 1]);
        }

        this.patternOffset = startOffset;
    }

    drawRect(vertice1, vertice2)
    {
        this.drawShape([vertice1, createVector(vertice2.x, vertice1.y), vertice2, createVector(vertice1.x, vertice2.y), vertice1]);
    }
}