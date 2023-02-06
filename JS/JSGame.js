function GetVectorMagnitude(inputVector) {
    let result = 0;
    let vecSum = 0;
    for (let i = 0; i < inputVector.length; i++) {
        vecSum += Math.pow(inputVector[i], 2);
    }
    result = Math.sqrt(vecSum);
    return result;
}

function GetNormalisedVector(inputVector) {
    let returnVector = []
    let magnitude = GetVectorMagnitude(inputVector);

    for (let i = 0; i < inputVector.length; i++) {
        if (magnitude > 0) {
            returnVector.push(inputVector[i] / magnitude);
        } else {
            returnVector.push(0);
        }
    }
    return returnVector;
}

// Touch Input Object
class JSGameTouch {
    constructor(touchIndex, HTMLElement) {
        this.id = touchIndex;
        //HTML Element touch is bound to
        this._targetElement = HTMLElement;
        this._targetElementRect = this._targetElement.getBoundingClientRect();

        this.startPos = [0, 0]; //Start point of touch
        this._lastPos = [0, 0]; //Last point in previous frame
        this.endPos = [0, 0]; //End point of touch
        this.normalisedEndPog = [0, 0];
        this.distanceVector = [0, 0];
        this.dirVector = [0, 0]; //Direction vector of touch

        this.moveDelta = [0, 0];

        //Frames since touchStart/End Event
        this._Frames = 0;

        //Start/End/ifPress Flags
        this.Down = false;
        this.isPressed = false;
        this.Up = false;
        //Duration of touch
        this.duration = 0;

        window.addEventListener("touchstart", (event) => {
            this._handleTouchStartEvent(event);
        })

        window.addEventListener("touchmove", (event) => {
            this._handleTouchMoveEvent(event)
        })

        window.addEventListener("touchend", (event) => {
            this._handleTouchEndEvent(event)
        })

        window.requestAnimationFrame((time) => {
            this._Tick();
        })
    }

    //Check for ID match in touch event
    //Return: The touch object found else null
    _CheckSelfInTouchEvent(event) {
        let matchTouch = null;
        for (let i = 0; i < event.changedTouches.length; i++) {
            if (event.changedTouches[i].identifier == this.id) {
                matchTouch = event.changedTouches[i];
            }
        }

        return matchTouch;
    }

    _handleTouchStartEvent(event) {
        let myTouch = this._CheckSelfInTouchEvent(event);

        if (!myTouch) {
            return;
        } else {
            this._targetElementRect = this._targetElement.getBoundingClientRect();

            let x = myTouch.pageX - this._targetElementRect.left;
            x -= this._targetElementRect.width / 2;
            let y = this._targetElementRect.height - (myTouch.pageY - this._targetElementRect.top);
            y -= this._targetElementRect.height / 2;


            this.startPos = [x, y];
            this._lastPos = [x, y];
            this.endPos = [x, y];
            this.Down = true;
            this.isPressed = true;
            this._Frames = 0;
            this.distanceVector = [0, 0];
        }
    }

    _handleTouchMoveEvent(event) {
        //Check if this touch did move
        let myTouch = this._CheckSelfInTouchEvent(event);

        if (!myTouch) {
            return;
        } else {
            this._targetElementRect = this._targetElement.getBoundingClientRect();

            let x = myTouch.pageX - this._targetElementRect.left;
            x -= this._targetElementRect.width / 2;
            let y = this._targetElementRect.height - (myTouch.pageY - this._targetElementRect.top);
            y -= this._targetElementRect.height / 2;

            this.endPos = [x, y];

            // Get Move Delta
            this.moveDelta = [
                this.endPos[0] - this._lastPos[0],
                this.endPos[1] - this._lastPos[1]
            ]


            this.distanceVector = [
                this.endPos[0] - this.startPos[0],
                this.endPos[1] - this.startPos[1]
            ]

            this.dirVector = GetNormalisedVector(this.distanceVector);
            this._lastPos = this.endPos;
            this.isPressed = true;
        }
    }

    _handleTouchEndEvent(event) {
        //Check if this touch changed in current event
        let myTouch = null;
        for (let i = 0; i < event.changedTouches.length; i++) {
            if (event.changedTouches[i].identifier == this.id) {
                myTouch = event.changedTouches[i];
            }
        }
        // Not this touch, do nothing
        if (!myTouch) {
            return;
        }

        this.Up = true;
        this.Down = false;
        this.isPressed = false;
        this._Frames = 0;


        this.ConsoleLogSelf();
    }

    // Reset events flags in object.
    _Reset() {
        this._Frames = 0;
        this.Down = false;

        //Respond to post touch-up event
        if (this.Up) {
            this.duration = 0;
            this.Up = false;
            this.dirVector = [0, 0];
            this.moveDelta = [0, 0];
        }
    }

