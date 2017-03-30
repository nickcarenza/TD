var Phaser = {};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Group is a container for {@link DisplayObject display objects} including {@link Phaser.Sprite Sprites} and {@link Phaser.Image Images}.
*
* Groups form the logical tree structure of the display/scene graph where local transformations are applied to children.
* For instance, all children are also moved/rotated/scaled when the group is moved/rotated/scaled.
*
* In addition, Groups provides support for fast pooling and object recycling.
*
* Groups are also display objects and can be nested as children within other Groups.
* 
* @class Phaser.Group
* @extends PIXI.DisplayObjectContainer
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {DisplayObject|null} [parent=(game world)] - The parent Group (or other {@link DisplayObject}) that this group will be added to.
*     If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; if null the Group will not be added to any parent.
* @param {string} [name='group'] - A name for this group. Not used internally but useful for debugging.
* @param {boolean} [addToStage=false] - If true this group will be added directly to the Game.Stage instead of Game.World.
* @param {boolean} [enableBody=false] - If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
* @param {integer} [physicsBodyType=0] - The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
*/
Phaser.Group = function (game, parent, name, addToStage, enableBody, physicsBodyType) {

    if (addToStage === undefined) { addToStage = false; }
    if (enableBody === undefined) { enableBody = false; }
    if (physicsBodyType === undefined) { physicsBodyType = Phaser.Physics.ARCADE; }

    /**
    * A reference to the currently running Game.
    * @property {Phaser.Game} game
    * @protected
    */
    this.game = game;

    if (parent === undefined)
    {
        parent = game.world;
    }

    /**
    * A name for this group. Not used internally but useful for debugging.
    * @property {string} name
    */
    this.name = name || 'group';

    /**
    * The z-depth value of this object within its parent container/Group - the World is a Group as well.
    * This value must be unique for each child in a Group.
    * @property {integer} z
    * @readOnly
    */
    this.z = 0;

    PIXI.DisplayObjectContainer.call(this);

    if (addToStage)
    {
        this.game.stage.addChild(this);
        this.z = this.game.stage.children.length;
    }
    else
    {
        if (parent)
        {
            parent.addChild(this);
            this.z = parent.children.length;
        }
    }

    /**
    * Internal Phaser Type value.
    * @property {integer} type
    * @protected
    */
    this.type = Phaser.GROUP;

    /**
    * @property {number} physicsType - The const physics body type of this object.
    * @readonly
    */
    this.physicsType = Phaser.GROUP;

    /**
    * The alive property is useful for Groups that are children of other Groups and need to be included/excluded in checks like forEachAlive.
    * @property {boolean} alive
    * @default
    */
    this.alive = true;

    /**
    * If exists is true the group is updated, otherwise it is skipped.
    * @property {boolean} exists
    * @default
    */
    this.exists = true;

    /**
    * A group with `ignoreDestroy` set to `true` ignores all calls to its `destroy` method.
    * @property {boolean} ignoreDestroy
    * @default
    */
    this.ignoreDestroy = false;

    /**
    * A Group is that has `pendingDestroy` set to `true` is flagged to have its destroy method 
    * called on the next logic update.
    * You can set it directly to flag the Group to be destroyed on its next update.
    * 
    * This is extremely useful if you wish to destroy a Group from within one of its own callbacks 
    * or a callback of one of its children.
    * 
    * @property {boolean} pendingDestroy
    */
    this.pendingDestroy = false;

    /**
    * The type of objects that will be created when using {@link #create} or {@link #createMultiple}.
    *
    * Any object may be used but it should extend either Sprite or Image and accept the same constructor arguments:
    * when a new object is created it is passed the following parameters to its constructor: `(game, x, y, key, frame)`.
    *
    * @property {object} classType
    * @default {@link Phaser.Sprite}
    */
    this.classType = Phaser.Sprite;

    /**
    * The current display object that the group cursor is pointing to, if any. (Can be set manually.)
    *
    * The cursor is a way to iterate through the children in a Group using {@link #next} and {@link #previous}.
    * @property {?DisplayObject} cursor
    */
    this.cursor = null;

    /**
    * If true all Sprites created by, or added to this group, will have a physics body enabled on them.
    *
    * The default body type is controlled with {@link #physicsBodyType}.
    * @property {boolean} enableBody
    */
    this.enableBody = enableBody;

    /**
    * If true when a physics body is created (via {@link #enableBody}) it will create a physics debug object as well.
    *
    * This only works for P2 bodies.
    * @property {boolean} enableBodyDebug
    * @default
    */
    this.enableBodyDebug = false;

    /**
    * If {@link #enableBody} is true this is the type of physics body that is created on new Sprites.
    *
    * The valid values are {@link Phaser.Physics.ARCADE}, {@link Phaser.Physics.P2JS}, {@link Phaser.Physics.NINJA}, etc.
    * @property {integer} physicsBodyType
    */
    this.physicsBodyType = physicsBodyType;

    /**
    * If this Group contains Arcade Physics Sprites you can set a custom sort direction via this property.
    * 
    * It should be set to one of the Phaser.Physics.Arcade sort direction constants: 
    * 
    * Phaser.Physics.Arcade.SORT_NONE
    * Phaser.Physics.Arcade.LEFT_RIGHT
    * Phaser.Physics.Arcade.RIGHT_LEFT
    * Phaser.Physics.Arcade.TOP_BOTTOM
    * Phaser.Physics.Arcade.BOTTOM_TOP
    *
    * If set to `null` the Group will use whatever Phaser.Physics.Arcade.sortDirection is set to. This is the default behavior.
    * 
    * @property {integer} physicsSortDirection
    * @default
    */
    this.physicsSortDirection = null;

    /**
    * This signal is dispatched when the group is destroyed.
    * @property {Phaser.Signal} onDestroy
    */
    this.onDestroy = new Phaser.Signal();

    /**
    * @property {integer} cursorIndex - The current index of the Group cursor. Advance it with Group.next.
    * @readOnly
    */
    this.cursorIndex = 0;

    /**
    * A Group that is fixed to the camera uses its x/y coordinates as offsets from the top left of the camera. These are stored in Group.cameraOffset.
    * 
    * Note that the cameraOffset values are in addition to any parent in the display list.
    * So if this Group was in a Group that has x: 200, then this will be added to the cameraOffset.x
    * 
    * @property {boolean} fixedToCamera
    */
    this.fixedToCamera = false;

    /**
    * If this object is {@link #fixedToCamera} then this stores the x/y position offset relative to the top-left of the camera view.
    * If the parent of this Group is also `fixedToCamera` then the offset here is in addition to that and should typically be disabled.
    * @property {Phaser.Point} cameraOffset
    */
    this.cameraOffset = new Phaser.Point();

    /**
    * The hash array is an array belonging to this Group into which you can add any of its children via Group.addToHash and Group.removeFromHash.
    * 
    * Only children of this Group can be added to and removed from the hash.
    * 
    * This hash is used automatically by Phaser Arcade Physics in order to perform non z-index based destructive sorting.
    * However if you don't use Arcade Physics, or this isn't a physics enabled Group, then you can use the hash to perform your own
    * sorting and filtering of Group children without touching their z-index (and therefore display draw order)
    * 
    * @property {array} hash
    */
    this.hash = [];

    /**
    * The property on which children are sorted.
    * @property {string} _sortProperty
    * @private
    */
    this._sortProperty = 'z';

};

Phaser.Group.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Phaser.Group.prototype.constructor = Phaser.Group;

/**
* A returnType value, as specified in {@link #iterate} eg.
* @constant
* @type {integer}
*/
Phaser.Group.RETURN_NONE = 0;

/**
* A returnType value, as specified in {@link #iterate} eg.
* @constant
* @type {integer}
*/
Phaser.Group.RETURN_TOTAL = 1;

/**
* A returnType value, as specified in {@link #iterate} eg.
* @constant
* @type {integer}
*/
Phaser.Group.RETURN_CHILD = 2;

/**
* A sort ordering value, as specified in {@link #sort} eg.
* @constant
* @type {integer}
*/
Phaser.Group.SORT_ASCENDING = -1;

/**
* A sort ordering value, as specified in {@link #sort} eg.
* @constant
* @type {integer}
*/
Phaser.Group.SORT_DESCENDING = 1;

/**
* Adds an existing object as the top child in this group.
*
* The child is automatically added to the top of the group and is displayed on top of every previous child.
*
* If Group.enableBody is set then a physics body will be created on the object, so long as one does not already exist.
*
* Use {@link #addAt} to control where a child is added. Use {@link #create} to create and add a new child.
*
* @method Phaser.Group#add
* @param {DisplayObject} child - The display object to add as a child.
* @param {boolean} [silent=false] - If true the child will not dispatch the `onAddedToGroup` event.
* @return {DisplayObject} The child that was added to the group.
*/
Phaser.Group.prototype.add = function (child, silent) {

    if (silent === undefined) { silent = false; }

    if (child.parent !== this)
    {
        this.addChild(child);

        child.z = this.children.length;

        if (this.enableBody && child.body === null)
        {
            this.game.physics.enable(child, this.physicsBodyType);
        }
        else if (child.body)
        {
            this.addToHash(child);
        }

        if (!silent && child.events)
        {
            child.events.onAddedToGroup$dispatch(child, this);
        }

        if (this.cursor === null)
        {
            this.cursor = child;
        }
    }

    return child;

};

/**
* Adds a child of this Group into the hash array.
* This call will return false if the child is not a child of this Group, or is already in the hash.
*
* @method Phaser.Group#addToHash
* @param {DisplayObject} child - The display object to add to this Groups hash. Must be a member of this Group already and not present in the hash.
* @return {boolean} True if the child was successfully added to the hash, otherwise false.
*/
Phaser.Group.prototype.addToHash = function (child) {

    if (child.parent === this)
    {
        var index = this.hash.indexOf(child);

        if (index === -1)
        {
            this.hash.push(child);
            return true;
        }
    }

    return false;

};

/**
* Removes a child of this Group from the hash array.
* This call will return false if the child is not in the hash.
*
* @method Phaser.Group#removeFromHash
* @param {DisplayObject} child - The display object to remove from this Groups hash. Must be a member of this Group and in the hash.
* @return {boolean} True if the child was successfully removed from the hash, otherwise false.
*/
Phaser.Group.prototype.removeFromHash = function (child) {

    if (child)
    {
        var index = this.hash.indexOf(child);

        if (index !== -1)
        {
            this.hash.splice(index, 1);
            return true;
        }
    }

    return false;

};

/**
* Adds an array of existing Display Objects to this Group.
*
* The Display Objects are automatically added to the top of this Group, and will render on-top of everything already in this Group.
*
* As well as an array you can also pass another Group as the first argument. In this case all of the children from that
* Group will be removed from it and added into this Group.
*
* @method Phaser.Group#addMultiple
* @param {DisplayObject[]|Phaser.Group} children - An array of display objects or a Phaser.Group. If a Group is given then *all* children will be moved from it.
* @param {boolean} [silent=false] - If true the children will not dispatch the `onAddedToGroup` event.
* @return {DisplayObject[]|Phaser.Group} The array of children or Group of children that were added to this Group.
*/
Phaser.Group.prototype.addMultiple = function (children, silent) {

    if (children instanceof Phaser.Group)
    {
        children.moveAll(this, silent);
    }
    else if (Array.isArray(children))
    {
        for (var i = 0; i < children.length; i++)
        {
            this.add(children[i], silent);
        }
    }

    return children;

};

/**
* Adds an existing object to this group.
*
* The child is added to the group at the location specified by the index value, this allows you to control child ordering.
*
* @method Phaser.Group#addAt
* @param {DisplayObject} child - The display object to add as a child.
* @param {integer} [index=0] - The index within the group to insert the child to.
* @param {boolean} [silent=false] - If true the child will not dispatch the `onAddedToGroup` event.
* @return {DisplayObject} The child that was added to the group.
*/
Phaser.Group.prototype.addAt = function (child, index, silent) {

    if (silent === undefined) { silent = false; }

    if (child.parent !== this)
    {
        this.addChildAt(child, index);

        this.updateZ();

        if (this.enableBody && child.body === null)
        {
            this.game.physics.enable(child, this.physicsBodyType);
        }
        else if (child.body)
        {
            this.addToHash(child);
        }

        if (!silent && child.events)
        {
            child.events.onAddedToGroup$dispatch(child, this);
        }

        if (this.cursor === null)
        {
            this.cursor = child;
        }
    }

    return child;

};

/**
* Returns the child found at the given index within this group.
*
* @method Phaser.Group#getAt
* @param {integer} index - The index to return the child from.
* @return {DisplayObject|integer} The child that was found at the given index, or -1 for an invalid index.
*/
Phaser.Group.prototype.getAt = function (index) {

    if (index < 0 || index >= this.children.length)
    {
        return -1;
    }
    else
    {
        return this.getChildAt(index);
    }

};

/**
* Creates a new Phaser.Sprite object and adds it to the top of this group.
*
* Use {@link #classType} to change the type of object created.
*
* @method Phaser.Group#create
* @param {number} x - The x coordinate to display the newly created Sprite at. The value is in relation to the group.x point.
* @param {number} y - The y coordinate to display the newly created Sprite at. The value is in relation to the group.y point.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|Phaser.Video|PIXI.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @param {boolean} [exists=true] - The default exists state of the Sprite.
* @return {DisplayObject} The child that was created: will be a {@link Phaser.Sprite} unless {@link #classType} has been changed.
*/
Phaser.Group.prototype.create = function (x, y, key, frame, exists) {

    if (exists === undefined) { exists = true; }

    var child = new this.classType(this.game, x, y, key, frame);

    child.exists = exists;
    child.visible = exists;
    child.alive = exists;

    this.addChild(child);

    child.z = this.children.length;

    if (this.enableBody)
    {
        this.game.physics.enable(child, this.physicsBodyType, this.enableBodyDebug);
    }

    if (child.events)
    {
        child.events.onAddedToGroup$dispatch(child, this);
    }

    if (this.cursor === null)
    {
        this.cursor = child;
    }

    return child;

};

/**
* Creates multiple Phaser.Sprite objects and adds them to the top of this group.
*
* Useful if you need to quickly generate a pool of identical sprites, such as bullets.
*
* By default the sprites will be set to not exist and will be positioned at 0, 0 (relative to the group.x/y).
* Use {@link #classType} to change the type of object created.
*
* @method Phaser.Group#createMultiple
* @param {integer} quantity - The number of Sprites to create.
* @param {string} key - The Game.cache key of the image that this Sprite will use.
* @param {integer|string} [frame] - If the Sprite image contains multiple frames you can specify which one to use here.
* @param {boolean} [exists=false] - The default exists state of the Sprite.
*/
Phaser.Group.prototype.createMultiple = function (quantity, key, frame, exists) {

    if (exists === undefined) { exists = false; }

    for (var i = 0; i < quantity; i++)
    {
        this.create(0, 0, key, frame, exists);
    }

};

/**
* Internal method that re-applies all of the children's Z values.
*
* This must be called whenever children ordering is altered so that their `z` indices are correctly updated.
*
* @method Phaser.Group#updateZ
* @protected
*/
Phaser.Group.prototype.updateZ = function () {

    var i = this.children.length;

    while (i--)
    {
        this.children[i].z = i;
    }

};

/**
* Sets the group cursor to the first child in the group.
*
* If the optional index parameter is given it sets the cursor to the object at that index instead.
*
* @method Phaser.Group#resetCursor
* @param {integer} [index=0] - Set the cursor to point to a specific index.
* @return {any} The child the cursor now points to.
*/
Phaser.Group.prototype.resetCursor = function (index) {

    if (index === undefined) { index = 0; }

    if (index > this.children.length - 1)
    {
        index = 0;
    }

    if (this.cursor)
    {
        this.cursorIndex = index;
        this.cursor = this.children[this.cursorIndex];
        return this.cursor;
    }

};

/**
* Advances the group cursor to the next (higher) object in the group.
*
* If the cursor is at the end of the group (top child) it is moved the start of the group (bottom child).
*
* @method Phaser.Group#next
* @return {any} The child the cursor now points to.
*/
Phaser.Group.prototype.next = function () {

    if (this.cursor)
    {
        //  Wrap the cursor?
        if (this.cursorIndex >= this.children.length - 1)
        {
            this.cursorIndex = 0;
        }
        else
        {
            this.cursorIndex++;
        }

        this.cursor = this.children[this.cursorIndex];

        return this.cursor;
    }

};

/**
* Moves the group cursor to the previous (lower) child in the group.
*
* If the cursor is at the start of the group (bottom child) it is moved to the end (top child).
*
* @method Phaser.Group#previous
* @return {any} The child the cursor now points to.
*/
Phaser.Group.prototype.previous = function () {

    if (this.cursor)
    {
        //  Wrap the cursor?
        if (this.cursorIndex === 0)
        {
            this.cursorIndex = this.children.length - 1;
        }
        else
        {
            this.cursorIndex--;
        }

        this.cursor = this.children[this.cursorIndex];

        return this.cursor;
    }

};

/**
* Swaps the position of two children in this group.
*
* Both children must be in this group, a child cannot be swapped with itself, and unparented children cannot be swapped.
*
* @method Phaser.Group#swap
* @param {any} child1 - The first child to swap.
* @param {any} child2 - The second child to swap.
*/
Phaser.Group.prototype.swap = function (child1, child2) {

    this.swapChildren(child1, child2);
    this.updateZ();

};

/**
* Brings the given child to the top of this group so it renders above all other children.
*
* @method Phaser.Group#bringToTop
* @param {any} child - The child to bring to the top of this group.
* @return {any} The child that was moved.
*/
Phaser.Group.prototype.bringToTop = function (child) {

    if (child.parent === this && this.getIndex(child) < this.children.length)
    {
        this.remove(child, false, true);
        this.add(child, true);
    }

    return child;

};

/**
* Sends the given child to the bottom of this group so it renders below all other children.
*
* @method Phaser.Group#sendToBack
* @param {any} child - The child to send to the bottom of this group.
* @return {any} The child that was moved.
*/
Phaser.Group.prototype.sendToBack = function (child) {

    if (child.parent === this && this.getIndex(child) > 0)
    {
        this.remove(child, false, true);
        this.addAt(child, 0, true);
    }

    return child;

};

/**
* Moves the given child up one place in this group unless it's already at the top.
*
* @method Phaser.Group#moveUp
* @param {any} child - The child to move up in the group.
* @return {any} The child that was moved.
*/
Phaser.Group.prototype.moveUp = function (child) {

    if (child.parent === this && this.getIndex(child) < this.children.length - 1)
    {
        var a = this.getIndex(child);
        var b = this.getAt(a + 1);

        if (b)
        {
            this.swap(child, b);
        }
    }

    return child;

};

/**
* Moves the given child down one place in this group unless it's already at the bottom.
*
* @method Phaser.Group#moveDown
* @param {any} child - The child to move down in the group.
* @return {any} The child that was moved.
*/
Phaser.Group.prototype.moveDown = function (child) {

    if (child.parent === this && this.getIndex(child) > 0)
    {
        var a = this.getIndex(child);
        var b = this.getAt(a - 1);

        if (b)
        {
            this.swap(child, b);
        }
    }

    return child;

};

/**
* Positions the child found at the given index within this group to the given x and y coordinates.
*
* @method Phaser.Group#xy
* @param {integer} index - The index of the child in the group to set the position of.
* @param {number} x - The new x position of the child.
* @param {number} y - The new y position of the child.
*/
Phaser.Group.prototype.xy = function (index, x, y) {

    if (index < 0 || index > this.children.length)
    {
        return -1;
    }
    else
    {
        this.getChildAt(index).x = x;
        this.getChildAt(index).y = y;
    }

};

/**
* Reverses all children in this group.
*
* This operaation applies only to immediate children and does not propagate to subgroups.
*
* @method Phaser.Group#reverse
*/
Phaser.Group.prototype.reverse = function () {

    this.children.reverse();
    this.updateZ();

};

/**
* Get the index position of the given child in this group, which should match the child's `z` property.
*
* @method Phaser.Group#getIndex
* @param {any} child - The child to get the index for.
* @return {integer} The index of the child or -1 if it's not a member of this group.
*/
Phaser.Group.prototype.getIndex = function (child) {

    return this.children.indexOf(child);

};

/**
* Replaces a child of this group with the given newChild. The newChild cannot be a member of this group.
*
* @method Phaser.Group#replace
* @param {any} oldChild - The child in this group that will be replaced.
* @param {any} newChild - The child to be inserted into this group.
* @return {any} Returns the oldChild that was replaced within this group.
*/
Phaser.Group.prototype.replace = function (oldChild, newChild) {

    var index = this.getIndex(oldChild);

    if (index !== -1)
    {
        if (newChild.parent)
        {
            if (newChild.parent instanceof Phaser.Group)
            {
                newChild.parent.remove(newChild);
            }
            else
            {
                newChild.parent.removeChild(newChild);
            }
        }

        this.remove(oldChild);

        this.addAt(newChild, index);

        return oldChild;
    }

};

/**
* Checks if the child has the given property.
*
* Will scan up to 4 levels deep only.
*
* @method Phaser.Group#hasProperty
* @param {any} child - The child to check for the existance of the property on.
* @param {string[]} key - An array of strings that make up the property.
* @return {boolean} True if the child has the property, otherwise false.
*/
Phaser.Group.prototype.hasProperty = function (child, key) {

    var len = key.length;

    if (len === 1 && key[0] in child)
    {
        return true;
    }
    else if (len === 2 && key[0] in child && key[1] in child[key[0]])
    {
        return true;
    }
    else if (len === 3 && key[0] in child && key[1] in child[key[0]] && key[2] in child[key[0]][key[1]])
    {
        return true;
    }
    else if (len === 4 && key[0] in child && key[1] in child[key[0]] && key[2] in child[key[0]][key[1]] && key[3] in child[key[0]][key[1]][key[2]])
    {
        return true;
    }

    return false;

};

/**
* Sets a property to the given value on the child. The operation parameter controls how the value is set.
*
* The operations are:
* - 0: set the existing value to the given value; if force is `true` a new property will be created if needed
* - 1: will add the given value to the value already present.
* - 2: will subtract the given value from the value already present.
* - 3: will multiply the value already present by the given value.
* - 4: will divide the value already present by the given value.
*
* @method Phaser.Group#setProperty
* @param {any} child - The child to set the property value on.
* @param {array} key - An array of strings that make up the property that will be set.
* @param {any} value - The value that will be set.
* @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
* @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
* @return {boolean} True if the property was set, false if not.
*/
Phaser.Group.prototype.setProperty = function (child, key, value, operation, force) {

    if (force === undefined) { force = false; }

    operation = operation || 0;

    //  As ugly as this approach looks, and although it's limited to a depth of only 4, it's much faster than a for loop or object iteration.

    //  0 = Equals
    //  1 = Add
    //  2 = Subtract
    //  3 = Multiply
    //  4 = Divide

    //  We can't force a property in and the child doesn't have it, so abort.
    //  Equally we can't add, subtract, multiply or divide a property value if it doesn't exist, so abort in those cases too.
    if (!this.hasProperty(child, key) && (!force || operation > 0))
    {
        return false;
    }

    var len = key.length;

    if (len === 1)
    {
        if (operation === 0) { child[key[0]] = value; }
        else if (operation == 1) { child[key[0]] += value; }
        else if (operation == 2) { child[key[0]] -= value; }
        else if (operation == 3) { child[key[0]] *= value; }
        else if (operation == 4) { child[key[0]] /= value; }
    }
    else if (len === 2)
    {
        if (operation === 0) { child[key[0]][key[1]] = value; }
        else if (operation == 1) { child[key[0]][key[1]] += value; }
        else if (operation == 2) { child[key[0]][key[1]] -= value; }
        else if (operation == 3) { child[key[0]][key[1]] *= value; }
        else if (operation == 4) { child[key[0]][key[1]] /= value; }
    }
    else if (len === 3)
    {
        if (operation === 0) { child[key[0]][key[1]][key[2]] = value; }
        else if (operation == 1) { child[key[0]][key[1]][key[2]] += value; }
        else if (operation == 2) { child[key[0]][key[1]][key[2]] -= value; }
        else if (operation == 3) { child[key[0]][key[1]][key[2]] *= value; }
        else if (operation == 4) { child[key[0]][key[1]][key[2]] /= value; }
    }
    else if (len === 4)
    {
        if (operation === 0) { child[key[0]][key[1]][key[2]][key[3]] = value; }
        else if (operation == 1) { child[key[0]][key[1]][key[2]][key[3]] += value; }
        else if (operation == 2) { child[key[0]][key[1]][key[2]][key[3]] -= value; }
        else if (operation == 3) { child[key[0]][key[1]][key[2]][key[3]] *= value; }
        else if (operation == 4) { child[key[0]][key[1]][key[2]][key[3]] /= value; }
    }

    return true;

};

/**
* Checks a property for the given value on the child.
*
* @method Phaser.Group#checkProperty
* @param {any} child - The child to check the property value on.
* @param {array} key - An array of strings that make up the property that will be set.
* @param {any} value - The value that will be checked.
* @param {boolean} [force=false] - If `force` is true then the property will be checked on the child regardless if it already exists or not. If true and the property doesn't exist, false will be returned.
* @return {boolean} True if the property was was equal to value, false if not.
*/
Phaser.Group.prototype.checkProperty = function (child, key, value, force) {

    if (force === undefined) { force = false; }

    //  We can't force a property in and the child doesn't have it, so abort.
    if (!Phaser.Utils.getProperty(child, key) && force)
    {
        return false;
    }

    if (Phaser.Utils.getProperty(child, key) !== value)
    {
        return false;
    }

    return true;

};

/**
* Quickly set a property on a single child of this group to a new value.
*
* The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
*
* @method Phaser.Group#set
* @param {Phaser.Sprite} child - The child to set the property on.
* @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
* @param {any} value - The value that will be set.
* @param {boolean} [checkAlive=false] - If set then the child will only be updated if alive=true.
* @param {boolean} [checkVisible=false] - If set then the child will only be updated if visible=true.
* @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
* @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
* @return {boolean} True if the property was set, false if not.
*/
Phaser.Group.prototype.set = function (child, key, value, checkAlive, checkVisible, operation, force) {

    if (force === undefined) { force = false; }

    key = key.split('.');

    if (checkAlive === undefined) { checkAlive = false; }
    if (checkVisible === undefined) { checkVisible = false; }

    if ((checkAlive === false || (checkAlive && child.alive)) && (checkVisible === false || (checkVisible && child.visible)))
    {
        return this.setProperty(child, key, value, operation, force);
    }

};

/**
* Quickly set the same property across all children of this group to a new value.
*
* This call doesn't descend down children, so if you have a Group inside of this group, the property will be set on the group but not its children.
* If you need that ability please see `Group.setAllChildren`.
*
* The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
*
* @method Phaser.Group#setAll
* @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
* @param {any} value - The value that will be set.
* @param {boolean} [checkAlive=false] - If set then only children with alive=true will be updated. This includes any Groups that are children.
* @param {boolean} [checkVisible=false] - If set then only children with visible=true will be updated. This includes any Groups that are children.
* @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
* @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
*/
Phaser.Group.prototype.setAll = function (key, value, checkAlive, checkVisible, operation, force) {

    if (checkAlive === undefined) { checkAlive = false; }
    if (checkVisible === undefined) { checkVisible = false; }
    if (force === undefined) { force = false; }

    key = key.split('.');
    operation = operation || 0;

    for (var i = 0; i < this.children.length; i++)
    {
        if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible)))
        {
            this.setProperty(this.children[i], key, value, operation, force);
        }
    }

};

/**
* Quickly set the same property across all children of this group, and any child Groups, to a new value.
*
* If this group contains other Groups then the same property is set across their children as well, iterating down until it reaches the bottom.
* Unlike with `setAll` the property is NOT set on child Groups itself.
*
* The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
*
* @method Phaser.Group#setAllChildren
* @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
* @param {any} value - The value that will be set.
* @param {boolean} [checkAlive=false] - If set then only children with alive=true will be updated. This includes any Groups that are children.
* @param {boolean} [checkVisible=false] - If set then only children with visible=true will be updated. This includes any Groups that are children.
* @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
* @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
*/
Phaser.Group.prototype.setAllChildren = function (key, value, checkAlive, checkVisible, operation, force) {

    if (checkAlive === undefined) { checkAlive = false; }
    if (checkVisible === undefined) { checkVisible = false; }
    if (force === undefined) { force = false; }

    operation = operation || 0;

    for (var i = 0; i < this.children.length; i++)
    {
        if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible)))
        {
            if (this.children[i] instanceof Phaser.Group)
            {
                this.children[i].setAllChildren(key, value, checkAlive, checkVisible, operation, force);
            }
            else
            {
                this.setProperty(this.children[i], key.split('.'), value, operation, force);
            }
        }
    }

};

