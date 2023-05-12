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
}

let black = new Color(0, 0, 0);
let white = new Color(255, 255, 255);

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
        super(name, new Thickness(0, 0, 0));
        this.layer = layer;
        this.point1 = null;
        this.point2 = null;
        this.area = new DashedLine(layer);
        this.selected = false;
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
            if(this.dragPosition == "INSIDE")
            {
                this.point1.add(mouseDelta);
                this.point2.add(mouseDelta);       
            }
            else 
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
                                this.img.flip(axes[i]);
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
            if(this.img) this.img.draw(canvas.canvas, this.point1, this.point2);
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
            else 
            {
                this.img = new Img(this.point1, this.point2, canvas.canvas);
                let img = new Img(this.point1, this.point2, canvas.color);
                img.draw(canvas.canvas, this.point1, this.point2);
            }
        }
    }

    use()
    {
        if(!this.selected || this.img.mouseOver() == "INSIDE")
        {
            let mouse = canvas.getMouseConstrained();
            this.area.drawRect(this.point1, createVector(mouse.x, mouse.y));
        }
    }

    drawEachFrame()
    {
        if(this.selected)
        {
            this.img.draw(this.layer, this.point1, this.point2);
            this.area.patternOffset += deltaTime / 40;
            this.area.drawRect(this.point1, this.point2);
        }
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