    _Tick() {
        //Check if flags must be reset
        if (this.isPressed | this.Up) {
            //Increase duration flag
            this.duration += Time.deltaTime;
            this._Frames += 1;
            if (this._Frames >= 2) {
                this._Reset();
            }
        }
        window.requestAnimationFrame((time) => {
            this._Tick();
        })
    }

    // Print Contents of Self to console
    // Keep it readable
    ConsoleLogSelf() {
        console.log(
            `Touch Event:
        EndPosition: ${this.endPos},
        StartPosition: ${this.startPos},
        MoveDelta: ${this.moveDelta}`)
    }
}

//Touch input handler
//This is class is made per HTML Element
class JSGameTouchInput {
    constructor(HTMLElement) {
        this._targetElement = HTMLElement;
        this.touch = [];
        for (let i = 0; i < 10; i++) {
            this.touch.push(new JSGameTouch(i, this._targetElement));
        }
    }

    GetTouch(touchIndex) {
        if (touchIndex < 0 || touchIndex > this.touch.length) {
        }
        return this.touch[touchIndex];
    }
}

// Representation on mouse button
class JSGameMouseButton {
    constructor(TargetElement, ButtonID) {
        this.ParentElement = TargetElement;
        this.ButtonID = ButtonID;
        this.Down = false;
        this.Pressed = false;
        this.Up = false;

        this.Frames = 0;

        // Set event listeners
        this.ParentElement.addEventListener("mousedown", (event) => {
            this._RespondToMouseDownEvent(event);
        })

        this.ParentElement.addEventListener("mouseup", (event) => {
            this._RespondToMouseUpEvent(event);
        })

        this._Tick();
    }

    _RespondToMouseDownEvent(event) {
        if (event.button != this.ButtonID) {
            return
        } else {
            this.Down = true;
            this.Pressed = true;
            this.Frames = 0;
        }
    }

    _RespondToMouseUpEvent(event) {
        if (event.button != this.ButtonID) {
            return
        } else {
            this.Down = false;
            this.Pressed = false;
            this.Up = true;
            this.Frames = 0;
        }
    }

    _Reset() {
        if (this.Down) {
            this.Down = false;
        } else if (this.Up) {
            this.Up = false;
        }
    }

    _Tick() {
        this.Frames += 1;
        if (this.Frames >= 2) {
            this._Reset();
        }
        window.requestAnimationFrame(() => {
            this._Tick()
        })
    }
}

// Mouse input handler
class JSGameMouseInput {
    #TargetElement = null;
    #MoveFrames = 0;

    constructor(HTMLElement) {
        let MouseButton = {
            Down: false,
            Up: false
        }

        //Button object for l-click, r-click and middle click
        this.Button = [];
        for (let i = 0; i < 3; i++) {
            this.Button.push(new JSGameMouseButton(HTMLElement, i));
        }

        this.position = [0, 0];
        this.moveDelta = [0, 0];
        this.#TargetElement = HTMLElement;
        this.#MoveFrames = 0;
        window.addEventListener("mousemove", (event) => {
            this.#Move(event)
        })
        window.requestAnimationFrame((time) => {
            this._Tick();
        })
    }

    #Move(event) {
        let rect = this.#TargetElement.getBoundingClientRect();
        let x = event.pageX - rect.left;
        let y = event.pageY - rect.top;
        if (x > rect.width) {
            x = rect.width;
        } else if (x < 0) {
            x = 0;
        }
        if (y > rect.height) {
            y = rect.height;
        } else if (y < 0) {
            y = 0;
        }

        this.position = [x, rect.height - y];
        this.moveDelta = [event.movementX, -event.movementY];
    }

    _Tick() {
        let fsElement = document.fullscreenElement;
        if (fsElement == this._targetElemet) {
            this.inFullscreen = true;
        } else {
            this.inFullscreen = false;
        }

        this._MoveFrames += 1;
        if (this._MoveFrames >= 2) {
            this._MoveFrames = 0;
            this.moveDelta = [0, 0];
        }
        this.Pos = [...this.position];
        window.requestAnimationFrame((time) => {
            this._Tick();
        })
    }

    ConsoleLog() {
        console.log(
            `Mouse:
            MoveDelta: ${this.moveDelta}
            ---
            Left Click:
            Down: ${this.Button[0].Down}
            Up: ${this.Button[0].Up}
            Pressed: ${this.Button[0].Pressed}
            
            Right Click:
            Down: ${this.Button[2].Down}
            Up: ${this.Button[2].Up}
            Pressed: ${this.Button[2].Pressed}
            
            
            Middle Click:
            Down: ${this.Button[1].Down}
            Up: ${this.Button[1].Up}
            Pressed: ${this.Button[1].Pressed}
            `
        )
    }
}

// Keyboard Key Object
class JSGameKey {
    // To be created on key press only
    constructor(KeyString) {
        this.Name = KeyString;
        this.Down = false;
        this.Up = false;
        this.Pressed = false;
        this._Frames = 0;


        if (this.Name != null) {
            // Set up event listener
            window.addEventListener("keydown", (event) => {
                this._RespondToKeyDownEvent(event);
            })

            window.addEventListener("keyup", (event) => {
                this._RespondToKeyUpEvent(event);
            })
            this.Tick();

            this.Down = true;
            this.Pressed = true;
        }
    }