/**
* Quickly check that the same property across all children of this group is equal to the given value.
*
* This call doesn't descend down children, so if you have a Group inside of this group, the property will be checked on the group but not its children.
*
* @method Phaser.Group#checkAll
* @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
* @param {any} value - The value that will be checked.
* @param {boolean} [checkAlive=false] - If set then only children with alive=true will be checked. This includes any Groups that are children.
* @param {boolean} [checkVisible=false] - If set then only children with visible=true will be checked. This includes any Groups that are children.
* @param {boolean} [force=false] - If `force` is true then the property will be checked on the child regardless if it already exists or not. If true and the property doesn't exist, false will be returned.
*/
Phaser.Group.prototype.checkAll = function (key, value, checkAlive, checkVisible, force) {

    if (checkAlive === undefined) { checkAlive = false; }
    if (checkVisible === undefined) { checkVisible = false; }
    if (force === undefined) { force = false; }

    for (var i = 0; i < this.children.length; i++)
    {
        if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible)))
        {
            if (!this.checkProperty(this.children[i], key, value, force))
            {
                return false;
            }
        }
    }

    return true;

};

/**
* Adds the amount to the given property on all children in this group.
*
* `Group.addAll('x', 10)` will add 10 to the child.x value for each child.
*
* @method Phaser.Group#addAll
* @param {string} property - The property to increment, for example 'body.velocity.x' or 'angle'.
* @param {number} amount - The amount to increment the property by. If child.x = 10 then addAll('x', 40) would make child.x = 50.
* @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
* @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
*/
Phaser.Group.prototype.addAll = function (property, amount, checkAlive, checkVisible) {

    this.setAll(property, amount, checkAlive, checkVisible, 1);

};

/**
* Subtracts the amount from the given property on all children in this group.
*
* `Group.subAll('x', 10)` will minus 10 from the child.x value for each child.
*
* @method Phaser.Group#subAll
* @param {string} property - The property to decrement, for example 'body.velocity.x' or 'angle'.
* @param {number} amount - The amount to subtract from the property. If child.x = 50 then subAll('x', 40) would make child.x = 10.
* @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
* @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
*/
Phaser.Group.prototype.subAll = function (property, amount, checkAlive, checkVisible) {

    this.setAll(property, amount, checkAlive, checkVisible, 2);

};

/**
* Multiplies the given property by the amount on all children in this group.
*
* `Group.multiplyAll('x', 2)` will x2 the child.x value for each child.
*
* @method Phaser.Group#multiplyAll
* @param {string} property - The property to multiply, for example 'body.velocity.x' or 'angle'.
* @param {number} amount - The amount to multiply the property by. If child.x = 10 then multiplyAll('x', 2) would make child.x = 20.
* @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
* @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
*/
Phaser.Group.prototype.multiplyAll = function (property, amount, checkAlive, checkVisible) {

    this.setAll(property, amount, checkAlive, checkVisible, 3);

};

/**
* Divides the given property by the amount on all children in this group.
*
* `Group.divideAll('x', 2)` will half the child.x value for each child.
*
* @method Phaser.Group#divideAll
* @param {string} property - The property to divide, for example 'body.velocity.x' or 'angle'.
* @param {number} amount - The amount to divide the property by. If child.x = 100 then divideAll('x', 2) would make child.x = 50.
* @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
* @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
*/
Phaser.Group.prototype.divideAll = function (property, amount, checkAlive, checkVisible) {

    this.setAll(property, amount, checkAlive, checkVisible, 4);

};

/**
* Calls a function, specified by name, on all children in the group who exist (or do not exist).
*
* After the existsValue parameter you can add as many parameters as you like, which will all be passed to the child callback.
*
* @method Phaser.Group#callAllExists
* @param {string} callback - Name of the function on the children to call.
* @param {boolean} existsValue - Only children with exists=existsValue will be called.
* @param {...any} parameter - Additional parameters that will be passed to the callback.
*/
Phaser.Group.prototype.callAllExists = function (callback, existsValue) {

    var args;

    if (arguments.length > 2)
    {
        args = [];

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }
    }

    for (var i = 0; i < this.children.length; i++)
    {
        if (this.children[i].exists === existsValue && this.children[i][callback])
        {
            this.children[i][callback].apply(this.children[i], args);
        }
    }

};

/**
* Returns a reference to a function that exists on a child of the group based on the given callback array.
*
* @method Phaser.Group#callbackFromArray
* @param {object} child - The object to inspect.
* @param {array} callback - The array of function names.
* @param {integer} length - The size of the array (pre-calculated in callAll).
* @protected
*/
Phaser.Group.prototype.callbackFromArray = function (child, callback, length) {

    //  Kinda looks like a Christmas tree

    if (length == 1)
    {
        if (child[callback[0]])
        {
            return child[callback[0]];
        }
    }
    else if (length == 2)
    {
        if (child[callback[0]][callback[1]])
        {
            return child[callback[0]][callback[1]];
        }
    }
    else if (length == 3)
    {
        if (child[callback[0]][callback[1]][callback[2]])
        {
            return child[callback[0]][callback[1]][callback[2]];
        }
    }
    else if (length == 4)
    {
        if (child[callback[0]][callback[1]][callback[2]][callback[3]])
        {
            return child[callback[0]][callback[1]][callback[2]][callback[3]];
        }
    }
    else
    {
        if (child[callback])
        {
            return child[callback];
        }
    }

    return false;

};

/**
* Calls a function, specified by name, on all on children.
*
* The function is called for all children regardless if they are dead or alive (see callAllExists for different options).
* After the method parameter and context you can add as many extra parameters as you like, which will all be passed to the child.
*
* @method Phaser.Group#callAll
* @param {string} method - Name of the function on the child to call. Deep property lookup is supported.
* @param {string} [context=null] - A string containing the context under which the method will be executed. Set to null to default to the child.
* @param {...any} args - Additional parameters that will be passed to the method.
*/
Phaser.Group.prototype.callAll = function (method, context) {

    if (method === undefined)
    {
        return;
    }

    //  Extract the method into an array
    method = method.split('.');

    var methodLength = method.length;

    if (context === undefined || context === null || context === '')
    {
        context = null;
    }
    else
    {
        //  Extract the context into an array
        if (typeof context === 'string')
        {
            context = context.split('.');
            var contextLength = context.length;
        }
    }

    var args;

    if (arguments.length > 2)
    {
        args = [];

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }
    }

    var callback = null;
    var callbackContext = null;

    for (var i = 0; i < this.children.length; i++)
    {
        callback = this.callbackFromArray(this.children[i], method, methodLength);

        if (context && callback)
        {
            callbackContext = this.callbackFromArray(this.children[i], context, contextLength);

            if (callback)
            {
                callback.apply(callbackContext, args);
            }
        }
        else if (callback)
        {
            callback.apply(this.children[i], args);
        }
    }

};

/**
* The core preUpdate - as called by World.
* @method Phaser.Group#preUpdate
* @protected
*/
Phaser.Group.prototype.preUpdate = function () {

    if (this.pendingDestroy)
    {
        this.destroy();
        return false;
    }

    if (!this.exists || !this.parent.exists)
    {
        this.renderOrderID = -1;
        return false;
    }

    var i = this.children.length;

    while (i--)
    {
        this.children[i].preUpdate();
    }

    return true;

};

/**
* The core update - as called by World.
* @method Phaser.Group#update
* @protected
*/
Phaser.Group.prototype.update = function () {

    var i = this.children.length;

    while (i--)
    {
        this.children[i].update();
    }

};

/**
* The core postUpdate - as called by World.
* @method Phaser.Group#postUpdate
* @protected
*/
Phaser.Group.prototype.postUpdate = function () {

    //  Fixed to Camera?
    if (this.fixedToCamera)
    {
        this.x = this.game.camera.view.x + this.cameraOffset.x;
        this.y = this.game.camera.view.y + this.cameraOffset.y;
    }

    var i = this.children.length;

    while (i--)
    {
        this.children[i].postUpdate();
    }

};


/**
* Find children matching a certain predicate.
*
* For example:
*
*     var healthyList = Group.filter(function(child, index, children) {
*         return child.health > 10 ? true : false;
*     }, true);
*     healthyList.callAll('attack');
*
* Note: Currently this will skip any children which are Groups themselves.
*
* @method Phaser.Group#filter
* @param {function} predicate - The function that each child will be evaluated against. Each child of the group will be passed to it as its first parameter, the index as the second, and the entire child array as the third
* @param {boolean} [checkExists=false] - If true, only existing can be selected; otherwise all children can be selected and will be passed to the predicate.
* @return {Phaser.ArraySet} Returns an array list containing all the children that the predicate returned true for
*/
Phaser.Group.prototype.filter = function (predicate, checkExists) {

    var index = -1;
    var length = this.children.length;
    var results = [];

    while (++index < length)
    {
        var child = this.children[index];

        if (!checkExists || (checkExists && child.exists))
        {
            if (predicate(child, index, this.children))
            {
                results.push(child);
            }
        }
    }

    return new Phaser.ArraySet(results);

};

/**
* Call a function on each child in this group.
*
* Additional arguments for the callback can be specified after the `checkExists` parameter. For example,
*
*     Group.forEach(awardBonusGold, this, true, 100, 500)
*
* would invoke `awardBonusGold` function with the parameters `(child, 100, 500)`.
*
* Note: This check will skip any children which are Groups themselves.
*
* @method Phaser.Group#forEach
* @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
* @param {object} callbackContext - The context in which the function should be called (usually 'this').
* @param {boolean} [checkExists=false] - If set only children matching for which `exists` is true will be passed to the callback, otherwise all children will be passed.
* @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
*/
Phaser.Group.prototype.forEach = function (callback, callbackContext, checkExists) {

    if (checkExists === undefined) { checkExists = false; }

    if (arguments.length <= 3)
    {
        for (var i = 0; i < this.children.length; i++)
        {
            if (!checkExists || (checkExists && this.children[i].exists))
            {
                callback.call(callbackContext, this.children[i]);
            }
        }
    }
    else
    {
        // Assigning to arguments properties causes Extreme Deoptimization in Chrome, FF, and IE.
        // Using an array and pushing each element (not a slice!) is _significantly_ faster.
        var args = [null];

        for (var i = 3; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }

        for (var i = 0; i < this.children.length; i++)
        {
            if (!checkExists || (checkExists && this.children[i].exists))
            {
                args[0] = this.children[i];
                callback.apply(callbackContext, args);
            }
        }
    }

};

/**
* Call a function on each existing child in this group.
*
* See {@link Phaser.Group#forEach forEach} for details.
*
* @method Phaser.Group#forEachExists
* @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
* @param {object} callbackContext - The context in which the function should be called (usually 'this').
* @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
*/
Phaser.Group.prototype.forEachExists = function (callback, callbackContext) {

    var args;

    if (arguments.length > 2)
    {
        args = [null];

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }
    }

    this.iterate('exists', true, Phaser.Group.RETURN_TOTAL, callback, callbackContext, args);

};

/**
* Call a function on each alive child in this group.
*
* See {@link Phaser.Group#forEach forEach} for details.
*
* @method Phaser.Group#forEachAlive
* @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
* @param {object} callbackContext - The context in which the function should be called (usually 'this').
* @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
*/
Phaser.Group.prototype.forEachAlive = function (callback, callbackContext) {

    var args;

    if (arguments.length > 2)
    {
        args = [null];

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }
    }

    this.iterate('alive', true, Phaser.Group.RETURN_TOTAL, callback, callbackContext, args);

};

/**
* Call a function on each dead child in this group.
*
* See {@link Phaser.Group#forEach forEach} for details.
*
* @method Phaser.Group#forEachDead
* @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
* @param {object} callbackContext - The context in which the function should be called (usually 'this').
* @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
*/
Phaser.Group.prototype.forEachDead = function (callback, callbackContext) {

    var args;

    if (arguments.length > 2)
    {
        args = [null];

        for (var i = 2; i < arguments.length; i++)
        {
            args.push(arguments[i]);
        }
    }

    this.iterate('alive', false, Phaser.Group.RETURN_TOTAL, callback, callbackContext, args);

};

/**
* Sort the children in the group according to a particular key and ordering.
*
* Call this function to sort the group according to a particular key value and order.
* For example to depth sort Sprites for Zelda-style game you might call `group.sort('y', Phaser.Group.SORT_ASCENDING)` at the bottom of your `State.update()`.
*
* @method Phaser.Group#sort
* @param {string} [key='z'] - The name of the property to sort on. Defaults to the objects z-depth value.
* @param {integer} [order=Phaser.Group.SORT_ASCENDING] - Order ascending ({@link Phaser.Group.SORT_ASCENDING SORT_ASCENDING}) or descending ({@link Phaser.Group.SORT_DESCENDING SORT_DESCENDING}).
*/
Phaser.Group.prototype.sort = function (key, order) {

    if (this.children.length < 2)
    {
        //  Nothing to swap
        return;
    }

    if (key === undefined) { key = 'z'; }
    if (order === undefined) { order = Phaser.Group.SORT_ASCENDING; }

    this._sortProperty = key;

    if (order === Phaser.Group.SORT_ASCENDING)
    {
        this.children.sort(this.ascendingSortHandler.bind(this));
    }
    else
    {
        this.children.sort(this.descendingSortHandler.bind(this));
    }

    this.updateZ();

};

/**
* Sort the children in the group according to custom sort function.
*
* The `sortHandler` is provided the two parameters: the two children involved in the comparison (a and b).
* It should return -1 if `a > b`, 1 if `a < b` or 0 if `a === b`.
*
* @method Phaser.Group#customSort
* @param {function} sortHandler - The custom sort function.
* @param {object} [context=undefined] - The context in which the sortHandler is called.
*/
Phaser.Group.prototype.customSort = function (sortHandler, context) {

    if (this.children.length < 2)
    {
        //  Nothing to swap
        return;
    }

    this.children.sort(sortHandler.bind(context));

    this.updateZ();

};

/**
* An internal helper function for the sort process.
*
* @method Phaser.Group#ascendingSortHandler
* @protected
* @param {object} a - The first object being sorted.
* @param {object} b - The second object being sorted.
*/
Phaser.Group.prototype.ascendingSortHandler = function (a, b) {

    if (a[this._sortProperty] < b[this._sortProperty])
    {
        return -1;
    }
    else if (a[this._sortProperty] > b[this._sortProperty])
    {
        return 1;
    }
    else
    {
        if (a.z < b.z)
        {
            return -1;
        }
        else
        {
            return 1;
        }
    }

};

/**
* An internal helper function for the sort process.
*
* @method Phaser.Group#descendingSortHandler
* @protected
* @param {object} a - The first object being sorted.
* @param {object} b - The second object being sorted.
*/
Phaser.Group.prototype.descendingSortHandler = function (a, b) {

    if (a[this._sortProperty] < b[this._sortProperty])
    {
        return 1;
    }
    else if (a[this._sortProperty] > b[this._sortProperty])
    {
        return -1;
    }
    else
    {
        return 0;
    }

};

/**
* Iterates over the children of the group performing one of several actions for matched children.
*
* A child is considered a match when it has a property, named `key`, whose value is equal to `value`
* according to a strict equality comparison.
*
* The result depends on the `returnType`:
*
* - {@link Phaser.Group.RETURN_TOTAL RETURN_TOTAL}:
*     The callback, if any, is applied to all matching children. The number of matched children is returned.
* - {@link Phaser.Group.RETURN_NONE RETURN_NONE}:
*     The callback, if any, is applied to all matching children. No value is returned.
* - {@link Phaser.Group.RETURN_CHILD RETURN_CHILD}:
*     The callback, if any, is applied to the *first* matching child and the *first* matched child is returned.
*     If there is no matching child then null is returned.
*
* If `args` is specified it must be an array. The matched child will be assigned to the first
* element and the entire array will be applied to the callback function.
*
* @method Phaser.Group#iterate
* @param {string} key - The child property to check, i.e. 'exists', 'alive', 'health'
* @param {any} value - A child matches if `child[key] === value` is true.
* @param {integer} returnType - How to iterate the children and what to return.
* @param {function} [callback=null] - Optional function that will be called on each matching child. The matched child is supplied as the first argument.
* @param {object} [callbackContext] - The context in which the function should be called (usually 'this').
* @param {any[]} [args=(none)] - The arguments supplied to to the callback; the first array index (argument) will be replaced with the matched child.
* @return {any} Returns either an integer (for RETURN_TOTAL), the first matched child (for RETURN_CHILD), or null.
*/
Phaser.Group.prototype.iterate = function (key, value, returnType, callback, callbackContext, args) {

    if (returnType === Phaser.Group.RETURN_TOTAL && this.children.length === 0)
    {
        return 0;
    }

    var total = 0;

    for (var i = 0; i < this.children.length; i++)
    {
        if (this.children[i][key] === value)
        {
            total++;

            if (callback)
            {
                if (args)
                {
                    args[0] = this.children[i];
                    callback.apply(callbackContext, args);
                }
                else
                {
                    callback.call(callbackContext, this.children[i]);
                }
            }

            if (returnType === Phaser.Group.RETURN_CHILD)
            {
                return this.children[i];
            }
        }
    }

    if (returnType === Phaser.Group.RETURN_TOTAL)
    {
        return total;
    }

    // RETURN_CHILD or RETURN_NONE
    return null;

};

/**
* Get the first display object that exists, or doesn't exist.
* 
* You can use the optional argument `createIfNull` to create a new Game Object if none matching your exists argument were found in this Group.
*
* It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
*
* If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
* will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
*
* @method Phaser.Group#getFirstExists
* @param {boolean} [exists=true] - If true, find the first existing child; otherwise find the first non-existing child.
* @param {boolean} [createIfNull=false] - If `true` and no alive children are found a new one is created.
* @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
* @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|Phaser.Video|PIXI.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @return {DisplayObject} The first child, or `null` if none found and `createIfNull` was false.
*/
Phaser.Group.prototype.getFirstExists = function (exists, createIfNull, x, y, key, frame) {

    if (createIfNull === undefined) { createIfNull = false; }

    if (typeof exists !== 'boolean')
    {
        exists = true;
    }

    var child = this.iterate('exists', exists, Phaser.Group.RETURN_CHILD);

    return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

};

/**
* Get the first child that is alive (`child.alive === true`).
*
* This is handy for choosing a squad leader, etc.
*
* You can use the optional argument `createIfNull` to create a new Game Object if no alive ones were found in this Group.
*
* It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
*
* If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
* will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
*
* @method Phaser.Group#getFirstAlive
* @param {boolean} [createIfNull=false] - If `true` and no alive children are found a new one is created.
* @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
* @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|Phaser.Video|PIXI.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @return {DisplayObject} The alive dead child, or `null` if none found and `createIfNull` was false.
*/
Phaser.Group.prototype.getFirstAlive = function (createIfNull, x, y, key, frame) {

    if (createIfNull === undefined) { createIfNull = false; }

    var child = this.iterate('alive', true, Phaser.Group.RETURN_CHILD);

    return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

};

/**
* Get the first child that is dead (`child.alive === false`).
*
* This is handy for checking if everything has been wiped out and adding to the pool as needed.
*
* You can use the optional argument `createIfNull` to create a new Game Object if no dead ones were found in this Group.
*
* It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
*
* If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
* will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
*
* @method Phaser.Group#getFirstDead
* @param {boolean} [createIfNull=false] - If `true` and no dead children are found a new one is created.
* @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
* @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|Phaser.Video|PIXI.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @return {DisplayObject} The first dead child, or `null` if none found and `createIfNull` was false.
*/
Phaser.Group.prototype.getFirstDead = function (createIfNull, x, y, key, frame) {

    if (createIfNull === undefined) { createIfNull = false; }

    var child = this.iterate('alive', false, Phaser.Group.RETURN_CHILD);

    return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

};

/**
* Takes a child and if the `x` and `y` arguments are given it calls `child.reset(x, y)` on it.
*
* If the `key` and optionally the `frame` arguments are given, it calls `child.loadTexture(key, frame)` on it.
*
* The two operations are separate. For example if you just wish to load a new texture then pass `null` as the x and y values.
*
* @method Phaser.Group#resetChild
* @param {DisplayObject} child - The child to reset and/or load the texture on.
* @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
* @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
* @param {string|Phaser.RenderTexture|Phaser.BitmapData|Phaser.Video|PIXI.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or PIXI.Texture.
* @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
* @return {DisplayObject} The child that was reset: usually a {@link Phaser.Sprite}.
*/
Phaser.Group.prototype.resetChild = function (child, x, y, key, frame) {

    if (child === null)
    {
        return null;
    }

    if (x === undefined) { x = null; }
    if (y === undefined) { y = null; }

    if (x !== null && y !== null)
    {
        child.reset(x, y);
    }

    if (key !== undefined)
    {
        child.loadTexture(key, frame);
    }

    return child;

};

/**
* Return the child at the top of this group.
*
* The top child is the child displayed (rendered) above every other child.
*
* @method Phaser.Group#getTop
* @return {any} The child at the top of the Group.
*/
Phaser.Group.prototype.getTop = function () {

    if (this.children.length > 0)
    {
        return this.children[this.children.length - 1];
    }

};

/**
* Returns the child at the bottom of this group.
*
* The bottom child the child being displayed (rendered) below every other child.
*
* @method Phaser.Group#getBottom
* @return {any} The child at the bottom of the Group.
*/
Phaser.Group.prototype.getBottom = function () {

    if (this.children.length > 0)
    {
        return this.children[0];
    }

};

/**
* Get the number of living children in this group.
*
* @method Phaser.Group#countLiving
* @return {integer} The number of children flagged as alive.
*/
Phaser.Group.prototype.countLiving = function () {

    return this.iterate('alive', true, Phaser.Group.RETURN_TOTAL);

};

/**
* Get the number of dead children in this group.
*
* @method Phaser.Group#countDead
* @return {integer} The number of children flagged as dead.
*/
Phaser.Group.prototype.countDead = function () {

    return this.iterate('alive', false, Phaser.Group.RETURN_TOTAL);

};

/**
* Returns a random child from the group.
*
* @method Phaser.Group#getRandom
* @param {integer} [startIndex=0] - Offset from the front of the front of the group (lowest child).
* @param {integer} [length=(to top)] - Restriction on the number of values you want to randomly select from.
* @return {any} A random child of this Group.
*/
Phaser.Group.prototype.getRandom = function (startIndex, length) {

    if (this.children.length === 0)
    {
        return null;
    }

    startIndex = startIndex || 0;
    length = length || this.children.length;

    return Phaser.ArrayUtils.getRandomItem(this.children, startIndex, length);

};

/**
* Removes the given child from this group.
*
* This will dispatch an `onRemovedFromGroup` event from the child (if it has one), and optionally destroy the child.
*
* If the group cursor was referring to the removed child it is updated to refer to the next child.
*
* @method Phaser.Group#remove
* @param {any} child - The child to remove.
* @param {boolean} [destroy=false] - If true `destroy` will be invoked on the removed child.
* @param {boolean} [silent=false] - If true the the child will not dispatch the `onRemovedFromGroup` event.
* @return {boolean} true if the child was removed from this group, otherwise false.
*/
Phaser.Group.prototype.remove = function (child, destroy, silent) {

    if (destroy === undefined) { destroy = false; }
    if (silent === undefined) { silent = false; }

    if (this.children.length === 0 || this.children.indexOf(child) === -1)
    {
        return false;
    }

    if (!silent && child.events && !child.destroyPhase)
    {
        child.events.onRemovedFromGroup$dispatch(child, this);
    }

    var removed = this.removeChild(child);

    this.removeFromHash(child);

    this.updateZ();

    if (this.cursor === child)
    {
        this.next();
    }

    if (destroy && removed)
    {
        removed.destroy(true);
    }

    return true;

};

/**
* Moves all children from this Group to the Group given.
*
* @method Phaser.Group#moveAll
* @param {Phaser.Group} group - The new Group to which the children will be moved to.
* @param {boolean} [silent=false] - If true the children will not dispatch the `onAddedToGroup` event for the new Group.
* @return {Phaser.Group} The Group to which all the children were moved.
*/
Phaser.Group.prototype.moveAll = function (group, silent) {

    if (silent === undefined) { silent = false; }

    if (this.children.length > 0 && group instanceof Phaser.Group)
    {
        do
        {
            group.add(this.children[0], silent);
        }
        while (this.children.length > 0);

        this.hash = [];

        this.cursor = null;
    }

    return group;

};

/**
* Removes all children from this group, but does not remove the group from its parent.
*
* @method Phaser.Group#removeAll
* @param {boolean} [destroy=false] - If true `destroy` will be invoked on each removed child.
* @param {boolean} [silent=false] - If true the children will not dispatch their `onRemovedFromGroup` events.
*/
Phaser.Group.prototype.removeAll = function (destroy, silent) {

    if (destroy === undefined) { destroy = false; }
    if (silent === undefined) { silent = false; }

    if (this.children.length === 0)
    {
        return;
    }

    do
    {
        if (!silent && this.children[0].events)
        {
            this.children[0].events.onRemovedFromGroup$dispatch(this.children[0], this);
        }

        var removed = this.removeChild(this.children[0]);

        this.removeFromHash(removed);

        if (destroy && removed)
        {
            removed.destroy(true);
        }
    }
    while (this.children.length > 0);

    this.hash = [];

    this.cursor = null;

};

/**
* Removes all children from this group whose index falls beteen the given startIndex and endIndex values.
*
* @method Phaser.Group#removeBetween
* @param {integer} startIndex - The index to start removing children from.
* @param {integer} [endIndex] - The index to stop removing children at. Must be higher than startIndex. If undefined this method will remove all children between startIndex and the end of the group.
* @param {boolean} [destroy=false] - If true `destroy` will be invoked on each removed child.
* @param {boolean} [silent=false] - If true the children will not dispatch their `onRemovedFromGroup` events.
*/
Phaser.Group.prototype.removeBetween = function (startIndex, endIndex, destroy, silent) {

    if (endIndex === undefined) { endIndex = this.children.length - 1; }
    if (destroy === undefined) { destroy = false; }
    if (silent === undefined) { silent = false; }

    if (this.children.length === 0)
    {
        return;
    }

    if (startIndex > endIndex || startIndex < 0 || endIndex > this.children.length)
    {
        return false;
    }

    var i = endIndex;

    while (i >= startIndex)
    {
        if (!silent && this.children[i].events)
        {
            this.children[i].events.onRemovedFromGroup$dispatch(this.children[i], this);
        }

        var removed = this.removeChild(this.children[i]);

        this.removeFromHash(removed);

        if (destroy && removed)
        {
            removed.destroy(true);
        }

        if (this.cursor === this.children[i])
        {
            this.cursor = null;
        }

        i--;
    }

    this.updateZ();

};

/**
* Destroys this group.
*
* Removes all children, then removes this group from its parent and nulls references.
*
* @method Phaser.Group#destroy
* @param {boolean} [destroyChildren=true] - If true `destroy` will be invoked on each removed child.
* @param {boolean} [soft=false] - A 'soft destroy' (set to true) doesn't remove this group from its parent or null the game reference. Set to false and it does.
*/
Phaser.Group.prototype.destroy = function (destroyChildren, soft) {

    if (this.game === null || this.ignoreDestroy) { return; }

    if (destroyChildren === undefined) { destroyChildren = true; }
    if (soft === undefined) { soft = false; }

    this.onDestroy.dispatch(this, destroyChildren, soft);

    this.removeAll(destroyChildren);

    this.cursor = null;
    this.filters = null;
    this.pendingDestroy = false;

    if (!soft)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        this.game = null;
        this.exists = false;
    }

};

/**
* Total number of existing children in the group.
*
* @name Phaser.Group#total
* @property {integer} total
* @readonly
*/
Object.defineProperty(Phaser.Group.prototype, "total", {

    get: function () {

        return this.iterate('exists', true, Phaser.Group.RETURN_TOTAL);

    }

});

/**
* Total number of children in this group, regardless of exists/alive status.
*
* @name Phaser.Group#length
* @property {integer} length 
* @readonly
*/
Object.defineProperty(Phaser.Group.prototype, "length", {

    get: function () {

        return this.children.length;

    }

});

