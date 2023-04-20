class Canvas
{
    setup(divId, color = white)
    {
        this.canvasDiv = document.getElementById(divId).getBoundingClientRect();
        this.canvas = createCanvas(this.canvasDiv.width, this.canvasDiv.height);
        this.canvas.position(this.canvasDiv.left, this.canvasDiv.top);
        background(color.r, color.g, color.b, color.a);
        this.instruments = [new Marker("Marker", new Thickness(1, 5), new Color(0, 0, 0, 10)), new Fill("Fill", 0.3), new Pencil("Pencil", new Thickness(1, 5), new Color(0, 0, 0, 10))];
        this.instrument = this.instruments[0];
        loadPixels();
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
        return (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);
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
let previousMouseX = 0, previousMouseY = 0;

function setup()
{
    canvas.setup("Canvas");
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
    if (canvas.drawCheck())
    {
        canvas.instrument.use();
    }
}