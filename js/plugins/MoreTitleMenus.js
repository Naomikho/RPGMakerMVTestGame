/*:
 * @plugindesc Plugin to add more menus & their commands to the title screen
 * @author Naomikho
 *
 * @help This plugin does not provide plugin commands.
 *
 * setup required:
 * A Menu_{language_name}.json file. Currently it will read Menu_EN.json file by default, 
 * so you will need to create a json file according to the Menu_EN.json in this repository.
 * the names should be self explanatory
 * 
 * You would also need to add the images LeftArrow.png and RightArrow.png into the img/pictures folder or add your own with those names.
 *
 * @param add_position
 * @desc position to add the new options in the title menu. E.g. if it is 4, then it will start with 4, then increase after that as you add more menus
 * @default 4
 */

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
    console.log(menus);
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

// Custom function to handle chapter selection
Scene_Title.prototype.commandCustomMenu = function(menuName) {
    SceneManager.goto(Scene_CustomMenu);
    // set the props and items for Scene_CustomMenu
};

// use the same scene class and window class for all menus
function Scene_CustomMenu() {
    this.initialize.apply(this, arguments);
}

Scene_CustomMenu.prototype = Object.create(Scene_MenuBase.prototype);
Scene_CustomMenu.prototype.constructor = Scene_CustomMenu;

Scene_CustomMenu.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_CustomMenu.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._customWindow = new Window_CustomMenu(0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this.addWindow(this._customWindow);
}

Scene_CustomMenu.prototype.update = function() {
    Scene_Base.prototype.update.call(this);

    if (Input.isTriggered("cancel")) { // ESC or X button
        SceneManager.goto(Scene_Title);
    }
};

function Window_CustomMenu() {
    this.initialize.apply(this, arguments);
}

Window_CustomMenu.prototype = Object.create(Window_Selectable.prototype);
Window_CustomMenu.prototype.constructor = Window_CustomMenu;

Window_CustomMenu.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._text = `Lorem ipsum dolor sit amet, consectetur`;
    this.drawAllItems();
}

Window_CustomMenu.prototype.drawAllItems = function() {
    this.drawText(`Lorem ipsum dolor sit amet, consectetur`, 20, 20, this.width - this.padding * 2);
}