/**
* The angle of rotation of the group container, in degrees.
*
* This adjusts the group itself by modifying its local rotation transform.
*
* This has no impact on the rotation/angle properties of the children, but it will update their worldTransform
* and on-screen orientation and position.
*
* @name Phaser.Group#angle
* @property {number} angle
*/
Object.defineProperty(Phaser.Group.prototype, "angle", {

    get: function() {
        return Phaser.Math.radToDeg(this.rotation);
    },

    set: function(value) {
        this.rotation = Phaser.Math.degToRad(value);
    }

});

/**
* A display object is any object that can be rendered in the Phaser/pixi.js scene graph.
*
* This includes {@link Phaser.Group} (groups are display objects!),
* {@link Phaser.Sprite}, {@link Phaser.Button}, {@link Phaser.Text}
* as well as {@link PIXI.DisplayObject} and all derived types.
*
* @typedef {object} DisplayObject
*/
// Documentation stub for linking.

/**
* The x coordinate of the group container.
*
* You can adjust the group container itself by modifying its coordinates.
* This will have no impact on the x/y coordinates of its children, but it will update their worldTransform and on-screen position.
* @name Phaser.Group#x
* @property {number} x
*/

/**
* The y coordinate of the group container.
*
* You can adjust the group container itself by modifying its coordinates.
* This will have no impact on the x/y coordinates of its children, but it will update their worldTransform and on-screen position.
* @name Phaser.Group#y
* @property {number} y
*/

/**
* The angle of rotation of the group container, in radians.
*
* This will adjust the group container itself by modifying its rotation.
* This will have no impact on the rotation value of its children, but it will update their worldTransform and on-screen position.
* @name Phaser.Group#rotation
* @property {number} rotation
*/

/**
* The visible state of the group. Non-visible Groups and all of their children are not rendered.
*
* @name Phaser.Group#visible
* @property {boolean} visible
*/

/**
* The alpha value of the group container.
*
* @name Phaser.Group#alpha
* @property {number} alpha
*/


/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* "This world is but a canvas to our imagination." - Henry David Thoreau
*
* A game has only one world. The world is an abstract place in which all game objects live. It is not bound
* by stage limits and can be any size. You look into the world via cameras. All game objects live within
* the world at world-based coordinates. By default a world is created the same size as your Stage.
*
* @class Phaser.World
* @extends Phaser.Group
* @constructor
* @param {Phaser.Game} game - Reference to the current game instance.
*/
Phaser.World = function (game) {

    Phaser.Group.call(this, game, null, '__world', false);

    /**
    * The World has no fixed size, but it does have a bounds outside of which objects are no longer considered as being "in world" and you should use this to clean-up the display list and purge dead objects.
    * By default we set the Bounds to be from 0,0 to Game.width,Game.height. I.e. it will match the size given to the game constructor with 0,0 representing the top-left of the display.
    * However 0,0 is actually the center of the world, and if you rotate or scale the world all of that will happen from 0,0.
    * So if you want to make a game in which the world itself will rotate you should adjust the bounds so that 0,0 is the center point, i.e. set them to -1000,-1000,2000,2000 for a 2000x2000 sized world centered around 0,0.
    * @property {Phaser.Rectangle} bounds - Bound of this world that objects can not escape from.
    */
    this.bounds = new Phaser.Rectangle(0, 0, game.width, game.height);

    /**
    * @property {Phaser.Camera} camera - Camera instance.
    */
    this.camera = null;

    /**
    * @property {boolean} _definedSize - True if the World has been given a specifically defined size (i.e. from a Tilemap or direct in code) or false if it's just matched to the Game dimensions.
    * @readonly
    */
    this._definedSize = false;

    /**
    * @property {number} width - The defined width of the World. Sometimes the bounds needs to grow larger than this (if you resize the game) but this retains the original requested dimension.
    */
    this._width = game.width;

    /**
    * @property {number} height - The defined height of the World. Sometimes the bounds needs to grow larger than this (if you resize the game) but this retains the original requested dimension.
    */
    this._height = game.height;

    this.game.state.onStateChange.add(this.stateChange, this);

};

Phaser.World.prototype = Object.create(Phaser.Group.prototype);
Phaser.World.prototype.constructor = Phaser.World;

/**
* Initialises the game world.
*
* @method Phaser.World#boot
* @protected
*/
Phaser.World.prototype.boot = function () {

    this.camera = new Phaser.Camera(this.game, 0, 0, 0, this.game.width, this.game.height);

    this.camera.displayObject = this;

    this.camera.scale = this.scale;

    this.game.camera = this.camera;

    this.game.stage.addChild(this);

};

/**
* Called whenever the State changes or resets.
* 
* It resets the world.x and world.y coordinates back to zero,
* then resets the Camera.
*
* @method Phaser.World#stateChange
* @protected
*/
Phaser.World.prototype.stateChange = function () {

    this.x = 0;
    this.y = 0;

    this.camera.reset();

};

/**
* Updates the size of this world and sets World.x/y to the given values
* The Camera bounds and Physics bounds (if set) are also updated to match the new World bounds.
*
* @method Phaser.World#setBounds
* @param {number} x - Top left most corner of the world.
* @param {number} y - Top left most corner of the world.
* @param {number} width - New width of the game world in pixels.
* @param {number} height - New height of the game world in pixels.
*/
Phaser.World.prototype.setBounds = function (x, y, width, height) {

    this._definedSize = true;
    this._width = width;
    this._height = height;

    this.bounds.setTo(x, y, width, height);

    this.x = x;
    this.y = y;

    if (this.camera.bounds)
    {
        //  The Camera can never be smaller than the game size
        this.camera.bounds.setTo(x, y, Math.max(width, this.game.width), Math.max(height, this.game.height));
    }

    this.game.physics.setBoundsToWorld();

};

/**
* Updates the size of this world. Note that this doesn't modify the world x/y coordinates, just the width and height.
*
* @method Phaser.World#resize
* @param {number} width - New width of the game world in pixels.
* @param {number} height - New height of the game world in pixels.
*/
Phaser.World.prototype.resize = function (width, height) {

    //  Don't ever scale the World bounds lower than the original requested dimensions if it's a defined world size

    if (this._definedSize)
    {
        if (width < this._width)
        {
            width = this._width;
        }

        if (height < this._height)
        {
            height = this._height;
        }
    }

    this.bounds.width = width;
    this.bounds.height = height;

    this.game.camera.setBoundsToWorld();

    this.game.physics.setBoundsToWorld();

};

/**
* Destroyer of worlds.
*
* @method Phaser.World#shutdown
*/
Phaser.World.prototype.shutdown = function () {

    //  World is a Group, so run a soft destruction on this and all children.
    this.destroy(true, true);

};

/**
* This will take the given game object and check if its x/y coordinates fall outside of the world bounds.
* If they do it will reposition the object to the opposite side of the world, creating a wrap-around effect.
* If sprite has a P2 body then the body (sprite.body) should be passed as first parameter to the function.
*
* @method Phaser.World#wrap
* @param {Phaser.Sprite|Phaser.Image|Phaser.TileSprite|Phaser.Text} sprite - The object you wish to wrap around the world bounds.
* @param {number} [padding=0] - Extra padding added equally to the sprite.x and y coordinates before checking if within the world bounds. Ignored if useBounds is true.
* @param {boolean} [useBounds=false] - If useBounds is false wrap checks the object.x/y coordinates. If true it does a more accurate bounds check, which is more expensive.
* @param {boolean} [horizontal=true] - If horizontal is false, wrap will not wrap the object.x coordinates horizontally.
* @param {boolean} [vertical=true] - If vertical is false, wrap will not wrap the object.y coordinates vertically.
*/
Phaser.World.prototype.wrap = function (sprite, padding, useBounds, horizontal, vertical) {

    if (padding === undefined) { padding = 0; }
    if (useBounds === undefined) { useBounds = false; }
    if (horizontal === undefined) { horizontal = true; }
    if (vertical === undefined) { vertical = true; }

    if (!useBounds)
    {
        if (horizontal && sprite.x + padding < this.bounds.x)
        {
            sprite.x = this.bounds.right + padding;
        }
        else if (horizontal && sprite.x - padding > this.bounds.right)
        {
            sprite.x = this.bounds.left - padding;
        }

        if (vertical && sprite.y + padding < this.bounds.top)
        {
            sprite.y = this.bounds.bottom + padding;
        }
        else if (vertical && sprite.y - padding > this.bounds.bottom)
        {
            sprite.y = this.bounds.top - padding;
        }
    }
    else
    {
        sprite.getBounds();

        if (horizontal)
        {
            if ((sprite.x + sprite._currentBounds.width) < this.bounds.x)
            {
                sprite.x = this.bounds.right;
            }
            else if (sprite.x > this.bounds.right)
            {
                sprite.x = this.bounds.left;
            }
        }

        if (vertical)
        {
            if ((sprite.y + sprite._currentBounds.height) < this.bounds.top)
            {
                sprite.y = this.bounds.bottom;
            }
            else if (sprite.y > this.bounds.bottom)
            {
                sprite.y = this.bounds.top;
            }
        }
    }

};

/**
* @name Phaser.World#width
* @property {number} width - Gets or sets the current width of the game world. The world can never be smaller than the game (canvas) dimensions.
*/
Object.defineProperty(Phaser.World.prototype, "width", {

    get: function () {
        return this.bounds.width;
    },

    set: function (value) {

        if (value < this.game.width)
        {
            value = this.game.width;
        }

        this.bounds.width = value;
        this._width = value;
        this._definedSize = true;

    }

});

/**
* @name Phaser.World#height
* @property {number} height - Gets or sets the current height of the game world. The world can never be smaller than the game (canvas) dimensions.
*/
Object.defineProperty(Phaser.World.prototype, "height", {

    get: function () {
        return this.bounds.height;
    },

    set: function (value) {

        if (value < this.game.height)
        {
            value = this.game.height;
        }

        this.bounds.height = value;
        this._height = value;
        this._definedSize = true;

    }

});

/**
* @name Phaser.World#centerX
* @property {number} centerX - Gets the X position corresponding to the center point of the world.
* @readonly
*/
Object.defineProperty(Phaser.World.prototype, "centerX", {

    get: function () {
        return this.bounds.halfWidth;
    }

});

/**
* @name Phaser.World#centerY
* @property {number} centerY - Gets the Y position corresponding to the center point of the world.
* @readonly
*/
Object.defineProperty(Phaser.World.prototype, "centerY", {

    get: function () {
        return this.bounds.halfHeight;
    }

});

/**
* @name Phaser.World#randomX
* @property {number} randomX - Gets a random integer which is lesser than or equal to the current width of the game world.
* @readonly
*/
Object.defineProperty(Phaser.World.prototype, "randomX", {

    get: function () {

        if (this.bounds.x < 0)
        {
            return this.game.rnd.between(this.bounds.x, (this.bounds.width - Math.abs(this.bounds.x)));
        }
        else
        {
            return this.game.rnd.between(this.bounds.x, this.bounds.width);
        }

    }

});

/**
* @name Phaser.World#randomY
* @property {number} randomY - Gets a random integer which is lesser than or equal to the current height of the game world.
* @readonly
*/
Object.defineProperty(Phaser.World.prototype, "randomY", {

    get: function () {

        if (this.bounds.y < 0)
        {
            return this.game.rnd.between(this.bounds.y, (this.bounds.height - Math.abs(this.bounds.y)));
        }
        else
        {
            return this.game.rnd.between(this.bounds.y, this.bounds.height);
        }

    }

});

/* jshint newcap: false */

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The State Manager is responsible for loading, setting up and switching game states.
*
* @class Phaser.StateManager
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {Phaser.State|Object} [pendingState=null] - A State object to seed the manager with.
*/
Phaser.StateManager = function (game, pendingState) {

    /**
    * @property {Phaser.Game} game - A reference to the currently running game.
    */
    this.game = game;

    /**
    * @property {object} states - The object containing Phaser.States.
    */
    this.states = {};

    /**
    * @property {Phaser.State} _pendingState - The state to be switched to in the next frame.
    * @private
    */
    this._pendingState = null;

    if (typeof pendingState !== 'undefined' && pendingState !== null)
    {
        this._pendingState = pendingState;
    }

    /**
    * @property {boolean} _clearWorld - Clear the world when we switch state?
    * @private
    */
    this._clearWorld = false;

    /**
    * @property {boolean} _clearCache - Clear the cache when we switch state?
    * @private
    */
    this._clearCache = false;

    /**
    * @property {boolean} _created - Flag that sets if the State has been created or not.
    * @private
    */
    this._created = false;

    /**
    * @property {any[]} _args - Temporary container when you pass vars from one State to another.
    * @private
    */
    this._args = [];

    /**
    * @property {string} current - The current active State object.
    * @default
    */
    this.current = '';

    /**
    * onStateChange is a Phaser.Signal that is dispatched whenever the game changes state.
    * 
    * It is dispatched only when the new state is started, which isn't usually at the same time as StateManager.start
    * is called because state swapping is done in sync with the game loop. It is dispatched *before* any of the new states
    * methods (such as preload and create) are called, and *after* the previous states shutdown method has been run.
    *
    * The callback you specify is sent two parameters: the string based key of the new state, 
    * and the second parameter is the string based key of the old / previous state.
    * 
    * @property {Phaser.Signal} onStateChange
    */
    this.onStateChange = new Phaser.Signal();

    /**
    * @property {function} onInitCallback - This is called when the state is set as the active state.
    * @default
    */
    this.onInitCallback = null;

    /**
    * @property {function} onPreloadCallback - This is called when the state starts to load assets.
    * @default
    */
    this.onPreloadCallback = null;

    /**
    * @property {function} onCreateCallback - This is called when the state preload has finished and creation begins.
    * @default
    */
    this.onCreateCallback = null;

    /**
    * @property {function} onUpdateCallback - This is called when the state is updated, every game loop. It doesn't happen during preload (@see onLoadUpdateCallback).
    * @default
    */
    this.onUpdateCallback = null;

    /**
    * @property {function} onRenderCallback - This is called post-render. It doesn't happen during preload (see onLoadRenderCallback).
    * @default
    */
    this.onRenderCallback = null;

    /**
    * @property {function} onResizeCallback - This is called if ScaleManager.scalemode is RESIZE and a resize event occurs. It's passed the new width and height.
    * @default
    */
    this.onResizeCallback = null;

    /**
    * @property {function} onPreRenderCallback - This is called before the state is rendered and before the stage is cleared but after all game objects have had their final properties adjusted.
    * @default
    */
    this.onPreRenderCallback = null;

    /**
    * @property {function} onLoadUpdateCallback - This is called when the State is updated during the preload phase.
    * @default
    */
    this.onLoadUpdateCallback = null;

    /**
    * @property {function} onLoadRenderCallback - This is called when the State is rendered during the preload phase.
    * @default
    */
    this.onLoadRenderCallback = null;

    /**
    * @property {function} onPausedCallback - This is called when the game is paused.
    * @default
    */
    this.onPausedCallback = null;

    /**
    * @property {function} onResumedCallback - This is called when the game is resumed from a paused state.
    * @default
    */
    this.onResumedCallback = null;

    /**
    * @property {function} onPauseUpdateCallback - This is called every frame while the game is paused.
    * @default
    */
    this.onPauseUpdateCallback = null;

    /**
    * @property {function} onShutDownCallback - This is called when the state is shut down (i.e. swapped to another state).
    * @default
    */
    this.onShutDownCallback = null;

};

Phaser.StateManager.prototype = {

    /**
    * The Boot handler is called by Phaser.Game when it first starts up.
    * @method Phaser.StateManager#boot
    * @private
    */
    boot: function () {

        this.game.onPause.add(this.pause, this);
        this.game.onResume.add(this.resume, this);

        if (this._pendingState !== null && typeof this._pendingState !== 'string')
        {
            this.add('default', this._pendingState, true);
        }

    },

    /**
    * Adds a new State into the StateManager. You must give each State a unique key by which you'll identify it.
    * The State can be either a Phaser.State object (or an object that extends it), a plain JavaScript object or a function.
    * If a function is given a new state object will be created by calling it.
    *
    * @method Phaser.StateManager#add
    * @param {string} key - A unique key you use to reference this state, i.e. "MainMenu", "Level1".
    * @param {Phaser.State|object|function} state  - The state you want to switch to.
    * @param {boolean} [autoStart=false]  - If true the State will be started immediately after adding it.
    */
    add: function (key, state, autoStart) {

        if (autoStart === undefined) { autoStart = false; }

        var newState;

        if (state instanceof Phaser.State)
        {
            newState = state;
        }
        else if (typeof state === 'object')
        {
            newState = state;
            newState.game = this.game;
        }
        else if (typeof state === 'function')
        {
            newState = new state(this.game);
        }

        this.states[key] = newState;

        if (autoStart)
        {
            if (this.game.isBooted)
            {
                this.start(key);
            }
            else
            {
                this._pendingState = key;
            }
        }

        return newState;

    },

    /**
    * Delete the given state.
    * @method Phaser.StateManager#remove
    * @param {string} key - A unique key you use to reference this state, i.e. "MainMenu", "Level1".
    */
    remove: function (key) {

        if (this.current === key)
        {
            this.callbackContext = null;

            this.onInitCallback = null;
            this.onShutDownCallback = null;

            this.onPreloadCallback = null;
            this.onLoadRenderCallback = null;
            this.onLoadUpdateCallback = null;
            this.onCreateCallback = null;
            this.onUpdateCallback = null;
            this.onPreRenderCallback = null;
            this.onRenderCallback = null;
            this.onResizeCallback = null;
            this.onPausedCallback = null;
            this.onResumedCallback = null;
            this.onPauseUpdateCallback = null;
        }

        delete this.states[key];

    },

    /**
    * Start the given State. If a State is already running then State.shutDown will be called (if it exists) before switching to the new State.
    *
    * @method Phaser.StateManager#start
    * @param {string} key - The key of the state you want to start.
    * @param {boolean} [clearWorld=true] - Clear everything in the world? This clears the World display list fully (but not the Stage, so if you've added your own objects to the Stage they will need managing directly)
    * @param {boolean} [clearCache=false] - Clear the Game.Cache? This purges out all loaded assets. The default is false and you must have clearWorld=true if you want to clearCache as well.
    * @param {...*} parameter - Additional parameters that will be passed to the State.init function (if it has one).
    */
    start: function (key, clearWorld, clearCache) {

        if (clearWorld === undefined) { clearWorld = true; }
        if (clearCache === undefined) { clearCache = false; }

        if (this.checkState(key))
        {
            //  Place the state in the queue. It will be started the next time the game loop begins.
            this._pendingState = key;
            this._clearWorld = clearWorld;
            this._clearCache = clearCache;

            if (arguments.length > 3)
            {
                this._args = Array.prototype.splice.call(arguments, 3);
            }
        }

    },

    /**
    * Restarts the current State. State.shutDown will be called (if it exists) before the State is restarted.
    *
    * @method Phaser.StateManager#restart
    * @param {boolean} [clearWorld=true] - Clear everything in the world? This clears the World display list fully (but not the Stage, so if you've added your own objects to the Stage they will need managing directly)
    * @param {boolean} [clearCache=false] - Clear the Game.Cache? This purges out all loaded assets. The default is false and you must have clearWorld=true if you want to clearCache as well.
    * @param {...*} parameter - Additional parameters that will be passed to the State.init function if it has one.
    */
    restart: function (clearWorld, clearCache) {

        if (clearWorld === undefined) { clearWorld = true; }
        if (clearCache === undefined) { clearCache = false; }

        //  Place the state in the queue. It will be started the next time the game loop starts.
        this._pendingState = this.current;
        this._clearWorld = clearWorld;
        this._clearCache = clearCache;

        if (arguments.length > 2)
        {
            this._args = Array.prototype.slice.call(arguments, 2);
        }

    },

    /**
    * Used by onInit and onShutdown when those functions don't exist on the state
    * @method Phaser.StateManager#dummy
    * @private
    */
    dummy: function () {
    },

    /**
    * preUpdate is called right at the start of the game loop. It is responsible for changing to a new state that was requested previously.
    *
    * @method Phaser.StateManager#preUpdate
    */
    preUpdate: function () {

        if (this._pendingState && this.game.isBooted)
        {
            var previousStateKey = this.current;

            //  Already got a state running?
            this.clearCurrentState();

            this.setCurrentState(this._pendingState);

            this.onStateChange.dispatch(this.current, previousStateKey);

            if (this.current !== this._pendingState)
            {
                return;
            }
            else
            {
                this._pendingState = null;
            }

            //  If StateManager.start has been called from the init of a State that ALSO has a preload, then
            //  onPreloadCallback will be set, but must be ignored
            if (this.onPreloadCallback)
            {
                this.game.load.reset(true);
                this.onPreloadCallback.call(this.callbackContext, this.game);

                //  Is the loader empty?
                if (this.game.load.totalQueuedFiles() === 0 && this.game.load.totalQueuedPacks() === 0)
                {
                    this.loadComplete();
                }
                else
                {
                    //  Start the loader going as we have something in the queue
                    this.game.load.start();
                }
            }
            else
            {
                //  No init? Then there was nothing to load either
                this.loadComplete();
            }
        }

    },

    /**
    * This method clears the current State, calling its shutdown callback. The process also removes any active tweens,
    * resets the camera, resets input, clears physics, removes timers and if set clears the world and cache too.
    *
    * @method Phaser.StateManager#clearCurrentState
    */
    clearCurrentState: function () {

        if (this.current)
        {
            if (this.onShutDownCallback)
            {
                this.onShutDownCallback.call(this.callbackContext, this.game);
            }

            this.game.tweens.removeAll();

            this.game.camera.reset();

            this.game.input.reset(true);

            this.game.physics.clear();

            this.game.time.removeAll();

            this.game.scale.reset(this._clearWorld);

            if (this.game.debug)
            {
                this.game.debug.reset();
            }

            if (this._clearWorld)
            {
                this.game.world.shutdown();

                if (this._clearCache === true)
                {
                    this.game.cache.destroy();
                }
            }
        }

    },

    /**
    * Checks if a given phaser state is valid. A State is considered valid if it has at least one of the core functions: preload, create, update or render.
    *
    * @method Phaser.StateManager#checkState
    * @param {string} key - The key of the state you want to check.
    * @return {boolean} true if the State has the required functions, otherwise false.
    */
    checkState: function (key) {

        if (this.states[key])
        {
            var valid = false;

            if (this.states[key]['preload'] || this.states[key]['create'] || this.states[key]['update'] || this.states[key]['render'])
            {
                valid = true;
            }

            if (valid === false)
            {
                console.warn("Invalid Phaser State object given. Must contain at least a one of the required functions: preload, create, update or render");
                return false;
            }

            return true;
        }
        else
        {
            console.warn("Phaser.StateManager - No state found with the key: " + key);
            return false;
        }

    },

    /**
    * Links game properties to the State given by the key.
    *
    * @method Phaser.StateManager#link
    * @param {string} key - State key.
    * @protected
    */
    link: function (key) {

        this.states[key].game = this.game;
        this.states[key].add = this.game.add;
        this.states[key].make = this.game.make;
        this.states[key].camera = this.game.camera;
        this.states[key].cache = this.game.cache;
        this.states[key].input = this.game.input;
        this.states[key].load = this.game.load;
        this.states[key].math = this.game.math;
        this.states[key].sound = this.game.sound;
        this.states[key].scale = this.game.scale;
        this.states[key].state = this;
        this.states[key].stage = this.game.stage;
        this.states[key].time = this.game.time;
        this.states[key].tweens = this.game.tweens;
        this.states[key].world = this.game.world;
        this.states[key].particles = this.game.particles;
        this.states[key].rnd = this.game.rnd;
        this.states[key].physics = this.game.physics;
        this.states[key].key = key;

    },

    /**
    * Nulls all State level Phaser properties, including a reference to Game.
    *
    * @method Phaser.StateManager#unlink
    * @param {string} key - State key.
    * @protected
    */
    unlink: function (key) {

        if (this.states[key])
        {
            this.states[key].game = null;
            this.states[key].add = null;
            this.states[key].make = null;
            this.states[key].camera = null;
            this.states[key].cache = null;
            this.states[key].input = null;
            this.states[key].load = null;
            this.states[key].math = null;
            this.states[key].sound = null;
            this.states[key].scale = null;
            this.states[key].state = null;
            this.states[key].stage = null;
            this.states[key].time = null;
            this.states[key].tweens = null;
            this.states[key].world = null;
            this.states[key].particles = null;
            this.states[key].rnd = null;
            this.states[key].physics = null;
        }

    },

    /**
    * Sets the current State. Should not be called directly (use StateManager.start)
    *
    * @method Phaser.StateManager#setCurrentState
    * @param {string} key - State key.
    * @private
    */
    setCurrentState: function (key) {

        this.callbackContext = this.states[key];

        this.link(key);

        //  Used when the state is set as being the current active state
        this.onInitCallback = this.states[key]['init'] || this.dummy;

        this.onPreloadCallback = this.states[key]['preload'] || null;
        this.onLoadRenderCallback = this.states[key]['loadRender'] || null;
        this.onLoadUpdateCallback = this.states[key]['loadUpdate'] || null;
        this.onCreateCallback = this.states[key]['create'] || null;
        this.onUpdateCallback = this.states[key]['update'] || null;
        this.onPreRenderCallback = this.states[key]['preRender'] || null;
        this.onRenderCallback = this.states[key]['render'] || null;
        this.onResizeCallback = this.states[key]['resize'] || null;
        this.onPausedCallback = this.states[key]['paused'] || null;
        this.onResumedCallback = this.states[key]['resumed'] || null;
        this.onPauseUpdateCallback = this.states[key]['pauseUpdate'] || null;

        //  Used when the state is no longer the current active state
        this.onShutDownCallback = this.states[key]['shutdown'] || this.dummy;

        //  Reset the physics system, but not on the first state start
        if (this.current !== '')
        {
            this.game.physics.reset();
        }

        this.current = key;
        this._created = false;

        //  At this point key and pendingState should equal each other
        this.onInitCallback.apply(this.callbackContext, this._args);

        //  If they no longer do then the init callback hit StateManager.start
        if (key === this._pendingState)
        {
            this._args = [];
        }

        this.game._kickstart = true;

    },

    /**
     * Gets the current State.
     *
     * @method Phaser.StateManager#getCurrentState
     * @return Phaser.State
     * @public
     */
    getCurrentState: function() {
        return this.states[this.current];
    },

    /**
    * @method Phaser.StateManager#loadComplete
    * @protected
    */
    loadComplete: function () {

        if (this._created === false && this.onCreateCallback)
        {
            this._created = true;
            this.onCreateCallback.call(this.callbackContext, this.game);
        }
        else
        {
            this._created = true;
        }

    },

    /**
    * @method Phaser.StateManager#pause
    * @protected
    */
    pause: function () {

        if (this._created && this.onPausedCallback)
        {
            this.onPausedCallback.call(this.callbackContext, this.game);
        }

    },

    /**
    * @method Phaser.StateManager#resume
    * @protected
    */
    resume: function () {

        if (this._created && this.onResumedCallback)
        {
            this.onResumedCallback.call(this.callbackContext, this.game);
        }

    },

    /**
    * @method Phaser.StateManager#update
    * @protected
    */
    update: function () {

        if (this._created)
        {
            if (this.onUpdateCallback)
            {
                this.onUpdateCallback.call(this.callbackContext, this.game);
            }
        }
        else
        {
            if (this.onLoadUpdateCallback)
            {
                this.onLoadUpdateCallback.call(this.callbackContext, this.game);
            }
        }

    },

    /**
    * @method Phaser.StateManager#pauseUpdate
    * @protected
    */
    pauseUpdate: function () {

        if (this._created)
        {
            if (this.onPauseUpdateCallback)
            {
                this.onPauseUpdateCallback.call(this.callbackContext, this.game);
            }
        }
        else
        {
            if (this.onLoadUpdateCallback)
            {
                this.onLoadUpdateCallback.call(this.callbackContext, this.game);
            }
        }

    },

    /**
    * @method Phaser.StateManager#preRender
    * @protected
    * @param {number} elapsedTime - The time elapsed since the last update.
    */
    preRender: function (elapsedTime) {

        if (this._created && this.onPreRenderCallback)
        {
            this.onPreRenderCallback.call(this.callbackContext, this.game, elapsedTime);
        }

    },

    /**
    * @method Phaser.StateManager#resize
    * @protected
    */
    resize: function (width, height) {

        if (this.onResizeCallback)
        {
            this.onResizeCallback.call(this.callbackContext, width, height);
        }

    },

    /**
    * @method Phaser.StateManager#render
    * @protected
    */
    render: function () {

        if (this._created)
        {
            if (this.onRenderCallback)
            {
                if (this.game.renderType === Phaser.CANVAS)
                {
                    this.game.context.save();
                    this.game.context.setTransform(1, 0, 0, 1, 0, 0);
                    this.onRenderCallback.call(this.callbackContext, this.game);
                    this.game.context.restore();
                }
                else
                {
                    this.onRenderCallback.call(this.callbackContext, this.game);
                }
            }
        }
        else
        {
            if (this.onLoadRenderCallback)
            {
                this.onLoadRenderCallback.call(this.callbackContext, this.game);
            }
        }

    },

    /**
    * Removes all StateManager callback references to the State object, nulls the game reference and clears the States object.
    * You don't recover from this without rebuilding the Phaser instance again.
    * @method Phaser.StateManager#destroy
    */
    destroy: function () {

        this.clearCurrentState();

        this.callbackContext = null;

        this.onInitCallback = null;
        this.onShutDownCallback = null;

        this.onPreloadCallback = null;
        this.onLoadRenderCallback = null;
        this.onLoadUpdateCallback = null;
        this.onCreateCallback = null;
        this.onUpdateCallback = null;
        this.onRenderCallback = null;
        this.onPausedCallback = null;
        this.onResumedCallback = null;
        this.onPauseUpdateCallback = null;

        this.game = null;
        this.states = {};
        this._pendingState = null;
        this.current = '';

    }

};