    _RespondToKeyDownEvent(event) {
        // Check if our key and not repeating
        if (event.key != this.Name || event.repeat == true) {
            return;
        }
        this.Down = true;
        this.Pressed = true;
        this._Frames = 1;
    }

    _RespondToKeyUpEvent(event) {
        if (event.key != this.Name) {
            return;
        }
        this.Up = true;
        this.Pressed = false;
        this._Frames = 1;
    }

    // Reset flags
    _Reset() {
        if (this.Down == true) {
            this.Down = false;
        } else if (this.Up) {
            this.Up = false;
            this.Pressed = false;
        }
    }

    Tick() {
        this._Frames += 1;
        if (this._Frames >= 2) {
            this._Reset();
        }

        window.requestAnimationFrame(() => {
            this.Tick()
        })
    }

    ConsoleLogSelf() {
        console.log(
            `Keyboard Key:
            Name: ${this.Name}
            Down: ${this.Down}
            Pressed: ${this.Pressed}
            Up: ${this.Up}
            `
        )
    }
}

// Keyboard Input Handler
class JSGameKeyInput {
    constructor() {
        this.Keys = []

        window.addEventListener("keydown", (event) => {
            if (!event.repeat) {
                this._AddKeyDownEvent(event);
            }
        })
    }

    GetKey(keyName) {
        let index = this._GetKeyIndex(keyName);
        if (index != null) {
            return this.Keys[index];
        } else {
            return new JSGameKey(null);
        }

    }

    DebugLogKeys() {
        console.log("Keys: ");
        for (let i = 0; i < this.Keys.length; i++) {
            console.log(this.Keys[i].value);
        }
    }

    _GetKeyIndex(keyString) {
        let returnIndex = -1;
        for (let i = 0; i < this.Keys.length; i++) {
            if (this.Keys[i].Name == keyString) {
                returnIndex = i;
            }
        }

        if (returnIndex >= 0) {
            return returnIndex;
        } else {
            return null;
        }
    }

    _AddKeyDownEvent(keyEvent) {
        if (!this._GetKeyIndex(keyEvent.key)) {
            this.Keys.push(new JSGameKey(keyEvent.key, true, true));
        }
    }
}

// Combined Input Handler for Mouse,Keyboard and Touch
class JSGameInput {
    #TouchHandler = null;
    #KeyboardHandler = null;
    #MouseHandler = null;

    constructor(HTMLElement) {
        this.#TouchHandler = new JSGameTouchInput(HTMLElement);
        this.#KeyboardHandler = new JSGameKeyInput();
        this.#MouseHandler = new JSGameMouseInput(HTMLElement);
    }
}

class JSGameCollider {
    constructor(ParentTransform, MatterJSBody, IsStatic = true) {
        this.TransformTarget = ParentTransform;
        this.Tansform = new Transform();
        this.Static = IsStatic;
        this.InitBody = MatterJSBody;
        this.Body = null;


        this.#SetToSize();
    }

    SetTransform(newTransform) {
        if (newTransform instanceof Transform) {
            this.Tansform = newTransform;
        }
    }

    #SetToSize() {
        this.Body = null;
        this.Body = Matter.Bodies.fromVertices(
            0, 0,
            this.InitBody.vertices
        )

        Matter.Body.scale(
            this.Body,
            this.TransformTarget.scale[0],
            this.TransformTarget.scale[1]
        );

        Matter.Body.setPosition(
            this.Body,
            {
                x: this.TransformTarget.position[0],
                y: this.TransformTarget.position[1]
            }
        )
    }

    Check(OtherCollider, Transform) {
        if (!OtherCollider instanceof JSGameCollider) {
            return;
        }

        this.#SetToSize();
        let otherBody = Matter.Common.clone(OtherCollider.Body, false);
        let CollisionEvent = Matter.Query.collides(this.Body, [otherBody]);

        if (CollisionEvent) {
            return CollisionEvent[0];
        } else {
            return null;
        }
    }

    //Set Body to World size based on transform
    //Used by Check function
    #SetBodyToWorldSize() {
        let sizeScale = 1;
        let sizeX = this.TransformTarget.scale[0] * sizeScale;
        let sizeY = this.TransformTarget.scale[0] * sizeScale;
        Matter.Body.scale(this.Body,
            sizeX,
            sizeY
        );

        Matter.Body.setPosition(
            this.Body,
            {
                x: this.TransformTarget.position[0],
                y: this.TransformTarget.position[1]
            }
        )

        Matter.Body.setAngle(this.Body,
            DegToRadians(this.TransformTarget.rotation[2])
        );
    }

    //Reset Body after it is set to world size
    //Since Body Scale Function does not reset.
    #ResetBodyFromWorldSize() {
        let sizeScale = 1;
        let sizeX = this.TransformTarget.scale[0] * sizeScale;
        let sizeY = this.TransformTarget.scale[1] * sizeScale;
        Matter.Body.scale(this.Body,
            1 / sizeX,
            1 / sizeY
        );

        Matter.Body.setPosition(
            this.Body,
            {
                x: 0,
                y: 0
            }
        )

        Matter.Body.setAngle(this.Body,
            0);
    }
}

