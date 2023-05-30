function setup()
{
    canvas.setup("Content", 800, 600);
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