Phaser.StateManager.prototype.constructor = Phaser.StateManager;

/**
* @name Phaser.StateManager#created
* @property {boolean} created - True if the current state has had its `create` method run (if it has one, if not this is true by default).
* @readOnly
*/
Object.defineProperty(Phaser.StateManager.prototype, "created", {

    get: function () {

        return this._created;

    }

});

/**
* "It's like nailing jelly to a kitten" - Gary Penn
*/

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* This is a base State class which can be extended if you are creating your own game.
* It provides quick access to common functions such as the camera, cache, input, match, sound and more.
*
* @class Phaser.State
* @constructor
*/
Phaser.State = function () {

    /**
    * @property {Phaser.Game} game - This is a reference to the currently running Game.
    */
    this.game = null;

    /**
    * @property {string} key - The string based identifier given to the State when added into the State Manager.
    */
    this.key = '';

    /**
    * @property {Phaser.GameObjectFactory} add - A reference to the GameObjectFactory which can be used to add new objects to the World.
    */
    this.add = null;

    /**
    * @property {Phaser.GameObjectCreator} make - A reference to the GameObjectCreator which can be used to make new objects.
    */
    this.make = null;

    /**
    * @property {Phaser.Camera} camera - A handy reference to World.camera.
    */
    this.camera = null;

    /**
    * @property {Phaser.Cache} cache - A reference to the game cache which contains any loaded or generated assets, such as images, sound and more.
    */
    this.cache = null;

    /**
    * @property {Phaser.Input} input - A reference to the Input Manager.
    */
    this.input = null;

    /**
    * @property {Phaser.Loader} load - A reference to the Loader, which you mostly use in the preload method of your state to load external assets.
    */
    this.load = null;

    /**
    * @property {Phaser.Math} math - A reference to Math class with lots of helpful functions.
    */
    this.math = null;

    /**
    * @property {Phaser.SoundManager} sound - A reference to the Sound Manager which can create, play and stop sounds, as well as adjust global volume.
    */
    this.sound = null;

    /**
    * @property {Phaser.ScaleManager} scale - A reference to the Scale Manager which controls the way the game scales on different displays.
    */
    this.scale = null;

    /**
    * @property {Phaser.Stage} stage - A reference to the Stage.
    */
    this.stage = null;

    /**
    * @property {Phaser.Time} time - A reference to the game clock and timed events system.
    */
    this.time = null;

    /**
    * @property {Phaser.TweenManager} tweens - A reference to the tween manager.
    */
    this.tweens = null;

    /**
    * @property {Phaser.World} world - A reference to the game world. All objects live in the Game World and its size is not bound by the display resolution.
    */
    this.world = null;

    /**
    * @property {Phaser.Particles} particles - The Particle Manager. It is called during the core gameloop and updates any Particle Emitters it has created.
    */
    this.particles = null;

    /**
    * @property {Phaser.Physics} physics - A reference to the physics manager which looks after the different physics systems available within Phaser.
    */
    this.physics = null;

    /**
    * @property {Phaser.RandomDataGenerator} rnd - A reference to the seeded and repeatable random data generator.
    */
    this.rnd = null;

};

Phaser.State.prototype = {

    /**
    * init is the very first function called when your State starts up. It's called before preload, create or anything else.
    * If you need to route the game away to another State you could do so here, or if you need to prepare a set of variables
    * or objects before the preloading starts.
    *
    * @method Phaser.State#init
    */
    init: function () {
    },

    /**
    * preload is called first. Normally you'd use this to load your game assets (or those needed for the current State)
    * You shouldn't create any objects in this method that require assets that you're also loading in this method, as
    * they won't yet be available.
    *
    * @method Phaser.State#preload
    */
    preload: function () {
    },

    /**
    * loadUpdate is called during the Loader process. This only happens if you've set one or more assets to load in the preload method.
    *
    * @method Phaser.State#loadUpdate
    */
    loadUpdate: function () {
    },

    /**
    * loadRender is called during the Loader process. This only happens if you've set one or more assets to load in the preload method.
    * The difference between loadRender and render is that any objects you render in this method you must be sure their assets exist.
    *
    * @method Phaser.State#loadRender
    */
    loadRender: function () {
    },

    /**
    * create is called once preload has completed, this includes the loading of any assets from the Loader.
    * If you don't have a preload method then create is the first method called in your State.
    *
    * @method Phaser.State#create
    */
    create: function () {
    },

    /**
    * The update method is left empty for your own use.
    * It is called during the core game loop AFTER debug, physics, plugins and the Stage have had their preUpdate methods called.
    * If is called BEFORE Stage, Tweens, Sounds, Input, Physics, Particles and Plugins have had their postUpdate methods called.
    *
    * @method Phaser.State#update
    */
    update: function () {
    },

    /**
    * The preRender method is called after all Game Objects have been updated, but before any rendering takes place.
    *
    * @method Phaser.State#preRender
    */
    preRender: function () {
    },

    /**
    * Nearly all display objects in Phaser render automatically, you don't need to tell them to render.
    * However the render method is called AFTER the game renderer and plugins have rendered, so you're able to do any
    * final post-processing style effects here. Note that this happens before plugins postRender takes place.
    *
    * @method Phaser.State#render
    */
    render: function () {
    },

    /**
    * If your game is set to Scalemode RESIZE then each time the browser resizes it will call this function, passing in the new width and height.
    *
    * @method Phaser.State#resize
    */
    resize: function () {
    },

    /**
    * This method will be called if the core game loop is paused.
    *
    * @method Phaser.State#paused
    */
    paused: function () {
    },

    /**
    * This method will be called when the core game loop resumes from a paused state.
    *
    * @method Phaser.State#resumed
    */
    resumed: function () {
    },

    /**
    * pauseUpdate is called while the game is paused instead of preUpdate, update and postUpdate.
    *
    * @method Phaser.State#pauseUpdate
    */
    pauseUpdate: function () {
    },

    /**
    * This method will be called when the State is shutdown (i.e. you switch to another state from this one).
    *
    * @method Phaser.State#shutdown
    */
    shutdown: function () {
    }

};

Phaser.State.prototype.constructor = Phaser.State;


/**
* @author       Miller Medeiros http://millermedeiros.github.com/js-signals/
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* A Signal is an event dispatch mechanism that supports broadcasting to multiple listeners.
*
* Event listeners are uniquely identified by the listener/callback function and the context.
* 
* @class Phaser.Signal
* @constructor
*/
Phaser.Signal = function () {
};

Phaser.Signal.prototype = {

    /**
    * @property {?Array.<Phaser.SignalBinding>} _bindings - Internal variable.
    * @private
    */
    _bindings: null,

    /**
    * @property {any} _prevParams - Internal variable.
    * @private
    */
    _prevParams: null,

    /**
    * Memorize the previously dispatched event?
    *
    * If an event has been memorized it is automatically dispatched when a new listener is added with {@link #add} or {@link #addOnce}.
    * Use {@link #forget} to clear any currently memorized event.
    *
    * @property {boolean} memorize
    */
    memorize: false,

    /**
    * @property {boolean} _shouldPropagate
    * @private
    */
    _shouldPropagate: true,

    /**
    * Is the Signal active? Only active signals will broadcast dispatched events.
    *
    * Setting this property during a dispatch will only affect the next dispatch. To stop the propagation of a signal from a listener use {@link #halt}.
    *
    * @property {boolean} active
    * @default
    */
    active: true,

    /**
    * @property {function} _boundDispatch - The bound dispatch function, if any.
    * @private
    */
    _boundDispatch: true,

    /**
    * @method Phaser.Signal#validateListener
    * @param {function} listener - Signal handler function.
    * @param {string} fnName - Function name.
    * @private
    */
    validateListener: function (listener, fnName) {

        if (typeof listener !== 'function')
        {
            throw new Error('Phaser.Signal: listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName));
        }

    },

    /**
    * @method Phaser.Signal#_registerListener
    * @private
    * @param {function} listener - Signal handler function.
    * @param {boolean} isOnce - Should the listener only be called once?
    * @param {object} [listenerContext] - The context under which the listener is invoked.
    * @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0).
    * @return {Phaser.SignalBinding} An Object representing the binding between the Signal and listener.
    */
    _registerListener: function (listener, isOnce, listenerContext, priority, args) {

        var prevIndex = this._indexOfListener(listener, listenerContext);
        var binding;

        if (prevIndex !== -1)
        {
            binding = this._bindings[prevIndex];

            if (binding.isOnce() !== isOnce)
            {
                throw new Error('You cannot add' + (isOnce ? '' : 'Once') + '() then add' + (!isOnce ? '' : 'Once') + '() the same listener without removing the relationship first.');
            }
        }
        else
        {
            binding = new Phaser.SignalBinding(this, listener, isOnce, listenerContext, priority, args);
            this._addBinding(binding);
        }

        if (this.memorize && this._prevParams)
        {
            binding.execute(this._prevParams);
        }

        return binding;

    },

    /**
    * @method Phaser.Signal#_addBinding
    * @private
    * @param {Phaser.SignalBinding} binding - An Object representing the binding between the Signal and listener.
    */
    _addBinding: function (binding) {

        if (!this._bindings)
        {
            this._bindings = [];
        }

        //  Simplified insertion sort
        var n = this._bindings.length;

        do {
            n--;
        }
        while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);

        this._bindings.splice(n + 1, 0, binding);

    },

    /**
    * @method Phaser.Signal#_indexOfListener
    * @private
    * @param {function} listener - Signal handler function.
    * @param {object} [context=null] - Signal handler function.
    * @return {number} The index of the listener within the private bindings array.
    */
    _indexOfListener: function (listener, context) {

        if (!this._bindings)
        {
            return -1;
        }

        if (context === undefined) { context = null; }

        var n = this._bindings.length;
        var cur;

        while (n--)
        {
            cur = this._bindings[n];

            if (cur._listener === listener && cur.context === context)
            {
                return n;
            }
        }

        return -1;

    },

    /**
    * Check if a specific listener is attached.
    *
    * @method Phaser.Signal#has
    * @param {function} listener - Signal handler function.
    * @param {object} [context] - Context on which listener will be executed (object that should represent the `this` variable inside listener function).
    * @return {boolean} If Signal has the specified listener.
    */
    has: function (listener, context) {

        return this._indexOfListener(listener, context) !== -1;

    },

    /**
    * Add an event listener for this signal.
    *
    * An event listener is a callback with a related context and priority.
    *
    * You can optionally provide extra arguments which will be passed to the callback after any internal parameters.
    *
    * For example: `Phaser.Key.onDown` when dispatched will send the Phaser.Key object that caused the signal as the first parameter.
    * Any arguments you've specified after `priority` will be sent as well:
    *
    * `fireButton.onDown.add(shoot, this, 0, 'lazer', 100);`
    *
    * When onDown dispatches it will call the `shoot` callback passing it: `Phaser.Key, 'lazer', 100`.
    *
    * Where the first parameter is the one that Key.onDown dispatches internally and 'lazer', 
    * and the value 100 were the custom arguments given in the call to 'add'.
    *
    * @method Phaser.Signal#add
    * @param {function} listener - The function to call when this Signal is dispatched.
    * @param {object} [listenerContext] - The context under which the listener will be executed (i.e. the object that should represent the `this` variable).
    * @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
    * @param {...any} [args=(none)] - Additional arguments to pass to the callback (listener) function. They will be appended after any arguments usually dispatched.
    * @return {Phaser.SignalBinding} An Object representing the binding between the Signal and listener.
    */
    add: function (listener, listenerContext, priority) {

        this.validateListener(listener, 'add');

        var args = [];

        if (arguments.length > 3)
        {
            for (var i = 3; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }
        }

        return this._registerListener(listener, false, listenerContext, priority, args);

    },

    /**
    * Add a one-time listener - the listener is automatically removed after the first execution.
    *
    * If there is as {@link Phaser.Signal#memorize memorized} event then it will be dispatched and
    * the listener will be removed immediately.
    *
    * @method Phaser.Signal#addOnce
    * @param {function} listener - The function to call when this Signal is dispatched.
    * @param {object} [listenerContext] - The context under which the listener will be executed (i.e. the object that should represent the `this` variable).
    * @param {number} [priority] - The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added (default = 0)
    * @param {...any} [args=(none)] - Additional arguments to pass to the callback (listener) function. They will be appended after any arguments usually dispatched.
    * @return {Phaser.SignalBinding} An Object representing the binding between the Signal and listener.
    */
    addOnce: function (listener, listenerContext, priority) {

        this.validateListener(listener, 'addOnce');

        var args = [];

        if (arguments.length > 3)
        {
            for (var i = 3; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }
        }

        return this._registerListener(listener, true, listenerContext, priority, args);

    },

    /**
    * Remove a single event listener.
    *
    * @method Phaser.Signal#remove
    * @param {function} listener - Handler function that should be removed.
    * @param {object} [context=null] - Execution context (since you can add the same handler multiple times if executing in a different context).
    * @return {function} Listener handler function.
    */
    remove: function (listener, context) {

        this.validateListener(listener, 'remove');

        var i = this._indexOfListener(listener, context);

        if (i !== -1)
        {
            this._bindings[i]._destroy(); //no reason to a Phaser.SignalBinding exist if it isn't attached to a signal
            this._bindings.splice(i, 1);
        }

        return listener;

    },

    /**
    * Remove all event listeners.
    *
    * @method Phaser.Signal#removeAll
    * @param {object} [context=null] - If specified only listeners for the given context will be removed.
    */
    removeAll: function (context) {

        if (context === undefined) { context = null; }

        if (!this._bindings)
        {
            return;
        }

        var n = this._bindings.length;

        while (n--)
        {
            if (context)
            {
                if (this._bindings[n].context === context)
                {
                    this._bindings[n]._destroy();
                    this._bindings.splice(n, 1);
                }
            }
            else
            {
                this._bindings[n]._destroy();
            }
        }

        if (!context)
        {
            this._bindings.length = 0;
        }

    },

    /**
    * Gets the total number of listeners attached to this Signal.
    *
    * @method Phaser.Signal#getNumListeners
    * @return {integer} Number of listeners attached to the Signal.
    */
    getNumListeners: function () {

        return this._bindings ? this._bindings.length : 0;

    },

    /**
    * Stop propagation of the event, blocking the dispatch to next listener on the queue.
    *
    * This should be called only during event dispatch as calling it before/after dispatch won't affect another broadcast.
    * See {@link #active} to enable/disable the signal entirely.
    *
    * @method Phaser.Signal#halt
    */
    halt: function () {

        this._shouldPropagate = false;

    },

    /**
    * Dispatch / broadcast the event to all listeners.
    *
    * To create an instance-bound dispatch for this Signal, use {@link #boundDispatch}.
    *
    * @method Phaser.Signal#dispatch
    * @param {any} [params] - Parameters that should be passed to each handler.
    */
    dispatch: function () {

        if (!this.active || !this._bindings)
        {
            return;
        }

        var paramsArr = Array.prototype.slice.call(arguments);
        var n = this._bindings.length;
        var bindings;

        if (this.memorize)
        {
            this._prevParams = paramsArr;
        }

        if (!n)
        {
            //  Should come after memorize
            return;
        }

        bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
        this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

        //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
        //reverse loop since listeners with higher priority will be added at the end of the list
        do {
            n--;
        }
        while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);

    },

    /**
    * Forget the currently {@link Phaser.Signal#memorize memorized} event, if any.
    *
    * @method Phaser.Signal#forget
    */
    forget: function() {

        if (this._prevParams)
        {
            this._prevParams = null;
        }

    },

    /**
    * Dispose the signal - no more events can be dispatched.
    *
    * This removes all event listeners and clears references to external objects.
    * Calling methods on a disposed objects results in undefined behavior.
    *
    * @method Phaser.Signal#dispose
    */
    dispose: function () {

        this.removeAll();

        this._bindings = null;
        if (this._prevParams)
        {
            this._prevParams = null;
        }

    },

    /**
    * A string representation of the object.
    *
    * @method Phaser.Signal#toString
    * @return {string} String representation of the object.
    */
    toString: function () {

        return '[Phaser.Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';

    }

};

/**
* Create a `dispatch` function that maintains a binding to the original Signal context.
*
* Use the resulting value if the dispatch function needs to be passed somewhere
* or called independently of the Signal object.
*
* @memberof Phaser.Signal
* @property {function} boundDispatch
*/
Object.defineProperty(Phaser.Signal.prototype, "boundDispatch", {

    get: function () {
        var _this = this;
        return this._boundDispatch || (this._boundDispatch = function () {
            return _this.dispatch.apply(_this, arguments);
        });
    }

});

Phaser.Signal.prototype.constructor = Phaser.Signal;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* This is where the magic happens. The Game object is the heart of your game,
* providing quick access to common functions and handling the boot process.
* 
* "Hell, there are no rules here - we're trying to accomplish something."
*                                                       Thomas A. Edison
*
* @class Phaser.Game
* @constructor
* @param {number|string} [width=800] - The width of your game in game pixels. If given as a string the value must be between 0 and 100 and will be used as the percentage width of the parent container, or the browser window if no parent is given.
* @param {number|string} [height=600] - The height of your game in game pixels. If given as a string the value must be between 0 and 100 and will be used as the percentage height of the parent container, or the browser window if no parent is given.
* @param {number} [renderer=Phaser.AUTO] - Which renderer to use: Phaser.AUTO will auto-detect, Phaser.WEBGL, Phaser.CANVAS or Phaser.HEADLESS (no rendering at all).
* @param {string|HTMLElement} [parent=''] - The DOM element into which this games canvas will be injected. Either a DOM ID (string) or the element itself.
* @param {object} [state=null] - The default state object. A object consisting of Phaser.State functions (preload, create, update, render) or null.
* @param {boolean} [transparent=false] - Use a transparent canvas background or not.
* @param {boolean} [antialias=true] - Draw all image textures anti-aliased or not. The default is for smooth textures, but disable if your game features pixel art.
* @param {object} [physicsConfig=null] - A physics configuration object to pass to the Physics world on creation.
*/
Phaser.Game = function (width, height, renderer, parent, state, transparent, antialias, physicsConfig) {

    /**
    * @property {number} id - Phaser Game ID (for when Pixi supports multiple instances).
    * @readonly
    */
    this.id = Phaser.GAMES.push(this) - 1;

    /**
    * @property {object} config - The Phaser.Game configuration object.
    */
    this.config = null;

    /**
    * @property {object} physicsConfig - The Phaser.Physics.World configuration object.
    */
    this.physicsConfig = physicsConfig;

    /**
    * @property {string|HTMLElement} parent - The Games DOM parent.
    * @default
    */
    this.parent = '';

    /**
    * The current Game Width in pixels.
    *
    * _Do not modify this property directly:_ use {@link Phaser.ScaleManager#setGameSize} - eg. `game.scale.setGameSize(width, height)` - instead.
    *
    * @property {integer} width
    * @readonly
    * @default
    */
    this.width = 800;

    /**
    * The current Game Height in pixels.
    *
    * _Do not modify this property directly:_ use {@link Phaser.ScaleManager#setGameSize} - eg. `game.scale.setGameSize(width, height)` - instead.
    *
    * @property {integer} height
    * @readonly
    * @default
    */
    this.height = 600;

    /**
    * The resolution of your game. This value is read only, but can be changed at start time it via a game configuration object.
    *
    * @property {integer} resolution
    * @readonly
    * @default
    */
    this.resolution = 1;

    /**
    * @property {integer} _width - Private internal var.
    * @private
    */
    this._width = 800;

    /**
    * @property {integer} _height - Private internal var.
    * @private
    */
    this._height = 600;

    /**
    * @property {boolean} transparent - Use a transparent canvas background or not.
    * @default
    */
    this.transparent = false;

    /**
    * @property {boolean} antialias - Anti-alias graphics. By default scaled images are smoothed in Canvas and WebGL, set anti-alias to false to disable this globally.
    * @default
    */
    this.antialias = true;

    /**
    * @property {boolean} preserveDrawingBuffer - The value of the preserveDrawingBuffer flag affects whether or not the contents of the stencil buffer is retained after rendering.
    * @default
    */
    this.preserveDrawingBuffer = false;

    /**
    * Clear the Canvas each frame before rendering the display list.
    * You can set this to `false` to gain some performance if your game always contains a background that completely fills the display.
    * @property {boolean} clearBeforeRender
    * @default
    */
    this.clearBeforeRender = true;

    /**
    * @property {PIXI.CanvasRenderer|PIXI.WebGLRenderer} renderer - The Pixi Renderer.
    * @protected
    */
    this.renderer = null;

    /**
    * @property {number} renderType - The Renderer this game will use. Either Phaser.AUTO, Phaser.CANVAS or Phaser.WEBGL.
    * @readonly
    */
    this.renderType = Phaser.AUTO;

    /**
    * @property {Phaser.StateManager} state - The StateManager.
    */
    this.state = null;

    /**
    * @property {boolean} isBooted - Whether the game engine is booted, aka available.
    * @readonly
    */
    this.isBooted = false;

    /**
    * @property {boolean} isRunning - Is game running or paused?
    * @readonly
    */
    this.isRunning = false;

    /**
    * @property {Phaser.RequestAnimationFrame} raf - Automatically handles the core game loop via requestAnimationFrame or setTimeout
    * @protected
    */
    this.raf = null;

    /**
    * @property {Phaser.GameObjectFactory} add - Reference to the Phaser.GameObjectFactory.
    */
    this.add = null;

    /**
    * @property {Phaser.GameObjectCreator} make - Reference to the GameObject Creator.
    */
    this.make = null;

    /**
    * @property {Phaser.Cache} cache - Reference to the assets cache.
    */
    this.cache = null;

    /**
    * @property {Phaser.Input} input - Reference to the input manager
    */
    this.input = null;

    /**
    * @property {Phaser.Loader} load - Reference to the assets loader.
    */
    this.load = null;

    /**
    * @property {Phaser.Math} math - Reference to the math helper.
    */
    this.math = null;

    /**
    * @property {Phaser.Net} net - Reference to the network class.
    */
    this.net = null;

    /**
    * @property {Phaser.ScaleManager} scale - The game scale manager.
    */
    this.scale = null;

    /**
    * @property {Phaser.SoundManager} sound - Reference to the sound manager.
    */
    this.sound = null;

    /**
    * @property {Phaser.Stage} stage - Reference to the stage.
    */
    this.stage = null;

    /**
    * @property {Phaser.Time} time - Reference to the core game clock.
    */
    this.time = null;

    /**
    * @property {Phaser.TweenManager} tweens - Reference to the tween manager.
    */
    this.tweens = null;

    /**
    * @property {Phaser.World} world - Reference to the world.
    */
    this.world = null;

    /**
    * @property {Phaser.Physics} physics - Reference to the physics manager.
    */
    this.physics = null;
    
    /**
    * @property {Phaser.PluginManager} plugins - Reference to the plugin manager.
    */
    this.plugins = null;

    /**
    * @property {Phaser.RandomDataGenerator} rnd - Instance of repeatable random data generator helper.
    */
    this.rnd = null;

    /**
    * @property {Phaser.Device} device - Contains device information and capabilities.
    */
    this.device = Phaser.Device;

    /**
    * @property {Phaser.Camera} camera - A handy reference to world.camera.
    */
    this.camera = null;

    /**
    * @property {HTMLCanvasElement} canvas - A handy reference to renderer.view, the canvas that the game is being rendered in to.
    */
    this.canvas = null;

    /**
    * @property {CanvasRenderingContext2D} context - A handy reference to renderer.context (only set for CANVAS games, not WebGL)
    */
    this.context = null;

    /**
    * @property {Phaser.Utils.Debug} debug - A set of useful debug utilities.
    */
    this.debug = null;

    /**
    * @property {Phaser.Particles} particles - The Particle Manager.
    */
    this.particles = null;

    /**
    * @property {Phaser.Create} create - The Asset Generator.
    */
    this.create = null;

    /**
    * If `false` Phaser will automatically render the display list every update. If `true` the render loop will be skipped.
    * You can toggle this value at run-time to gain exact control over when Phaser renders. This can be useful in certain types of game or application.
    * Please note that if you don't render the display list then none of the game object transforms will be updated, so use this value carefully.
    * @property {boolean} lockRender
    * @default
    */
    this.lockRender = false;

    /**
    * @property {boolean} stepping - Enable core loop stepping with Game.enableStep().
    * @default
    * @readonly
    */
    this.stepping = false;

    /**
    * @property {boolean} pendingStep - An internal property used by enableStep, but also useful to query from your own game objects.
    * @default
    * @readonly
    */
    this.pendingStep = false;

    /**
    * @property {number} stepCount - When stepping is enabled this contains the current step cycle.
    * @default
    * @readonly
    */
    this.stepCount = 0;

    /**
    * @property {Phaser.Signal} onPause - This event is fired when the game pauses.
    */
    this.onPause = null;

    /**
    * @property {Phaser.Signal} onResume - This event is fired when the game resumes from a paused state.
    */
    this.onResume = null;

    /**
    * @property {Phaser.Signal} onBlur - This event is fired when the game no longer has focus (typically on page hide).
    */
    this.onBlur = null;

    /**
    * @property {Phaser.Signal} onFocus - This event is fired when the game has focus (typically on page show).
    */
    this.onFocus = null;

    /**
    * @property {boolean} _paused - Is game paused?
    * @private
    */
    this._paused = false;

    /**
    * @property {boolean} _codePaused - Was the game paused via code or a visibility change?
    * @private
    */
    this._codePaused = false;

    /**
    * The ID of the current/last logic update applied this render frame, starting from 0.
    * The first update is `currentUpdateID === 0` and the last update is `currentUpdateID === updatesThisFrame.`
    * @property {integer} currentUpdateID
    * @protected
    */
    this.currentUpdateID = 0;

    /**
    * Number of logic updates expected to occur this render frame; will be 1 unless there are catch-ups required (and allowed).
    * @property {integer} updatesThisFrame
    * @protected
    */
    this.updatesThisFrame = 1;

    /**
    * @property {number} _deltaTime - Accumulate elapsed time until a logic update is due.
    * @private
    */
    this._deltaTime = 0;

    /**
    * @property {number} _lastCount - Remember how many 'catch-up' iterations were used on the logicUpdate last frame.
    * @private
    */
    this._lastCount = 0;

    /**
    * @property {number} _spiraling - If the 'catch-up' iterations are spiraling out of control, this counter is incremented.
    * @private
    */
    this._spiraling = 0;

    /**
    * @property {boolean} _kickstart - Force a logic update + render by default (always set on Boot and State swap)
    * @private
    */
    this._kickstart = true;

    /**
    * If the game is struggling to maintain the desired FPS, this signal will be dispatched.
    * The desired/chosen FPS should probably be closer to the {@link Phaser.Time#suggestedFps} value.
    * @property {Phaser.Signal} fpsProblemNotifier
    * @public
    */
    this.fpsProblemNotifier = new Phaser.Signal();

    /**
    * @property {boolean} forceSingleUpdate - Should the game loop force a logic update, regardless of the delta timer? Set to true if you know you need this. You can toggle it on the fly.
    */
    this.forceSingleUpdate = false;

    /**
    * @property {number} _nextNotification - The soonest game.time.time value that the next fpsProblemNotifier can be dispatched.
    * @private
    */
    this._nextFpsNotification = 0;

    //  Parse the configuration object (if any)
    if (arguments.length === 1 && typeof arguments[0] === 'object')
    {
        this.parseConfig(arguments[0]);
    }
    else
    {
        this.config = { enableDebug: true };

        if (typeof width !== 'undefined')
        {
            this._width = width;
        }

        if (typeof height !== 'undefined')
        {
            this._height = height;
        }

        if (typeof renderer !== 'undefined')
        {
            this.renderType = renderer;
        }

        if (typeof parent !== 'undefined')
        {
            this.parent = parent;
        }

        if (typeof transparent !== 'undefined')
        {
            this.transparent = transparent;
        }

        if (typeof antialias !== 'undefined')
        {
            this.antialias = antialias;
        }

        this.rnd = new Phaser.RandomDataGenerator([(Date.now() * Math.random()).toString()]);

        this.state = new Phaser.StateManager(this, state);
    }

    this.device.whenReady(this.boot, this);

    return this;

};