class JSGameBoxCollider extends JSGameCollider {
    constructor(ParentTransform, SizeVector = [1, 1], IsStatic = true) {
        super(ParentTransform, Matter.Bodies.rectangle(0, 0, SizeVector[0] * 2, SizeVector[1] * 2), IsStatic);
    }
}

class JSGameCircleCollider extends JSGameCollider {
    constructor(
        ParentTransform, Radius = 0.5, IsStatic = true
    ) {
        super(ParentTransform, Matter.Bodies.circle(
            0, 0,
            Radius
        ), IsStatic);
    }
}

class JSGameObject {
    //Collision Events
    #CollisionEnterObj = []
    #CollisionStayObj = []
    #CollisionExitObj = []
    #SceneList = null;
    #MatterBody = null;

    constructor(name = "NullObject", options = {
        LayerName: "DefaultLayer",
    }) {
        this.transform = new Transform(); //Transform of object
        this.name = name; //Name Of Object

        this.LayerName = "DefaultLayer";
        if (options.LayerName) {
            this.LayerName = options.LayerName;
        }

        this.ParentObject = null;
        this.ChildObject = []; //Child Objects of this Object
        this.#SceneList = null;
    }

    Tick(DeltaTime) {
    }

    SetMatterBody(newBody) {
        this.#MatterBody = newBody;
    }

    GetMatterBody() {
        if (!this.#MatterBody) {
            return null;
        }
        let copyBody = Matter.Bodies.fromVertices(0, 0, this.#MatterBody.vertices);
        Matter.Body.setPosition(
            copyBody,
            {
                x: this.transform.position[0],
                y: this.transform.position[1]
            }
        );
        Matter.Body.setAngle(
            copyBody,
            this.transform.rotation[2]
        );

        Matter.Body.scale(
            copyBody,
            this.transform.scale[0] * 2,
            this.transform.scale[1] * 2
        )
        return copyBody;
    }

    CollisionCheck(otherObject) {
        let thisBody = this.GetMatterBody();
        let otherBody = otherObject.GetMatterBody();

        if (!thisBody || !otherBody) {
            return null;
        }

        let colEvent = Matter.Query.collides(
            thisBody,
            [otherBody]
        );

        if (colEvent.length > 0) {
            return colEvent[0];
        } else {
            return null;
        }
    }


    Draw(JSWebGlCamera) {
    }

    FindObjectsOfType(ObjectType) {
        let ResultArray = [];
        let AllObjects = this.SceneList;
        for (let i = 0; i < AllObjects.length; i++) {
            if (AllObjects[i] instanceof ObjectType) {
                ResultArray.push(AllObjects[i]);
            }
        }
        return ResultArray;
    }

    GetAllChildObjects() {
        let returnArray = []
        // Nodes to check
        let CurrentNodes = []
        CurrentNodes.push(...this.ChildObject);

        //While there's still nodes to check
        while (CurrentNodes.length > 0) {
            let nextToCheck = [];
            //Add current nodes to array
            returnArray.push(...CurrentNodes);

            // Check for more children nodes
            for (let i = 0; i < CurrentNodes.length; i++) {
                if (CurrentNodes[i].ChildObject.length > 0) {
                    nextToCheck.push(...CurrentNodes[i].ChildObject);
                }
            }
            CurrentNodes = [];
            CurrentNodes.push(...nextToCheck); //Move to next to check nodes
        }

        return returnArray;
    }

    GetRootObject() {
        let root = this;
        while (root.ParentObject) {
            root = root.ParentObject;
        }
        return root;
    }

    #RemoveSelfFromScene() {
        if (!this.SceneList) {
            return;
        }
        let index = this.FindObjSceneIndex(this);
        if (index != null) {
            this.SceneList.splice(index, 1);
            this.#SceneList = null;
        }

        for (let obj in this.ChildObject) {
            // Remove Child Objects from scene
            this.ChildObject[obj].#RemoveSelfFromScene();
        }
    }

