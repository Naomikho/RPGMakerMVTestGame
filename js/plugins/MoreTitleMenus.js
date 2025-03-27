/*:
 * @plugindesc Plugin to add more menus & their commands to the title screen
 * @author Naomikho
 *
 * @help This plugin does not provide plugin commands.
 *
 * setup required:
 * A Menu_{language_name}.json file. Currently it will read Menu_EN.json file by default, 
 * so you will need to create a json file based on format of Menu_EN.json in this repository.
 * 
 *  
 * @param add_position
 * @desc position to add the new options in the title menu. E.g. if it is 4, then it will start with 4, then increase after that as you add more menus
 * @default 4
 */

// Achievements should probably be stored in a different json folder as it's related to player data...
// But I don't have any ideas for now. We need to store different lists of achievemnts
// for each language, but then we'd need a separate way to determine whether the achievement is met.
// maybe we can read it from player data to determine whether achievement has been unlocked

const MoreTitleMenus = {};

// Load all required json files here

// TODO: when we have translations, so we'd have to dynamically load it from a xxx_{language_name}.json
// this language would have to read from a config file.
MoreTitleMenus.language = 'EN';
DataManager.loadDataFile('menus', `Menu_${MoreTitleMenus.language}.json`);

// for each menu in the json:
// add a new command to the title screen
// associate the scene type that needs to be used for the menu with one with the scene classes below

// Adds commands to the title screen
const titleMenuParams      = PluginManager.parameters('MoreTitleMenus');
MoreTitleMenus._makeCommandList      = Window_TitleCommand.prototype.makeCommandList;

Window_TitleCommand.prototype.makeCommandList = function() {
    MoreTitleMenus._makeCommandList.call(this);
    let menuCount = 0;
    Object.keys(menus).forEach(menuName => {
        this.addCommand(menuName, menuName, true);
        var addPosition = parseInt(titleMenuParams['add_position'] + menuCount, 10);
        if (addPosition > 0) {
            var anotherCommand = this._list.pop();
            this._list.splice(addPosition - 1, 0, anotherCommand);
        }
        menuCount++;
    });
};

MoreTitleMenus._createCommandWindow = Scene_Title.prototype.createCommandWindow;
Scene_Title.prototype.createCommandWindow = function() {
    MoreTitleMenus._createCommandWindow.call(this);
    Object.keys(menus).forEach(menuName => {
        this._commandWindow.setHandler(menuName, () => this.commandCustomMenu(menuName));
    });
};

// Custom function to handle opening of menu
Scene_Title.prototype.commandCustomMenu = function(menuName) {
    // set the props and items for Scene_CustomMenu
    Scene_CustomMenu._windowMode = menus[menuName].mode;
    SceneManager.push(Scene_CustomMenu);
    SceneManager.prepareNextScene(
        menuName,
        menus[menuName].mode, 
        menus[menuName].items, 
        menus[menuName].itemHeight,
        menus[menuName].itemColumns,
        menus[menuName].footerText,
        menus[menuName].highlightSelectedItem,
    );
    if (this._commandWindow) {
        this._commandWindow.hide();
    }
};

// use the same scene class and window class for all menus
function Scene_CustomMenu() {
    this.initialize.apply(this, arguments);
}

Scene_CustomMenu.prototype = Object.create(Scene_MenuBase.prototype);
Scene_CustomMenu.prototype.constructor = Scene_CustomMenu;

Scene_CustomMenu.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
    this._customWindow = {};
};

Scene_CustomMenu.prototype.prepare = function(
    title, windowMode, items, itemHeight, itemColumns, footerText, highlightSelectedItem
) {
    this._title = title;
    this._windowMode = windowMode;
    this._items = items;
    this._itemHeight = itemHeight;
    this._itemColumns = itemColumns;
    this._footerText = footerText;
    this._highlightSelectedItem = highlightSelectedItem;
};


Scene_CustomMenu.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    switch(this._windowMode) {
        case 'vertical':
            this._customWindow = new Window_CustomMenu(0, 0, Graphics.boxWidth, Graphics.boxHeight);
            break;
        case 'horizontal':
            this._customWindow = new Window_CustomHorizontalMenu(0, 0, Graphics.boxWidth, Graphics.boxHeight);
            break;
        case 'tabs': {
            this._customWindow = new Window_CustomHorizontalMenu(0, 0, Graphics.boxWidth, Graphics.boxHeight);
            this._secondaryWindow = new Window_CustomHorizontalMenu(0, 120, Graphics.boxWidth, Graphics.boxHeight - 120);
            this._customWindow._secondaryWindow = this._secondaryWindow;
            break;
        }
        default:
            this._customWindow = new Window_CustomMenu(0, 0, Graphics.boxWidth, Graphics.boxHeight);
            break;
    }
    this._customWindow.setItems(
        this._title, 
        this._itemHeight, 
        this._itemColumns, 
        this._footerText,
        this._highlightSelectedItem,
        this._items,
    );
    this.addWindow(this._customWindow);
    if (this._windowMode === 'tabs') this.addWindow(this._secondaryWindow);
}

Scene_CustomMenu.prototype.update = function() {
    Scene_Base.prototype.update.call(this);

    if (this._windowMode !== 'tabs') {
        if (Input.isTriggered("up") || Input.isTriggered("left")) {
            this._customWindow.selectPrevious();
        }
        
        if (Input.isTriggered("down") || Input.isTriggered("right")) {
            this._customWindow.selectNext();
        }
    
        if (Input.isTriggered("cancel")) { // ESC or X button
            SceneManager.pop();
        }
    
        if (TouchInput.wheelY > 0) {
            this._customWindow.selectNext();
        } else if (TouchInput.wheelY < 0) {
            this._customWindow.selectPrevious();
        }
    }
};