Phaser.Game.prototype = {

    /**
    * Parses a Game configuration object.
    *
    * @method Phaser.Game#parseConfig
    * @protected
    */
    parseConfig: function (config) {

        this.config = config;

        if (config['enableDebug'] === undefined)
        {
            this.config.enableDebug = true;
        }

        if (config['width'])
        {
            this._width = config['width'];
        }

        if (config['height'])
        {
            this._height = config['height'];
        }

        if (config['renderer'])
        {
            this.renderType = config['renderer'];
        }

        if (config['parent'])
        {
            this.parent = config['parent'];
        }

        if (config['transparent'])
        {
            this.transparent = config['transparent'];
        }

        if (config['antialias'])
        {
            this.antialias = config['antialias'];
        }

        if (config['resolution'])
        {
            this.resolution = config['resolution'];
        }

        if (config['preserveDrawingBuffer'])
        {
            this.preserveDrawingBuffer = config['preserveDrawingBuffer'];
        }

        if (config['physicsConfig'])
        {
            this.physicsConfig = config['physicsConfig'];
        }

        var seed = [(Date.now() * Math.random()).toString()];

        if (config['seed'])
        {
            seed = config['seed'];
        }

        this.rnd = new Phaser.RandomDataGenerator(seed);

        var state = null;

        if (config['state'])
        {
            state = config['state'];
        }

        this.state = new Phaser.StateManager(this, state);

    },

    /**
    * Initialize engine sub modules and start the game.
    *
    * @method Phaser.Game#boot
    * @protected
    */
    boot: function () {

        if (this.isBooted)
        {
            return;
        }

        this.onPause = new Phaser.Signal();
        this.onResume = new Phaser.Signal();
        this.onBlur = new Phaser.Signal();
        this.onFocus = new Phaser.Signal();

        this.isBooted = true;

        PIXI.game = this;

        this.math = Phaser.Math;

        this.scale = new Phaser.ScaleManager(this, this._width, this._height);
        this.stage = new Phaser.Stage(this);

        this.setUpRenderer();

        this.world = new Phaser.World(this);
        this.add = new Phaser.GameObjectFactory(this);
        this.make = new Phaser.GameObjectCreator(this);
        this.cache = new Phaser.Cache(this);
        this.load = new Phaser.Loader(this);
        this.time = new Phaser.Time(this);
        this.tweens = new Phaser.TweenManager(this);
        this.input = new Phaser.Input(this);
        this.sound = new Phaser.SoundManager(this);
        this.physics = new Phaser.Physics(this, this.physicsConfig);
        this.particles = new Phaser.Particles(this);
        this.create = new Phaser.Create(this);
        this.plugins = new Phaser.PluginManager(this);
        this.net = new Phaser.Net(this);

        this.time.boot();
        this.stage.boot();
        this.world.boot();
        this.scale.boot();
        this.input.boot();
        this.sound.boot();
        this.state.boot();

        if (this.config['enableDebug'])
        {
            this.debug = new Phaser.Utils.Debug(this);
            this.debug.boot();
        }
        else
        {
            this.debug = { preUpdate: function () {}, update: function () {}, reset: function () {} };
        }

        this.showDebugHeader();

        this.isRunning = true;

        if (this.config && this.config['forceSetTimeOut'])
        {
            this.raf = new Phaser.RequestAnimationFrame(this, this.config['forceSetTimeOut']);
        }
        else
        {
            this.raf = new Phaser.RequestAnimationFrame(this, false);
        }

        this._kickstart = true;

        if (window['focus'])
        {
            if (!window['PhaserGlobal'] || (window['PhaserGlobal'] && !window['PhaserGlobal'].stopFocus))
            {
                window.focus();
            }
        }

        this.raf.start();

    },

    /**
    * Displays a Phaser version debug header in the console.
    *
    * @method Phaser.Game#showDebugHeader
    * @protected
    */
    showDebugHeader: function () {

        if (window['PhaserGlobal'] && window['PhaserGlobal'].hideBanner)
        {
            return;
        }

        var v = Phaser.VERSION;
        var r = 'Canvas';
        var a = 'HTML Audio';
        var c = 1;

        if (this.renderType === Phaser.WEBGL)
        {
            r = 'WebGL';
            c++;
        }
        else if (this.renderType == Phaser.HEADLESS)
        {
            r = 'Headless';
        }

        if (this.device.webAudio)
        {
            a = 'WebAudio';
            c++;
        }

        if (this.device.chrome)
        {
            var args = [
                '%c %c %c Phaser v' + v + ' | Pixi.js ' + PIXI.VERSION + ' | ' + r + ' | ' + a + '  %c %c ' + '%c http://phaser.io %c\u2665%c\u2665%c\u2665',
                'background: #9854d8',
                'background: #6c2ca7',
                'color: #ffffff; background: #450f78;',
                'background: #6c2ca7',
                'background: #9854d8',
                'background: #ffffff'
            ];

            for (var i = 0; i < 3; i++)
            {
                if (i < c)
                {
                    args.push('color: #ff2424; background: #fff');
                }
                else
                {
                    args.push('color: #959595; background: #fff');
                }
            }

            console.log.apply(console, args);
        }
        else if (window['console'])
        {
            console.log('Phaser v' + v + ' | Pixi.js ' + PIXI.VERSION + ' | ' + r + ' | ' + a + ' | http://phaser.io');
        }

    },

    /**
    * Checks if the device is capable of using the requested renderer and sets it up or an alternative if not.
    *
    * @method Phaser.Game#setUpRenderer
    * @protected
    */
    setUpRenderer: function () {

        this.canvas = Phaser.Canvas.create(this, this.width, this.height, this.config['canvasID'], true);

        if (this.config['canvasStyle'])
        {
            this.canvas.style = this.config['canvasStyle'];
        }
        else
        {
            this.canvas.style['-webkit-full-screen'] = 'width: 100%; height: 100%';
        }

        if (this.renderType === Phaser.HEADLESS || this.renderType === Phaser.CANVAS || (this.renderType === Phaser.AUTO && !this.device.webGL))
        {
            if (this.device.canvas)
            {
                //  They requested Canvas and their browser supports it
                this.renderType = Phaser.CANVAS;

                this.renderer = new PIXI.CanvasRenderer(this);

                this.context = this.renderer.context;
            }
            else
            {
                throw new Error('Phaser.Game - Cannot create Canvas or WebGL context, aborting.');
            }
        }
        else
        {
            //  They requested WebGL and their browser supports it
            this.renderType = Phaser.WEBGL;

            this.renderer = new PIXI.WebGLRenderer(this);

            this.context = null;

            this.canvas.addEventListener('webglcontextlost', this.contextLost.bind(this), false);
            this.canvas.addEventListener('webglcontextrestored', this.contextRestored.bind(this), false);
        }

        if (this.device.cocoonJS)
        {
            this.canvas.screencanvas = (this.renderType === Phaser.CANVAS) ? true : false;
        }

        if (this.renderType !== Phaser.HEADLESS)
        {
            this.stage.smoothed = this.antialias;
            
            Phaser.Canvas.addToDOM(this.canvas, this.parent, false);
            Phaser.Canvas.setTouchAction(this.canvas);
        }

    },

    /**
    * Handles WebGL context loss.
    *
    * @method Phaser.Game#contextLost
    * @private
    * @param {Event} event - The webglcontextlost event.
    */
    contextLost: function (event) {

        event.preventDefault();

        this.renderer.contextLost = true;

    },

    /**
    * Handles WebGL context restoration.
    *
    * @method Phaser.Game#contextRestored
    * @private
    */
    contextRestored: function () {

        this.renderer.initContext();

        this.cache.clearGLTextures();

        this.renderer.contextLost = false;

    },

    /**
    * The core game loop.
    *
    * @method Phaser.Game#update
    * @protected
    * @param {number} time - The current time as provided by RequestAnimationFrame.
    */
    update: function (time) {

        this.time.update(time);

        if (this._kickstart)
        {
            this.updateLogic(this.time.desiredFpsMult);

            //  Sync the scene graph after _every_ logic update to account for moved game objects                
            this.stage.updateTransform();

            // call the game render update exactly once every frame
            this.updateRender(this.time.slowMotion * this.time.desiredFps);

            this._kickstart = false;

            return;
        }

        // if the logic time is spiraling upwards, skip a frame entirely
        if (this._spiraling > 1 && !this.forceSingleUpdate)
        {
            // cause an event to warn the program that this CPU can't keep up with the current desiredFps rate
            if (this.time.time > this._nextFpsNotification)
            {
                // only permit one fps notification per 10 seconds
                this._nextFpsNotification = this.time.time + 10000;

                // dispatch the notification signal
                this.fpsProblemNotifier.dispatch();
            }

            // reset the _deltaTime accumulator which will cause all pending dropped frames to be permanently skipped
            this._deltaTime = 0;
            this._spiraling = 0;

            // call the game render update exactly once every frame
            this.updateRender(this.time.slowMotion * this.time.desiredFps);
        }
        else
        {
            // step size taking into account the slow motion speed
            var slowStep = this.time.slowMotion * 1000.0 / this.time.desiredFps;

            // accumulate time until the slowStep threshold is met or exceeded... up to a limit of 3 catch-up frames at slowStep intervals
            this._deltaTime += Math.max(Math.min(slowStep * 3, this.time.elapsed), 0);

            // call the game update logic multiple times if necessary to "catch up" with dropped frames
            // unless forceSingleUpdate is true
            var count = 0;

            this.updatesThisFrame = Math.floor(this._deltaTime / slowStep);

            if (this.forceSingleUpdate)
            {
                this.updatesThisFrame = Math.min(1, this.updatesThisFrame);
            }

            while (this._deltaTime >= slowStep)
            {
                this._deltaTime -= slowStep;
                this.currentUpdateID = count;

                this.updateLogic(this.time.desiredFpsMult);

                //  Sync the scene graph after _every_ logic update to account for moved game objects
                this.stage.updateTransform();

                count++;

                if (this.forceSingleUpdate && count === 1)
                {
                    break;
                }
                else
                {
                    this.time.refresh();
                }
            }

            // detect spiraling (if the catch-up loop isn't fast enough, the number of iterations will increase constantly)
            if (count > this._lastCount)
            {
                this._spiraling++;
            }
            else if (count < this._lastCount)
            {
                // looks like it caught up successfully, reset the spiral alert counter
                this._spiraling = 0;
            }

            this._lastCount = count;

            // call the game render update exactly once every frame unless we're playing catch-up from a spiral condition
            this.updateRender(this._deltaTime / slowStep);
        }

    },

    /**
    * Updates all logic subsystems in Phaser. Called automatically by Game.update.
    *
    * @method Phaser.Game#updateLogic
    * @protected
    * @param {number} timeStep - The current timeStep value as determined by Game.update.
    */
    updateLogic: function (timeStep) {

        if (!this._paused && !this.pendingStep)
        {
            if (this.stepping)
            {
                this.pendingStep = true;
            }

            this.scale.preUpdate();
            this.debug.preUpdate();
            this.world.camera.preUpdate();
            this.physics.preUpdate();
            this.state.preUpdate(timeStep);
            this.plugins.preUpdate(timeStep);
            this.stage.preUpdate();

            this.state.update();
            this.stage.update();
            this.tweens.update();
            this.sound.update();
            this.input.update();
            this.physics.update();
            this.particles.update();
            this.plugins.update();

            this.stage.postUpdate();
            this.plugins.postUpdate();
        }
        else
        {
            // Scaling and device orientation changes are still reflected when paused.
            this.scale.pauseUpdate();
            this.state.pauseUpdate();
            this.debug.preUpdate();
        }

    },

    /**
    * Runs the Render cycle.
    * It starts by calling State.preRender. In here you can do any last minute adjustments of display objects as required.
    * It then calls the renderer, which renders the entire display list, starting from the Stage object and working down.
    * It then calls plugin.render on any loaded plugins, in the order in which they were enabled.
    * After this State.render is called. Any rendering that happens here will take place on-top of the display list.
    * Finally plugin.postRender is called on any loaded plugins, in the order in which they were enabled.
    * This method is called automatically by Game.update, you don't need to call it directly.
    * Should you wish to have fine-grained control over when Phaser renders then use the `Game.lockRender` boolean.
    * Phaser will only render when this boolean is `false`.
    *
    * @method Phaser.Game#updateRender
    * @protected
    * @param {number} elapsedTime - The time elapsed since the last update.
    */
    updateRender: function (elapsedTime) {

        if (this.lockRender)
        {
            return;
        }

        this.state.preRender(elapsedTime);

        this.renderer.render(this.stage);

        this.plugins.render(elapsedTime);

        this.state.render(elapsedTime);

        this.plugins.postRender(elapsedTime);

    },

    /**
    * Enable core game loop stepping. When enabled you must call game.step() directly (perhaps via a DOM button?)
    * Calling step will advance the game loop by one frame. This is extremely useful for hard to track down errors!
    *
    * @method Phaser.Game#enableStep
    */
    enableStep: function () {

        this.stepping = true;
        this.pendingStep = false;
        this.stepCount = 0;

    },

    /**
    * Disables core game loop stepping.
    *
    * @method Phaser.Game#disableStep
    */
    disableStep: function () {

        this.stepping = false;
        this.pendingStep = false;

    },

    /**
    * When stepping is enabled you must call this function directly (perhaps via a DOM button?) to advance the game loop by one frame.
    * This is extremely useful to hard to track down errors! Use the internal stepCount property to monitor progress.
    *
    * @method Phaser.Game#step
    */
    step: function () {

        this.pendingStep = false;
        this.stepCount++;

    },

    /**
    * Nukes the entire game from orbit.
    *
    * @method Phaser.Game#destroy
    */
    destroy: function () {

        this.raf.stop();

        this.state.destroy();
        this.sound.destroy();

        this.scale.destroy();
        this.stage.destroy();
        this.input.destroy();
        this.physics.destroy();

        this.state = null;
        this.cache = null;
        this.input = null;
        this.load = null;
        this.sound = null;
        this.stage = null;
        this.time = null;
        this.world = null;
        this.isBooted = false;

        this.renderer.destroy(false);
        Phaser.Canvas.removeFromDOM(this.canvas);

        Phaser.GAMES[this.id] = null;

    },

    /**
    * Called by the Stage visibility handler.
    *
    * @method Phaser.Game#gamePaused
    * @param {object} event - The DOM event that caused the game to pause, if any.
    * @protected
    */
    gamePaused: function (event) {

        //   If the game is already paused it was done via game code, so don't re-pause it
        if (!this._paused)
        {
            this._paused = true;
            this.time.gamePaused();
            this.sound.setMute();
            this.onPause.dispatch(event);

            //  Avoids Cordova iOS crash event: https://github.com/photonstorm/phaser/issues/1800
            if (this.device.cordova && this.device.iOS)
            {
                this.lockRender = true;
            }
        }

    },

    /**
    * Called by the Stage visibility handler.
    *
    * @method Phaser.Game#gameResumed
    * @param {object} event - The DOM event that caused the game to pause, if any.
    * @protected
    */
    gameResumed: function (event) {

        //  Game is paused, but wasn't paused via code, so resume it
        if (this._paused && !this._codePaused)
        {
            this._paused = false;
            this.time.gameResumed();
            this.input.reset();
            this.sound.unsetMute();
            this.onResume.dispatch(event);

            //  Avoids Cordova iOS crash event: https://github.com/photonstorm/phaser/issues/1800
            if (this.device.cordova && this.device.iOS)
            {
                this.lockRender = false;
            }
        }

    },

    /**
    * Called by the Stage visibility handler.
    *
    * @method Phaser.Game#focusLoss
    * @param {object} event - The DOM event that caused the game to pause, if any.
    * @protected
    */
    focusLoss: function (event) {

        this.onBlur.dispatch(event);

        if (!this.stage.disableVisibilityChange)
        {
            this.gamePaused(event);
        }

    },

    /**
    * Called by the Stage visibility handler.
    *
    * @method Phaser.Game#focusGain
    * @param {object} event - The DOM event that caused the game to pause, if any.
    * @protected
    */
    focusGain: function (event) {

        this.onFocus.dispatch(event);

        if (!this.stage.disableVisibilityChange)
        {
            this.gameResumed(event);
        }

    }

};

Phaser.Game.prototype.constructor = Phaser.Game;

/**
* The paused state of the Game. A paused game doesn't update any of its subsystems.
* When a game is paused the onPause event is dispatched. When it is resumed the onResume event is dispatched.
* @name Phaser.Game#paused
* @property {boolean} paused - Gets and sets the paused state of the Game.
*/
Object.defineProperty(Phaser.Game.prototype, "paused", {

    get: function () {
        return this._paused;
    },

    set: function (value) {

        if (value === true)
        {
            if (this._paused === false)
            {
                this._paused = true;
                this.sound.setMute();
                this.time.gamePaused();
                this.onPause.dispatch(this);
            }
            this._codePaused = true;
        }
        else
        {
            if (this._paused)
            {
                this._paused = false;
                this.input.reset();
                this.sound.unsetMute();
                this.time.gameResumed();
                this.onResume.dispatch(this);
            }
            this._codePaused = false;
        }

    }

});

/**
 * 
 * "Deleted code is debugged code." - Jeff Sickel
 *
 * ヽ(〃＾▽＾〃)ﾉ
 * 
*/

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The Physics Manager is responsible for looking after all of the running physics systems.
* Phaser supports 4 physics systems: Arcade Physics, P2, Ninja Physics and Box2D via a commercial plugin.
* 
* Game Objects (such as Sprites) can only belong to 1 physics system, but you can have multiple systems active in a single game.
*
* For example you could have P2 managing a polygon-built terrain landscape that an vehicle drives over, while it could be firing bullets that use the
* faster (due to being much simpler) Arcade Physics system.
*
* @class Phaser.Physics
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {object} [physicsConfig=null] - A physics configuration object to pass to the Physics world on creation.
*/
Phaser.Physics = function (game, config) {

    config = config || {};

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = game;

    /**
    * @property {object} config - The physics configuration object as passed to the game on creation.
    */
    this.config = config;

    /**
    * @property {Phaser.Physics.Arcade} arcade - The Arcade Physics system.
    */
    this.arcade = null;

    /**
    * @property {Phaser.Physics.P2} p2 - The P2.JS Physics system.
    */
    this.p2 = null;

    /**
    * @property {Phaser.Physics.Ninja} ninja - The N+ Ninja Physics system.
    */
    this.ninja = null;

    /**
    * @property {Phaser.Physics.Box2D} box2d - The Box2D Physics system.
    */
    this.box2d = null;

    /**
    * @property {Phaser.Physics.Chipmunk} chipmunk - The Chipmunk Physics system (to be done).
    */
    this.chipmunk = null;

    /**
    * @property {Phaser.Physics.Matter} matter - The MatterJS Physics system (coming soon).
    */
    this.matter = null;

    this.parseConfig();

};

/**
* @const
* @type {number}
*/
Phaser.Physics.ARCADE = 0;

/**
* @const
* @type {number}
*/
Phaser.Physics.P2JS = 1;

/**
* @const
* @type {number}
*/
Phaser.Physics.NINJA = 2;

/**
* @const
* @type {number}
*/
Phaser.Physics.BOX2D = 3;

/**
* @const
* @type {number}
*/
Phaser.Physics.CHIPMUNK = 4;

/**
* @const
* @type {number}
*/
Phaser.Physics.MATTERJS = 5;

Phaser.Physics.prototype = {

    /**
    * Parses the Physics Configuration object passed to the Game constructor and starts any physics systems specified within.
    *
    * @method Phaser.Physics#parseConfig
    */
    parseConfig: function () {

        if ((!this.config.hasOwnProperty('arcade') || this.config['arcade'] === true) && Phaser.Physics.hasOwnProperty('Arcade'))
        {
            //  If Arcade isn't specified, we create it automatically if we can
            this.arcade = new Phaser.Physics.Arcade(this.game);
        }

        if (this.config.hasOwnProperty('ninja') && this.config['ninja'] === true && Phaser.Physics.hasOwnProperty('Ninja'))
        {
            this.ninja = new Phaser.Physics.Ninja(this.game);
        }

        if (this.config.hasOwnProperty('p2') && this.config['p2'] === true && Phaser.Physics.hasOwnProperty('P2'))
        {
            this.p2 = new Phaser.Physics.P2(this.game, this.config);
        }

        if (this.config.hasOwnProperty('box2d') && this.config['box2d'] === true && Phaser.Physics.hasOwnProperty('BOX2D'))
        {
            this.box2d = new Phaser.Physics.BOX2D(this.game, this.config);
        }

        if (this.config.hasOwnProperty('matter') && this.config['matter'] === true && Phaser.Physics.hasOwnProperty('Matter'))
        {
            this.matter = new Phaser.Physics.Matter(this.game, this.config);
        }

    },

    /**
    * This will create an instance of the requested physics simulation.
    * Phaser.Physics.Arcade is running by default, but all others need activating directly.
    * 
    * You can start the following physics systems:
    * 
    * Phaser.Physics.P2JS - A full-body advanced physics system by Stefan Hedman.
    * Phaser.Physics.NINJA - A port of Metanet Softwares N+ physics system.
    * Phaser.Physics.BOX2D - A commercial Phaser Plugin (see http://phaser.io)
    *
    * Both Ninja Physics and Box2D require their respective plugins to be loaded before you can start them.
    * They are not bundled into the core Phaser library.
    *
    * If the physics world has already been created (i.e. in another state in your game) then 
    * calling startSystem will reset the physics world, not re-create it. If you need to start them again from their constructors 
    * then set Phaser.Physics.p2 (or whichever system you want to recreate) to `null` before calling `startSystem`.
    *
    * @method Phaser.Physics#startSystem
    * @param {number} system - The physics system to start: Phaser.Physics.ARCADE, Phaser.Physics.P2JS, Phaser.Physics.NINJA or Phaser.Physics.BOX2D.
    */
    startSystem: function (system) {

        if (system === Phaser.Physics.ARCADE)
        {
            this.arcade = new Phaser.Physics.Arcade(this.game);
        }
        else if (system === Phaser.Physics.P2JS)
        {
            if (this.p2 === null)
            {
                this.p2 = new Phaser.Physics.P2(this.game, this.config);
            }
            else
            {
                this.p2.reset();
            }
        }
        else if (system === Phaser.Physics.NINJA)
        {
            this.ninja = new Phaser.Physics.Ninja(this.game);
        }
        else if (system === Phaser.Physics.BOX2D)
        {
            if (this.box2d === null)
            {
                this.box2d = new Phaser.Physics.Box2D(this.game, this.config);
            }
            else
            {
                this.box2d.reset();
            }
        }
        else if (system === Phaser.Physics.MATTERJS)
        {
            if (this.matter === null)
            {
                this.matter = new Phaser.Physics.Matter(this.game, this.config);
            }
            else
            {
                this.matter.reset();
            }
        }

    },

    /**
    * This will create a default physics body on the given game object or array of objects.
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
    * It can be for any of the physics systems that have been started:
    *
    * Phaser.Physics.Arcade - A light weight AABB based collision system with basic separation.
    * Phaser.Physics.P2JS - A full-body advanced physics system supporting multiple object shapes, polygon loading, contact materials, springs and constraints.
    * Phaser.Physics.NINJA - A port of Metanet Softwares N+ physics system. Advanced AABB and Circle vs. Tile collision.
    * Phaser.Physics.BOX2D - A port of https://code.google.com/p/box2d-html5
    * Phaser.Physics.MATTER - A full-body and light-weight advanced physics system (still in development)
    * Phaser.Physics.CHIPMUNK is still in development.
    *
    * If you require more control over what type of body is created, for example to create a Ninja Physics Circle instead of the default AABB, then see the
    * individual physics systems `enable` methods instead of using this generic one.
    *
    * @method Phaser.Physics#enable
    * @param {object|array} object - The game object to create the physics body on. Can also be an array of objects, a body will be created on every object in the array.
    * @param {number} [system=Phaser.Physics.ARCADE] - The physics system that will be used to create the body. Defaults to Arcade Physics.
    * @param {boolean} [debug=false] - Enable the debug drawing for this body. Defaults to false.
    */
    enable: function (object, system, debug) {

        if (system === undefined) { system = Phaser.Physics.ARCADE; }
        if (debug === undefined) { debug = false; }

        if (system === Phaser.Physics.ARCADE)
        {
            this.arcade.enable(object);
        }
        else if (system === Phaser.Physics.P2JS && this.p2)
        {
            this.p2.enable(object, debug);
        }
        else if (system === Phaser.Physics.NINJA && this.ninja)
        {
            this.ninja.enableAABB(object);
        }
        else if (system === Phaser.Physics.BOX2D && this.box2d)
        {
            this.box2d.enable(object);
        }
        else if (system === Phaser.Physics.MATTERJS && this.matter)
        {
            this.matter.enable(object);
        }

    },

    /**
    * preUpdate checks.
    *
    * @method Phaser.Physics#preUpdate
    * @protected
    */
    preUpdate: function () {

        //  ArcadePhysics / Ninja don't have a core to preUpdate

        if (this.p2)
        {
            this.p2.preUpdate();
        }

        if (this.box2d)
        {
            this.box2d.preUpdate();
        }

        if (this.matter)
        {
            this.matter.preUpdate();
        }

    },

    /**
    * Updates all running physics systems.
    *
    * @method Phaser.Physics#update
    * @protected
    */
    update: function () {

        //  ArcadePhysics / Ninja don't have a core to update

        if (this.p2)
        {
            this.p2.update();
        }

        if (this.box2d)
        {
            this.box2d.update();
        }

        if (this.matter)
        {
            this.matter.update();
        }

    },

    /**
    * Updates the physics bounds to match the world dimensions.
    *
    * @method Phaser.Physics#setBoundsToWorld
    * @protected
    */
    setBoundsToWorld: function () {

        if (this.arcade)
        {
            this.arcade.setBoundsToWorld();
        }

        if (this.ninja)
        {
            this.ninja.setBoundsToWorld();
        }

        if (this.p2)
        {
            this.p2.setBoundsToWorld();
        }

        if (this.box2d)
        {
            this.box2d.setBoundsToWorld();
        }

        if (this.matter)
        {
            this.matter.setBoundsToWorld();
        }

    },

    /**
    * Clears down all active physics systems. This doesn't destroy them, it just clears them of objects and is called when the State changes.
    *
    * @method Phaser.Physics#clear
    * @protected
    */
    clear: function () {

        if (this.p2)
        {
            this.p2.clear();
        }

        if (this.box2d)
        {
            this.box2d.clear();
        }

        if (this.matter)
        {
            this.matter.clear();
        }

    },

    /**
    * Resets the active physics system. Called automatically on a Phaser.State swap.
    *
    * @method Phaser.Physics#reset
    * @protected
    */
    reset: function () {

        if (this.p2)
        {
            this.p2.reset();
        }

        if (this.box2d)
        {
            this.box2d.reset();
        }

        if (this.matter)
        {
            this.matter.reset();
        }

    },

    /**
    * Destroys all active physics systems. Usually only called on a Game Shutdown, not on a State swap.
    *
    * @method Phaser.Physics#destroy
    */
    destroy: function () {

        if (this.p2)
        {
            this.p2.destroy();
        }

        if (this.box2d)
        {
            this.box2d.destroy();
        }

        if (this.matter)
        {
            this.matter.destroy();
        }

        this.arcade = null;
        this.ninja = null;
        this.p2 = null;
        this.box2d = null;
        this.matter = null;

    }

};

