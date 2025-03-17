/*:
 * @plugindesc Plugin for Chapter Selector scene.
 * @author Naomikho
 *
 * @help This plugin does not provide plugin commands nor params. Params are to be set in json files or via the code itself.
 *
 * setup required:
 * A Chapters_{language_name}.json file. Currently it will read Chapters_EN.json file by default, 
 * so you will need to create a json file according to the Chapters_EN.json in this repository.
 * the names should be self explanatory, the chapterScene property is for the name of the scene it should jump to when the start button is clicked.
 * 
 * You would also need to add the images LeftArrow.png and RightArrow.png into the img/pictures folder.
 */

// Load all required json files here

// TODO: when we have translations, so we'd have to dynamically load it from a xxx_{language_name}.json
// this language would have to read from a config file.
const language = 'EN';
DataManager.loadDataFile('chapters', `Chapters_${language}.json`);

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
    this.createArrowButtons();
    this.createText();
    this.createStartButton();

    // Listen for chapter changes
    this._handler.on('chapterChanged', this.onChapterChanged.bind(this));
};

Scene_ChapterSelector.prototype.createBackground = function() {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = ImageManager.loadPicture(this._handler.chapterImage);

    this._backgroundSprite.bitmap.addLoadListener(() => {
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        const imgWidth = this._backgroundSprite.bitmap.width;
        const imgHeight = this._backgroundSprite.bitmap.height;

        // Scale to image to fit screen
        const scaleX = screenWidth / imgWidth;
        const scaleY = screenHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY); // Keep aspect ratio

        this._backgroundSprite.scale.x = scale;
        this._backgroundSprite.scale.y = scale;

        // Center the image
        this._backgroundSprite.x = (screenWidth - imgWidth * scale) / 2;
        this._backgroundSprite.y = (screenHeight - imgHeight * scale) / 2;
    });

    this.addChild(this._backgroundSprite);
};

Scene_ChapterSelector.prototype.createArrowButtons = function() {
    this._leftButton = new Sprite_Button();
    this._leftButton.bitmap = ImageManager.loadPicture('LeftArrow');
    this._leftButton.x = 10; 
    this._leftButton.y = 10;
    this._leftButton.setClickHandler(this._handler.decrementChapter.bind(this._handler));
    this.addChild(this._leftButton);

    this._rightButton = new Sprite_Button();
    this._rightButton.bitmap = ImageManager.loadPicture('RightArrow');
    this._rightButton.x = Graphics.width - this._rightButton.bitmap.width - 70;
    this._rightButton.y = 5;
    this._rightButton.setClickHandler(this._handler.incrementChapter.bind(this._handler));
    this.addChild(this._rightButton);
};

Scene_ChapterSelector.prototype.createStartButton = function() {
    this._startButton = new Sprite(new Bitmap(268, 50)); // Set button size

    // Draw a filled rectangle (button background)
    this._startButton.bitmap.fillRect(0, 0, 268, 50, '#444');

    // Draw text on the button
    this._startButton.bitmap.textColor = '#FFF'; // White text
    this._startButton.bitmap.fontSize = 28;
    this._startButton.bitmap.drawText('Start ' + this._handler.chapterName, -15, 10, 300, 30, 'center');
    this._startButton.x = 260;
    this._startButton.y = 540;
    this.addChild(this._startButton);

    // Create an invisible Sprite_Button on top
    this._startButtonClickArea = new Sprite_Button();
    this._startButtonClickArea.bitmap = new Bitmap(250, 50);
    this._startButtonClickArea.bitmap.fillRect(0, 0, 250, 50, 'rgba(0, 0, 0, 0)');
    this._startButtonClickArea.x = this._startButton.x;
    this._startButtonClickArea.y = this._startButton.y;
    this._startButtonClickArea.setClickHandler(this.startChapter.bind(this));
    this.addChild(this._startButtonClickArea);
}

Scene_ChapterSelector.prototype.startChapter = function() {
    SceneManager.goto(window[this._handler.chapterScene]);
}

Scene_ChapterSelector.prototype.createText = function() {
    this._textSprite = new Sprite(new Bitmap(500, 100));
    this._textSprite.x = 195;
    this._textSprite.y = 25;
    this._textSprite.bitmap.fontSize = 38;
    this._textSprite.bitmap.drawText('Chapter Select', 0, 0, 400, 40, 'center');
    this.addChild(this._textSprite);

    this._textSprite = new Sprite(new Bitmap(500, 100));
    this._textSprite.x = 190;
    this._textSprite.y = 70;
    this._textSprite.bitmap.fontSize = 28;
    this._textSprite.bitmap.drawText(this._handler.chapterTitle, 0, 0, 400, 40, 'center');
    this.addChild(this._textSprite);
};

Scene_ChapterSelector.prototype.updateBackground = function() {
    this._backgroundSprite.bitmap = ImageManager.loadPicture(this._handler.chapterImage);
}

Scene_ChapterSelector.prototype.updateText = function() {
    if (this._textSprite) {
        this._textSprite.bitmap.clear(); // Clear the previous text
        this._textSprite.bitmap.drawText(this._handler.chapterTitle, 0, 0, 400, 40, 'center'); // Draw new text
    }
};

Scene_ChapterSelector.prototype.updateStartButtonText = function() {
    if (this._startButton) {
        this._startButton.bitmap.clear();
        this._startButton.bitmap.drawText('Start ' + this._handler.chapterName, -25, 10, 300, 30, 'center');
    }
}

// Handle chapter change
Scene_ChapterSelector.prototype.onChapterChanged = function(chapterIndex) {    
    this.updateText();
    this.updateBackground();
    this.createStartButton();
};


// Chapter Selection Logic
class ChapterSelector {
    constructor() {
        this.chapterNumber = 1;
        // read the chapter progress of the player.
        this.playerChapterProgress = 1;
        this.eventTarget = new EventTarget();
        if (window['chapters']) {
            this.chapters = chapters;
        }
        this.chapterLimit = Object.keys(this.chapters).length;
    }

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventTarget.dispatchEvent(event);
    };

    on(eventName, callback) {
        this.eventTarget.addEventListener(eventName, (e) => callback(e.detail));
    };

    get chapter() {
        return this.chapterNumber;
    }

    get chapterName() {
        return this.chapters[this.chapterNumber.toString()].name;
    }

    // instead of using a switch, we can simplify it by writing our json object as a [key: string] : object map
    get chapterTitle() {
        return this.chapters[this.chapterNumber.toString()].name + ' ' + this.chapters[this.chapterNumber.toString()].title;
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
            this.emit('chapterChanged', this.chapterIndex);
        }
    }

    decrementChapter() {
        if (this.chapterNumber > 1) {
            this.chapterNumber--;
            this.emit('chapterChanged', this.chapterIndex);
        }
    }
}