// Scene_CustomMenuWithTabs

function Window_CustomMenu() {
    this.initialize.apply(this, arguments);
}

Window_CustomMenu.prototype = Object.create(Window_Selectable.prototype);
Window_CustomMenu.prototype.constructor = Window_CustomMenu;

Window_CustomMenu.prototype.initialize = function(x, y, width, height) {
    this._selectedIndex = 0;
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
};

Window_CustomMenu.prototype.maxItems = function() {
    return this._data ? this._data.length : 0;
};

// Set menu items dynamically
Window_CustomMenu.prototype.setItems = function(
    title, itemHeight, itemColumns, footerText, highlightSelectedItem, items
) {
    this._title = title;
    this._columns = itemColumns;
    this._itemHeight = itemHeight;
    this._footerText = footerText;
    this._highlightSelectedItem = highlightSelectedItem;
    this._data = items;
    this.select(this._selectedIndex);
    this.refresh();
};

Window_CustomMenu.prototype.itemRect = function(index) {
    const rect = Window_Selectable.prototype.itemRect.call(this, index);
    rect.y += 50; // add top margin from title text
    return rect;
};

Window_CustomMenu.prototype.updateCursor = function() {
    if (this._highlightSelectedItem === false) {
        this.setCursorRect(0, 0, 0, 0);
    } else {
        Window_Selectable.prototype.updateCursor.call(this);
    }
};
// Draw menu items
Window_CustomMenu.prototype.drawItem = function(index) {
    const item = this._data[index];
    const isDisabled = item.disabled || false;
    if (item) {
        const rect = this.itemRect(index); // Get item rectangle
        const iconSize = 32;
        const textX = item.hasOwnProperty('iconIndex') 
            ? rect.x + iconSize + 8
            : rect.x;
        const textWidth = rect.width - iconSize - 12;

        if (item.hasOwnProperty('iconIndex')) {
            this.drawIcon(item.iconIndex, rect.x, rect.y + 4);
        }

        if (isDisabled) {
            this.changeTextColor(this.textColor(7));
        }

        // determine whether to display text as 'disabled'
        // for now, we will read it from the json
        
        MoreTitleMenus._initialFontSize = this.contents.fontSize;
        this.contents.fontSize = this.contents.fontSize - 3;
        this.drawText(item.title, textX, rect.y, textWidth, 'left');

        this.contents.fontSize = this.contents.fontSize - 7;
        // all items in the content array should be of the same type
        if (typeof item.content === "string") {
            this.drawText(item.content, textX, rect.y + 32, textWidth, 10, 'left');
        } else if (Array.isArray(item.content) && typeof item.content[0] === 'string') {
            let textY = rect.y
            const columnWidth = Math.floor((textWidth - 360) / this._columns);
            const columnSpacing = 10;

            for (let line = 0; line < item.content.length; line++) {
                const col = line % this._columns;
                const colX = textX + 360 + col * (columnWidth + columnSpacing);

                this.drawText(item.content[line], colX, textY, columnWidth, 'left');
                if (line % this._columns === this._columns - 1) {
                    textY = textY + 20
                }
            }
        } else {
            
        }

        this.contents.fontSize = MoreTitleMenus._initialFontSize;

        if (isDisabled) {
            this.changeTextColor(this.textColor(0));
        }
    }
};

Window_CustomMenu.prototype.itemHeight = function() {
    return this._itemHeight;
};

// Refresh menu content
Window_CustomMenu.prototype.refresh = function() {
    this.contents.clear();
    this.drawText(this._title, 0, 0, this.itemRect(0).width - 12, 'left');
    for (let i = 0; i < this.maxItems(); i++) {
        this.drawItem(i);
    }
    MoreTitleMenus._initialFontSize = this.contents.fontSize;
    this.contents.fontSize = this.contents.fontSize - 10;
    this.drawText(this._footerText, 0, 550, this.itemRect(0).width - 12, 'left');
    this.contents.fontSize = MoreTitleMenus._initialFontSize;
};

Window_CustomMenu.prototype.selectPrevious = function() {
    if (this._selectedIndex > 0) {
        this.select(--this._selectedIndex);
    }
}

Window_CustomMenu.prototype.selectNext = function() {
    if (this._selectedIndex < this._data.length - 1) {
        this.select(++this._selectedIndex);
    }
}

function Window_CustomHorizontalMenu() {
    this.initialize.apply(this, arguments);
}

Window_CustomHorizontalMenu.prototype = Object.create(Window_CustomMenu.prototype);
Window_CustomHorizontalMenu.prototype.constructor = Window_CustomHorizontalMenu;

Window_CustomHorizontalMenu.prototype.initialize = function(x, y, width, height) {
    Window_CustomMenu.prototype.initialize.call(this, x, y, width, height);
};

// Override maxCols() to enable horizontal layout
Window_CustomHorizontalMenu.prototype.maxCols = function() {
    return 4; // Number of columns
};

// Ensure item width fits within columns
Window_CustomHorizontalMenu.prototype.itemWidth = function() {
    return Math.floor(this.width / this.maxCols()) - this.padding * 2;
};