Phaser.Physics.prototype.constructor = Phaser.Physics;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The Physics Body is linked to a single Sprite. All physics operations should be performed against the body rather than
* the Sprite itself. For example you can set the velocity, acceleration, bounce values etc all on the Body.
*
* @class Phaser.Physics.Arcade.Body
* @constructor
* @param {Phaser.Sprite} sprite - The Sprite object this physics body belongs to.
*/
Phaser.Physics.Arcade.Body = function (sprite) {

    /**
    * @property {Phaser.Sprite} sprite - Reference to the parent Sprite.
    */
    this.sprite = sprite;

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = sprite.game;

    /**
    * @property {number} type - The type of physics system this body belongs to.
    */
    this.type = Phaser.Physics.ARCADE;

    /**
    * @property {boolean} enable - A disabled body won't be checked for any form of collision or overlap or have its pre/post updates run.
    * @default
    */
    this.enable = true;

    /**
    * @property {Phaser.Point} offset - The offset of the Physics Body from the Sprite x/y position.
    */
    this.offset = new Phaser.Point();

    /**
    * @property {Phaser.Point} position - The position of the physics body.
    * @readonly
    */
    this.position = new Phaser.Point(sprite.x, sprite.y);

    /**
    * @property {Phaser.Point} prev - The previous position of the physics body.
    * @readonly
    */
    this.prev = new Phaser.Point(this.position.x, this.position.y);

    /**
    * @property {boolean} allowRotation - Allow this Body to be rotated? (via angularVelocity, etc)
    * @default
    */
    this.allowRotation = true;

    /**
    * An Arcade Physics Body can have angularVelocity and angularAcceleration. Please understand that the collision Body
    * itself never rotates, it is always axis-aligned. However these values are passed up to the parent Sprite and updates its rotation.
    * @property {number} rotation
    */
    this.rotation = sprite.rotation;

    /**
    * @property {number} preRotation - The previous rotation of the physics body.
    * @readonly
    */
    this.preRotation = sprite.rotation;

    /**
    * @property {number} width - The calculated width of the physics body.
    * @readonly
    */
    this.width = sprite.width;

    /**
    * @property {number} height - The calculated height of the physics body.
    * @readonly
    */
    this.height = sprite.height;

    /**
    * @property {number} sourceWidth - The un-scaled original size.
    * @readonly
    */
    this.sourceWidth = sprite.width;

    /**
    * @property {number} sourceHeight - The un-scaled original size.
    * @readonly
    */
    this.sourceHeight = sprite.height;

    if (sprite.texture)
    {
        this.sourceWidth = sprite.texture.frame.width;
        this.sourceHeight = sprite.texture.frame.height;
    }

    /**
    * @property {number} halfWidth - The calculated width / 2 of the physics body.
    * @readonly
    */
    this.halfWidth = Math.abs(sprite.width / 2);

    /**
    * @property {number} halfHeight - The calculated height / 2 of the physics body.
    * @readonly
    */
    this.halfHeight = Math.abs(sprite.height / 2);

    /**
    * @property {Phaser.Point} center - The center coordinate of the Physics Body.
    * @readonly
    */
    this.center = new Phaser.Point(sprite.x + this.halfWidth, sprite.y + this.halfHeight);

    /**
    * @property {Phaser.Point} velocity - The velocity, or rate of change in speed of the Body. Measured in pixels per second.
    */
    this.velocity = new Phaser.Point();

    /**
    * @property {Phaser.Point} newVelocity - The new velocity. Calculated during the Body.preUpdate and applied to its position.
    * @readonly
    */
    this.newVelocity = new Phaser.Point(0, 0);

    /**
    * @property {Phaser.Point} deltaMax - The Sprite position is updated based on the delta x/y values. You can set a cap on those (both +-) using deltaMax.
    */
    this.deltaMax = new Phaser.Point(0, 0);

    /**
    * @property {Phaser.Point} acceleration - The acceleration is the rate of change of the velocity. Measured in pixels per second squared.
    */
    this.acceleration = new Phaser.Point();

    /**
    * @property {Phaser.Point} drag - The drag applied to the motion of the Body.
    */
    this.drag = new Phaser.Point();

    /**
    * @property {boolean} allowGravity - Allow this Body to be influenced by gravity? Either world or local.
    * @default
    */
    this.allowGravity = true;

    /**
    * @property {Phaser.Point} gravity - A local gravity applied to this Body. If non-zero this over rides any world gravity, unless Body.allowGravity is set to false.
    */
    this.gravity = new Phaser.Point(0, 0);

    /**
    * @property {Phaser.Point} bounce - The elasticity of the Body when colliding. bounce.x/y = 1 means full rebound, bounce.x/y = 0.5 means 50% rebound velocity.
    */
    this.bounce = new Phaser.Point();

    /**
    * @property {Phaser.Point} maxVelocity - The maximum velocity in pixels per second sq. that the Body can reach.
    * @default
    */
    this.maxVelocity = new Phaser.Point(10000, 10000);

    /**
    * @property {Phaser.Point} friction - The amount of movement that will occur if another object 'rides' this one.
    */
    this.friction = new Phaser.Point(1, 0);

    /**
    * @property {number} angularVelocity - The angular velocity controls the rotation speed of the Body. It is measured in radians per second.
    * @default
    */
    this.angularVelocity = 0;

    /**
    * @property {number} angularAcceleration - The angular acceleration is the rate of change of the angular velocity. Measured in radians per second squared.
    * @default
    */
    this.angularAcceleration = 0;

    /**
    * @property {number} angularDrag - The drag applied during the rotation of the Body.
    * @default
    */
    this.angularDrag = 0;

    /**
    * @property {number} maxAngular - The maximum angular velocity in radians per second that the Body can reach.
    * @default
    */
    this.maxAngular = 1000;

    /**
    * @property {number} mass - The mass of the Body. When two bodies collide their mass is used in the calculation to determine the exchange of velocity.
    * @default
    */
    this.mass = 1;

    /**
    * @property {number} angle - The angle of the Body in radians, as calculated by its angularVelocity.
    * @readonly
    */
    this.angle = 0;

    /**
    * @property {number} speed - The speed of the Body as calculated by its velocity.
    * @readonly
    */
    this.speed = 0;

    /**
    * @property {number} facing - A const reference to the direction the Body is traveling or facing.
    * @default
    */
    this.facing = Phaser.NONE;

    /**
    * @property {boolean} immovable - An immovable Body will not receive any impacts from other bodies.
    * @default
    */
    this.immovable = false;

    /**
    * If you have a Body that is being moved around the world via a tween or a Group motion, but its local x/y position never
    * actually changes, then you should set Body.moves = false. Otherwise it will most likely fly off the screen.
    * If you want the physics system to move the body around, then set moves to true.
    * @property {boolean} moves - Set to true to allow the Physics system to move this Body, otherwise false to move it manually.
    * @default
    */
    this.moves = true;

    /**
    * This flag allows you to disable the custom x separation that takes place by Physics.Arcade.separate.
    * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
    * @property {boolean} customSeparateX - Use a custom separation system or the built-in one?
    * @default
    */
    this.customSeparateX = false;

    /**
    * This flag allows you to disable the custom y separation that takes place by Physics.Arcade.separate.
    * Used in combination with your own collision processHandler you can create whatever type of collision response you need.
    * @property {boolean} customSeparateY - Use a custom separation system or the built-in one?
    * @default
    */
    this.customSeparateY = false;

    /**
    * When this body collides with another, the amount of overlap is stored here.
    * @property {number} overlapX - The amount of horizontal overlap during the collision.
    */
    this.overlapX = 0;

    /**
    * When this body collides with another, the amount of overlap is stored here.
    * @property {number} overlapY - The amount of vertical overlap during the collision.
    */
    this.overlapY = 0;

    /**
    * If a body is overlapping with another body, but neither of them are moving (maybe they spawned on-top of each other?) this is set to true.
    * @property {boolean} embedded - Body embed value.
    */
    this.embedded = false;

    /**
    * A Body can be set to collide against the World bounds automatically and rebound back into the World if this is set to true. Otherwise it will leave the World.
    * @property {boolean} collideWorldBounds - Should the Body collide with the World bounds?
    */
    this.collideWorldBounds = false;

    /**
    * Set the checkCollision properties to control which directions collision is processed for this Body.
    * For example checkCollision.up = false means it won't collide when the collision happened while moving up.
    * @property {object} checkCollision - An object containing allowed collision.
    */
    this.checkCollision = { none: false, any: true, up: true, down: true, left: true, right: true };

    /**
    * This object is populated with boolean values when the Body collides with another.
    * touching.up = true means the collision happened to the top of this Body for example.
    * @property {object} touching - An object containing touching results.
    */
    this.touching = { none: true, up: false, down: false, left: false, right: false };

    /**
    * This object is populated with previous touching values from the bodies previous collision.
    * @property {object} wasTouching - An object containing previous touching results.
    */
    this.wasTouching = { none: true, up: false, down: false, left: false, right: false };

    /**
    * This object is populated with boolean values when the Body collides with the World bounds or a Tile.
    * For example if blocked.up is true then the Body cannot move up.
    * @property {object} blocked - An object containing on which faces this Body is blocked from moving, if any.
    */
    this.blocked = { up: false, down: false, left: false, right: false };

    /**
    * If this is an especially small or fast moving object then it can sometimes skip over tilemap collisions if it moves through a tile in a step.
    * Set this padding value to add extra padding to its bounds. tilePadding.x applied to its width, y to its height.
    * @property {Phaser.Point} tilePadding - Extra padding to be added to this sprite's dimensions when checking for tile collision.
    */
    this.tilePadding = new Phaser.Point();

    /**
    * @property {boolean} dirty - If this Body in a preUpdate (true) or postUpdate (false) state?
    */
    this.dirty = false;

    /**
    * @property {boolean} skipQuadTree - If true and you collide this Sprite against a Group, it will disable the collision check from using a QuadTree.
    */
    this.skipQuadTree = false;

    /**
    * If true the Body will check itself against the Sprite.getBounds() dimensions and adjust its width and height accordingly.
    * If false it will compare its dimensions against the Sprite scale instead, and adjust its width height if the scale has changed.
    * Typically you would need to enable syncBounds if your sprite is the child of a responsive display object such as a FlexLayer, 
    * or in any situation where the Sprite scale doesn't change, but its parents scale is effecting the dimensions regardless.
    * @property {boolean} syncBounds
    * @default
    */
    this.syncBounds = false;

    /**
    * @property {boolean} _reset - Internal cache var.
    * @private
    */
    this._reset = true;

    /**
    * @property {number} _sx - Internal cache var.
    * @private
    */
    this._sx = sprite.scale.x;

    /**
    * @property {number} _sy - Internal cache var.
    * @private
    */
    this._sy = sprite.scale.y;

    /**
    * @property {number} _dx - Internal cache var.
    * @private
    */
    this._dx = 0;

    /**
    * @property {number} _dy - Internal cache var.
    * @private
    */
    this._dy = 0;

};

