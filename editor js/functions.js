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

function copyArea(x, y, w, h)
{
    x = Math.trunc(x);
    y = Math.trunc(y);
    w = Math.trunc(w);
    h = Math.trunc(h);
    let d = pixelDensity();
    let area = [];
    area.length = w * h * d * 4;

    for(let i = 0; i < w; i++)
    {
        for(let j = 0; j < h; j++)
        {
            let index = 4 * ((y + j) * width * d + x + i);
            let areaIndex = 4 * (j * w * d + i);
            if(index < 0 || (index + 3) > pixels.length) continue;
            for(let k = 0; k < 4; k++)
            {
                area[areaIndex + k] = pixels[index + k];
            }
        }
    }
    return area;
}

function pasteArea(x, y, w, h, area)
{
    x = Math.trunc(x);
    y = Math.trunc(y);
    w = Math.trunc(w);
    h = Math.trunc(h);

    let d = pixelDensity();

    for(let i = 0; i < w; i++)
    {
        for(let j = 0; j < h; j++)
        {
            let index = 4 * ((y + j) * width * d + x + i);
            let areaIndex = 4 * (j * w * d + i);
            if(index < 0 || (index + 3) > pixels.length || (areaIndex + 3) > area.length) continue;
            for(let k = 0; k < 4; k++)
            {
                pixels[index + k] = area[areaIndex + k];
            }
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
            if(index1 < 0 || index2 < 0 || (index1 + 3) > pixels.length || (index2 + 3) > pixels.length) continue;
            for(let i = 0; i < 4; i++)
            {
                pixels[index2 + i] = pixels[index1 + i];
            }
        }
    }
}

function absDifference(num1, num2)
{
    return Math.abs(Math.abs(num1) - Math.abs(num2));
}

function isBetween(num1, num2, num3)
{
    return num1 >= num2 && num1 <= num3;
}

class Img
{
    constructor(x, y, w, h, layer)
    {
        let rect = this.getRect(x, y, w, h);
        if(!layer && !h) layer = w;
        this.img = createImage(rect.w * pixelDensity(), rect.h * pixelDensity());
        this.resizedImg = createImage(rect.w * pixelDensity(), rect.h * pixelDensity());
        if(!layer.r) this.img.copy(layer, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w * pixelDensity(), rect.h * pixelDensity());
        else this.setColor(layer);
        this.drawn = false;
        this.w = rect.w;
        this.h = rect.h;
        this.copyToResized();
    }

    copyToResized()
    {
        this.resizedImg.copy(this.img, 0, 0, this.img.width, this.img.height, 0, 0, this.resizedImg.width, this.resizedImg.height);
    }

    setColor(color)
    {
        this.img.loadPixels();
            for(let i = 0; i < this.img.height; i++)
            {
                for(let j = 0; j < this.img.width; j++)
                {
                    let index = (i * this.img.width + j) * 4;
                    this.img.pixels[index    ] = color.r;
                    this.img.pixels[index + 1] = color.g;
                    this.img.pixels[index + 2] = color.b;
                    this.img.pixels[index + 3] = color.a;
                }
            }
        this.img.updatePixels();
        this.copyToResized();
    }

    getRect(x, y, w, h)
    {
        if(!x)
        {
            x = this.x;
            y = this.y;
            w = this.w;
            h = this.h;
        }
        if(!h)
        {
            w = y.x - x.x;
            h = y.y - x.y;
            y = x.y;
            x = x.x;
        }
        if(w < 0)
        {
            x += w;
            w = -w;
        }
        if(h < 0)
        {
            y += h;
            h = -h;
        }
        x = Math.trunc(x);
        y = Math.trunc(y);
        w = Math.trunc(w);
        h = Math.trunc(h);
        return {x : x, y : y, w : w, h : h};
    }

    flip(flipDirection = "X")
    {
        this.img.loadPixels();
        let h = flipDirection == "Y" ? this.img.height / 2 : this.img.height;
        let w = flipDirection == "X" ? this.img.width / 2 : this.img.width;
        for(let i = 0; i < h; i++)
        {
            for(let j = 0; j < w; j++)
            {
                let index1 = (i * this.img.width + j) * 4;
                let k = flipDirection == "Y" ? this.img.height - 1 - i : i;
                let l = flipDirection == "X" ? this.img.width - 1 - j : j;
                let index2 = (k * this.img.width + l) * 4;
                for(let m = 0; m < 4; m ++)
                {
                    [this.img.pixels[index1 + m], this.img.pixels[index2 + m]] = [this.img.pixels[index2 + m], this.img.pixels[index1 + m]];
                }
            }
        }
        this.img.updatePixels();
    }