    #RemoveSelfFromParent() {
        if (this.ParentObject) {
            let ChildList = this.ParentObject.ChildObject

            let matchIndex = null;
            // Look for self in parent. Remove when found.
            for (let i = 0; i < ChildList.length; i++) {
                if (this == ChildList[i]) {
                    ChildList.splice(i, 1); // Remove Self From List
                    this.ParentObject = null;
                    this.transform.parentTransform = null;
                    return;
                }
            }
        }
    }

    SetParent(otherObject) {
        if (otherObject != null && !otherObject instanceof JSGameObject) {
            return;
        }
        if (otherObject != null) {
            if (otherObject.ParentObject == this) {
                throw "GameObject Error: This Object is already parent to other GameObject"
                return;
            }
        }

        //Check if already exist
        if (otherObject != null) {
            if (otherObject instanceof JSGameObject) {
                let alreadyExist = false;
                for (let i = 0; i < otherObject.ChildObject.length; i++) {
                    if (otherObject.ChildObject[i] == otherObject) {
                        alreadyExist = true;
                        break;
                    }
                }
                // Have Space
                // Add self as child object
                if (!alreadyExist) {
                    this.#RemoveSelfFromParent();
                    this.#RemoveSelfFromScene();

                    otherObject.ChildObject.push(this);
                    this.ParentObject = otherObject;
                    this.transform.parentTransform = otherObject.transform;

                }
            }
            // Set Parent to Null
        } else {
            this.#RemoveSelfFromParent();
        }
    }

    AddToSceneList(NewList) {
        if (this.SceneList == NewList) {
            return;
        } else {
            this.#RemoveSelfFromScene();
            NewList.push(this);
            this.SceneList = NewList;
        }
    }

    // Find Object in Scene List
    // Returns Index Pos
    FindObjSceneIndex(TargetObj) {
        if (!this.SceneList) {
            return;
        }
        for (let i = 0; i < this.SceneList.length; i++) {
            if (this.SceneList[i] == TargetObj) {
                return i;
            }
        }
        return null;
    }

    Spawn(NewObj) {
        NewObj.AddToSceneList(this.SceneList);
    }

    Destroy(Obj) {
        this.#RemoveSelfFromScene();
    }

    OnObjectStay(CollisionEvent) {
    }
}

class JSGameScene extends JSGameObject {
    #CollisionEvents ={
        OnEnter: [],
        OnStay: [],
        OnExit: []
    }
    constructor() {
        super("Scene", {
            Root: true,
            LayerID: 0
        });
        this.SceneList = []
    }

    Add(GameObj) {
        //Check if object already exists in scene
        function SearchForObj(target, List) {

            for (let i = 0; i < List.length; i++) {
                if (List[i] == target) {
                    return i;
                }
            }

            return null;
        }

        if (GameObj instanceof JSGameObject) {
            GameObj.AddToSceneList(this.SceneList);
        }
    }

    Tick() {
        let Objects = this.SceneList;
        for (let i = 0; i < Objects.length; i++) {
            let objs = [Objects[i]];
            let children = objs[0].GetAllChildObjects();
            for (let i in children) {
                objs.push(children[i]);
            }

            for (let i in objs) {
                objs[i].Tick(Time.deltaTime);
            }
        }
        this.#CollisionCheckObjs();
    }

    Draw(JSWebGlCamera) {
        MainWebGlContext.clear();
        let Objects = this.SceneList;
        Objects = this.SortObjectsByDepth(Objects);
        for (let i = 0; i < Objects.length; i++) {
            let objs = [Objects[i]];
            let children = objs[0].GetAllChildObjects();

            for (let i in children) {
                objs.push(children[i]);
            }

            for (let i in objs) {
                objs[i].Tick(JSWebGlCamera);
            }
        }
    }

    GetAllObjects() {
        let returnList = [];
        for (let i in this.SceneList) {
            returnList.push(this.SceneList[i]);
            let children = this.SceneList[i].GetAllChildObjects();
            for (let c in children) {
                returnList.push(children[c]);
            }
        }

        return returnList;
    }

    // Checks collisions for all objects in a scene.
    // Triggers Collision Functions in Objects if needed
    // Collision Data is of Matter JS Type "Collision"
    // See: https://brm.io/matter-js/docs/classes/Collision.html
    #CollisionCheckObjs() {
        // Already checked existing
        let existingEvent = [];

        // Check the if collision between two objects has already been added
        function CheckExistingEvent(thisObject, otherObj) {

            function ifEvent(Object,Event) {
                if (Event.objectA == Object || Event.objectB == Object){
                    return true;
                }
                else{
                    return false
                }
            }

            // Look for existing events
            for (let i = 0; i < existingEvent.length; i++) {
                if (existingEvent[i]) {
                    let event = existingEvent[i];
                    if (ifEvent(thisObject,event) && ifEvent(otherObj,event)){
                        return true;
                    }
                }
            }
            // Did not find existing event. Add event to array
            {
                existingEvent.push({
                    objectA: thisObject,
                    objectB: otherObj,
                });
            }
            return false;
        }

        let Objects = this.SceneList;
        for (let i = 0; i < Objects.length; i++) {
            for (let obj = 0; obj < Objects.length; obj++) {
                if (obj != i) {
                    let response = Objects[i].CollisionCheck(Objects[obj]);
                    if (response != null) {
                        if (CheckExistingEvent(Objects[i], Objects[obj]) == false) {
                            Objects[i].OnObjectStay({
                                otherObj: Objects[obj],
                                info: response
                            })
                            Objects[obj].OnObjectStay({
                                otherObj: Objects[i],
                                info: response
                            })
                        }
                    }
                }
            }
        }

    }
    SortObjectsByDepth(JSWebGlCamera, ObjectList = this.GetAllObjects()) {
        if (!JSWebGlCamera) {
            console.warn("GameObject: SortObjectByDepth, no camera given");
            return [];
        }
        // Bubble Sort objects. Return array of them in order.
        // Furthest 1st
        let RArray = [...ObjectList];

        //Start Sorting
        for (let i = 0; i < RArray.length - 1; i++) {
            let thisPos = vec4.create();
            let thatPos = vec4.create();

            let camTransform = JSWebGlCamera.GetViewMatrix();
            vec4.transformMat4(
                thisPos,
                [...RArray[i].transform.position, 0],
                camTransform
            );


            vec4.transformMat4(
                thatPos,
                [...RArray[i + 1].transform.position, 0],
                camTransform
            );

            if (thisPos[2] < thatPos[2]) {
                let tempObj = RArray[i];
                RArray[i] = RArray[i + 1];
                RArray[i + 1] = tempObj;
                i = 0;
            }
        }
        return RArray;
    }
    GroupObjectsByLayer() {
        let ResultArray = []
        let Objects = this.GetAllObjects();
        for (let i = 0; i < Objects.length; i++) {
            let LayerMatchIndex = null;

            // Search if layer is already in list
            for (let Layer = 0; Layer < ResultArray.length; Layer++) {
                if (ResultArray[Layer][0] == Objects[i].LayerName) {
                    LayerMatchIndex = Layer;
                    break;
                }
            }

            // Layer not on list. Add Layer
            if (LayerMatchIndex == null) {
                ResultArray.push([
                    Objects[i].LayerName,
                    [Objects[i]]
                ])
            }
            // Layer on list. Push object to layer
            else {
                ResultArray[LayerMatchIndex][1].push(Objects[i])
            }
        }
        return ResultArray;
    }
}