Phaser.Physics.Arcade.Body.prototype = {

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#updateBounds
    * @protected
    */
    updateBounds: function () {

        if (this.syncBounds)
        {
            var b = this.sprite.getBounds();
            b.ceilAll();

            if (b.width !== this.width || b.height !== this.height)
            {
                this.width = b.width;
                this.height = b.height;
                this._reset = true;
            }
        }
        else
        {
            var asx = Math.abs(this.sprite.scale.x);
            var asy = Math.abs(this.sprite.scale.y);

            if (asx !== this._sx || asy !== this._sy)
            {
                this.width = this.sourceWidth * asx;
                this.height = this.sourceHeight * asy;
                this._sx = asx;
                this._sy = asy;
                this._reset = true;
            }
        }

        if (this._reset)
        {
            this.halfWidth = Math.floor(this.width / 2);
            this.halfHeight = Math.floor(this.height / 2);
            this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);
        }

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#preUpdate
    * @protected
    */
    preUpdate: function () {

        if (!this.enable || this.game.physics.arcade.isPaused)
        {
            return;
        }

        this.dirty = true;

        //  Store and reset collision flags
        this.wasTouching.none = this.touching.none;
        this.wasTouching.up = this.touching.up;
        this.wasTouching.down = this.touching.down;
        this.wasTouching.left = this.touching.left;
        this.wasTouching.right = this.touching.right;

        this.touching.none = true;
        this.touching.up = false;
        this.touching.down = false;
        this.touching.left = false;
        this.touching.right = false;

        this.blocked.up = false;
        this.blocked.down = false;
        this.blocked.left = false;
        this.blocked.right = false;

        this.embedded = false;

        this.updateBounds();

        this.position.x = (this.sprite.world.x - (this.sprite.anchor.x * this.width)) + this.offset.x;
        this.position.y = (this.sprite.world.y - (this.sprite.anchor.y * this.height)) + this.offset.y;
        this.rotation = this.sprite.angle;

        this.preRotation = this.rotation;

        if (this._reset || this.sprite.fresh)
        {
            this.prev.x = this.position.x;
            this.prev.y = this.position.y;
        }

        if (this.moves)
        {
            this.game.physics.arcade.updateMotion(this);

            this.newVelocity.set(this.velocity.x * this.game.time.physicsElapsed, this.velocity.y * this.game.time.physicsElapsed);

            this.position.x += this.newVelocity.x;
            this.position.y += this.newVelocity.y;

            if (this.position.x !== this.prev.x || this.position.y !== this.prev.y)
            {
                this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                this.angle = Math.atan2(this.velocity.y, this.velocity.x);
            }

            //  Now the State update will throw collision checks at the Body
            //  And finally we'll integrate the new position back to the Sprite in postUpdate

            if (this.collideWorldBounds)
            {
                this.checkWorldBounds();
            }
        }

        this._dx = this.deltaX();
        this._dy = this.deltaY();

        this._reset = false;

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#postUpdate
    * @protected
    */
    postUpdate: function () {

        //  Only allow postUpdate to be called once per frame
        if (!this.enable || !this.dirty)
        {
            return;
        }

        this.dirty = false;

        if (this.deltaX() < 0)
        {
            this.facing = Phaser.LEFT;
        }
        else if (this.deltaX() > 0)
        {
            this.facing = Phaser.RIGHT;
        }

        if (this.deltaY() < 0)
        {
            this.facing = Phaser.UP;
        }
        else if (this.deltaY() > 0)
        {
            this.facing = Phaser.DOWN;
        }

        if (this.moves)
        {
            this._dx = this.deltaX();
            this._dy = this.deltaY();

            if (this.deltaMax.x !== 0 && this._dx !== 0)
            {
                if (this._dx < 0 && this._dx < -this.deltaMax.x)
                {
                    this._dx = -this.deltaMax.x;
                }
                else if (this._dx > 0 && this._dx > this.deltaMax.x)
                {
                    this._dx = this.deltaMax.x;
                }
            }

            if (this.deltaMax.y !== 0 && this._dy !== 0)
            {
                if (this._dy < 0 && this._dy < -this.deltaMax.y)
                {
                    this._dy = -this.deltaMax.y;
                }
                else if (this._dy > 0 && this._dy > this.deltaMax.y)
                {
                    this._dy = this.deltaMax.y;
                }
            }

            this.sprite.position.x += this._dx;
            this.sprite.position.y += this._dy;
            this._reset = true;
        }

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

        if (this.allowRotation)
        {
            this.sprite.angle += this.deltaZ();
        }

        this.prev.x = this.position.x;
        this.prev.y = this.position.y;

    },

    /**
    * Removes this bodys reference to its parent sprite, freeing it up for gc.
    *
    * @method Phaser.Physics.Arcade.Body#destroy
    */
    destroy: function () {

        if (this.sprite.parent && this.sprite.parent instanceof Phaser.Group)
        {
            this.sprite.parent.removeFromHash(this.sprite);
        }

        this.sprite.body = null;
        this.sprite = null;

    },

    /**
    * Internal method.
    *
    * @method Phaser.Physics.Arcade.Body#checkWorldBounds
    * @protected
    */
    checkWorldBounds: function () {

        var pos = this.position;
        var bounds = this.game.physics.arcade.bounds;
        var check = this.game.physics.arcade.checkCollision;

        if (pos.x < bounds.x && check.left)
        {
            pos.x = bounds.x;
            this.velocity.x *= -this.bounce.x;
            this.blocked.left = true;
        }
        else if (this.right > bounds.right && check.right)
        {
            pos.x = bounds.right - this.width;
            this.velocity.x *= -this.bounce.x;
            this.blocked.right = true;
        }

        if (pos.y < bounds.y && check.up)
        {
            pos.y = bounds.y;
            this.velocity.y *= -this.bounce.y;
            this.blocked.up = true;
        }
        else if (this.bottom > bounds.bottom && check.down)
        {
            pos.y = bounds.bottom - this.height;
            this.velocity.y *= -this.bounce.y;
            this.blocked.down = true;
        }

    },

    /**
    * You can modify the size of the physics Body to be any dimension you need.
    * So it could be smaller or larger than the parent Sprite. You can also control the x and y offset, which
    * is the position of the Body relative to the top-left of the Sprite.
    *
    * @method Phaser.Physics.Arcade.Body#setSize
    * @param {number} width - The width of the Body.
    * @param {number} height - The height of the Body.
    * @param {number} [offsetX] - The X offset of the Body from the Sprite position.
    * @param {number} [offsetY] - The Y offset of the Body from the Sprite position.
    */
    setSize: function (width, height, offsetX, offsetY) {

        if (offsetX === undefined) { offsetX = this.offset.x; }
        if (offsetY === undefined) { offsetY = this.offset.y; }

        this.sourceWidth = width;
        this.sourceHeight = height;
        this.width = this.sourceWidth * this._sx;
        this.height = this.sourceHeight * this._sy;
        this.halfWidth = Math.floor(this.width / 2);
        this.halfHeight = Math.floor(this.height / 2);
        this.offset.setTo(offsetX, offsetY);

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

    },

    /**
    * Resets all Body values (velocity, acceleration, rotation, etc)
    *
    * @method Phaser.Physics.Arcade.Body#reset
    * @param {number} x - The new x position of the Body.
    * @param {number} y - The new y position of the Body.
    */
    reset: function (x, y) {

        this.velocity.set(0);
        this.acceleration.set(0);

        this.speed = 0;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;

        this.position.x = (x - (this.sprite.anchor.x * this.width)) + this.offset.x;
        this.position.y = (y - (this.sprite.anchor.y * this.height)) + this.offset.y;

        this.prev.x = this.position.x;
        this.prev.y = this.position.y;

        this.rotation = this.sprite.angle;
        this.preRotation = this.rotation;

        this._sx = this.sprite.scale.x;
        this._sy = this.sprite.scale.y;

        this.center.setTo(this.position.x + this.halfWidth, this.position.y + this.halfHeight);

    },

    /**
    * Tests if a world point lies within this Body.
    *
    * @method Phaser.Physics.Arcade.Body#hitTest
    * @param {number} x - The world x coordinate to test.
    * @param {number} y - The world y coordinate to test.
    * @return {boolean} True if the given coordinates are inside this Body, otherwise false.
    */
    hitTest: function (x, y) {
        return Phaser.Rectangle.contains(this, x, y);
    },

    /**
    * Returns true if the bottom of this Body is in contact with either the world bounds or a tile.
    *
    * @method Phaser.Physics.Arcade.Body#onFloor
    * @return {boolean} True if in contact with either the world bounds or a tile.
    */
    onFloor: function () {
        return this.blocked.down;
    },

    /**
    * Returns true if either side of this Body is in contact with either the world bounds or a tile.
    *
    * @method Phaser.Physics.Arcade.Body#onWall
    * @return {boolean} True if in contact with either the world bounds or a tile.
    */
    onWall: function () {
        return (this.blocked.left || this.blocked.right);
    },

    /**
    * Returns the absolute delta x value.
    *
    * @method Phaser.Physics.Arcade.Body#deltaAbsX
    * @return {number} The absolute delta value.
    */
    deltaAbsX: function () {
        return (this.deltaX() > 0 ? this.deltaX() : -this.deltaX());
    },

    /**
    * Returns the absolute delta y value.
    *
    * @method Phaser.Physics.Arcade.Body#deltaAbsY
    * @return {number} The absolute delta value.
    */
    deltaAbsY: function () {
        return (this.deltaY() > 0 ? this.deltaY() : -this.deltaY());
    },

    /**
    * Returns the delta x value. The difference between Body.x now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaX
    * @return {number} The delta value. Positive if the motion was to the right, negative if to the left.
    */
    deltaX: function () {
        return this.position.x - this.prev.x;
    },

    /**
    * Returns the delta y value. The difference between Body.y now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaY
    * @return {number} The delta value. Positive if the motion was downwards, negative if upwards.
    */
    deltaY: function () {
        return this.position.y - this.prev.y;
    },

    /**
    * Returns the delta z value. The difference between Body.rotation now and in the previous step.
    *
    * @method Phaser.Physics.Arcade.Body#deltaZ
    * @return {number} The delta value. Positive if the motion was clockwise, negative if anti-clockwise.
    */
    deltaZ: function () {
        return this.rotation - this.preRotation;
    }

};

/**
* @name Phaser.Physics.Arcade.Body#bottom
* @property {number} bottom - The bottom value of this Body (same as Body.y + Body.height)
* @readonly
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "bottom", {

    get: function () {
        return this.position.y + this.height;
    }

});

/**
* @name Phaser.Physics.Arcade.Body#right
* @property {number} right - The right value of this Body (same as Body.x + Body.width)
* @readonly
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "right", {

    get: function () {
        return this.position.x + this.width;
    }

});

/**
* @name Phaser.Physics.Arcade.Body#x
* @property {number} x - The x position.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "x", {

    get: function () {
        return this.position.x;
    },

    set: function (value) {

        this.position.x = value;
    }

});

/**
* @name Phaser.Physics.Arcade.Body#y
* @property {number} y - The y position.
*/
Object.defineProperty(Phaser.Physics.Arcade.Body.prototype, "y", {

    get: function () {
        return this.position.y;
    },

    set: function (value) {

        this.position.y = value;

    }

});

/**
* Render Sprite Body.
*
* @method Phaser.Physics.Arcade.Body#render
* @param {object} context - The context to render to.
* @param {Phaser.Physics.Arcade.Body} body - The Body to render the info of.
* @param {string} [color='rgba(0,255,0,0.4)'] - color of the debug info to be rendered. (format is css color string).
* @param {boolean} [filled=true] - Render the objected as a filled (default, true) or a stroked (false)
*/
Phaser.Physics.Arcade.Body.render = function (context, body, color, filled) {

    if (filled === undefined) { filled = true; }

    color = color || 'rgba(0,255,0,0.4)';

    if (filled)
    {
        context.fillStyle = color;
        context.fillRect(body.position.x - body.game.camera.x, body.position.y - body.game.camera.y, body.width, body.height);
    }
    else
    {
        context.strokeStyle = color;
        context.strokeRect(body.position.x - body.game.camera.x, body.position.y - body.game.camera.y, body.width, body.height);
    }

};

/**
* Render Sprite Body Physics Data as text.
*
* @method Phaser.Physics.Arcade.Body#renderBodyInfo
* @param {Phaser.Physics.Arcade.Body} body - The Body to render the info of.
* @param {number} x - X position of the debug info to be rendered.
* @param {number} y - Y position of the debug info to be rendered.
* @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
*/
Phaser.Physics.Arcade.Body.renderBodyInfo = function (debug, body) {

    debug.line('x: ' + body.x.toFixed(2), 'y: ' + body.y.toFixed(2), 'width: ' + body.width, 'height: ' + body.height);
    debug.line('velocity x: ' + body.velocity.x.toFixed(2), 'y: ' + body.velocity.y.toFixed(2), 'deltaX: ' + body._dx.toFixed(2), 'deltaY: ' + body._dy.toFixed(2));
    debug.line('acceleration x: ' + body.acceleration.x.toFixed(2), 'y: ' + body.acceleration.y.toFixed(2), 'speed: ' + body.speed.toFixed(2), 'angle: ' + body.angle.toFixed(2));
    debug.line('gravity x: ' + body.gravity.x, 'y: ' + body.gravity.y, 'bounce x: ' + body.bounce.x.toFixed(2), 'y: ' + body.bounce.y.toFixed(2));
    debug.line('touching left: ' + body.touching.left, 'right: ' + body.touching.right, 'up: ' + body.touching.up, 'down: ' + body.touching.down);
    debug.line('blocked left: ' + body.blocked.left, 'right: ' + body.blocked.right, 'up: ' + body.blocked.up, 'down: ' + body.blocked.down);

};

Phaser.Physics.Arcade.Body.prototype.constructor = Phaser.Physics.Arcade.Body;

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* The Arcade Physics world. Contains Arcade Physics related collision, overlap and motion methods.
*
* @class Phaser.Physics.Arcade
* @constructor
* @param {Phaser.Game} game - reference to the current game instance.
*/
Phaser.Physics.Arcade = function (game) {

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = game;

    /**
    * @property {Phaser.Point} gravity - The World gravity setting. Defaults to x: 0, y: 0, or no gravity.
    */
    this.gravity = new Phaser.Point();

    /**
    * @property {Phaser.Rectangle} bounds - The bounds inside of which the physics world exists. Defaults to match the world bounds.
    */
    this.bounds = new Phaser.Rectangle(0, 0, game.world.width, game.world.height);

    /**
    * Set the checkCollision properties to control for which bounds collision is processed.
    * For example checkCollision.down = false means Bodies cannot collide with the World.bounds.bottom.
    * @property {object} checkCollision - An object containing allowed collision flags.
    */
    this.checkCollision = { up: true, down: true, left: true, right: true };

    /**
    * @property {number} maxObjects - Used by the QuadTree to set the maximum number of objects per quad.
    */
    this.maxObjects = 10;

    /**
    * @property {number} maxLevels - Used by the QuadTree to set the maximum number of iteration levels.
    */
    this.maxLevels = 4;

    /**
    * @property {number} OVERLAP_BIAS - A value added to the delta values during collision checks.
    */
    this.OVERLAP_BIAS = 4;

    /**
    * @property {boolean} forceX - If true World.separate will always separate on the X axis before Y. Otherwise it will check gravity totals first.
    */
    this.forceX = false;

    /**
    * @property {number} sortDirection - Used when colliding a Sprite vs. a Group, or a Group vs. a Group, this defines the direction the sort is based on. Default is Phaser.Physics.Arcade.LEFT_RIGHT.
    * @default
    */
    this.sortDirection = Phaser.Physics.Arcade.LEFT_RIGHT;

    /**
    * @property {boolean} skipQuadTree - If true the QuadTree will not be used for any collision. QuadTrees are great if objects are well spread out in your game, otherwise they are a performance hit. If you enable this you can disable on a per body basis via `Body.skipQuadTree`.
    */
    this.skipQuadTree = true;

    /**
    * @property {boolean} isPaused - If `true` the `Body.preUpdate` method will be skipped, halting all motion for all bodies. Note that other methods such as `collide` will still work, so be careful not to call them on paused bodies.
    */
    this.isPaused = false;

    /**
    * @property {Phaser.QuadTree} quadTree - The world QuadTree.
    */
    this.quadTree = new Phaser.QuadTree(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

    /**
    * @property {number} _total - Internal cache var.
    * @private
    */
    this._total = 0;

    // By default we want the bounds the same size as the world bounds
    this.setBoundsToWorld();

};

Phaser.Physics.Arcade.prototype.constructor = Phaser.Physics.Arcade;

/**
* A constant used for the sortDirection value.
* Use this if you don't wish to perform any pre-collision sorting at all, or will manually sort your Groups.
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.SORT_NONE = 0;

/**
* A constant used for the sortDirection value.
* Use this if your game world is wide but short and scrolls from the left to the right (i.e. Mario)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.LEFT_RIGHT = 1;

/**
* A constant used for the sortDirection value.
* Use this if your game world is wide but short and scrolls from the right to the left (i.e. Mario backwards)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.RIGHT_LEFT = 2;

/**
* A constant used for the sortDirection value.
* Use this if your game world is narrow but tall and scrolls from the top to the bottom (i.e. Dig Dug)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.TOP_BOTTOM = 3;

/**
* A constant used for the sortDirection value.
* Use this if your game world is narrow but tall and scrolls from the bottom to the top (i.e. Commando or a vertically scrolling shoot-em-up)
* @constant
* @type {number}
*/
Phaser.Physics.Arcade.BOTTOM_TOP = 4;

Phaser.Physics.Arcade.prototype = {

    /**
    * Updates the size of this physics world.
    *
    * @method Phaser.Physics.Arcade#setBounds
    * @param {number} x - Top left most corner of the world.
    * @param {number} y - Top left most corner of the world.
    * @param {number} width - New width of the world. Can never be smaller than the Game.width.
    * @param {number} height - New height of the world. Can never be smaller than the Game.height.
    */
    setBounds: function (x, y, width, height) {

        this.bounds.setTo(x, y, width, height);

    },

    /**
    * Updates the size of this physics world to match the size of the game world.
    *
    * @method Phaser.Physics.Arcade#setBoundsToWorld
    */
    setBoundsToWorld: function () {

        this.bounds.copyFrom(this.game.world.bounds);

    },

    /**
    * This will create an Arcade Physics body on the given game object or array of game objects.
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
    *
    * @method Phaser.Physics.Arcade#enable
    * @param {object|array|Phaser.Group} object - The game object to create the physics body on. Can also be an array or Group of objects, a body will be created on every child that has a `body` property.
    * @param {boolean} [children=true] - Should a body be created on all children of this object? If true it will recurse down the display list as far as it can go.
    */
    enable: function (object, children) {

        if (children === undefined) { children = true; }

        var i = 1;

        if (Array.isArray(object))
        {
            i = object.length;

            while (i--)
            {
                if (object[i] instanceof Phaser.Group)
                {
                    //  If it's a Group then we do it on the children regardless
                    this.enable(object[i].children, children);
                }
                else
                {
                    this.enableBody(object[i]);

                    if (children && object[i].hasOwnProperty('children') && object[i].children.length > 0)
                    {
                        this.enable(object[i], true);
                    }
                }
            }
        }
        else
        {
            if (object instanceof Phaser.Group)
            {
                //  If it's a Group then we do it on the children regardless
                this.enable(object.children, children);
            }
            else
            {
                this.enableBody(object);

                if (children && object.hasOwnProperty('children') && object.children.length > 0)
                {
                    this.enable(object.children, true);
                }
            }
        }

    },

    /**
    * Creates an Arcade Physics body on the given game object.
    * 
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the body is nulled.
    *
    * When you add an Arcade Physics body to an object it will automatically add the object into its parent Groups hash array.
    *
    * @method Phaser.Physics.Arcade#enableBody
    * @param {object} object - The game object to create the physics body on. A body will only be created if this object has a null `body` property.
    */
    enableBody: function (object) {

        if (object.hasOwnProperty('body') && object.body === null)
        {
            object.body = new Phaser.Physics.Arcade.Body(object);

            if (object.parent && object.parent instanceof Phaser.Group)
            {
                object.parent.addToHash(object);
            }
        }

    },

    /**
    * Called automatically by a Physics body, it updates all motion related values on the Body unless `World.isPaused` is `true`.
    *
    * @method Phaser.Physics.Arcade#updateMotion
    * @param {Phaser.Physics.Arcade.Body} The Body object to be updated.
    */
    updateMotion: function (body) {

        var velocityDelta = this.computeVelocity(0, body, body.angularVelocity, body.angularAcceleration, body.angularDrag, body.maxAngular) - body.angularVelocity;
        body.angularVelocity += velocityDelta;
        body.rotation += (body.angularVelocity * this.game.time.physicsElapsed);

        body.velocity.x = this.computeVelocity(1, body, body.velocity.x, body.acceleration.x, body.drag.x, body.maxVelocity.x);
        body.velocity.y = this.computeVelocity(2, body, body.velocity.y, body.acceleration.y, body.drag.y, body.maxVelocity.y);

    },

    /**
    * A tween-like function that takes a starting velocity and some other factors and returns an altered velocity.
    * Based on a function in Flixel by @ADAMATOMIC
    *
    * @method Phaser.Physics.Arcade#computeVelocity
    * @param {number} axis - 0 for nothing, 1 for horizontal, 2 for vertical.
    * @param {Phaser.Physics.Arcade.Body} body - The Body object to be updated.
    * @param {number} velocity - Any component of velocity (e.g. 20).
    * @param {number} acceleration - Rate at which the velocity is changing.
    * @param {number} drag - Really kind of a deceleration, this is how much the velocity changes if Acceleration is not set.
    * @param {number} [max=10000] - An absolute value cap for the velocity.
    * @return {number} The altered Velocity value.
    */
    computeVelocity: function (axis, body, velocity, acceleration, drag, max) {

        if (max === undefined) { max = 10000; }

        if (axis === 1 && body.allowGravity)
        {
            velocity += (this.gravity.x + body.gravity.x) * this.game.time.physicsElapsed;
        }
        else if (axis === 2 && body.allowGravity)
        {
            velocity += (this.gravity.y + body.gravity.y) * this.game.time.physicsElapsed;
        }

        if (acceleration)
        {
            velocity += acceleration * this.game.time.physicsElapsed;
        }
        else if (drag)
        {
            drag *= this.game.time.physicsElapsed;

            if (velocity - drag > 0)
            {
                velocity -= drag;
            }
            else if (velocity + drag < 0)
            {
                velocity += drag;
            }
            else
            {
                velocity = 0;
            }
        }

        if (velocity > max)
        {
            velocity = max;
        }
        else if (velocity < -max)
        {
            velocity = -max;
        }

        return velocity;

    },

    /**
    * Checks for overlaps between two game objects. The objects can be Sprites, Groups or Emitters.
    * You can perform Sprite vs. Sprite, Sprite vs. Group and Group vs. Group overlap checks.
    * Unlike collide the objects are NOT automatically separated or have any physics applied, they merely test for overlap results.
    * Both the first and second parameter can be arrays of objects, of differing types.
    * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
    * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups within Groups).
    *
    * @method Phaser.Physics.Arcade#overlap
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group or Phaser.Particles.Emitter.
    * @param {function} [overlapCallback=null] - An optional callback function that is called if the objects overlap. The two objects will be passed to this function in the same order in which you specified them, unless you are checking Group vs. Sprite, in which case Sprite will always be the first parameter.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then `overlapCallback` will only be called if this callback returns `true`.
    * @param {object} [callbackContext] - The context in which to run the callbacks.
    * @return {boolean} True if an overlap occurred otherwise false.
    */
    overlap: function (object1, object2, overlapCallback, processCallback, callbackContext) {

        overlapCallback = overlapCallback || null;
        processCallback = processCallback || null;
        callbackContext = callbackContext || overlapCallback;

        this._total = 0;

        if (!Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object2.length; i++)
            {
                this.collideHandler(object1, object2[i], overlapCallback, processCallback, callbackContext, true);
            }
        }
        else if (Array.isArray(object1) && !Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                this.collideHandler(object1[i], object2, overlapCallback, processCallback, callbackContext, true);
            }
        }
        else if (Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                for (var j = 0; j < object2.length; j++)
                {
                    this.collideHandler(object1[i], object2[j], overlapCallback, processCallback, callbackContext, true);
                }
            }
        }
        else
        {
            this.collideHandler(object1, object2, overlapCallback, processCallback, callbackContext, true);
        }

        return (this._total > 0);

    },

    /**
    * Checks for collision between two game objects. You can perform Sprite vs. Sprite, Sprite vs. Group, Group vs. Group, Sprite vs. Tilemap Layer or Group vs. Tilemap Layer collisions.
    * Both the first and second parameter can be arrays of objects, of differing types.
    * If two arrays are passed, the contents of the first parameter will be tested against all contents of the 2nd parameter.
    * The objects are also automatically separated. If you don't require separation then use ArcadePhysics.overlap instead.
    * An optional processCallback can be provided. If given this function will be called when two sprites are found to be colliding. It is called before any separation takes place,
    * giving you the chance to perform additional checks. If the function returns true then the collision and separation is carried out. If it returns false it is skipped.
    * The collideCallback is an optional function that is only called if two sprites collide. If a processCallback has been set then it needs to return true for collideCallback to be called.
    * NOTE: This function is not recursive, and will not test against children of objects passed (i.e. Groups or Tilemaps within other Groups).
    *
    * @method Phaser.Physics.Arcade#collide
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object1 - The first object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer|array} object2 - The second object or array of objects to check. Can be Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer.
    * @param {function} [collideCallback=null] - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them, unless you are colliding Group vs. Sprite, in which case Sprite will always be the first parameter.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} [callbackContext] - The context in which to run the callbacks.
    * @return {boolean} True if a collision occurred otherwise false.
    */
    collide: function (object1, object2, collideCallback, processCallback, callbackContext) {

        collideCallback = collideCallback || null;
        processCallback = processCallback || null;
        callbackContext = callbackContext || collideCallback;

        this._total = 0;

        if (!Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object2.length; i++)
            {
                this.collideHandler(object1, object2[i], collideCallback, processCallback, callbackContext, false);
            }
        }
        else if (Array.isArray(object1) && !Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                this.collideHandler(object1[i], object2, collideCallback, processCallback, callbackContext, false);
            }
        }
        else if (Array.isArray(object1) && Array.isArray(object2))
        {
            for (var i = 0; i < object1.length; i++)
            {
                for (var j = 0; j < object2.length; j++)
                {
                    this.collideHandler(object1[i], object2[j], collideCallback, processCallback, callbackContext, false);
                }
            }
        }
        else
        {
            this.collideHandler(object1, object2, collideCallback, processCallback, callbackContext, false);
        }

        return (this._total > 0);

    },

    /**
     * A Sort function for sorting two bodies based on a LEFT to RIGHT sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortLeftRight
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortLeftRight: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return a.body.x - b.body.x;

    },

    /**
     * A Sort function for sorting two bodies based on a RIGHT to LEFT sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortRightLeft
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortRightLeft: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return b.body.x - a.body.x;

    },

    /**
     * A Sort function for sorting two bodies based on a TOP to BOTTOM sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortTopBottom
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortTopBottom: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return a.body.y - b.body.y;

    },

    /**
     * A Sort function for sorting two bodies based on a BOTTOM to TOP sort direction.
     *
     * This is called automatically by World.sort
     *
     * @method Phaser.Physics.Arcade#sortBottomTop
     * @param {Phaser.Sprite} a - The first Sprite to test. The Sprite must have an Arcade Physics Body.
     * @param {Phaser.Sprite} b - The second Sprite to test. The Sprite must have an Arcade Physics Body.
     * @return {integer} A negative value if `a > b`, a positive value if `a < b` or 0 if `a === b` or the bodies are invalid.
     */
    sortBottomTop: function (a, b) {

        if (!a.body || !b.body)
        {
            return 0;
        }

        return b.body.y - a.body.y;

    },

    /**
     * This method will sort a Groups hash array.
     *
     * If the Group has `physicsSortDirection` set it will use the sort direction defined.
     *
     * Otherwise if the sortDirection parameter is undefined, or Group.physicsSortDirection is null, it will use Phaser.Physics.Arcade.sortDirection.
     *
     * By changing Group.physicsSortDirection you can customise each Group to sort in a different order.
     *
     * @method Phaser.Physics.Arcade#sort
     * @param {Phaser.Group} group - The Group to sort.
     * @param {integer} [sortDirection] - The sort direction used to sort this Group.
     */
    sort: function (group, sortDirection) {

        if (group.physicsSortDirection !== null)
        {
            sortDirection = group.physicsSortDirection;
        }
        else
        {
            if (sortDirection === undefined) { sortDirection = this.sortDirection; }
        }

        if (sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
        {
            //  Game world is say 2000x600 and you start at 0
            group.hash.sort(this.sortLeftRight);
        }
        else if (sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
        {
            //  Game world is say 2000x600 and you start at 2000
            group.hash.sort(this.sortRightLeft);
        }
        else if (sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
        {
            //  Game world is say 800x2000 and you start at 0
            group.hash.sort(this.sortTopBottom);
        }
        else if (sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
        {
            //  Game world is say 800x2000 and you start at 2000
            group.hash.sort(this.sortBottomTop);
        }

    },

    /**
    * Internal collision handler.
    *
    * @method Phaser.Physics.Arcade#collideHandler
    * @private
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object1 - The first object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter, or Phaser.TilemapLayer.
    * @param {Phaser.Sprite|Phaser.Group|Phaser.Particles.Emitter|Phaser.TilemapLayer} object2 - The second object to check. Can be an instance of Phaser.Sprite, Phaser.Group, Phaser.Particles.Emitter or Phaser.TilemapLayer. Can also be an array of objects to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideHandler: function (object1, object2, collideCallback, processCallback, callbackContext, overlapOnly) {

        //  Only collide valid objects
        if (object2 === undefined && object1.physicsType === Phaser.GROUP)
        {
            this.sort(object1);
            this.collideGroupVsSelf(object1, collideCallback, processCallback, callbackContext, overlapOnly);
            return;
        }

        //  If neither of the objects are set or exist then bail out
        if (!object1 || !object2 || !object1.exists || !object2.exists)
        {
            return;
        }

        //  Groups? Sort them
        if (this.sortDirection !== Phaser.Physics.Arcade.SORT_NONE)
        {
            if (object1.physicsType === Phaser.GROUP)
            {
                this.sort(object1);
            }

            if (object2.physicsType === Phaser.GROUP)
            {
                this.sort(object2);
            }
        }

        //  SPRITES
        if (object1.physicsType === Phaser.SPRITE)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsSprite(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideSpriteVsGroup(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.TILEMAPLAYER)
            {
                this.collideSpriteVsTilemapLayer(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        //  GROUPS
        else if (object1.physicsType === Phaser.GROUP)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsGroup(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideGroupVsGroup(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.TILEMAPLAYER)
            {
                this.collideGroupVsTilemapLayer(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        //  TILEMAP LAYERS
        else if (object1.physicsType === Phaser.TILEMAPLAYER)
        {
            if (object2.physicsType === Phaser.SPRITE)
            {
                this.collideSpriteVsTilemapLayer(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
            else if (object2.physicsType === Phaser.GROUP)
            {
                this.collideGroupVsTilemapLayer(object2, object1, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideSpriteVsSprite
    * @private
    * @param {Phaser.Sprite} sprite1 - The first sprite to check.
    * @param {Phaser.Sprite} sprite2 - The second sprite to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} True if there was a collision, otherwise false.
    */
    collideSpriteVsSprite: function (sprite1, sprite2, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (!sprite1.body || !sprite2.body)
        {
            return false;
        }

        if (this.separate(sprite1.body, sprite2.body, processCallback, callbackContext, overlapOnly))
        {
            if (collideCallback)
            {
                collideCallback.call(callbackContext, sprite1, sprite2);
            }

            this._total++;
        }

        return true;

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideSpriteVsGroup
    * @private
    * @param {Phaser.Sprite} sprite - The sprite to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideSpriteVsGroup: function (sprite, group, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group.length === 0 || !sprite.body)
        {
            return;
        }

        var body;

        if (this.skipQuadTree || sprite.body.skipQuadTree)
        {
            for (var i = 0; i < group.hash.length; i++)
            {
                //  Skip duff entries - we can't check a non-existent sprite or one with no body
                if (!group.hash[i] || !group.hash[i].exists || !group.hash[i].body)
                {
                    continue;
                }

                body = group.hash[i].body;

                //  Skip items either side of the sprite
                if (this.sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
                {
                    if (sprite.body.right < body.x)
                    {
                        break;
                    }
                    else if (body.right < sprite.body.x)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
                {
                    if (sprite.body.x > body.right)
                    {
                        break;
                    }
                    else if (body.x > sprite.body.right)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
                {
                    if (sprite.body.bottom < body.y)
                    {
                        break;
                    }
                    else if (body.bottom < sprite.body.y)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
                {
                    if (sprite.body.y > body.bottom)
                    {
                        break;
                    }
                    else if (body.y > sprite.body.bottom)
                    {
                        continue;
                    }
                }
                
                this.collideSpriteVsSprite(sprite, group.hash[i], collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }
        else
        {
            //  What is the sprite colliding with in the quadtree?
            this.quadTree.clear();

            this.quadTree.reset(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

            this.quadTree.populate(group);

            var items = this.quadTree.retrieve(sprite);

            for (var i = 0; i < items.length; i++)
            {
                //  We have our potential suspects, are they in this group?
                if (this.separate(sprite.body, items[i], processCallback, callbackContext, overlapOnly))
                {
                    if (collideCallback)
                    {
                        collideCallback.call(callbackContext, sprite, items[i].sprite);
                    }

                    this._total++;
                }
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideGroupVsSelf
    * @private
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} True if there was a collision, otherwise false.
    */
    collideGroupVsSelf: function (group, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group.length === 0)
        {
            return;
        }

        for (var i = 0; i < group.hash.length; i++)
        {
            //  Skip duff entries - we can't check a non-existent sprite or one with no body
            if (!group.hash[i] || !group.hash[i].exists || !group.hash[i].body)
            {
                continue;
            }

            var object1 = group.hash[i];

            for (var j = i + 1; j < group.hash.length; j++)
            {
                //  Skip duff entries - we can't check a non-existent sprite or one with no body
                if (!group.hash[j] || !group.hash[j].exists || !group.hash[j].body)
                {
                    continue;
                }

                var object2 = group.hash[j];

                //  Skip items either side of the sprite
                if (this.sortDirection === Phaser.Physics.Arcade.LEFT_RIGHT)
                {
                    if (object1.body.right < object2.body.x)
                    {
                        break;
                    }
                    else if (object2.body.right < object1.body.x)
                    {
                        continue;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.RIGHT_LEFT)
                {
                    if (object1.body.x > object2.body.right)
                    {
                        continue;
                    }
                    else if (object2.body.x > object1.body.right)
                    {
                        break;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.TOP_BOTTOM)
                {
                    if (object1.body.bottom < object2.body.y)
                    {
                        continue;
                    }
                    else if (object2.body.bottom < object1.body.y)
                    {
                        break;
                    }
                }
                else if (this.sortDirection === Phaser.Physics.Arcade.BOTTOM_TOP)
                {
                    if (object1.body.y > object2.body.bottom)
                    {
                        continue;
                    }
                    else if (object2.body.y > object1.body.bottom)
                    {
                        break;
                    }
                }
                
                this.collideSpriteVsSprite(object1, object2, collideCallback, processCallback, callbackContext, overlapOnly);
            }
        }

    },

    /**
    * An internal function. Use Phaser.Physics.Arcade.collide instead.
    *
    * @method Phaser.Physics.Arcade#collideGroupVsGroup
    * @private
    * @param {Phaser.Group} group1 - The first Group to check.
    * @param {Phaser.Group} group2 - The second Group to check.
    * @param {function} collideCallback - An optional callback function that is called if the objects collide. The two objects will be passed to this function in the same order in which you specified them.
    * @param {function} processCallback - A callback function that lets you perform additional checks against the two objects if they overlap. If this is set then collision will only happen if processCallback returns true. The two objects will be passed to this function in the same order in which you specified them.
    * @param {object} callbackContext - The context in which to run the callbacks.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    */
    collideGroupVsGroup: function (group1, group2, collideCallback, processCallback, callbackContext, overlapOnly) {

        if (group1.length === 0 || group2.length === 0)
        {
            return;
        }

        for (var i = 0; i < group1.children.length; i++)
        {
            if (group1.children[i].exists)
            {
                if (group1.children[i].physicsType === Phaser.GROUP)
                {
                    this.collideGroupVsGroup(group1.children[i], group2, collideCallback, processCallback, callbackContext, overlapOnly);
                }
                else
                {
                    this.collideSpriteVsGroup(group1.children[i], group2, collideCallback, processCallback, callbackContext, overlapOnly);
                }
            }
        }

    },

    /**
    * The core separation function to separate two physics bodies.
    *
    * @private
    * @method Phaser.Physics.Arcade#separate
    * @param {Phaser.Physics.Arcade.Body} body1 - The first Body object to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The second Body object to separate.
    * @param {function} [processCallback=null] - A callback function that lets you perform additional checks against the two objects if they overlap. If this function is set then the sprites will only be collided if it returns true.
    * @param {object} [callbackContext] - The context in which to run the process callback.
    * @param {boolean} overlapOnly - Just run an overlap or a full collision.
    * @return {boolean} Returns true if the bodies collided, otherwise false.
    */
    separate: function (body1, body2, processCallback, callbackContext, overlapOnly) {

        if (!body1.enable || !body2.enable || !this.intersects(body1, body2))
        {
            return false;
        }

        //  They overlap. Is there a custom process callback? If it returns true then we can carry on, otherwise we should abort.
        if (processCallback && processCallback.call(callbackContext, body1.sprite, body2.sprite) === false)
        {
            return false;
        }

        //  Do we separate on x or y first?

        var result = false;

        //  If we weren't having to carry around so much legacy baggage with us, we could do this properly. But alas ...
        if (this.forceX || Math.abs(this.gravity.y + body1.gravity.y) < Math.abs(this.gravity.x + body1.gravity.x))
        {
            result = (this.separateX(body1, body2, overlapOnly) || this.separateY(body1, body2, overlapOnly));
        }
        else
        {
            result = (this.separateY(body1, body2, overlapOnly) || this.separateX(body1, body2, overlapOnly));
        }

        if (overlapOnly)
        {
            //  We already know they intersect from the check above, but by this point we know they've now had their overlapX/Y values populated
            return true;
        }
        else
        {
            return result;
        }

    },

    /**
    * Check for intersection against two bodies.
    *
    * @method Phaser.Physics.Arcade#intersects
    * @param {Phaser.Physics.Arcade.Body} body1 - The Body object to check.
    * @param {Phaser.Physics.Arcade.Body} body2 - The Body object to check.
    * @return {boolean} True if they intersect, otherwise false.
    */
    intersects: function (body1, body2) {

        if (body1.right <= body2.position.x)
        {
            return false;
        }

        if (body1.bottom <= body2.position.y)
        {
            return false;
        }

        if (body1.position.x >= body2.right)
        {
            return false;
        }

        if (body1.position.y >= body2.bottom)
        {
            return false;
        }

        return true;

    },

    /**
    * The core separation function to separate two physics bodies on the x axis.
    *
    * @private
    * @method Phaser.Physics.Arcade#separateX
    * @param {Phaser.Physics.Arcade.Body} body1 - The Body object to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The Body object to separate.
    * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
    * @return {boolean} Returns true if the bodies were separated, otherwise false.
    */
    separateX: function (body1, body2, overlapOnly) {

        //  Can't separate two immovable bodies
        if (body1.immovable && body2.immovable)
        {
            return false;
        }

        var overlap = 0;

        //  Check if the hulls actually overlap
        if (this.intersects(body1, body2))
        {
            var maxOverlap = body1.deltaAbsX() + body2.deltaAbsX() + this.OVERLAP_BIAS;

            if (body1.deltaX() === 0 && body2.deltaX() === 0)
            {
                //  They overlap but neither of them are moving
                body1.embedded = true;
                body2.embedded = true;
            }
            else if (body1.deltaX() > body2.deltaX())
            {
                //  Body1 is moving right and/or Body2 is moving left
                overlap = body1.right - body2.x;

                if ((overlap > maxOverlap) || body1.checkCollision.right === false || body2.checkCollision.left === false)
                {
                    overlap = 0;
                }
                else
                {
                    body1.touching.none = false;
                    body1.touching.right = true;
                    body2.touching.none = false;
                    body2.touching.left = true;
                }
            }
            else if (body1.deltaX() < body2.deltaX())
            {
                //  Body1 is moving left and/or Body2 is moving right
                overlap = body1.x - body2.width - body2.x;

                if ((-overlap > maxOverlap) || body1.checkCollision.left === false || body2.checkCollision.right === false)
                {
                    overlap = 0;
                }
                else
                {
                    body1.touching.none = false;
                    body1.touching.left = true;
                    body2.touching.none = false;
                    body2.touching.right = true;
                }
            }

            //  Resets the overlapX to zero if there is no overlap, or to the actual pixel value if there is
            body1.overlapX = overlap;
            body2.overlapX = overlap;

            //  Then adjust their positions and velocities accordingly (if there was any overlap)
            if (overlap !== 0)
            {
                if (overlapOnly || body1.customSeparateX || body2.customSeparateX)
                {
                    return true;
                }

                var v1 = body1.velocity.x;
                var v2 = body2.velocity.x;

                if (!body1.immovable && !body2.immovable)
                {
                    overlap *= 0.5;

                    body1.x = body1.x - overlap;
                    body2.x += overlap;

                    var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
                    var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
                    var avg = (nv1 + nv2) * 0.5;

                    nv1 -= avg;
                    nv2 -= avg;

                    body1.velocity.x = avg + nv1 * body1.bounce.x;
                    body2.velocity.x = avg + nv2 * body2.bounce.x;
                }
                else if (!body1.immovable)
                {
                    body1.x = body1.x - overlap;
                    body1.velocity.x = v2 - v1 * body1.bounce.x;

                    //  This is special case code that handles things like vertically moving platforms you can ride
                    if (body2.moves)
                    {
                        body1.y += (body2.y - body2.prev.y) * body2.friction.y;
                    }
                }
                else if (!body2.immovable)
                {
                    body2.x += overlap;
                    body2.velocity.x = v1 - v2 * body2.bounce.x;

                    //  This is special case code that handles things like vertically moving platforms you can ride
                    if (body1.moves)
                    {
                        body2.y += (body1.y - body1.prev.y) * body1.friction.y;
                    }
                }

                return true;
            }
        }

        return false;

    },

    /**
    * The core separation function to separate two physics bodies on the y axis.
    *
    * @private
    * @method Phaser.Physics.Arcade#separateY
    * @param {Phaser.Physics.Arcade.Body} body1 - The Body object to separate.
    * @param {Phaser.Physics.Arcade.Body} body2 - The Body object to separate.
    * @param {boolean} overlapOnly - If true the bodies will only have their overlap data set, no separation or exchange of velocity will take place.
    * @return {boolean} Returns true if the bodies were separated, otherwise false.
    */
    separateY: function (body1, body2, overlapOnly) {

        //  Can't separate two immovable or non-existing bodies
        if (body1.immovable && body2.immovable)
        {
            return false;
        }

        var overlap = 0;

        //  Check if the hulls actually overlap
        if (this.intersects(body1, body2))
        {
            var maxOverlap = body1.deltaAbsY() + body2.deltaAbsY() + this.OVERLAP_BIAS;

            if (body1.deltaY() === 0 && body2.deltaY() === 0)
            {
                //  They overlap but neither of them are moving
                body1.embedded = true;
                body2.embedded = true;
            }
            else if (body1.deltaY() > body2.deltaY())
            {
                //  Body1 is moving down and/or Body2 is moving up
                overlap = body1.bottom - body2.y;

                if ((overlap > maxOverlap) || body1.checkCollision.down === false || body2.checkCollision.up === false)
                {
                    overlap = 0;
                }
                else
                {
                    body1.touching.none = false;
                    body1.touching.down = true;
                    body2.touching.none = false;
                    body2.touching.up = true;
                }
            }
            else if (body1.deltaY() < body2.deltaY())
            {
                //  Body1 is moving up and/or Body2 is moving down
                overlap = body1.y - body2.bottom;

                if ((-overlap > maxOverlap) || body1.checkCollision.up === false || body2.checkCollision.down === false)
                {
                    overlap = 0;
                }
                else
                {
                    body1.touching.none = false;
                    body1.touching.up = true;
                    body2.touching.none = false;
                    body2.touching.down = true;
                }
            }

            //  Resets the overlapY to zero if there is no overlap, or to the actual pixel value if there is
            body1.overlapY = overlap;
            body2.overlapY = overlap;

            //  Then adjust their positions and velocities accordingly (if there was any overlap)
            if (overlap !== 0)
            {
                if (overlapOnly || body1.customSeparateY || body2.customSeparateY)
                {
                    return true;
                }

                var v1 = body1.velocity.y;
                var v2 = body2.velocity.y;

                if (!body1.immovable && !body2.immovable)
                {
                    overlap *= 0.5;

                    body1.y = body1.y - overlap;
                    body2.y += overlap;

                    var nv1 = Math.sqrt((v2 * v2 * body2.mass) / body1.mass) * ((v2 > 0) ? 1 : -1);
                    var nv2 = Math.sqrt((v1 * v1 * body1.mass) / body2.mass) * ((v1 > 0) ? 1 : -1);
                    var avg = (nv1 + nv2) * 0.5;

                    nv1 -= avg;
                    nv2 -= avg;

                    body1.velocity.y = avg + nv1 * body1.bounce.y;
                    body2.velocity.y = avg + nv2 * body2.bounce.y;
                }
                else if (!body1.immovable)
                {
                    body1.y = body1.y - overlap;
                    body1.velocity.y = v2 - v1 * body1.bounce.y;

                    //  This is special case code that handles things like horizontal moving platforms you can ride
                    if (body2.moves)
                    {
                        body1.x += (body2.x - body2.prev.x) * body2.friction.x;
                    }
                }
                else if (!body2.immovable)
                {
                    body2.y += overlap;
                    body2.velocity.y = v1 - v2 * body2.bounce.y;

                    //  This is special case code that handles things like horizontal moving platforms you can ride
                    if (body1.moves)
                    {
                        body2.x += (body1.x - body1.prev.x) * body1.friction.x;
                    }
                }

                return true;
            }

        }

        return false;

    },

    /**
    * Given a Group and a Pointer this will check to see which Group children overlap with the Pointer coordinates.
    * Each child will be sent to the given callback for further processing.
    * Note that the children are not checked for depth order, but simply if they overlap the Pointer or not.
    *
    * @method Phaser.Physics.Arcade#getObjectsUnderPointer
    * @param {Phaser.Pointer} pointer - The Pointer to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} [callback] - A callback function that is called if the object overlaps with the Pointer. The callback will be sent two parameters: the Pointer and the Object that overlapped with it.
    * @param {object} [callbackContext] - The context in which to run the callback.
    * @return {PIXI.DisplayObject[]} An array of the Sprites from the Group that overlapped the Pointer coordinates.
    */
    getObjectsUnderPointer: function (pointer, group, callback, callbackContext) {

        if (group.length === 0 || !pointer.exists)
        {
            return;
        }

        return this.getObjectsAtLocation(pointer.x, pointer.y, group, callback, callbackContext, pointer);

    },

    /**
    * Given a Group and a location this will check to see which Group children overlap with the coordinates.
    * Each child will be sent to the given callback for further processing.
    * Note that the children are not checked for depth order, but simply if they overlap the coordinate or not.
    *
    * @method Phaser.Physics.Arcade#getObjectsAtLocation
    * @param {number} x - The x coordinate to check.
    * @param {number} y - The y coordinate to check.
    * @param {Phaser.Group} group - The Group to check.
    * @param {function} [callback] - A callback function that is called if the object overlaps the coordinates. The callback will be sent two parameters: the callbackArg and the Object that overlapped the location.
    * @param {object} [callbackContext] - The context in which to run the callback.
    * @param {object} [callbackArg] - An argument to pass to the callback.
    * @return {PIXI.DisplayObject[]} An array of the Sprites from the Group that overlapped the coordinates.
    */
    getObjectsAtLocation: function (x, y, group, callback, callbackContext, callbackArg) {

        this.quadTree.clear();

        this.quadTree.reset(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, this.maxObjects, this.maxLevels);

        this.quadTree.populate(group);

        var rect = new Phaser.Rectangle(x, y, 1, 1);
        var output = [];

        var items = this.quadTree.retrieve(rect);

        for (var i = 0; i < items.length; i++)
        {
            if (items[i].hitTest(x, y))
            {
                if (callback)
                {
                    callback.call(callbackContext, callbackArg, items[i].sprite);
                }

                output.push(items[i].sprite);
            }
        }

        return output;
        
    },

    /**
    * Move the given display object towards the destination object at a steady velocity.
    * If you specify a maxTime then it will adjust the speed (overwriting what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    * Note: Doesn't take into account acceleration, maxVelocity or drag (if you've set drag or acceleration too high this object may not move at all)
    *
    * @method Phaser.Physics.Arcade#moveToObject
    * @param {any} displayObject - The display object to move.
    * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToObject: function (displayObject, destination, speed, maxTime) {

        if (speed === undefined) { speed = 60; }
        if (maxTime === undefined) { maxTime = 0; }

        var angle = Math.atan2(destination.y - displayObject.y, destination.x - displayObject.x);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceBetween(displayObject, destination) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Move the given display object towards the pointer at a steady velocity. If no pointer is given it will use Phaser.Input.activePointer.
    * If you specify a maxTime then it will adjust the speed (over-writing what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#moveToPointer
    * @param {any} displayObject - The display object to move.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {Phaser.Pointer} [pointer] - The pointer to move towards. Defaults to Phaser.Input.activePointer.
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToPointer: function (displayObject, speed, pointer, maxTime) {

        if (speed === undefined) { speed = 60; }
        pointer = pointer || this.game.input.activePointer;
        if (maxTime === undefined) { maxTime = 0; }

        var angle = this.angleToPointer(displayObject, pointer);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceToPointer(displayObject, pointer) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Move the given display object towards the x/y coordinates at a steady velocity.
    * If you specify a maxTime then it will adjust the speed (over-writing what you set) so it arrives at the destination in that number of seconds.
    * Timings are approximate due to the way browser timers work. Allow for a variance of +- 50ms.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    * Note: Doesn't take into account acceleration, maxVelocity or drag (if you've set drag or acceleration too high this object may not move at all)
    *
    * @method Phaser.Physics.Arcade#moveToXY
    * @param {any} displayObject - The display object to move.
    * @param {number} x - The x coordinate to move towards.
    * @param {number} y - The y coordinate to move towards.
    * @param {number} [speed=60] - The speed it will move, in pixels per second (default is 60 pixels/sec)
    * @param {number} [maxTime=0] - Time given in milliseconds (1000 = 1 sec). If set the speed is adjusted so the object will arrive at destination in the given number of ms.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new velocity.
    */
    moveToXY: function (displayObject, x, y, speed, maxTime) {

        if (speed === undefined) { speed = 60; }
        if (maxTime === undefined) { maxTime = 0; }

        var angle = Math.atan2(y - displayObject.y, x - displayObject.x);

        if (maxTime > 0)
        {
            //  We know how many pixels we need to move, but how fast?
            speed = this.distanceToXY(displayObject, x, y) / (maxTime / 1000);
        }

        displayObject.body.velocity.x = Math.cos(angle) * speed;
        displayObject.body.velocity.y = Math.sin(angle) * speed;

        return angle;

    },

    /**
    * Given the angle (in degrees) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
    * One way to use this is: velocityFromAngle(angle, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#velocityFromAngle
    * @param {number} angle - The angle in degrees calculated in clockwise positive direction (down = 90 degrees positive, right = 0 degrees positive, up = 90 degrees negative)
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
    * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
    */
    velocityFromAngle: function (angle, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(this.game.math.degToRad(angle)) * speed), (Math.sin(this.game.math.degToRad(angle)) * speed));

    },

    /**
    * Given the rotation (in radians) and speed calculate the velocity and return it as a Point object, or set it to the given point object.
    * One way to use this is: velocityFromRotation(rotation, 200, sprite.velocity) which will set the values directly to the sprites velocity and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#velocityFromRotation
    * @param {number} rotation - The angle in radians.
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated velocity.
    * @return {Phaser.Point} - A Point where point.x contains the velocity x value and point.y contains the velocity y value.
    */
    velocityFromRotation: function (rotation, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));

    },

    /**
    * Given the rotation (in radians) and speed calculate the acceleration and return it as a Point object, or set it to the given point object.
    * One way to use this is: accelerationFromRotation(rotation, 200, sprite.acceleration) which will set the values directly to the sprites acceleration and not create a new Point object.
    *
    * @method Phaser.Physics.Arcade#accelerationFromRotation
    * @param {number} rotation - The angle in radians.
    * @param {number} [speed=60] - The speed it will move, in pixels per second sq.
    * @param {Phaser.Point|object} [point] - The Point object in which the x and y properties will be set to the calculated acceleration.
    * @return {Phaser.Point} - A Point where point.x contains the acceleration x value and point.y contains the acceleration y value.
    */
    accelerationFromRotation: function (rotation, speed, point) {

        if (speed === undefined) { speed = 60; }
        point = point || new Phaser.Point();

        return point.setTo((Math.cos(rotation) * speed), (Math.sin(rotation) * speed));

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the target at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToObject
    * @param {any} displayObject - The display object to move.
    * @param {any} destination - The display object to move towards. Can be any object but must have visible x/y properties.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToObject: function (displayObject, destination, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleBetween(displayObject, destination);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the target at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToPointer
    * @param {any} displayObject - The display object to move.
    * @param {Phaser.Pointer} [pointer] - The pointer to move towards. Defaults to Phaser.Input.activePointer.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToPointer: function (displayObject, pointer, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (pointer === undefined) { pointer = this.game.input.activePointer; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleToPointer(displayObject, pointer);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Sets the acceleration.x/y property on the display object so it will move towards the x/y coordinates at the given speed (in pixels per second sq.)
    * You must give a maximum speed value, beyond which the display object won't go any faster.
    * Note: The display object does not continuously track the target. If the target changes location during transit the display object will not modify its course.
    * Note: The display object doesn't stop moving once it reaches the destination coordinates.
    *
    * @method Phaser.Physics.Arcade#accelerateToXY
    * @param {any} displayObject - The display object to move.
    * @param {number} x - The x coordinate to accelerate towards.
    * @param {number} y - The y coordinate to accelerate towards.
    * @param {number} [speed=60] - The speed it will accelerate in pixels per second.
    * @param {number} [xSpeedMax=500] - The maximum x velocity the display object can reach.
    * @param {number} [ySpeedMax=500] - The maximum y velocity the display object can reach.
    * @return {number} The angle (in radians) that the object should be visually set to in order to match its new trajectory.
    */
    accelerateToXY: function (displayObject, x, y, speed, xSpeedMax, ySpeedMax) {

        if (speed === undefined) { speed = 60; }
        if (xSpeedMax === undefined) { xSpeedMax = 1000; }
        if (ySpeedMax === undefined) { ySpeedMax = 1000; }

        var angle = this.angleToXY(displayObject, x, y);

        displayObject.body.acceleration.setTo(Math.cos(angle) * speed, Math.sin(angle) * speed);
        displayObject.body.maxVelocity.setTo(xSpeedMax, ySpeedMax);

        return angle;

    },

    /**
    * Find the distance between two display objects (like Sprites).
    *
    * @method Phaser.Physics.Arcade#distanceBetween
    * @param {any} source - The Display Object to test from.
    * @param {any} target - The Display Object to test to.
    * @return {number} The distance between the source and target objects.
    */
    distanceBetween: function (source, target) {

        var dx = source.x - target.x;
        var dy = source.y - target.y;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the distance between a display object (like a Sprite) and the given x/y coordinates.
    * The calculation is made from the display objects x/y coordinate. This may be the top-left if its anchor hasn't been changed.
    * If you need to calculate from the center of a display object instead use the method distanceBetweenCenters()
    *
    * @method Phaser.Physics.Arcade#distanceToXY
    * @param {any} displayObject - The Display Object to test from.
    * @param {number} x - The x coordinate to move towards.
    * @param {number} y - The y coordinate to move towards.
    * @return {number} The distance between the object and the x/y coordinates.
    */
    distanceToXY: function (displayObject, x, y) {

        var dx = displayObject.x - x;
        var dy = displayObject.y - y;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the distance between a display object (like a Sprite) and a Pointer. If no Pointer is given the Input.activePointer is used.
    * The calculation is made from the display objects x/y coordinate. This may be the top-left if its anchor hasn't been changed.
    * If you need to calculate from the center of a display object instead use the method distanceBetweenCenters()
    * The distance to the Pointer is returned in screen space, not world space.
    *
    * @method Phaser.Physics.Arcade#distanceToPointer
    * @param {any} displayObject - The Display Object to test from.
    * @param {Phaser.Pointer} [pointer] - The Phaser.Pointer to test to. If none is given then Input.activePointer is used.
    * @return {number} The distance between the object and the Pointer.
    */
    distanceToPointer: function (displayObject, pointer) {

        pointer = pointer || this.game.input.activePointer;

        var dx = displayObject.x - pointer.worldX;
        var dy = displayObject.y - pointer.worldY;

        return Math.sqrt(dx * dx + dy * dy);

    },

    /**
    * Find the angle in radians between two display objects (like Sprites).
    *
    * @method Phaser.Physics.Arcade#angleBetween
    * @param {any} source - The Display Object to test from.
    * @param {any} target - The Display Object to test to.
    * @return {number} The angle in radians between the source and target display objects.
    */
    angleBetween: function (source, target) {

        var dx = target.x - source.x;
        var dy = target.y - source.y;

        return Math.atan2(dy, dx);

    },

    /**
    * Find the angle in radians between a display object (like a Sprite) and the given x/y coordinate.
    *
    * @method Phaser.Physics.Arcade#angleToXY
    * @param {any} displayObject - The Display Object to test from.
    * @param {number} x - The x coordinate to get the angle to.
    * @param {number} y - The y coordinate to get the angle to.
    * @return {number} The angle in radians between displayObject.x/y to Pointer.x/y
    */
    angleToXY: function (displayObject, x, y) {

        var dx = x - displayObject.x;
        var dy = y - displayObject.y;

        return Math.atan2(dy, dx);

    },

    /**
    * Find the angle in radians between a display object (like a Sprite) and a Pointer, taking their x/y and center into account.
    *
    * @method Phaser.Physics.Arcade#angleToPointer
    * @param {any} displayObject - The Display Object to test from.
    * @param {Phaser.Pointer} [pointer] - The Phaser.Pointer to test to. If none is given then Input.activePointer is used.
    * @return {number} The angle in radians between displayObject.x/y to Pointer.x/y
    */
    angleToPointer: function (displayObject, pointer) {

        pointer = pointer || this.game.input.activePointer;

        var dx = pointer.worldX - displayObject.x;
        var dy = pointer.worldY - displayObject.y;

        return Math.atan2(dy, dx);

    }

};

/**
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/

/**
* This is the core internal game clock.
*
* It manages the elapsed time and calculation of elapsed values, used for game object motion and tweens,
* and also handles the standard Timer pool.
*
* To create a general timed event, use the master {@link Phaser.Timer} accessible through {@link Phaser.Time.events events}.
*
* There are different *types* of time in Phaser:
*
* - ***Game time*** always runs at the speed of time in real life.
*
*   Unlike wall-clock time, *game time stops when Phaser is paused*.
*
*   Game time is used for {@link Phaser.Timer timer events}.
*
* - ***Physics time*** represents the amount of time given to physics calculations.
*
*   *When {@link #slowMotion} is in effect physics time runs slower than game time.*
*   Like game time, physics time stops when Phaser is paused.
*
*   Physics time is used for physics calculations and {@link Phaser.Tween tweens}.
*
* - {@link https://en.wikipedia.org/wiki/Wall-clock_time ***Wall-clock time***} represents the duration between two events in real life time.
*
*   This time is independent of Phaser and always progresses, regardless of if Phaser is paused.
*
* @class Phaser.Time
* @constructor
* @param {Phaser.Game} game A reference to the currently running game.
*/
Phaser.Time = function (game) {

    /**
    * @property {Phaser.Game} game - Local reference to game.
    * @protected
    */
    this.game = game;

    /**
    * The `Date.now()` value when the time was last updated.
    * @property {integer} time
    * @protected
    */
    this.time = 0;

    /**
    * The `now` when the previous update occurred.
    * @property {number} prevTime
    * @protected
    */
    this.prevTime = 0;

    /**
    * An increasing value representing cumulative milliseconds since an undisclosed epoch.
    *
    * While this value is in milliseconds and can be used to compute time deltas,
    * it must must _not_ be used with `Date.now()` as it may not use the same epoch / starting reference.
    *
    * The source may either be from a high-res source (eg. if RAF is available) or the standard Date.now;
    * the value can only be relied upon within a particular game instance.
    *
    * @property {number} now
    * @protected
    */
    this.now = 0;

    /**
    * Elapsed time since the last time update, in milliseconds, based on `now`.
    *
    * This value _may_ include time that the game is paused/inactive.
    *
    * _Note:_ This is updated only once per game loop - even if multiple logic update steps are done.
    * Use {@link Phaser.Timer#physicsTime physicsTime} as a basis of game/logic calculations instead.
    *
    * @property {number} elapsed
    * @see Phaser.Time.time
    * @protected
    */
    this.elapsed = 0;

    /**
    * The time in ms since the last time update, in milliseconds, based on `time`.
    *
    * This value is corrected for game pauses and will be "about zero" after a game is resumed.
    *
    * _Note:_ This is updated once per game loop - even if multiple logic update steps are done.
    * Use {@link Phaser.Timer#physicsTime physicsTime} as a basis of game/logic calculations instead.
    *
    * @property {integer} elapsedMS
    * @protected
    */
    this.elapsedMS = 0;

    /**
    * The physics update delta, in fractional seconds.
    *
    * This should be used as an applicable multiplier by all logic update steps (eg. `preUpdate/postUpdate/update`)
    * to ensure consistent game timing. Game/logic timing can drift from real-world time if the system
    * is unable to consistently maintain the desired FPS.
    *
    * With fixed-step updates this is normally equivalent to `1.0 / desiredFps`.
    *
    * @property {number} physicsElapsed
    */
    this.physicsElapsed = 1 / 60;

    /**
    * The physics update delta, in milliseconds - equivalent to `physicsElapsed * 1000`.
    *
    * @property {number} physicsElapsedMS
    */
    this.physicsElapsedMS = (1 / 60) * 1000;

    /**
    * The desiredFps multiplier as used by Game.update.
    * @property {integer} desiredFpsMult
    * @protected
    */
    this.desiredFpsMult = 1.0 / 60;

    /**
    * The desired frame rate of the game.
    *
    * This is used is used to calculate the physic/logic multiplier and how to apply catch-up logic updates.
    *
    * @property {number} _desiredFps
    * @private
    * @default
    */
    this._desiredFps = 60;

    /**
    * The suggested frame rate for your game, based on an averaged real frame rate.
    * This value is only populated if `Time.advancedTiming` is enabled.
    *
    * _Note:_ This is not available until after a few frames have passed; until then
    * it's set to the same value as desiredFps.
    *
    * @property {number} suggestedFps
    * @default
    */
    this.suggestedFps = this.desiredFps;

    /**
    * Scaling factor to make the game move smoothly in slow motion
    * - 1.0 = normal speed
    * - 2.0 = half speed
    * @property {number} slowMotion
    * @default
    */
    this.slowMotion = 1.0;

    /**
    * If true then advanced profiling, including the fps rate, fps min/max, suggestedFps and msMin/msMax are updated.
    * @property {boolean} advancedTiming
    * @default
    */
    this.advancedTiming = false;

    /**
    * Advanced timing result: The number of render frames record in the last second.
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * @property {integer} frames
    * @readonly
    */
    this.frames = 0;

    /**
    * Advanced timing result: Frames per second.
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * @property {number} fps
    * @readonly
    */
    this.fps = 0;

    /**
    * Advanced timing result: The lowest rate the fps has dropped to.
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * This value can be manually reset.
    * @property {number} fpsMin
    */
    this.fpsMin = 1000;

    /**
    * Advanced timing result: The highest rate the fps has reached (usually no higher than 60fps).
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * This value can be manually reset.
    * @property {number} fpsMax
    */
    this.fpsMax = 0;

    /**
    * Advanced timing result: The minimum amount of time the game has taken between consecutive frames.
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * This value can be manually reset.
    * @property {number} msMin
    * @default
    */
    this.msMin = 1000;

    /**
    * Advanced timing result: The maximum amount of time the game has taken between consecutive frames.
    *
    * Only calculated if {@link Phaser.Time#advancedTiming advancedTiming} is enabled.
    * This value can be manually reset.
    * @property {number} msMax
    */
    this.msMax = 0;

    /**
    * Records how long the game was last paused, in milliseconds.
    * (This is not updated until the game is resumed.)
    * @property {number} pauseDuration
    */
    this.pauseDuration = 0;

    /**
    * @property {number} timeToCall - The value that setTimeout needs to work out when to next update
    * @protected
    */
    this.timeToCall = 0;

    /**
    * @property {number} timeExpected - The time when the next call is expected when using setTimer to control the update loop
    * @protected
    */
    this.timeExpected = 0;

    /**
    * A {@link Phaser.Timer} object bound to the master clock (this Time object) which events can be added to.
    * @property {Phaser.Timer} events
    */
    this.events = new Phaser.Timer(this.game, false);

    /**
    * @property {number} _frameCount - count the number of calls to time.update since the last suggestedFps was calculated
    * @private
    */
    this._frameCount = 0;

    /**
    * @property {number} _elapsedAcumulator - sum of the elapsed time since the last suggestedFps was calculated
    * @private
    */
    this._elapsedAccumulator = 0;

    /**
    * @property {number} _started - The time at which the Game instance started.
    * @private
    */
    this._started = 0;

    /**
    * @property {number} _timeLastSecond - The time (in ms) that the last second counter ticked over.
    * @private
    */
    this._timeLastSecond = 0;

    /**
    * @property {number} _pauseStarted - The time the game started being paused.
    * @private
    */
    this._pauseStarted = 0;

    /**
    * @property {boolean} _justResumed - Internal value used to recover from the game pause state.
    * @private
    */
    this._justResumed = false;

    /**
    * @property {Phaser.Timer[]} _timers - Internal store of Phaser.Timer objects.
    * @private
    */
    this._timers = [];

};

Phaser.Time.prototype = {

    /**
    * Called automatically by Phaser.Game after boot. Should not be called directly.
    *
    * @method Phaser.Time#boot
    * @protected
    */
    boot: function () {

        this._started = Date.now();
        this.time = Date.now();
        this.events.start();
        this.timeExpected = this.time;

    },

    /**
    * Adds an existing Phaser.Timer object to the Timer pool.
    *
    * @method Phaser.Time#add
    * @param {Phaser.Timer} timer - An existing Phaser.Timer object.
    * @return {Phaser.Timer} The given Phaser.Timer object.
    */
    add: function (timer) {

        this._timers.push(timer);

        return timer;

    },

    /**
    * Creates a new stand-alone Phaser.Timer object.
    *
    * @method Phaser.Time#create
    * @param {boolean} [autoDestroy=true] - A Timer that is set to automatically destroy itself will do so after all of its events have been dispatched (assuming no looping events).
    * @return {Phaser.Timer} The Timer object that was created.
    */
    create: function (autoDestroy) {

        if (autoDestroy === undefined) { autoDestroy = true; }

        var timer = new Phaser.Timer(this.game, autoDestroy);

        this._timers.push(timer);

        return timer;

    },

    /**
    * Remove all Timer objects, regardless of their state and clears all Timers from the {@link Phaser.Time#events events} timer.
    *
    * @method Phaser.Time#removeAll
    */
    removeAll: function () {

        for (var i = 0; i < this._timers.length; i++)
        {
            this._timers[i].destroy();
        }

        this._timers = [];

        this.events.removeAll();

    },

    /**
    * Refreshes the Time.time and Time.elapsedMS properties from the system clock.
    *
    * @method Phaser.Time#refresh
    */
    refresh: function () {

        //  Set to the old Date.now value
        var previousDateNow = this.time;

        // this.time always holds a Date.now value
        this.time = Date.now();

        //  Adjust accordingly.
        this.elapsedMS = this.time - previousDateNow;

    },

    /**
    * Updates the game clock and if enabled the advanced timing data. This is called automatically by Phaser.Game.
    *
    * @method Phaser.Time#update
    * @protected
    * @param {number} time - The current relative timestamp; see {@link Phaser.Time#now now}.
    */
    update: function (time) {

        //  Set to the old Date.now value
        var previousDateNow = this.time;

        // this.time always holds a Date.now value
        this.time = Date.now();

        //  Adjust accordingly.
        this.elapsedMS = this.time - previousDateNow;

        // 'now' is currently still holding the time of the last call, move it into prevTime
        this.prevTime = this.now;

        // update 'now' to hold the current time
        // this.now may hold the RAF high resolution time value if RAF is available (otherwise it also holds Date.now)
        this.now = time;

        // elapsed time between previous call and now - this could be a high resolution value
        this.elapsed = this.now - this.prevTime;

        if (this.game.raf._isSetTimeOut)
        {
            // console.log('Time isSet', this._desiredFps, 'te', this.timeExpected, 'time', time);

            // time to call this function again in ms in case we're using timers instead of RequestAnimationFrame to update the game
            this.timeToCall = Math.floor(Math.max(0, (1000.0 / this._desiredFps) - (this.timeExpected - time)));

            // time when the next call is expected if using timers
            this.timeExpected = time + this.timeToCall;

            // console.log('Time expect', this.timeExpected);
        }

        if (this.advancedTiming)
        {
            this.updateAdvancedTiming();
        }

        //  Paused but still running?
        if (!this.game.paused)
        {
            //  Our internal Phaser.Timer
            this.events.update(this.time);

            if (this._timers.length)
            {
                this.updateTimers();
            }
        }

    },

    /**
    * Handles the updating of the Phaser.Timers (if any)
    * Called automatically by Time.update.
    *
    * @method Phaser.Time#updateTimers
    * @private
    */
    updateTimers: function () {

        //  Any game level timers
        var i = 0;
        var len = this._timers.length;

        while (i < len)
        {
            if (this._timers[i].update(this.time))
            {
                i++;
            }
            else
            {
                //  Timer requests to be removed
                this._timers.splice(i, 1);
                len--;
            }
        }

    },

    /**
    * Handles the updating of the advanced timing values (if enabled)
    * Called automatically by Time.update.
    *
    * @method Phaser.Time#updateAdvancedTiming
    * @private
    */
    updateAdvancedTiming: function () {

        // count the number of time.update calls
        this._frameCount++;
        this._elapsedAccumulator += this.elapsed;

        // occasionally recalculate the suggestedFps based on the accumulated elapsed time
        if (this._frameCount >= this._desiredFps * 2)
        {
            // this formula calculates suggestedFps in multiples of 5 fps
            this.suggestedFps = Math.floor(200 / (this._elapsedAccumulator / this._frameCount)) * 5;
            this._frameCount = 0;
            this._elapsedAccumulator = 0;
        }

        this.msMin = Math.min(this.msMin, this.elapsed);
        this.msMax = Math.max(this.msMax, this.elapsed);

        this.frames++;

        if (this.now > this._timeLastSecond + 1000)
        {
            this.fps = Math.round((this.frames * 1000) / (this.now - this._timeLastSecond));
            this.fpsMin = Math.min(this.fpsMin, this.fps);
            this.fpsMax = Math.max(this.fpsMax, this.fps);
            this._timeLastSecond = this.now;
            this.frames = 0;
        }

    },

    /**
    * Called when the game enters a paused state.
    *
    * @method Phaser.Time#gamePaused
    * @private
    */
    gamePaused: function () {

        this._pauseStarted = Date.now();

        this.events.pause();

        var i = this._timers.length;

        while (i--)
        {
            this._timers[i]._pause();
        }

    },

    /**
    * Called when the game resumes from a paused state.
    *
    * @method Phaser.Time#gameResumed
    * @private
    */
    gameResumed: function () {

        // Set the parameter which stores Date.now() to make sure it's correct on resume
        this.time = Date.now();

        this.pauseDuration = this.time - this._pauseStarted;

        this.events.resume();

        var i = this._timers.length;

        while (i--)
        {
            this._timers[i]._resume();
        }

    },

    /**
    * The number of seconds that have elapsed since the game was started.
    *
    * @method Phaser.Time#totalElapsedSeconds
    * @return {number} The number of seconds that have elapsed since the game was started.
    */
    totalElapsedSeconds: function() {
        return (this.time - this._started) * 0.001;
    },

    /**
    * How long has passed since the given time.
    *
    * @method Phaser.Time#elapsedSince
    * @param {number} since - The time you want to measure against.
    * @return {number} The difference between the given time and now.
    */
    elapsedSince: function (since) {
        return this.time - since;
    },

    /**
    * How long has passed since the given time (in seconds).
    *
    * @method Phaser.Time#elapsedSecondsSince
    * @param {number} since - The time you want to measure (in seconds).
    * @return {number} Duration between given time and now (in seconds).
    */
    elapsedSecondsSince: function (since) {
        return (this.time - since) * 0.001;
    },

    /**
    * Resets the private _started value to now and removes all currently running Timers.
    *
    * @method Phaser.Time#reset
    */
    reset: function () {

        this._started = this.time;
        this.removeAll();

    }

};

/**
* The desired frame rate of the game.
*
* This is used is used to calculate the physic / logic multiplier and how to apply catch-up logic updates.
* 
* @name Phaser.Time#desiredFps
* @property {integer} desiredFps - The desired frame rate of the game. Defaults to 60.
*/
Object.defineProperty(Phaser.Time.prototype, "desiredFps", {

    get: function () {

        return this._desiredFps;

    },

    set: function (value) {

        this._desiredFps = value;

        //  Set the physics elapsed time... this will always be 1 / this.desiredFps 
        //  because we're using fixed time steps in game.update
        this.physicsElapsed = 1 / value;

        this.physicsElapsedMS = this.physicsElapsed * 1000;

        this.desiredFpsMult = 1.0 / value;

    }

});

Phaser.Time.prototype.constructor = Phaser.Time;



modules.export = Phaser;