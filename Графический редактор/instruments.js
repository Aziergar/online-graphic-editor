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

function getPixelColor(x, y)
{
    x = Math.trunc(x);
    y = Math.trunc(y);
    let d = pixelDensity();
    let index = Math.trunc(4 * (y * width * d + x));
    return new Color(pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]);
}

function setPixelColor(x, y, color, isReplace = false, isRealPixel = true)
{
    if(isReplace) color = color.toRGB();
    x = Math.trunc(x);
    y = Math.trunc(y);
    let d = pixelDensity();
    let ratio = color.a / 255;
    for (let i = 0; i < d; i++)
    {
        for (let j = 0; j < d; j++)
        {
            let index = isRealPixel ? 4 * (y * width * d + x)
                                    : 4 * ((y * d + j) * width * d + (x * d + i));
            pixels[index    ] = Math.round(pixels[index    ] * (1 - ratio) + color.r * ratio);
            pixels[index + 1] = Math.round(pixels[index + 1] * (1 - ratio) + color.g * ratio);
            pixels[index + 2] = Math.round(pixels[index + 2] * (1 - ratio) + color.b * ratio);
            pixels[index + 3] = 255;
            if(isRealPixel) return;
        }
    }
}

function copyPasteArea(x1, y1, x2, y2, w, h)
{
    x1 = Math.trunc(x1);
    y1 = Math.trunc(y1);
    x2 = Math.trunc(x2);
    y2 = Math.trunc(y2);
    w = Math.trunc(w);
    h = Math.trunc(h);
    let d = pixelDensity();
    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            let index1 = 4 * ((y1 + y) * width * d + x1 + x);
            let index2 = 4 * ((y2 + y) * width * d + x2 + x);
            for(let i = 0; i < 4; i++)
            {
                pixels[index2 + i] = pixels[index1 + i];
            }
        }
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
        let current = createVector(pmouseX, pmouseY);
        let end = createVector(mouseX, mouseY);
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
}

class Pencil extends Instrument
{
    draw(x, y, col, thickness)
    {
        x = Math.round(x);
        y = Math.round(y);
        let d = pixelDensity();
        copyPasteArea(x * d, y * d, 0, 0, thickness * d, thickness * d);
        for(let i = 0; i < thickness; i++)
        {
            for(let j = 0; j < thickness; j++)
            {
                setPixelColor(i, j, col, false, false);
            }
        }
        updatePixels(x - thickness / 2, y - thickness / 2, thickness, thickness);
        copyPasteArea(0, 0, x * d, y * d, thickness * d, thickness * d);
    }

    use()
    {
        this.applyForLine(this.draw);
    }
}

// class Eraser extends Pencil
// {
//     constructor(name, thickness, color)
// }

class Marker extends Instrument
{
    use()
    {
        strokeWeight(this.thickness);
        stroke(color(this.color.r, this.color.g, this.color.b, this.color.a));
        line(pmouseX, pmouseY, mouseX, mouseY);
    }
}

class FillLine
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

class Fill extends Instrument
{
    constructor(name, deviation = 0, color = black)
    {
        super(name, new Thickness(0, 0, 0), color);
        this.deviation = deviation;
    }

    fillByLines(x, y)
    {
        x = Math.trunc(x);
        y = Math.trunc(y);
        let iterations = 0;
        let d = pixelDensity();
        let stack = [];
        stack.push(new FillLine(x * d, y * d, this.color));

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
                        stack.push(new FillLine(x, y, filler.color));
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
        this.baseColor = getPixelColor(mouseX * pixelDensity(), mouseY * pixelDensity());
        if(this.baseColor.isEqual(this.color, this.deviation)) return;
        this.fillByLines(mouseX, mouseY);
        updatePixels();
    }
}