// Testing
let testCanvas = document.getElementById("Canvas");
let testCanvas_MouseInput = new JSGameMouseInput(testCanvas);
testCanvas_MouseInput.locked = false;

let TouchInput = new JSGameTouchInput(testCanvas);
let KeyInput = new JSGameKeyInput();
let MouseInput = new JSGameMouseInput(testCanvas);

let MainWebGlContext = new WebGlContext(testCanvas);
let MainShaderContext = new JSWebGLShader(MainWebGlContext);
let myCamera = new JSWebGlOrthoCamera(MainWebGlContext);

const GameShape = {
    Square: new JSWebGlSquare(MainWebGlContext),
    Triangle: new JSWebGlTriangle(MainWebGlContext),
    Circle: new JSWebGlCircle(MainWebGlContext)
}

const GameSprite = {
    Player: {
        Ship: new JSWebGlImage("GameAsset/Sprite/TestSprite.PNG")
    }
}

GameShape.Triangle.setShader(MainShaderContext);
GameShape.Circle.setShader(MainShaderContext);
GameShape.Square.setShader(MainShaderContext);

class PlayerPlane_Mesh extends JSWebGlTriangle {
    constructor() {
        let myImage = new JSWebGlImage(
            "https://is3-ssl.mzstatic.com/image/thumb/Purple111/v4/cd/7f/f0/cd7ff0df-cb1f-8d10-6c4a-9cde28f2c5a5/source/256x256bb.jpg"
        );
        let texture = new JSWebGlCanvasTexture(MainWebGlContext);
        texture.setAsImage(myImage);
        super(MainWebGlContext, MainShaderContext, [0, 0, 0, 1]);
        this.setTexture(texture);
        this.Colour = [1, 1, 1, 1];
    }
}

class HeroPlaneModel {
    constructor() {
    }

    draw(JSWebGlCamera, TargetTransform) {
        let DrawTransform = new Transform();
        DrawTransform.SetParent(TargetTransform);

        DrawTransform.position = [0, 0, 0, 0];
        GameShape.Square.setColour([1, 1, 1, 1]);
        GameShape.Square.draw(JSWebGlCamera, DrawTransform);

        DrawTransform.position = [0, -1, 0, 0];
        DrawTransform.scale = [1, 1, 1, 0];
        GameShape.Circle.draw(JSWebGlCamera, DrawTransform);

        DrawTransform.position = [1, 0, 0, 0];
        DrawTransform.scale = [1, 1, 1, 0];
        GameShape.Triangle.setColour([1, 1, 1, 1]);
        GameShape.Triangle.draw(JSWebGlCamera, DrawTransform);

        DrawTransform.position = [-1, 0, 0, 0];
        DrawTransform.scale = [1, 1, 1, 0];
        GameShape.Triangle.setColour([1, 1, 1, 1]);
        GameShape.Triangle.draw(JSWebGlCamera, DrawTransform);

        DrawTransform.position = [0, -1.5, 0, 0];
        DrawTransform.scale = [1, -0.5, 1, 0];
        GameShape.Triangle.setColour([1, 1, 0, 1]);
        GameShape.Triangle.draw(JSWebGlCamera, DrawTransform);
    }
}

