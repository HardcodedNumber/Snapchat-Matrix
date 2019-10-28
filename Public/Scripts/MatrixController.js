// -----JS CODE-----
//MatrixController.js
//Version 0.0.1
//Description: Matrix unicode text scroll

// @input Asset.Texture segmentationTexture

// @input bool customBackgroundColor = false { "label": "Custom Background Color"}
// @ui {"widget": "group_start", "label": "Background Color", "showIf": "customBackgroundColor"}
// @input vec3 color {"widget":"color"}
// @input float colorAlpha = 1.0 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01}
// @ui {"widget": "group_end"}

// @input bool text = false
// @ui {"widget": "group_start", "label": "Text", "showIf": "text"}
// @input int numTextObjects = 10 {"widget":"slider", "min":0, "max":100, "step":1}
// @input vec3 textColor {"widget": "color"}
// @input float minTextSize = 1.0 {"widget":"slider", "min":0, "max":40, "step":1}
// @input float maxTextSize = 10.0 {"widget":"slider", "min":10, "max":40, "step":1}
// @input float textSpeed = 5.0 {"widget":"slider", "min":0, "max":20, "step":0.25}
// @ui {"widget": "group_end"}

// @input bool advanced = true
// @ui {"widget": "group_start", "label": "Advanced", "showIf":"advanced"}
// @input Component.Image backgroundColorBillboard
// @input SceneObject[] enableOnSegmentation
// @input Component.Camera cameraMasked
// @input Component.Camera orthographicCameraMasked
// @input Asset.ObjectPrefab textPrefab
// @input SceneObject textParent
// @ui {"widget": "group_end"}

var segmentationTextureReady = false;
var textObjects = [];
var topLeft = script.orthographicCameraMasked.screenSpaceToWorldSpace(new vec2(0,0), 200);
var topRight = script.orthographicCameraMasked.screenSpaceToWorldSpace(new vec2(1,0), 200);

function TextObject(textComponent) 
{
	this.textComponent = textComponent;
	this.currentInsertTime = 0.0;
	this.currentSpeed = 0.0;
	this.characterInsertTime = 0.16;
	this.currentTotalTime = 0.0;
	this.maxTime = 200;
}

TextObject.prototype.reset = function() {
	this.textComponent.text = generateRandomCharacter();
	this.textComponent.size = randomNumberInt(script.minTextSize, script.maxTextSize);
	
	var textTransform = this.textComponent.getTransform();
	var worldPosition = textTransform.getWorldPosition();
	worldPosition.x = randomNumber(-5, 5);
	worldPosition.y = topLeft.y + randomNumber(0, 10);

	textTransform.setWorldPosition(worldPosition);

	this.currentSpeed = script.textSpeed;
	this.currentInsertTime = -randomNumber(0, 1);
	this.characterInsertTime = randomNumber(0.016, 1);
	this.maxTime = randomNumber(2, 10);
	this.currentTotalTime = 0.0;
}

function turnOn( eventData )
{
    configureSegmentationMasks();
	configureBackgroundColor();
	configureTextObjects();
}

var turnOnEvent = script.createEvent("TurnOnEvent");
turnOnEvent.bind( turnOn );

function update( eventData )
{
	if(!script.segmentationTexture) {
		print( "SegmentationController, ERROR: Make sure to set the segmentation texture");
		return;
	}

	if(!segmentationTextureReady) {
		segmentationTextureReady = script.segmentationTexture.control.getWidth() > 1;
		
		for(var i = 0; i < script.enableOnSegmentation.length; i++) {
			if(script.enableOnSegmentation[i]) {
				script.enableOnSegmentation[i].enabled = segmentationTextureReady;
			}
		}
	}

	updateRainEffect();
}
var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind( update );

function configureBackgroundColor() 
{
    if (!script.backgroundColorBillboard) {
        print("Error: Background Color Billboard reference not set!");
        return;        
    }

    var backgroundColor = new vec4(0, 0, 0, 1);

    if (script.customBackgroundColor) {
        backgroundColor = new vec4( script.color.r, script.color.g, script.color.b, script.colorAlpha );
    }

    script.backgroundColorBillboard.mainPass.baseColor = backgroundColor;
}

function configureSegmentationMasks()
{
	if(!script.segmentationTexture) {
		print("Error:Make sure to set the segmentation texture");
		return;
	}

	if(!script.cameraMasked) {
		print("Error: Camera Masked is not set");
		return;
	}

	if(!script.orthographicCameraMasked) {
		print("Error: Orthographic Camera Masked is not set");
		return;
	}

	script.cameraMasked.maskTexture = script.segmentationTexture;
	script.orthographicCameraMasked.maskTexture = script.segmentationTexture;
}

function configureTextObjects() 
{
	if (!script.textPrefab) {
		print("Error: Text Prefab reference not set!");
		return;
	}

	if (!script.textParent) {
		print("Error: Text Parent reference not set!");
		return;
	}

	//topLeft.y += 1; //move offscreen

	for (var i = 0; i < script.numTextObjects; ++i) {
		var textInstance = script.textPrefab.instantiate(null);
		var textComponent = textInstance.getFirstComponent("Component.Text");
		var textObject = new TextObject(textComponent);
		var worldPosition = new vec3(0,0,0);

		textObject.reset();

		worldPosition.x = randomNumber(-5, 5);
		worldPosition.y = topLeft.y + 1;

		var textTransform = textComponent.getTransform();
		textTransform.setWorldPosition(worldPosition);

		textComponent.textFill.color =  new vec4(script.textColor.r, script.textColor.g, script.textColor.b, 1);

		textObjects.push(textObject);
	}
}

function generateRandomCharacter()
{
	var charArray = [];

	//A-Z
	for (var i = 65; i <= 90; ++i) {
		charArray.push(i);
	}

	//a-z
	for (var i = 97; i <= 122; ++i) {
		charArray.push(i);
	}

	//0-9
	for (var i = 48; i <= 57; ++i) {
		charArray.push(i);
	}

	//Extended Latin A-Z
	for (var i = 192; i <= 223; ++i) {
		charArray.push(i);
	}

	//Extended Latin a-z
	for (var i = 224; i <= 252; ++i) {
		charArray.push(i);
	}

	var randomIndex = randomNumberInt(0, charArray.length);

	return String.fromCharCode(charArray[randomIndex]);
}

function randomNumberInt(low, high)
{
	return Math.floor(randomNumber(low, high));
}

function randomNumber(low, high)
{
	return (Math.random() * (high - low)) + low;
}

function updateRainEffect()
{
	for (var i = 0; i < textObjects.length; ++i) {
		var textObject = textObjects[i];
		var textComponent = textObject.textComponent;
		var currentTime = textObject.currentInsertTime + textObject.currentSpeed * getDeltaTime();
		textObject.currentTotalTime += getDeltaTime();

		if (currentTime >= textObject.characterInsertTime) {
			textComponent.text += "\\u0A" + generateRandomCharacter();
			textObject.currentTime = 0;
		}
		else {
			textObject.currentInsertTime = currentTime;
		}
		
		if (textObject.currentTotalTime >= textObject.maxTime) {
			textObject.reset();
		}
	}
}