class WebGlText extends JSWebGlSquare {
    constructor(WebGlContext,WebGlShader) {
        super(WebGlContext, MainShaderContext,[1, 1, 1, 1]);
        this._targetCanvas = document.createElement("canvas");

        // WebGl Objects
        this._TextCanvasTexture = new JSWebGlCanvasTexture(WebGlContext, this._targetCanvas);
        this._canvasContext = this._TextCanvasTexture.GetCanvasContext();
        this._targetCanvas = this._TextCanvasTexture.GetCanvas();

        this.properties = {
            style: {
                fontSize: 100,
                fontType: "arial",
                textAlign: "center",
                fontColour: "#ffffff"
            },
            strokeStyle: {
                width: 3,
                colour: [0, 0, 0, 1]
            },
            maxLength: 0,
            maxHeight: 0,
        }

        this.ExternalTexture = this._TextCanvasTexture;
    }

    // Set font using font face#
    // Refresh texture when font is loaded
    SetFontAsFontFace(newFontFace) {
        if (newFontFace.constructor.name == "FontFace") {
            newFontFace.load().then((result) => {
                this.properties.style.fontType = newFontFace.family;
                this.SetText(this.TextString);
            })
        }
    }

    // Get length of string with current properties
    _getRenderLength(string) {
        this._canvasContext.font = this.properties.style.fontSize + "px " + this.properties.style.fontType;
        this._canvasContext.textAlign = "left";
        this._canvasContext.textBaseline = "alphabetic";

        let measureMetric = this._canvasContext.measureText(string);
        let width = measureMetric.actualBoundingBoxLeft + measureMetric.actualBoundingBoxRight;

        return width;
    }

    // Splits string into words
    // Includes length of each split
    _splitIntoParts(string) {
        // Return list of words
        let returnList = []

        let currentWord = "";
        for (let char = 0; char < string.length; char++) {

            // Don't add new line char
            if (string[char] != "\n") {
                currentWord += string[char];
            }

            if (
                string[char] == " " ||
                string[char] == "."
            ) {
                returnList.push([currentWord, this._getRenderLength(currentWord)]);
                currentWord = "";
            }
            // If char is new line, add word then nl char
            else if (string[char] == "\n") {
                returnList.push([currentWord, this._getRenderLength(currentWord)]);
                returnList.push(["\n", this._getRenderLength("\n")]);
                currentWord = "";
            }
        }

        if (currentWord.length > 0) {
            returnList.push([currentWord, this._getRenderLength(currentWord)]);
            currentWord = "";
        }
        return returnList
    }

    // Set the target string and update texture
    SetText(string) {
        document.fonts.ready.then(() => {

            this.TextString = string;
            let splitList = this._splitIntoParts(string);

            let lines = [];

            let currentLine = "";
            let remainingLength = this.properties.maxLength;

            // There is no maxLength ( = 0)
            // String is one line (except \n)
            if (this.properties.maxLength <= 0) {
                for (let i = 0; i < splitList.length; i++) {
                    if (splitList[i][0] != "\n") {
                        currentLine += splitList[i][0];
                    } else {
                        lines.push(currentLine);
                        currentLine = "";
                    }
                }
                lines.push(currentLine);
            }
            // Max length is set. Set lines
            else {
                this._targetCanvas.width = this.properties.maxLength;
                for (let i = 0; i < splitList.length; i++) {
                    // No nl characters
                    if (splitList[i][0] != "\n") {
                        // Split can fit within remaining space?
                        if (splitList[i][1] <= remainingLength) {
                            currentLine += splitList[i][0]; //Add the word / split
                            // Subtract remaining space
                            remainingLength -= splitList[i][1]
                        }
                            // No? Can the word/split if on own line
                        // If so, make new line and repeat check
                        else if (splitList[i][1] <= this.properties.maxLength) {
                            lines.push(currentLine);
                            currentLine = "";
                            remainingLength = this.properties.maxLength;
                            i--; // Push loop index back (repeat check)
                        }
                            // No more space for split/word
                        // Try to fit by the character
                        else {

                            let splitString = splitList[i][0]

                            for (let char = 0; char < splitString.length; char++) {
                                // Get character length
                                let charLength = this._getRenderLength(splitString[char]);

                                // Can character fit?
                                if (charLength <= remainingLength) {
                                    currentLine += splitString[char]
                                    remainingLength -= charLength;
                                    // Character can't fit, make new line
                                } else {
                                    lines.push(currentLine)
                                    currentLine = "";
                                    remainingLength = this.properties.maxLength;

                                    // Infin loop avoid
                                    // Skip character if length boundary is too short
                                    if (charLength <= this.properties.maxLength) {
                                        char--;
                                    }
                                }
                            }
                        }
                    }

                    // \n char hit, add new line
                    else {
                        lines.push(currentLine);
                        currentLine = "";
                        remainingLength = this.properties.maxLength;
                    }

                }

                // Still some characters left. Push it on
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
            }

            // Get the appropriate size of canvas
            let renderWidth = 0;
            let renderHeight = 0;

            // Render Width
            if (this.properties.maxLength == 0) {
                for (let i = 0; i < lines.length; i++) {
                    let width = this._getRenderLength(lines[i]);
                    if (width > renderWidth) {
                        renderWidth = width;
                    }
                }
            } else {
                renderWidth = this.properties.maxLength;
            }

            //Height
            renderHeight = this.properties.style.fontSize * lines.length;

            this._targetCanvas.width = renderWidth;
            this._targetCanvas.height = renderHeight;

            //Set wanted font styles/properties
            this._TextCanvasTexture.CanvasContext.clearRect(0, 0, renderWidth, renderHeight);
            this._TextCanvasTexture.CanvasContext.fillStyle = this.properties.style.fontColour;
            this._TextCanvasTexture.CanvasContext.textAlign = this.properties.style.textAlign;
            let size = this.properties.style.fontSize;
            let fontType = this.properties.style.fontType;

            this._TextCanvasTexture.CanvasContext.font = size + "px " + fontType;
            this._TextCanvasTexture.CanvasContext.textBaseline = "bottom";

            let lineY = size;
            for (let i = 0; i < lines.length; i++) {
                this._canvasContext.fillStyle = this.properties.style.fontColour;
                this._canvasContext.fillText(lines[i],
                    this._targetCanvas.width / 2,
                    lineY,
                    this._targetCanvas.width * 1
                );


                let strokeC = this.properties.strokeStyle.colour;
                let strokeW = this.properties.strokeStyle.width;

                // Only stroke/outline if there is a width
                if (strokeW > 0) {
                    this._canvasContext.strokeStyle = `rgba(
            ${strokeC[0] * 255},
            ${strokeC[1] * 255},
            ${strokeC[2] * 255},
            ${strokeC[3]}
            )`;
                    this._canvasContext.lineWidth = strokeW;
                    this._canvasContext.stroke();

                    this._canvasContext.strokeText(lines[i],
                        this._targetCanvas.width / 2,
                        lineY,
                        this._targetCanvas.width * 1
                    )

                    lineY += this.properties.style.fontSize;
                }
            }

            this._TextCanvasTexture.updateTexture();
        });
    }

}