let PlayerPlaneMesh = new HeroPlaneModel();

class UI_MoveJoystick extends JSGameObject {
    constructor() {
        super("UI_Joystick", {LayerName: "UI"});
        this.OuterCircle = new JSWebGlCircle(MainWebGlContext, MainShaderContext, [0, 0, 0, 0.1]);
        this.ThumbCirlce = new JSWebGlCircle(MainWebGlContext, MainShaderContext, [0, 0, 0, 0.3]);

        this.OuterCircle.transform.SetParent(this.transform);
        this.ThumbCirlce.transform.SetParent(this.transform);
        this.ThumbCirlce.transform.scale = [0.3, 0.3, 1];
        this.ThumbCirlce.transform.position = [0, 0, 0];

        this.MoveX = 0;
        this.MoveY = 0;
        this.MoveAngle = 0;

        this.JoystickSize = 0;
        this.Active = false;
    }

    Tick() {
        if (!MainWebGlContext.isFullscreen) {
            return;
        }
        this.JoystickSize = (MainWebGlContext.getSize().width / 2) * 0.2;
        this.transform.scale = [this.JoystickSize, this.JoystickSize, 1];
        this.transform.position[2] = 0;

        if (TouchInput.touch[0].isPressed) {
            let touchObj = TouchInput.touch[0];
            let distanceVector = [...touchObj.distanceVector];

            for (let i = 0; i < distanceVector.length; i++) {
                if (distanceVector[i] > this.JoystickSize) {
                    distanceVector[i] = this.JoystickSize;
                } else if (distanceVector[i] < -this.JoystickSize) {
                    distanceVector[i] = -this.JoystickSize;
                }
            }

            this.MoveX = distanceVector[0] / this.JoystickSize;
            this.MoveY = distanceVector[1] / this.JoystickSize;
            this.MoveAngle = (Math.atan2(this.MoveY, this.MoveX) * 180 / Math.PI) - 90;

            this.ThumbCirlce.transform.rotation = [0, 0, this.MoveAngle];

            this.transform.position = [
                touchObj.startPos[0],
                touchObj.startPos[1],
                this.transform.position[2]
            ];

            this.ThumbCirlce.transform.position = [
                this.MoveX,
                this.MoveY,
                1
            ];


            this.Active = true;
        } else {
            this.MoveX = 0;
            this.MoveY = 0;
            this.Active = false;
        }
    }

    Draw(JSWebGlCamera) {
        if (!this.Active) {
            return;
        }

        let ThumbCirlceTransform = new Transform();

        ThumbCirlceTransform.Copy(this.transform);
        ThumbCirlceTransform.position[0] += this.MoveX * this.transform.scale[0];
        ThumbCirlceTransform.position[1] += this.MoveY * this.transform.scale[0];
        let ThumbScale = 0.35;
        ThumbCirlceTransform.scale = [
            this.transform.scale[0] * ThumbScale,
            this.transform.scale[0] * ThumbScale,
            1
        ]

        this.ThumbCirlce.draw(JSWebGlCamera, ThumbCirlceTransform);
        this.OuterCircle.draw(JSWebGlCamera, this.transform);


    }
}

class SomeBox extends JSGameObject {
    constructor() {
        super("SomeBox");
        this.Collider = new JSGameBoxCollider(this.transform);
        this.SetMatterBody(Matter.Bodies.rectangle(
            0, 0,
            1, 1
        ));
        this.Mesh = new JSWebGlSquare(MainWebGlContext, MainShaderContext, [1, 1, 1, 1]);
        this.Mesh.transform.SetParent(this.transform);
    }

    Tick(DeltaTime) {
        this.transform.position = [10, 0, 0];
        this.transform.scale = [50, 50, 1];
        this.transform.rotation[2] = 0;
    }
    Draw(JSWebGlCamera) {
        GameShape.Square.setColour([1, 1, 1, 1]);
        GameShape.Square.Texture.clear([1, 1, 1, 1]);
        GameShape.Square.draw(JSWebGlCamera, this.transform);
    }
}

class TestBullet extends JSGameObject {
    constructor(startPos = [0, 0, 0]) {
        super("Bullet");
        this.SetMatterBody(Matter.Bodies.rectangle(
            0, 0, 1, 1
        ))

        this.transform.position[0] = startPos[0];
        this.transform.position[1] = startPos[1];
        this.transform.position[2] = startPos[2];
        this.TimeAlive = 0;
    }

    Tick(DeltaTime) {
        this.transform.position[2] = [-10];
        this.transform.position[1] += Time.deltaTime * 1.5;
        this.transform.scale = [20, 20, 1];
        this.transform.rotation[2] = 0;

        this.TimeAlive += Time.deltaTime;
        if (this.TimeAlive > 2000) {
            this.Destroy(this);
        }
    }