    draw(layer, x, y, w, h)
    {
        let rect = this.getRect(x, y, w, h);
        if(layer == canvas.canvas) image(this.img, rect.x, rect.y, rect.w, rect.h);
        else layer.image(this.img, rect.x, rect.y, rect.w, rect.h);
        this.drawn = true;
        this.x = rect.x;
        this.y = rect.y;
        this.w = rect.w;
        this.h = rect.h;
    }

    resize(newW, newH, direction = "RIGHT")
    {
        newW = Math.trunc(newW);
        newH = Math.trunc(newH);

        if(direction.includes("LEFT")) this.x -= newW - this.w;
        if(direction.includes("TOP")) this.y -= newH - this.h;

        if(direction == "RIGHT" || direction == "LEFT") this.w = newW;
        else if(direction == "TOP" || direction == "BOTTOM") this.h = newH;
        else
        {
            this.w = newW;
            this.h = newH;
        }
    }

    resizeByDelta(deltaX, deltaY, direction = "RIGHT", isProportional = false)
    {
        if(direction.includes("LEFT")) deltaX *= -1;
        if(direction.includes("TOP")) deltaY *= -1;
        if(isProportional)
        {
            if(deltaX >= deltaY) this.resize(this.w + deltaX, 0, direction);
            else this.resize(0, this.h + deltaY, direction);
        }
        else
        {
            this.resize(this.w + deltaX, this.h + deltaY, direction);
        }
    }

    mouseOver()
    {
        if(this.drawn && canvas.mouseInCanvas())
        {
            let mouse = canvas.getMouse();
            let distance = null;
            let scaleDirection = null;
            if(isBetween(mouse.x, this.x, this.x + this.w) && isBetween(mouse.y, this.y, this.y + this.h)) scaleDirection = "INSIDE";
            function checkEdgeDistance(edge, img)
            {
                let mouseButtons;
                let borders;
                let dif = null;
                switch(edge)
                {
                    case "LEFT":
                        mouseButtons = [mouse.y, mouse.x];
                        borders = [img.y, img.y + img.h, img.x];
                        break;
                    case "RIGHT":
                        mouseButtons = [mouse.y, mouse.x];
                        borders = [img.y, img.y + img.h, img.x + img.w];
                        break;
                    case "TOP":
                        mouseButtons = [mouse.x, mouse.y];
                        borders = [img.x, img.x + img.w, img.y];
                        break;
                    case "BOTTOM":
                        mouseButtons = [mouse.x, mouse.y];
                        borders = [img.x, img.x + img.w, img.y + img.h];
                        break;
                    case "LEFT-TOP":
                        dif = dist(img.x, img.y, mouse.x, mouse.y);
                        break;
                    case "RIGHT-TOP":
                        dif = dist(img.x + img.w, img.y, mouse.x, mouse.y);
                        break;
                    case "RIGHT-BOTTOM":
                        dif = dist(img.x + img.w, img.y + img.h, mouse.x, mouse.y);
                        break;
                    case "LEFT-BOTTOM":
                        dif = dist(img.x, img.y + img.h, mouse.x, mouse.y);
                }
                if(dif || isBetween(mouseButtons[0], borders[0], borders[1]))
                {
                    if(!dif) dif = absDifference(mouseButtons[1], borders[2]);
                    if(dif <= 20 / canvas.zoom.zoom && (edge.includes("-") || (!distance || dif < distance)))
                    {
                        distance = dif;
                        scaleDirection = edge;
                    }
                }
            }
            checkEdgeDistance("LEFT", this);
            checkEdgeDistance("RIGHT", this);
            checkEdgeDistance("TOP", this);
            checkEdgeDistance("BOTTOM", this);
            checkEdgeDistance("LEFT-TOP", this);
            checkEdgeDistance("RIGHT-TOP", this);
            checkEdgeDistance("RIGHT-BOTTOM", this);
            checkEdgeDistance("LEFT-BOTTOM", this);
            return scaleDirection;
        }
        return null;
    }
}