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
    document.addEventListener("copy", copyFunction);
    document.addEventListener("paste", pasteFunction);
    document.getElementById("Download").addEventListener("click", () =>
    {
        saveCanvas(canvas.canvas, createFileName(), "png");
    });
}
let username =  "";
function draw()
{
    canvas.outerLayer.clear();
    if (canvas.drawCheck())
    {
        canvas.drawn = true;
        let sendData = canvas.instrument.use();
    //     chatSocket.send(JSON.stringify({
    //         type: "edit_canvas",
    //         data: sendData,
    //         username: username,
    //     }));
    // }
    // while(drawData.length > 0)
    // {
    //     let instrument;
    //     let data = JSON.parse(drawData.shift());
    //     if(data.username != null)
    //     {
    //         let instrument = canvas.dataInstruments.find(element => element.name == data.name && element.username == data.username);
    //         if(!instrument) canvas.dataInstruments.push(data.name == "SelectImage" ? new SelectImage("SelectImage", canvas.onlineLayer) : new Text("Text", canvas.onlineLayer));
    //         canvas.dataInstruments[canvas.dataInstruments.length - 1].username = data.username;
    //     }
    //     else instrument = canvas.dataInstruments.find(element => element.name == data.name);
    //     instrument.useData(data);
    // }
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