    Draw(JSWebGlCamera) {
        GameShape.Square.setColour([0, 1, 1, 1]);
        GameShape.Square.Texture.clear([1, 1, 1, 1]);
        GameShape.Square.draw(JSWebGlCamera, this.transform);
    }

    OnObjectStay(CollisionEvent) {
        let otherObj = CollisionEvent.otherObj;
        if (otherObj instanceof TestBullet) { return; }
        this.Destroy(this);
    }
}

class MyPlane extends JSGameObject {
    #MoveVector = [];

    constructor() {
        super("PlayerPlane");
        this.MoveSpeed = 1;
        this.SetMatterBody(Matter.Bodies.rectangle(
            0, 0,
            1, 1
        ));
        this.Shot = {
            Delay: 150,
            Time: 0
        }
        this.#MoveVector = [0, 0];

    }

    Draw(JSWebCamera) {
        GameShape.Square.setColour([1, 1, 1, 1]);
        GameShape.Square.Texture.setAsImage(GameSprite.Player.Ship);
        GameShape.Square.draw(JSWebCamera, this.transform);
        this.transform.scale = [30, 30, 1]
    }

    Tick(DeltaTime) {
        if (!MainWebGlContext.isFullscreen) {
            return;
        }

        this.Shot.Time -= Time.deltaTime;
        if (this.Shot.Time < 0) {
            this.Shot.Time = 0;
        }

        if (TouchInput.touch[0].isPressed) {
            let touchObj = TouchInput.touch[0];
            let distanceVector = [...touchObj.distanceVector];

            let JoyStick = this.FindObjectsOfType(UI_MoveJoystick);
            if (JoyStick.length > 0) {
                JoyStick = JoyStick[0]
            }
            ;


            this.transform.position[0] += JoyStick.MoveX * DeltaTime / 2 * this.MoveSpeed;
            this.transform.position[1] += JoyStick.MoveY * DeltaTime / 2 * this.MoveSpeed;
        } else {
            if (KeyInput.GetKey("w").Pressed) {
                this.transform.position[1] += 1 * DeltaTime / 2 * this.MoveSpeed;
            } else if (KeyInput.GetKey("s").Pressed) {
                this.transform.position[1] -= 1 * DeltaTime / 2 * this.MoveSpeed;
            }

            if (KeyInput.GetKey("a").Pressed) {
                this.transform.position[0] -= 1 * DeltaTime / 2 * this.MoveSpeed;
            } else if (KeyInput.GetKey("d").Pressed) {
                this.transform.position[0] += 1 * DeltaTime / 2 * this.MoveSpeed;
            }
        }

        if (TouchInput.touch[1].isPressed || KeyInput.GetKey("j").Pressed) {
            if (this.Shot.Time <= 0) {
                let newBullet = new TestBullet([
                    this.transform.position[0],
                    this.transform.position[1] + this.transform.scale[1] * 2,
                    this.transform.position[2] + 100
                ]);
                this.Spawn(newBullet);
                this.Shot.Time = this.Shot.Delay;
            }
        }
        this.transform.position[2] = -10;
        this.transform.scale = [30, 30, 1];
    }

    OnObjectStay(CollisionEvent) {
        let penetration = CollisionEvent.info.penetration;
        this.transform.position[0] += penetration.x;
        this.transform.position[1] += penetration.y;
    }
}

MainWebGlContext.setCanFullScreen(true);
MainWebGlContext.resolutionScale = 1;

class TestScene extends JSGameScene {
    constructor() {
        super();
        this.Camera = new JSWebGlUICamera(MainWebGlContext);
        //this.Add(new SomeBox());
        this.Add(new MyPlane());
        this.Add(new UI_MoveJoystick());
        this.Add(new SomeBox());
    }

    Tick() {
        super.Tick();
        this.Camera.transform.position = [0, 0, 10];
    }

    Draw(JSWebGlCamera = this.Camera) {
        for (let object of this.SortObjectsByDepth(this.Camera)) {
            object.Draw(JSWebGlCamera);
        }
    }
}

let MyTestScene = new TestScene();


function loop() {

    let key = KeyInput.GetKey("w");
    if (KeyInput.GetKey("w").Down) {
        console.log(`KeyDown | Frames = ${KeyInput.GetKey("w")._Frames}`);
    } else if (KeyInput.GetKey("w").Up) {
        console.log("KeyUp");
    }


    if (MouseInput.Button[0].Down) {
        console.log(`Mouse Down Press`);
    }
    myCamera.Size = [testCanvas.width, testCanvas.height];
    myCamera.transform.position = [0, 0, 20];

    MyTestScene.Tick();
    MainWebGlContext.clear([0.2, 0.2, 0.2, 1]);
    MyTestScene.Draw();

    window.requestAnimationFrame(() => {
        loop();
    })
}

loop()