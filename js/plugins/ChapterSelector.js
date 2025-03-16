//import the Chapter Scene classes here

// Chapter Selector scene
function Scene_ChapterSelector() {
    this.initialize.apply(this, arguments);
}

Scene_ChapterSelector.prototype = Object.create(Scene_Base.prototype);
Scene_ChapterSelector.prototype.constructor = Scene_ChapterSelector;

Scene_ChapterSelector.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._handler = new ChapterSelector();
};

Scene_ChapterSelector.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
    this.createButtons();
    this.createText();

    // Listen for chapter changes
    this._handler.on("chapterChanged", this.onChapterChanged.bind(this));
};

Scene_ChapterSelector.prototype.createBackground = function() {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = ImageManager.loadPicture(this._handler.chapterImage);
    this.addChild(this._backgroundSprite);
};

Scene_ChapterSelector.prototype.createButtons = function() {
    this._leftButton = new Sprite_Button();
    this._leftButton.bitmap = ImageManager.loadPicture("LeftArrow");
    this._leftButton.x = 10; 
    this._leftButton.y = 10;
    this._leftButton.setClickHandler(this._handler.decrementChapter.bind(this._handler));
    this.addChild(this._leftButton);

    this._rightButton = new Sprite_Button();
    this._rightButton.bitmap = ImageManager.loadPicture("RightArrow");
    this._rightButton.x = Graphics.width - this._rightButton.bitmap.width - 70;
    this._rightButton.y = 5;
    this._rightButton.setClickHandler(this._handler.incrementChapter.bind(this._handler));
    this.addChild(this._rightButton);

    this._startButton = new Sprite(new Bitmap(150, 50)); // Set button size

    // Draw a filled rectangle (button background)
    this._startButton.bitmap.fillRect(0, 0, 150, 50, "#444"); // Dark gray button

    // Draw text on the button
    this._startButton.bitmap.textColor = "#FFF"; // White text
    this._startButton.bitmap.fontSize = 22;
    this._startButton.bitmap.drawText("Start Chapter " + this._handler.chapterNumber, 0, 10, 150, 30, "center");
    this._startButton.x = 330;
    this._startButton.y = 500;
    this.addChild(this._startButton);

    // Create an invisible Sprite_Button on top
    this._startButtonClickArea = new Sprite_Button();
    this._startButtonClickArea.bitmap = new Bitmap(150, 50);
    this._startButtonClickArea.bitmap.fillRect(0, 0, 150, 50, "rgba(0, 0, 0, 0)");
    this._startButtonClickArea.x = this._startButton.x;
    this._startButtonClickArea.y = this._startButton.y;
    this._startButtonClickArea.setClickHandler(this.startChapter.bind(this));
    this.addChild(this._startButtonClickArea);
};

Scene_ChapterSelector.prototype.startChapter = function() {
    SceneManager.goto(window[this._handler.chapterScene]);
}

Scene_ChapterSelector.prototype.createText = function() {
    this._textSprite = new Sprite(new Bitmap(500, 100));
    this._textSprite.x = 100;
    this._textSprite.y = 50;
    this._textSprite.bitmap.fontSize = 28;
    this._textSprite.bitmap.drawText(this._handler.chapterTitle, 0, 0, 500, 40, "center");
    this.addChild(this._textSprite);
};

Scene_ChapterSelector.prototype.updateBackground = function() {
    this._backgroundSprite.bitmap = ImageManager.loadPicture(this._handler.chapterImage);
}

Scene_ChapterSelector.prototype.updateText = function() {
    if (this._textSprite) {
        this._textSprite.bitmap.clear(); // Clear the previous text
        this._textSprite.bitmap.drawText(this._handler.chapterTitle, 0, 0, 500, 40, "center"); // Draw new text
    }
};

Scene_ChapterSelector.prototype.updateStartButton = function() {
    if (this._startButton) {
        this._startButton.bitmap.clear();
        this._startButton.bitmap.drawText("Start Chapter " + this._handler.chapterNumber, 0, 10, 150, 30, "center");
    }
}

// Handle chapter change
Scene_ChapterSelector.prototype.onChapterChanged = function(chapterIndex) {    
    this.updateText();
    this.updateBackground();
};


// Chapter Selection Logic
class ChapterSelector {
    constructor() {
        this.chapterNumber = 1;
        this.chapterLimit = Object.keys(this.chapters).length;
        // read the chapter progress of the player. Ideally we want this to be a const with a fixed value, e.g. const CHAPTER_1_CLEARED = 1;
        this.playerChapterProgress = 1;
        this.eventTarget = new EventTarget();
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventTarget.dispatchEvent(event);
    };

    on(eventName, callback) {
        this.eventTarget.addEventListener(eventName, (e) => callback(e.detail));
    };

    // read it from json file later, when we have translations, so we'd have to dynamically load it from a xxx_{language_name}.json
    get chapters() {
        return {
            '1': {
                title: 'Chapter 1: xxxx',
                chapterImage: 'Meadow',
                spoilerChapterImage: 'Meadow',
                chapterScene: 'Scene_ChapterOne',
            },
            '2': {
                title: 'Chapter 2: xxxx',
                chapterImage: 'Crystal',
                spoilerChapterImage: 'Crystal',
                chapterScene: 'Scene_ChapterTwo',
            },
            '3' : {
                title: 'Chapter 3: xxxx',
                chapterImage: 'Snowfield',
                spoilerChapterImage: 'Snowfield',
                chapterScene: 'Scene_ChapterThree',
            },
            '4' : {
                title: 'Chapter 4: xxxx',
                chapterImage: 'Translucent',
                spoilerChapterImage: 'Translucent',
                chapterScene: 'Scene_ChapterFour',
            }
        };
    }

    get chapter() {
        return this.chapterNumber;
    }

    // instead of using a switch, we can simplify it by writing our json object as a [key: string] : object map
    get chapterTitle() {
        return this.chapters[this.chapterNumber.toString()].title;
    }

    get chapterImage() {
        // checks whether the player should view the spoilered image
        return this.playerChapterProgress >= this.chapterNumber 
            ? this.chapters[this.chapterNumber.toString()].spoilerChapterImage
            : this.chapters[this.chapterNumber.toString()].chapterImage;
    }

    get chapterScene() {
        return this.chapters[this.chapterNumber.toString()].chapterScene;
    }

    incrementChapter() {
        if (this.chapterNumber < this.chapterLimit) {
            this.chapterNumber++;
            this.emit("chapterChanged", this.chapterIndex);
        }
    }

    decrementChapter() {
        if (this.chapterNumber > 1) {
            this.chapterNumber--;
            this.emit("chapterChanged", this.chapterIndex);
        }
    }
}
