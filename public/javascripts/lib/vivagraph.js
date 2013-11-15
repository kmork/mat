/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */
var Viva = Viva || {};

Viva.Graph = Viva.Graph || {};
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Viva;
}
Viva.Graph.version = '0.4.1';
/**
 * Extends target object with given fields/values in the options object.
 * Unlike jQuery's extend this method does not override target object
 * properties if their type matches corresponding type in the options object
 */
Viva.lazyExtend = function (target, options) {
    var key;
    if (!target) { target = {}; }
    if (options) {
        for (key in options) {
            if (options.hasOwnProperty(key)) {
                var targetHasIt = target.hasOwnProperty(key),
                    optionsValueType = typeof options[key],
                    shouldReplace = !targetHasIt || (typeof target[key] !== optionsValueType);

                if (shouldReplace) {
                    target[key] = options[key];
                } else if (optionsValueType === 'object') {
                    // go deep, don't care about loops here, we are simple API!:
                    target[key] = Viva.lazyExtend(target[key], options[key]);
                }
            }
        }
    }

    return target;
};
/**
 * Implenetation of seeded pseudo random number generator, based on LFIB4 algorithm.
 *
 * Usage example:
 *  var random = Viva.random('random seed', 'can', 'be', 'multiple strings'),
 *      i = random.next(100); // returns random number from [0 .. 100) range.
 */

Viva.random = function () {
    // From http://baagoe.com/en/RandomMusings/javascript/
    function getMash() {
        var n = 0xefc8249d;

        var mash = function (data) {
            var i;
            data = data.toString();
            for (i = 0; i < data.length; i++) {
                n += data.charCodeAt(i);
                var h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 0x100000000; // 2^32
            }
            return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
        };

        mash.version = 'Mash 0.9';
        return mash;
    }

    function LFIB4(args) {
        return (function (args) {
            // George Marsaglia's LFIB4,
            //http://groups.google.com/group/sci.crypt/msg/eb4ddde782b17051
            var k0 = 0,
                k1 = 58,
                k2 = 119,
                k3 = 178,
                j,
                i,
                s = [],
                mash = getMash();

            if (args.length === 0) {
                args = [+new Date()];
            }

            for (j = 0; j < 256; j++) {
                s[j] = mash(' ');
                s[j] -= mash(' ') * 4.76837158203125e-7; // 2^-21
                if (s[j] < 0) {
                    s[j] += 1;
                }
            }

            for (i = 0; i < args.length; i++) {
                for (j = 0; j < 256; j++) {
                    s[j] -= mash(args[i]);
                    s[j] -= mash(args[i]) * 4.76837158203125e-7; // 2^-21
                    if (s[j] < 0) {
                        s[j] += 1;
                    }
                }
            }

            mash = null;

            var random = function () {
                var x;

                k0 = (k0 + 1) & 255;
                k1 = (k1 + 1) & 255;
                k2 = (k2 + 1) & 255;
                k3 = (k3 + 1) & 255;

                x = s[k0] - s[k1];
                if (x < 0) {
                    x += 1;
                }
                x -= s[k2];
                if (x < 0) {
                    x += 1;
                }
                x -= s[k3];
                if (x < 0) {
                    x += 1;
                }

                s[k0] = x;
                return x;
            };

            random.uint32 = function () {
                return random() * 0x100000000 >>> 0; // 2^32
            };
            random.fract53 = random;
            random.version = 'LFIB4 0.9';
            random.args = args;

            return random;
        }(args));
    }

    var randomFunc = new LFIB4(Array.prototype.slice.call(arguments));

    return {
        /**
         * Generates random integer number in the range from 0 (inclusive) to maxValue (exclusive)
         *
         * @param maxValue is REQUIRED. Ommitit this numbe will result in NaN values from PRNG.
         */
        next : function (maxValue) {
            return Math.floor(randomFunc() * maxValue);
        },

        /**
         * Generates random double number in the range from 0 (inclusive) to 1 (exclusive)
         * This function is the same as Math.random() (except that it could be seeded)
         */
        nextDouble : function () {
            return randomFunc();
        }
    };
};

/**
 * Iterates over array in arbitrary order. The iterator modifies actual array content.
 * It's based on modern version of Fisher–Yates shuffle algorithm.
 *
 * @see http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 *
 * @param array to be shuffled
 * @param random - a [seeded] random number generator to produce same sequences. This parameter
 * is optional. If you don't need determenistic randomness keep it blank.
 */
Viva.randomIterator = function (array, random) {
    random = random || Viva.random();

    return {
        forEach : function (callback) {
            var i, j, t;
            for (i = array.length - 1; i > 0; --i) {
                j = random.next(i + 1); // i inclusive
                t = array[j];
                array[j] = array[i];
                array[i] = t;

                callback(t);
            }

            if (array.length) {
                callback(array[0]);
            }
        },

        /**
         * Shuffles array randomly.
         */
        shuffle : function () {
            var i, j, t;
            for (i = array.length - 1; i > 0; --i) {
                j = random.next(i + 1); // i inclusive
                t = array[j];
                array[j] = array[i];
                array[i] = t;
            }

            return array;
        }
    };
};
Viva.BrowserInfo = (function () {
    if (typeof window === "undefined" || !window.hasOwnProperty("navigator")) {
        return {
            browser : "",
            version : "0"
        };
    }

    var ua = window.navigator.userAgent.toLowerCase(),
    // Useragent RegExp
        rwebkit = /(webkit)[ \/]([\w.]+)/,
        ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
        rmsie = /(msie) ([\w.]+)/,
        rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
        match = rwebkit.exec(ua) ||
            ropera.exec(ua) ||
            rmsie.exec(ua) ||
            (ua.indexOf("compatible") < 0 && rmozilla.exec(ua)) ||
            [];

    return {
        browser: match[1] || "",
        version: match[2] || "0"
    };
}());
/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.Utils = Viva.Graph.Utils || {};

Viva.Graph.Utils.indexOfElementInArray = function (element, array) {
    if (array.indexOf) {
        return array.indexOf(element);
    }

    var len = array.length,
        i;

    for (i = 0; i < len; i += 1) {
        if (array.hasOwnProperty(i) && (array[i] === element)) {
            return i;
        }
    }

    return -1;
};
Viva.Graph.Utils = Viva.Graph.Utils || {};

Viva.Graph.Utils.getDimension = function (container) {
    if (!container) {
        throw {
            message : 'Cannot get dimensions of undefined container'
        };
    }

    // TODO: Potential cross browser bug.
    var width = container.clientWidth;
    var height = container.clientHeight;

    return {
        left : 0,
        top : 0,
        width : width,
        height : height
    };
};

/**
 * Finds the absolute position of an element on a page
 */
Viva.Graph.Utils.findElementPosition = function (obj) {
    var curleft = 0,
        curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while ((obj = obj.offsetParent) !== null);
    }

    return [curleft, curtop];
};/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.Utils = Viva.Graph.Utils || {};

// TODO: I don't really like the way I implemented events. It looks clumsy and
// hard to understand. Refactor it.

// TODO: This is really painful. Please don't use this class anymore, I will
// definitely depricate it or update its interface.

/**
 * Allows to start/stop listen to element's events. An element can be arbitrary
 * DOM element, or object with eventuality behavior.
 *
 * To add eventuality behavior to arbitrary object 'obj' call
 * Viva.Graph.Utils.event(obj).extend() method.
 * After this call is made the object can use obj.fire(eventName, params) method, and listeners
 * can listen to event by Viva.Graph.Utils.events(obj).on(eventName, callback) method.
 */
Viva.Graph.Utils.events = function (element) {

    /**
     * Extends arbitrary object with fire method and allows it to be used with on/stop methods.
     *
     * This behavior is based on Crockford's eventuality example, but with a minor changes:
     *   - fire() method accepts parameters to pass to callbacks (instead of setting them in 'on' method)
     *   - on() method is replaced with addEventListener(), to let objects be used as a DOM objects.
     *   - behavoir contract is simplified to "string as event name"/"function as callback" convention.
     *   - removeEventListener() method added to let unsubscribe from events.
     */
    var eventuality = function (that) {
        var registry = {};

        /**
         * Fire an event on an object. The event is a string containing the name of the event
         * Handlers registered by the 'addEventListener' method that match the event name
         * will be invoked.
         */
        that.fire = function (eventName, parameters) {
            var registeredHandlers,
                callback,
                handler,
                i;

            if (typeof eventName !== "string") {
                throw "Only strings can be used as even type";
            }

            // If an array of handlers exist for this event, then
            // loop through it and execute the handlers in order.
            if (registry.hasOwnProperty(eventName)) {
                registeredHandlers = registry[eventName];
                for (i = 0; i < registeredHandlers.length; ++i) {
                    handler = registeredHandlers[i];
                    callback = handler.method;
                    callback(parameters);
                }
            }

            return this;
        };

        that.addEventListener = function (eventName, callback) {
            if (typeof callback !== "function") {
                throw "Only functions allowed to be callbacks";
            }

            var handler = {
                method: callback
            };
            if (registry.hasOwnProperty(eventName)) {
                registry[eventName].push(handler);
            } else {
                registry[eventName] = [handler];
            }

            return this;
        };

        that.removeEventListener = function (eventName, callback) {
            if (typeof callback !== "function") {
                throw "Only functions allowed to be callbacks";
            }

            if (registry.hasOwnProperty(eventName)) {
                var handlers = registry[eventName],
                    i;

                for (i = 0; i < handlers.length; ++i) {
                    if (handlers[i].callback === callback) {
                        handlers.splice(i);
                        break;
                    }
                }
            }

            return this;
        };

        that.removeAllListeners = function () {
            var eventName;
            for (eventName in registry) {
                if (registry.hasOwnProperty(eventName)) {
                    delete registry[eventName];
                }
            }
        };

        return that;
    };

    return {
        /**
         * Registes callback to be called when element fires event with given event name.
         */
        on : function (eventName, callback) {
            if (element.addEventListener) {// W3C DOM and eventuality objecets.
                element.addEventListener(eventName, callback, false);
            } else if (element.attachEvent) { // IE DOM
                element.attachEvent("on" + eventName, callback);
            }

            return this;
        },

        /**
         * Unsubcribes from object's events.
         */
        stop : function (eventName, callback) {
            if (element.removeEventListener) {
                element.removeEventListener(eventName, callback, false);
            } else if (element.detachEvent) {
                element.detachEvent("on" + eventName, callback);
            }
        },

        /**
         * Adds eventuality to arbitrary JavaScript object. Eventuality adds
         * fire(), addEventListner() and removeEventListners() to the target object.
         *
         * This is required if you want to use object with on(), stop() methods.
         */
        extend : function () {
            return eventuality(element);
        }
    };
};/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.Utils = Viva.Graph.Utils || {};

// TODO: Move to input namespace
// TODO: Methods should be extracted into the prototype. This class
// does not need to consume so much memory for every tracked element
Viva.Graph.Utils.dragndrop = function (element) {
    var start,
        drag,
        end,
        click,
        scroll,
        prevSelectStart,
        prevDragStart,
        documentEvents = Viva.Graph.Utils.events(window.document),
        elementEvents = Viva.Graph.Utils.events(element),
        findElementPosition = Viva.Graph.Utils.findElementPosition,

        startX = 0,
        startY = 0,
        dragObject,
        touchInProgress = false,
        pinchZoomLength = 0,

        getMousePos = function (e) {
            var posx = 0,
                posy = 0;

            e = e || window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + window.document.body.scrollLeft + window.document.documentElement.scrollLeft;
                posy = e.clientY + window.document.body.scrollTop + window.document.documentElement.scrollTop;
            }

            return [posx, posy];
        },

        move = function (e, clientX, clientY) {
            if (drag) {
                drag(e, {x : clientX - startX, y : clientY - startY });
            }

            startX = clientX;
            startY = clientY;
        },

        stopPropagation = function (e) {
            if (e.stopPropagation) { e.stopPropagation(); } else { e.cancelBubble = true; }
        },
        preventDefault = function (e) {
            if (e.preventDefault) { e.preventDefault(); }
        },

        handleDisabledEvent = function (e) {
            stopPropagation(e);
            return false;
        },

        handleMouseMove = function (e) {
            e = e || window.event;

            move(e, e.clientX, e.clientY);
        },

        handleTap = function (e) {
            if (this.nodeName === 'g') {
                if (click) { click(element.id); }
            }
        },

        handleMouseDown = function (e) {
            e = e || window.event;
            if (touchInProgress) {
                // modern browsers will fire mousedown for touch events too
                // we do not want this, since touch is handled separately.
                stopPropagation(e);
                return false;
            }
            // for IE, left click == 1
            // for Firefox, left click == 0
            var isLeftButton = ((e.button === 1 && window.event !== null) || e.button === 0);

            if (isLeftButton) {
                startX = e.clientX;
                startY = e.clientY;

                // TODO: bump zIndex?
                dragObject = e.target || e.srcElement;

                if (start) { start(e, {x: startX, y : startY}); }

                documentEvents.on('mousemove', handleMouseMove);
                documentEvents.on('mouseup', handleMouseUp);


                stopPropagation(e);
                // TODO: What if event already there? Not bullet proof:
                prevSelectStart = window.document.onselectstart;
                prevDragStart = window.document.ondragstart;

                window.document.onselectstart = handleDisabledEvent;
                dragObject.ondragstart = handleDisabledEvent;

                // prevent text selection (except IE)
                return false;
            }
        },

        handleMouseUp = function (e) {
            e = e || window.event;

            documentEvents.stop('mousemove', handleMouseMove);
            documentEvents.stop('mouseup', handleMouseUp);

            window.document.onselectstart = prevSelectStart;
            dragObject.ondragstart = prevDragStart;
            dragObject = null;
            if (end) { end(e); }
        },

        handleMouseWheel = function (e) {
            if (typeof scroll !== 'function') {
                return;
            }

            e = e || window.event;
            if (e.preventDefault) {
                e.preventDefault();
            }

            e.returnValue = false;
            var delta,
                mousePos = getMousePos(e),
                elementOffset = findElementPosition(element),
                relMousePos = {
                    x: mousePos[0] - elementOffset[0],
                    y: mousePos[1] - elementOffset[1]
                };

            if (e.wheelDelta) {
                delta = e.wheelDelta / 360; // Chrome/Safari
            } else {
                delta = e.detail / -9; // Mozilla
            }

            scroll(e, delta, relMousePos);
        },

        updateScrollEvents = function (scrollCallback) {
            if (!scroll && scrollCallback) {
                // client is interested in scrolling. Start listening to events:
                if (Viva.BrowserInfo.browser === 'webkit') {
                    element.addEventListener('mousewheel', handleMouseWheel, false); // Chrome/Safari
                } else {
                    element.addEventListener('DOMMouseScroll', handleMouseWheel, false); // Others
                }
            } else if (scroll && !scrollCallback) {
                if (Viva.BrowserInfo.browser === 'webkit') {
                    element.removeEventListener('mousewheel', handleMouseWheel, false); // Chrome/Safari
                } else {
                    element.removeEventListener('DOMMouseScroll', handleMouseWheel, false); // Others
                }
            }

            scroll = scrollCallback;
        },

        getPinchZoomLength = function(finger1, finger2) {
            return (finger1.clientX - finger2.clientX) * (finger1.clientX - finger2.clientX) +
                (finger1.clientY - finger2.clientY) * (finger1.clientY - finger2.clientY);
        },

        handleTouchMove = function (e) {
            if (e.touches.length === 1) {
                stopPropagation(e);

                var touch = e.touches[0];
                move(e, touch.clientX, touch.clientY);
            } else if (e.touches.length === 2) {
                // it's a zoom:
                var currentPinchLength = getPinchZoomLength(e.touches[0], e.touches[1]);
                var delta = 0;
                if (currentPinchLength < pinchZoomLength) {
                    delta = -1;
                } else if (currentPinchLength > pinchZoomLength) {
                    delta = 1;
                }
                scroll(e, delta, {x: e.touches[0].clientX, y: e.touches[0].clientY});
                pinchZoomLength = currentPinchLength;
                stopPropagation(e);
                preventDefault(e);
            }
        },

        handleTouchEnd = function (e) {
            touchInProgress = false;
            documentEvents.stop('touchmove', handleTouchMove);
            documentEvents.stop('touchend', handleTouchEnd);
            documentEvents.stop('touchcancel', handleTouchEnd);
            dragObject = null;
            if (end) { end(e); }
        },

        handleSignleFingerTouch = function (e, touch) {
            stopPropagation(e);
            preventDefault(e);

            startX = touch.clientX;
            startY = touch.clientY;

            dragObject = e.target || e.srcElement;

            if (start) { start(e, {x: startX, y : startY}); }
            // TODO: can I enter into the state when touch is in progress
            // but it's still a single finger touch?
            if (!touchInProgress) {
                touchInProgress = true;
                documentEvents.on('touchmove', handleTouchMove);
                documentEvents.on('touchend', handleTouchEnd);
                documentEvents.on('touchcancel', handleTouchEnd);
            }
        },

        handleTouchStart = function (e) {
            console.log('Touch start for ', element);
            if (e.touches.length === 1) {
                return handleSignleFingerTouch(e, e.touches[0]);
            } else if (e.touches.length === 2) {
                // handleTouchMove() will care about pinch zoom.
                stopPropagation(e);
                preventDefault(e);

                pinchZoomLength = getPinchZoomLength(e.touches[0], e.touches[1]);

            }
            // don't care about the rest.
        };


    elementEvents.on('mousedown', handleMouseDown);
    elementEvents.on('touchstart', handleTouchStart);
    elementEvents.on('click', handleTap);

    return {
        onStart : function (callback) {
            start = callback;
            return this;
        },

        onDrag : function (callback) {
            drag = callback;
            return this;
        },

        onStop : function (callback) {
            end = callback;
            return this;
        },

        onClick : function (callback) {
            click = callback;
            return this;
        },

        /**
         * Occurs when mouse wheel event happens. callback = function(e, scrollDelta, scrollPoint);
         */
        onScroll : function (callback) {
            updateScrollEvents(callback);
            return this;
        },

        release : function () {
            // TODO: could be unsafe. We might wanna release dragObject, etc.
            documentEvents.stop('mousemove', handleMouseMove);
            documentEvents.stop('mousedown', handleMouseDown);
            documentEvents.stop('mouseup', handleMouseUp);
            documentEvents.stop('click', handleTap);
            documentEvents.stop('touchmove', handleTouchMove);
            documentEvents.stop('touchend', handleTouchEnd);
            documentEvents.stop('touchcancel', handleTouchEnd);

            updateScrollEvents(null);
        }
    };
};
/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Input = Viva.Input || {};
Viva.Input.domInputManager = function () {
    return {
        /**
         * Called by renderer to listen to drag-n-drop events from node. E.g. for CSS/SVG
         * graphics we may listen to DOM events, whereas for WebGL the graphics
         * should provide custom eventing mechanism.
         *
         * @param node - to be monitored.
         * @param handlers - object with set of three callbacks:
         *   onStart: function(),
         *   onDrag: function(e, offset),
         *   onStop: function()
         */
        bindDragNDrop : function (node, handlers) {
            if (handlers) {
                var events = Viva.Graph.Utils.dragndrop(node.ui);
                if (typeof handlers.onStart === 'function') {
                    events.onStart(handlers.onStart);
                }
                if (typeof handlers.onDrag === 'function') {
                    events.onDrag(handlers.onDrag);
                }
                if (typeof handlers.onStop === 'function') {
                    events.onStop(handlers.onStop);
                }
                if (typeof handlers.onClick === 'function') {
                    events.onClick(handlers.onClick);
                }

                node.events = events;
            } else if (node.events) {
                // TODO: i'm not sure if this is required in JS world...
                node.events.release();
                node.events = null;
                delete node.events;
            }
        }
    };
};
/**
 * Allows querying graph nodes position at given point.
 *
 * @param graph - graph to be queried.
 * @param toleranceOrCheckCallback - if it's a number then it represents offest
 *          in pixels from any node position to be considered a part of the node.
 *          if it's a function then it's called for every node to check intersection
 *
 * TODO: currently it performes linear search. Use real spatial index to improve performance.
 */
Viva.Graph.spatialIndex = function (graph, toleranceOrCheckCallback) {
    var getNodeFunction,
        preciseCheckCallback,
        tolerance = 16;

    if (typeof toleranceOrCheckCallback === 'function') {
        preciseCheckCallback = toleranceOrCheckCallback;
        getNodeFunction = function (x, y) {
            var foundNode = null;
            graph.forEachNode(function (node) {
                if (preciseCheckCallback(node, x, y)) {
                    foundNode = node;
                    return true;
                }
            });

            return foundNode;
        };
    } else if (typeof toleranceOrCheckCallback === 'number') {
        tolerance = toleranceOrCheckCallback;
        getNodeFunction = function (x, y) {
            var foundNode = null;

            graph.forEachNode(function (node) {
                var pos = node.position;

                if (pos.x - tolerance < x && x < pos.x + tolerance &&
                    pos.y - tolerance < y && y < pos.y + tolerance) {

                    foundNode = node;
                    return true;
                }
            });

            return foundNode;
        };
    }


    return {
        getNodeAt : getNodeFunction
    };
};
/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.Utils = Viva.Graph.Utils || {};

(function () {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        i,
        scope;

    if (typeof window !== 'undefined') {
        scope = window;
    } else if (typeof global !== 'undefined') {
        scope = global;
    } else {
        scope = {
            setTimeout: function () {},
            clearTimeout: function () {}
        };
    }
    for (i = 0; i < vendors.length && !scope.requestAnimationFrame; ++i) {
        var vendorPrefix = vendors[i];
        scope.requestAnimationFrame = scope[vendorPrefix + 'RequestAnimationFrame'];
        scope.cancelAnimationFrame =
            scope[vendorPrefix + 'CancelAnimationFrame'] || scope[vendorPrefix + 'CancelRequestAnimationFrame'];
    }

    if (!scope.requestAnimationFrame) {
        scope.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = scope.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!scope.cancelAnimationFrame) {
        scope.cancelAnimationFrame = function (id) {
            scope.clearTimeout(id);
        };
    }

    /**
     * Timer that fires callback with given interval (in ms) until
     * callback returns true;
     */
    Viva.Graph.Utils.timer = function (callback) {
        var intervalId,
            stopTimer = function () {
                scope.cancelAnimationFrame(intervalId);
                intervalId = 0;
            },

            startTimer = function () {
                intervalId = scope.requestAnimationFrame(startTimer);
                if (!callback()) {
                    stopTimer();
                }
            };

        startTimer(); // start it right away.

        return {
            /**
             * Stops execution of the callback
             */
            stop: stopTimer,

            restart : function () {
                if (!intervalId) {
                    startTimer();
                }
            }
        };
    };
}());Viva.Graph.geom = function () {

    return {
        // function from Graphics GEM to determine lines intersection:
        // http://www.opensource.apple.com/source/graphviz/graphviz-498/graphviz/dynagraph/common/xlines.c
        intersect : function (x1, y1, x2, y2, // first line segment
                              x3, y3, x4, y4) { // second line segment
            var a1, a2, b1, b2, c1, c2, /* Coefficients of line eqns. */
                r1, r2, r3, r4,         /* 'Sign' values */
                denom, offset, num,     /* Intermediate values */
                result = { x: 0, y : 0};

            /* Compute a1, b1, c1, where line joining points 1 and 2
             * is "a1 x  +  b1 y  +  c1  =  0".
             */
            a1 = y2 - y1;
            b1 = x1 - x2;
            c1 = x2 * y1 - x1 * y2;

            /* Compute r3 and r4.
             */
            r3 = a1 * x3 + b1 * y3 + c1;
            r4 = a1 * x4 + b1 * y4 + c1;

            /* Check signs of r3 and r4.  If both point 3 and point 4 lie on
             * same side of line 1, the line segments do not intersect.
             */

            if (r3 !== 0 && r4 !== 0 && ((r3 >= 0) === (r4 >= 4))) {
                return null; //no itersection.
            }

            /* Compute a2, b2, c2 */
            a2 = y4 - y3;
            b2 = x3 - x4;
            c2 = x4 * y3 - x3 * y4;

            /* Compute r1 and r2 */

            r1 = a2 * x1 + b2 * y1 + c2;
            r2 = a2 * x2 + b2 * y2 + c2;

            /* Check signs of r1 and r2.  If both point 1 and point 2 lie
             * on same side of second line segment, the line segments do
             * not intersect.
             */
            if (r1 !== 0 && r2 !== 0 && ((r1 >= 0) === (r2 >= 0))) {
                return null; // no intersection;
            }
            /* Line segments intersect: compute intersection point.
             */

            denom = a1 * b2 - a2 * b1;
            if (denom === 0) {
                return null; // Actually collinear..
            }

            offset = denom < 0 ? -denom / 2 : denom / 2;
            offset = 0.0;

            /* The denom/2 is to get rounding instead of truncating.  It
             * is added or subtracted to the numerator, depending upon the
             * sign of the numerator.
             */


            num = b1 * c2 - b2 * c1;
            result.x = (num < 0 ? num - offset : num + offset) / denom;

            num = a2 * c1 - a1 * c2;
            result.y = (num < 0 ? num - offset : num + offset) / denom;

            return result;
        },

        /**
         * Returns intersection point of the rectangle defined by
         * left, top, right, bottom and a line starting in x1, y1
         * and ending in x2, y2;
         */
        intersectRect : function (left, top, right, bottom, x1, y1, x2, y2) {
            return this.intersect(left, top, left, bottom, x1, y1, x2, y2) ||
                this.intersect(left, bottom, right, bottom, x1, y1, x2, y2) ||
                this.intersect(right, bottom, right, top, x1, y1, x2, y2) ||
                this.intersect(right, top, left, top, x1, y1, x2, y2);
        },

        convexHull : function (points) {
            var polarAngleSort = function (basePoint, points) {
                    var cosAngle = function (p) {
                            var dx = p.x - basePoint.x,
                                dy = p.y - basePoint.y,
                                sign = dx > 0 ? 1 : -1;

                            // We use squared dx, to avoid Sqrt opertion and improve performance.
                            // To avoid sign loss during dx * dx operation we precompute its sign:
                            return sign * dx * dx / (dx * dx + dy * dy);
                        },

                        sortedPoints = points.sort(function (p1, p2) {
                            return cosAngle(p2) - cosAngle(p1);
                        }),

                    // If more than one point has the same angle, remove all but the one that is farthest from basePoint:
                        lastPoint = sortedPoints[0],
                        lastAngle = cosAngle(lastPoint),
                        dx = lastPoint.x - basePoint.x,
                        dy = lastPoint.y - basePoint.y,
                        lastDistance = dx * dx + dy * dy,
                        curDistance,
                        i;

                    for (i = 1; i < sortedPoints.length; ++i) {
                        lastPoint = sortedPoints[i];
                        var angle = cosAngle(lastPoint);
                        if (angle === lastAngle) {
                            dx = lastPoint.x - basePoint.x;
                            dy = lastPoint.y - basePoint.y;
                            curDistance = dx * dx + dy * dy;

                            if (curDistance < lastDistance) {
                                sortedPoints.splice(i, 1);
                            } else {
                                sortedPoints.splice(i - 1, 1);
                            }
                        } else {
                            lastAngle = angle;
                        }
                    }

                    return sortedPoints;
                },

                /**
                 * Returns true if angle formed by points p0, p1, p2 makes left turn.
                 * (counterclockwise)
                 */
                    ccw = function (p0, p1, p2) {
                    return ((p2.x - p0.x) * (p1.y - p0.y) - (p2.y - p0.y) * (p1.x - p0.x)) < 0;
                };

            if (points.length < 3) {
                return points; // This one is easy... Not precise, but should be enough for now.
            }

            // let p0 be the point in Q with the minimum y-coordinate, or the leftmost
            // such point in case of a tie
            var p0Idx = 0,
                i;
            for (i = 0; i < points.length; ++i) {
                if (points[i].y < points[p0Idx].y) {
                    p0Idx = i;
                } else if (points[i].y === points[p0Idx].y && points[i].x < points[p0Idx].x) {
                    p0Idx = i;
                }
            }

            var p0 = points[p0Idx];
            // let <p1; p2; ... pm> be the remaining points
            points.splice(p0Idx, 1);
            // sorted by polar angle in counterclockwise order around p0
            var sortedPoints = polarAngleSort(p0, points);
            if (sortedPoints.length < 2) {
                return sortedPoints;
            }

            // let S be empty stack
            var s = [];
            s.push(p0);
            s.push(sortedPoints[0]);
            s.push(sortedPoints[1]);
            var sLength = s.length;
            for (i = 2; i < sortedPoints.length; ++i) {
                while (!ccw(s[sLength - 2], s[sLength - 1], sortedPoints[i])) {
                    s.pop();
                    sLength -= 1;
                }

                s.push(sortedPoints[i]);
                sLength += 1;
            }

            return s;
        }
    };
};/**
 * Very generic rectangle.
 */
Viva.Graph.Rect = function (x1, y1, x2, y2) {
    this.x1 = x1 || 0;
    this.y1 = y1 || 0;
    this.x2 = x2 || 0;
    this.y2 = y2 || 0;
};

/**
 * Very generic two-dimensional point.
 */
Viva.Graph.Point2d = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

/**
 * Internal structure to represent node;
 */
Viva.Graph.Node = function (id) {
    this.id = id;
    this.links = [];
    this.data = null;
};

/**
 * Internal structure to represent links;
 */
Viva.Graph.Link = function (fromId, toId, data) {
    this.fromId = fromId;
    this.toId = toId;
    this.data = data;
};/**
 * @fileOverview Contains definition of the core graph object.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

/**
 * @namespace Represents a graph data structure.
 *
 * @example
 *  var g = Viva.Graph.graph();
 *  g.addNode(1);     // g has one node.
 *  g.addLink(2, 3);  // now g contains three nodes and one link.
 *
 */
Viva.Graph.graph = function () {

    // Graph structure is maintained as dictionary of nodes
    // and array of links. Each node has 'links' property which
    // hold all links related to that node. And general links
    // array is used to speed up all links enumeration. This is inefficient
    // in terms of memory, but simplifies coding. Furthermore, the graph structure
    // is isolated from outter world, and can be changed to adjacency matrix later.

    var nodes = {},
        links = [],
        nodesCount = 0,
        suspendEvents = 0,
        selectedNodes = {},

    // Accumlates all changes made during graph updates.
    // Each change element contains:
    //  changeType - one of the strings: 'add', 'remove' or 'update';
    //  node - if change is related to node this property is set to changed graph's node;
    //  link - if change is related to link this property is set to changed graph's link;
        changes = [],

        fireGraphChanged = function (graph) {
            // TODO: maybe we shall copy changes?
            graph.fire('changed', changes);
        },

    // Enter, Exit Mofidication allows bulk graph updates without firing events.
        enterModification = function () {
            suspendEvents += 1;
        },

        exitModification = function (graph) {
            suspendEvents -= 1;
            if (suspendEvents === 0 && changes.length > 0) {
                fireGraphChanged(graph);
                changes.length = 0;
            }
        },

        recordNodeChange = function (node, changeType) {
            // TODO: Could add changeType verification.
            changes.push({node : node, changeType : changeType});
        },

        recordLinkChange = function (link, changeType) {
            // TODO: Could add change type verification;
            changes.push({link : link, changeType : changeType});
        },

        isArray = function (value) {
            return value &&
                typeof value === 'object' &&
                typeof value.length === 'number' &&
                typeof value.splice === 'function' &&
                !(value.propertyIsEnumerable('length'));
        };

    /** @scope Viva.Graph.graph */
    var graphPart = {

        /**
         * Adds node to the graph. If node with given id already exists in the graph
         * its data is extended with whatever comes in 'data' argument.
         *
         * @param nodeId the node's identifier. A string is preferred.
         * @param [data] additional data for the node being added. If node already
         *   exists its data object is augmented with the new one.
         *
         * @return {node} The newly added node or node with given id if it already exists.
         */
        addNode : function (nodeId, data) {
            if (typeof nodeId === 'undefined') {
                throw {
                    message: 'Invalid node identifier'
                };
            }

            enterModification();

            var node = this.getNode(nodeId);
            if (!node) {
                node = new Viva.Graph.Node(nodeId);
                nodesCount++;

                recordNodeChange(node, 'add');
            } else {
                recordNodeChange(node, 'update');
            }

            if (data) {
                var augmentedData = node.data || {},
                    dataType = typeof data,
                    name;

                if (dataType === 'string' || isArray(data) ||
                    dataType === 'number' || dataType === 'boolean') {
                    augmentedData = data;
                } else if (dataType === 'undefined') {
                    augmentedData = null;
                } else {
                    for (name in data) {
                        if (data.hasOwnProperty(name)) {
                            augmentedData[name] = data[name];
                        }
                    }
                }

                node.data = augmentedData;
            }

            nodes[nodeId] = node;

            exitModification(this);
            return node;
        },

        /**
         * Adds a link to the graph. The function always create a new
         * link between two nodes. If one of the nodes does not exists
         * a new node is created.
         *
         * @param fromId link start node id;
         * @param toId link end node id;
         * @param [data] additional data to be set on the new link;
         *
         * @return {link} The newly created link
         */
        addLink : function (fromId, toId, data) {
            enterModification();

            var fromNode = this.getNode(fromId) || this.addNode(fromId);
            var toNode = this.getNode(toId) || this.addNode(toId);

            var link = new Viva.Graph.Link(fromId, toId, data);

            links.push(link);

            // TODO: this is not cool. On large graphs potentially would consume more memory.
            fromNode.links.push(link);
            toNode.links.push(link);

            recordLinkChange(link, 'add');

            exitModification(this);

            return link;
        },

        /**
         * Removes link from the graph. If link does not exist does nothing.
         *
         * @param link - object returned by addLink() or getLinks() methods.
         *
         * @returns true if link was removed; false otherwise.
         */
        removeLink : function (link) {
            if (!link) { return false; }
            var idx = Viva.Graph.Utils.indexOfElementInArray(link, links);
            if (idx < 0) { return false; }

            enterModification();

            links.splice(idx, 1);

            var fromNode = this.getNode(link.fromId);
            var toNode = this.getNode(link.toId);

            if (fromNode) {
                idx = Viva.Graph.Utils.indexOfElementInArray(link, fromNode.links);
                if (idx >= 0) {
                    fromNode.links.splice(idx, 1);
                }
            }

            if (toNode) {
                idx = Viva.Graph.Utils.indexOfElementInArray(link, toNode.links);
                if (idx >= 0) {
                    toNode.links.splice(idx, 1);
                }
            }

            recordLinkChange(link, 'remove');

            exitModification(this);

            return true;
        },

        /**
         * Removes node with given id from the graph. If node does not exist in the graph
         * does nothing.
         *
         * @param nodeId node's identifier passed to addNode() function.
         *
         * @returns true if node was removed; false otherwise.
         */
        removeNode: function (nodeId) {
            var node = this.getNode(nodeId);
            if (!node) { return false; }

            enterModification();

            while (node.links.length) {
                var link = node.links[0];
                this.removeLink(link);
            }

            nodes[nodeId] = null;
            delete nodes[nodeId];
            nodesCount--;

            recordNodeChange(node, 'remove');

            exitModification(this);
        },

        /**
         * Gets node with given identifier. If node does not exist undefined value is returned.
         *
         * @param nodeId requested node identifier;
         *
         * @return {node} in with requested identifier or undefined if no such node exists.
         */
        getNode : function (nodeId) {
            return nodes[nodeId];
        },

        /**
         * Gets number of nodes in this graph.
         *
         * @return number of nodes in the graph.
         */
        getNodesCount : function () {
            return nodesCount;
        },

        /**
         * Gets total number of links in the graph.
         */
        getLinksCount : function () {
            return links.length;
        },

        /**
         * Gets all links (inbound and outbound) from the node with given id.
         * If node with given id is not found null is returned.
         *
         * @param nodeId requested node identifier.
         *
         * @return Array of links from and to requested node if such node exists;
         *   otherwise null is returned.
         */
        getLinks : function (nodeId) {
            var node = this.getNode(nodeId);
            return node ? node.links : null;
        },

        /**
         * Invokes callback on each node of the graph.
         *
         * @param {Function(node)} callback Function to be invoked. The function
         *   is passed one argument: visited node.
         */
        forEachNode : function (callback) {
            if (typeof callback !== 'function') {
                return;
            }
            var node;

            // TODO: could it be faster for nodes iteration if we had indexed access?
            // I.e. use array + 'for' iterator instead of dictionary + 'for .. in'?
            for (node in nodes) {
                // For performance reasons you might want to sacrifice this sanity check:
                if (nodes.hasOwnProperty(node)) {
                    if (callback(nodes[node])) {
                        return; // client doesn't want to proceed. return.
                    }
                }
            }
        },

        /**
         * Invokes callback on every linked (adjacent) node to the given one.
         *
         * @param nodeId Identifier of the requested node.
         * @param {Function(node, link)} callback Function to be called on all linked nodes.
         *   The function is passed two parameters: adjacent node and link object itself.
         * @param oriented if true graph treated as oriented.
         */
        forEachLinkedNode : function (nodeId, callback, oriented) {
            var node = this.getNode(nodeId),
                i,
                link,
                linkedNodeId;

            if (node && node.links && typeof callback === 'function') {
                // Extraced orientation check out of the loop to increase performance
                if (oriented) {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        if (link.fromId === nodeId) {
                            callback(nodes[link.toId], link);
                        }
                    }
                } else {
                    for (i = 0; i < node.links.length; ++i) {
                        link = node.links[i];
                        linkedNodeId = link.fromId === nodeId ? link.toId : link.fromId;

                        callback(nodes[linkedNodeId], link);
                    }
                }
            }
        },

        /**
         * Enumerates all links in the graph
         *
         * @param {Function(link)} callback Function to be called on all links in the graph.
         *   The function is passed one parameter: graph's link object.
         *
         * Link object contains at least the following fields:
         *  fromId - node id where link starts;
         *  toId - node id where link ends,
         *  data - additional data passed to graph.addLink() method.
         */
        forEachLink : function (callback) {
            var i;
            if (typeof callback === 'function') {
                for (i = 0; i < links.length; ++i) {
                    callback(links[i]);
                }
            }
        },

        /**
         * Suspend all notifications about graph changes until
         * endUpdate is called.
         */
        beginUpdate : function () {
            enterModification();
        },

        /**
         * Resumes all notifications about graph changes and fires
         * graph 'changed' event in case there are any pending changes.
         */
        endUpdate : function () {
            exitModification(this);
        },

        /**
         * Removes all nodes and links from the graph.
         */
        clear : function () {
            var that = this;
            that.beginUpdate();
            that.forEachNode(function (node) { that.removeNode(node.id); });
            that.endUpdate();
        },

        /**
         * Detects whether there is a link between two nodes.
         * Operation complexity is O(n) where n - number of links of a node.
         *
         * @returns link if there is one. null otherwise.
         */
        hasLink : function (fromNodeId, toNodeId) {
            // TODO: Use adjacency matrix to speed up this operation.
            var node = this.getNode(fromNodeId),
                i;
            if (!node) {
                return null;
            }

            for (i = 0; i < node.links.length; ++i) {
                var link = node.links[i];
                if (link.fromId === fromNodeId && link.toId === toNodeId) {
                    return link;
                }
            }

            return null; // no link.
        },
        toggleSelectedNode : function (id) {
            selectedNodes[id] = !selectedNodes[id];
            return selectedNodes[id];
        },
        // Returns an array of the selected node ids only
        selectedNodes : function () {
            return $.map(selectedNodes, function(value, key) {
                if (value) {
                    return key;
                } else {
                    return null;
                }
            });
        },
        clearSelected : function () {
            selectedNodes = {};
            for (node in nodes) {
                nodes[node].svgImg.attr("style", "fill:white");
            };
        }

    };

    // Let graph fire events before we return it to the caller.
    Viva.Graph.Utils.events(graphPart).extend();

    return graphPart;
};/**
 * @fileOverview Contains collection of primitve operations under graph.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.operations = function () {

    return {
        /**
         * Gets graph density, which is a ratio of actual number of edges to maximum
         * number of edges. I.e. graph density 1 means all nodes are connected with each other with an edge.
         * Density 0 - graph has no edges. Runtime: O(1)
         *
         * @param graph represents oriented graph structure.
         *
         * @returns density of the graph if graph has nodes. NaN otherwise
         */
        density : function (graph) {
            var nodes = graph.getNodesCount();
            if (nodes === 0) {
                return NaN;
            }

            return 2 * graph.getLinksCount() / (nodes * (nodes - 1));
        }
    };
};
Viva.Graph.Physics = Viva.Graph.Physics || {};

Viva.Graph.Physics.Vector = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

Viva.Graph.Physics.Vector.prototype = {
    multiply : function (scalar) {
        return new Viva.Graph.Physics.Vector(this.x * scalar, this.y * scalar);
    }
};

Viva.Graph.Physics.Point = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

Viva.Graph.Physics.Point.prototype = {
    add : function (point) {
        return new Viva.Graph.Physics.Point(this.x + point.x, this.y + point.y);
    }
};

Viva.Graph.Physics.Body = function () {
    this.mass = 1;
    this.force = new Viva.Graph.Physics.Vector();
    this.velocity = new Viva.Graph.Physics.Vector(); // For chained call use vel() method.
    this.location = new Viva.Graph.Physics.Point(); // For chained calls use loc() method instead.
    this.prevLocation = new Viva.Graph.Physics.Point(); // TODO: might be not always needed
};

Viva.Graph.Physics.Body.prototype = {
    loc : function (location) {
        if (location) {
            this.location.x = location.x;
            this.location.y = location.y;

            return this;
        }

        return this.location;
    },
    vel : function (velocity) {
        if (velocity) {
            this.velocity.x = velocity.x;
            this.velocity.y = velocity.y;

            return this;
        }

        return this.velocity;
    }
};

Viva.Graph.Physics.Spring = function (body1, body2, length, coeff, weight) {
    this.body1 = body1;
    this.body2 = body2;
    this.length = length;
    this.coeff = coeff;
    this.weight = weight;
};

Viva.Graph.Physics.QuadTreeNode = function () {
    this.centerOfMass = new Viva.Graph.Physics.Point();
    this.children = [];
    this.body = null;
    this.hasChildren = false;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
};
Viva.Graph.Physics = Viva.Graph.Physics || {};

/**
 * Updates velocity and position data using the Euler's method.
 * It is faster than RK4 but may produce less accurate results.
 *
 * http://en.wikipedia.org/wiki/Euler_method
 */
Viva.Graph.Physics.eulerIntegrator = function () {
    return {
        /**
         * Performs forces integration, using given timestep and force simulator.
         *
         * @returns squared distance of total position updates.
         */
        integrate : function (simulator, timeStep) {
            var speedLimit = simulator.speedLimit,
                tx = 0,
                ty = 0,
                i,
                max = simulator.bodies.length;

            for (i = 0; i < max; ++i) {
                var body = simulator.bodies[i],
                    coeff = timeStep / body.mass;

                body.velocity.x += coeff * body.force.x;
                body.velocity.y += coeff * body.force.y;
                var vx = body.velocity.x,
                    vy = body.velocity.y,
                    v = Math.sqrt(vx * vx + vy * vy);

                if (v > speedLimit) {
                    body.velocity.x = speedLimit * vx / v;
                    body.velocity.y = speedLimit * vy / v;
                }

                tx = timeStep * body.velocity.x;
                ty = timeStep * body.velocity.y;
                body.location.x += tx;
                body.location.y += ty;
            }

            return tx * tx + ty * ty;
        }
    };
};
/**
 * This is Barnes Hut simulation algorithm. Implementation
 * is adopted to non-recursive solution, since certain browsers
 * handle recursion extremly bad.
 *
 * http://www.cs.princeton.edu/courses/archive/fall03/cs126/assignments/barnes-hut.html
 */
Viva.Graph.Physics.nbodyForce = function (options) {
    options = Viva.lazyExtend(options || {
        gravity : -1,
        theta : 0.8
    });

    // the following structures are here to reduce memory pressure
    // when constructing BH-tree.
    function InsertStackElement(node, body) {
        this.node = node;
        this.body = body;
    }

    function InsertStack () {
        this.stack = [];
        this.popIdx = 0;
    }

    InsertStack.prototype = {
        isEmpty: function() {
            return this.popIdx === 0;
        },
        push: function (node, body) {
            var item = this.stack[this.popIdx];
            if (!item) {
                this.stack[this.popIdx] = new InsertStackElement(node, body);
            } else {
                item.node = node;
                item.body = body;
            }
            ++this.popIdx;
        },
        pop: function () {
            if (this.popIdx > 0) {
                return this.stack[--this.popIdx];
            }
        },
        reset: function () {
            this.popIdx = 0;
        }
    };


    var gravity = options.gravity,
        updateQueue = [],
        insertStack = new InsertStack(),
        theta = options.theta,
        random = Viva.random('5f4dcc3b5aa765d61d8327deb882cf99', 75, 20, 63, 0x6c, 65, 76, 65, 72),

        Node = function () {
            this.body = null;
            this.quads = [];
            this.mass = 0;
            this.massX = 0;
            this.massY = 0;
            this.left = 0;
            this.top = 0;
            this.bottom = 0;
            this.right = 0;
            this.isInternal = false;
        },

        nodesCache = [],
        currentInCache = 0,
        newNode = function () {
            // To avoid pressure on GC we reuse nodes.
            var node;
            if (nodesCache[currentInCache]) {
                node = nodesCache[currentInCache];
                node.quads[0] = null;
                node.quads[1] = null;
                node.quads[2] = null;
                node.quads[3] = null;
                node.body = null;
                node.mass = node.massX = node.massY = 0;
                node.left = node.right = node.top = node.bottom = 0;
                node.isInternal = false;
            } else {
                node = new Node();
                nodesCache[currentInCache] = node;
            }

            ++currentInCache;
            return node;
        },

        root = newNode(),

        isSamePosition = function (point1, point2) {
            // TODO: inline it?
            var dx = Math.abs(point1.x - point2.x);
            var dy = Math.abs(point1.y - point2.y);

            return (dx < 0.01 && dy < 0.01);
        },

    // Inserts body to the tree
        insert = function (newBody) {
            insertStack.reset();
            insertStack.push(root, newBody);

            while (!insertStack.isEmpty()) {
                var stackItem = insertStack.pop(),
                    node = stackItem.node,
                    body = stackItem.body;

                if (node.isInternal) {
                    // This is internal node. Update the total mass of the node and center-of-mass.
                    var x = body.location.x;
                    var y = body.location.y;
                    node.mass = node.mass + body.mass;
                    node.massX = node.massX + body.mass * x;
                    node.massY = node.massY + body.mass * y;

                    // Recursively insert the body in the appropriate quadrant.
                    // But first find the appropriate quadrant.
                    var quadIdx = 0, // Assume we are in the 0's quad.
                        left = node.left,
                        right = (node.right + left) / 2,
                        top = node.top,
                        bottom = (node.bottom + top) / 2;

                    if (x > right) {// somewhere in the eastern part.
                        quadIdx = quadIdx + 1;
                        var oldLeft = left;
                        left = right;
                        right = right + (right - oldLeft);
                    }
                    if (y > bottom) {// and in south.
                        quadIdx = quadIdx + 2;
                        var oldTop = top;
                        top = bottom;
                        bottom = bottom + (bottom - oldTop);
                    }

                    var child = node.quads[quadIdx];
                    if (!child) {
                        // The node is internal but this quadrant is not taken. Add
                        // subnode to it.
                        child = newNode();
                        child.left = left;
                        child.top = top;
                        child.right = right;
                        child.bottom = bottom;

                        node.quads[quadIdx] = child;
                    }

                    // continue searching in this quadrant.
                    insertStack.push(child, body);
                } else if (node.body) {
                    // We are trying to add to the leaf node.
                    // To achieve this we have to convert current leaf into internal node
                    // and continue adding two nodes.
                    var oldBody = node.body;
                    node.body = null; // internal nodes do not cary bodies
                    node.isInternal = true;

                    if (isSamePosition(oldBody.location, body.location)) {
                        // Prevent infinite subdivision by bumping one node
                        // slightly. I assume this operation should be quite
                        // rare, that's why usage of cos()/sin() shouldn't hit performance.
                        var newX, newY;
                        do {
                            var angle = random.nextDouble() * 2 * Math.PI;
                            var dx = (node.right - node.left) * 0.006 * Math.cos(angle);
                            var dy = (node.bottom - node.top) * 0.006 * Math.sin(angle);

                            newX = oldBody.location.x + dx;
                            newY = oldBody.location.y + dy;
                            // Make sure we don't bump it out of the box. If we do, next iteration should fix it
                        } while (newX < node.left || newX > node.right ||
                            newY < node.top  || newY > node.bottom);

                        oldBody.location.x = newX;
                        oldBody.location.y = newY;
                    }
                    // Next iteration should subdivide node further.
                    insertStack.push(node, oldBody);
                    insertStack.push(node, body);
                } else {
                    // Node has no body. Put it in here.
                    node.body = body;
                }
            }
        },

        update = function (sourceBody) {
            var queue = updateQueue,
                v,
                dx,
                dy,
                r,
                queueLength = 1,
                shiftIdx = 0,
                pushIdx = 1;

            queue[0] = root;

            // TODO: looks like in rare cases this guy has infinite loop bug. To reproduce
            // render K1000 (complete(1000)) with the settings: {springLength : 3, springCoeff : 0.0005,
            // dragCoeff : 0.02, gravity : -1.2 }
            while (queueLength) {
                var node = queue[shiftIdx],
                    body = node.body;

                queueLength -= 1;
                shiftIdx += 1;

                if (body && body !== sourceBody) {
                    // If the current node is an external node (and it is not source body),
                    // calculate the force exerted by the current node on body, and add this
                    // amount to body's net force.
                    dx = body.location.x - sourceBody.location.x;
                    dy = body.location.y - sourceBody.location.y;
                    r = Math.sqrt(dx * dx + dy * dy);

                    if (r === 0) {
                        // Poor man's protection agains zero distance.
                        dx = (random.nextDouble() - 0.5) / 50;
                        dy = (random.nextDouble() - 0.5) / 50;
                        r = Math.sqrt(dx * dx + dy * dy);
                    }

                    // This is standard gravition force calculation but we divide
                    // by r^3 to save two operations when normalizing force vector.
                    v = gravity * body.mass * sourceBody.mass / (r * r * r);
                    sourceBody.force.x = sourceBody.force.x + v * dx;
                    sourceBody.force.y = sourceBody.force.y + v * dy;
                } else {
                    // Otherwise, calculate the ratio s / r,  where s is the width of the region
                    // represented by the internal node, and r is the distance between the body
                    // and the node's center-of-mass
                    dx = node.massX / node.mass - sourceBody.location.x;
                    dy = node.massY / node.mass - sourceBody.location.y;
                    r = Math.sqrt(dx * dx + dy * dy);

                    if (r === 0) {
                        // Sorry about code duplucation. I don't want to create many functions
                        // right away. Just want to see performance first.
                        dx = (random.nextDouble() - 0.5) / 50;
                        dy = (random.nextDouble() - 0.5) / 50;
                        r = Math.sqrt(dx * dx + dy * dy);
                    }
                    // If s / r < θ, treat this internal node as a single body, and calculate the
                    // force it exerts on body b, and add this amount to b's net force.
                    if ((node.right - node.left) / r < theta) {
                        // in the if statement above we consider node's width only
                        // because the region was sqaurified during tree creation.
                        // Thus there is no difference between using width or height.
                        v = gravity * node.mass * sourceBody.mass / (r * r * r);
                        sourceBody.force.x = sourceBody.force.x + v * dx;
                        sourceBody.force.y = sourceBody.force.y + v * dy;
                    } else {
                        // Otherwise, run the procedure recursively on each of the current node's children.

                        // I intentionally unfolded this loop, to save several CPU cycles.
                        if (node.quads[0]) { queue[pushIdx] = node.quads[0]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[1]) { queue[pushIdx] = node.quads[1]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[2]) { queue[pushIdx] = node.quads[2]; queueLength += 1; pushIdx += 1; }
                        if (node.quads[3]) { queue[pushIdx] = node.quads[3]; queueLength += 1; pushIdx += 1; }
                    }
                }
            }
        },

        init = function (forceSimulator) {
            var x1 = Number.MAX_VALUE,
                y1 = Number.MAX_VALUE,
                x2 = Number.MIN_VALUE,
                y2 = Number.MIN_VALUE,
                i,
                bodies = forceSimulator.bodies,
                max = bodies.length;

            // To reduce quad tree depth we are looking for exact bounding box of all particles.
            i = max;
            while (i--) {
                var x = bodies[i].location.x;
                var y = bodies[i].location.y;
                if (x < x1) { x1 = x; }
                if (x > x2) { x2 = x; }
                if (y < y1) { y1 = y; }
                if (y > y2) { y2 = y; }
            }

            // Squarify the bounds.
            var dx = x2 - x1,
                dy = y2 - y1;
            if (dx > dy) { y2 = y1 + dx; } else { x2 = x1 + dy; }

            currentInCache = 0;
            root = newNode();
            root.left = x1;
            root.right = x2;
            root.top = y1;
            root.bottom = y2;

            i = max;
            while (i--) {
                insert(bodies[i], root);
            }
        };

    return {
        insert : insert,
        init : init,
        update : update,
        options : function (newOptions) {
            if (newOptions) {
                if (typeof newOptions.gravity === 'number') { gravity = newOptions.gravity; }
                if (typeof newOptions.theta === 'number') { theta = newOptions.theta; }

                return this;
            }

            return {gravity : gravity, theta : theta};
        }
    };
};Viva.Graph.Physics.dragForce = function (options) {
    if (!options) {
        options = {};
    }

    var currentOptions = {
        coeff : options.coeff || 0.01
    };

    return {
        init : function (forceSimulator) {},
        update : function (body) {
            body.force.x -= currentOptions.coeff * body.velocity.x;
            body.force.y -= currentOptions.coeff * body.velocity.y;
        },
        options : function (newOptions) {
            if (newOptions) {
                if (typeof newOptions.coeff === 'number') { currentOptions.coeff = newOptions.coeff; }

                return this;
            }

            return currentOptions;
        }
    };
};
Viva.Graph.Physics.springForce = function (currentOptions) {
    currentOptions = Viva.lazyExtend(currentOptions, {
        length : 50,
        coeff : 0.00022
    });

    var random = Viva.random('Random number 4.', 'Chosen by fair dice roll');

    return {
        init : function (forceSimulator) {},

        update : function (spring) {
            var body1 = spring.body1,
                body2 = spring.body2,
                length = spring.length < 0 ? currentOptions.length : spring.length,
                dx = body2.location.x - body1.location.x,
                dy = body2.location.y - body1.location.y,
                r = Math.sqrt(dx * dx + dy * dy);

            if (r === 0) {
                dx = (random.nextDouble() - 0.5) / 50;
                dy = (random.nextDouble() - 0.5) / 50;
                r = Math.sqrt(dx * dx + dy * dy);
            }

            var d = r - length;
            var coeff = ((!spring.coeff || spring.coeff < 0) ? currentOptions.coeff : spring.coeff) * d / r * spring.weight;

            body1.force.x += coeff * dx;
            body1.force.y += coeff * dy;

            body2.force.x += -coeff * dx;
            body2.force.y += -coeff * dy;
        },

        options : function (newOptions) {
            if (newOptions) {
                if (typeof newOptions.length === 'number') { currentOptions.length = newOptions.length; }
                if (typeof newOptions.coeff === 'number') { currentOptions.coeff = newOptions.coeff; }

                return this;
            }
            return currentOptions;
        }
    };
};
Viva.Graph.Physics = Viva.Graph.Physics || {};

/**
 * Manages a simulation of physical forces acting on bodies.
 * To create a custom force simulator register forces of the system
 * via addForce() method, choos appropriate integrator and register
 * bodies.
 *
 * // TODO: Show example.
 */
Viva.Graph.Physics.forceSimulator = function (forceIntegrator) {
    var integrator = forceIntegrator,
        bodies = [], // Bodies in this simulation.
        springs = [], // Springs in this simulation.
        bodyForces = [], // Forces acting on bodies.
        springForces = []; // Forces acting on springs.

    return {

        /**
         * The speed limit allowed by this simulator.
         */
        speedLimit : 1.0,

        /**
         * Bodies in this simulation
         */
        bodies : bodies,

        /**
         * Accumulates all forces acting on the bodies and springs.
         */
        accumulate : function () {
            var i, j, body;

            // Reinitialize all forces
            i = bodyForces.length;
            while (i--) {
                bodyForces[i].init(this);
            }

            i = springForces.length;
            while (i--) {
                springForces[i].init(this);
            }

            // Accumulate forces acting on bodies.
            i = bodies.length;
            while (i--) {
                body = bodies[i];
                body.force.x = 0;
                body.force.y = 0;

                for (j = 0; j < bodyForces.length; j++) {
                    bodyForces[j].update(body);
                }
            }

            // Accumulate forces acting on springs.
            for (i = 0; i < springs.length; ++i) {
                for (j = 0; j < springForces.length; j++) {
                    springForces[j].update(springs[i]);
                }
            }
        },

        /**
         * Runs simulation for one time step.
         */
        run : function (timeStep) {
            this.accumulate();
            return integrator.integrate(this, timeStep);
        },

        /**
         * Adds body to this simulation
         *
         * @param body - a new body. Bodies expected to have
         *   mass, force, velocity, location and prevLocation properties.
         *   the method does not check all this properties, for the sake of performance.
         *   // TODO: maybe it should check it?
         */
        addBody : function (body) {
            if (!body) {
                throw {
                    message : 'Cannot add null body to force simulator'
                };
            }

            bodies.push(body); // TODO: could mark simulator as dirty...

            return body;
        },

        removeBody : function (body) {
            if (!body) { return false; }

            var idx = Viva.Graph.Utils.indexOfElementInArray(body, bodies);
            if (idx < 0) { return false; }

            return bodies.splice(idx, 1);
        },

        /**
         * Adds a spring to this simulation.
         */
        addSpring: function (body1, body2, springLength, springCoefficient, springWeight) {
            if (!body1 || !body2) {
                throw {
                    message : 'Cannot add null spring to force simulator'
                };
            }

            if (typeof springLength !== 'number') {
                throw {
                    message : 'Spring length should be a number'
                };
            }
            springWeight = typeof springWeight === 'number' ? springWeight : 1;

            var spring = new Viva.Graph.Physics.Spring(body1, body2, springLength, springCoefficient >= 0 ? springCoefficient : -1, springWeight);
            springs.push(spring);

            // TODO: could mark simulator as dirty.
            return spring;
        },

        removeSpring : function (spring) {
            if (!spring) { return false; }

            var idx = Viva.Graph.Utils.indexOfElementInArray(spring, springs);
            if (idx < 0) { return false; }

            return springs.splice(idx, 1);
        },

        /**
         * Adds a force acting on all bodies in this simulation
         */
        addBodyForce: function (force) {
            if (!force) {
                throw {
                    message : 'Cannot add mighty (unknown) force to the simulator'
                };
            }

            bodyForces.push(force);
        },

        /**
         * Adds a spring force acting on all springs in this simulation.
         */
        addSpringForce : function (force) {
            if (!force) {
                throw {
                    message : 'Cannot add unknown force to the simulator'
                };
            }

            springForces.push(force);
        }
    };
};// I don't like to suppress this, but I'm afraid 'force_directed_body'
// could already be used by someone. Don't want to break it now.
/* jshint camelcase:false */

Viva.Graph.Layout = Viva.Graph.Layout || {};
Viva.Graph.Layout.forceDirected = function(graph, settings) {
    var STABLE_THRESHOLD = 0.001; // Maximum movement of the system which can be considered as stabilized

    if (!graph) {
        throw {
            message: 'Graph structure cannot be undefined'
        };
    }

    settings = Viva.lazyExtend(settings, {
        /**
         * Ideal length for links (springs in physical model).
         */
        springLength: 120,

        /**
         * Hook's law coefficient. 1 - solid spring.
         */
        springCoeff: 0.0002,

        /**
         * Coulomb's law coefficient. It's used to repel nodes thus should be negative
         * if you make it positive nodes start attract each other :).
         */
        gravity: -1.2,

        /**
         * Theta coeffiecient from Barnes Hut simulation. Ranged between (0, 1).
         * The closer it's to 1 the more nodes algorithm will have to go through.
         * Setting it to one makes Barnes Hut simulation no different from
         * brute-force forces calculation (each node is considered).
         */
        theta: 0.8,

        /**
         * Drag force coefficient. Used to slow down system, thus should be less than 1.
         * The closer it is to 0 the less tight system will be.
         */
        dragCoeff: 0.02
    });

    var forceSimulator = Viva.Graph.Physics.forceSimulator(Viva.Graph.Physics.eulerIntegrator()),
        nbodyForce = Viva.Graph.Physics.nbodyForce({
            gravity: settings.gravity,
            theta: settings.theta
        }),
        springForce = Viva.Graph.Physics.springForce({
            length: settings.springLength,
            coeff: settings.springCoeff
        }),
        dragForce = Viva.Graph.Physics.dragForce({
            coeff: settings.dragCoeff
        }),
        graphRect = new Viva.Graph.Rect(),
        random = Viva.random('ted.com', 103, 114, 101, 97, 116),

        getBestNodePosition = function(node) {
            // TODO: Initial position could be picked better, e.g. take into
            // account all neighbouring nodes/links, not only one.
            // TODO: this is the same as in gem layout. consider refactoring.
            var baseX = (graphRect.x1 + graphRect.x2) / 2,
                baseY = (graphRect.y1 + graphRect.y2) / 2,
                springLength = settings.springLength;

            if (node.links && node.links.length > 0) {
                var firstLink = node.links[0],
                    otherNode = firstLink.fromId !== node.id ? graph.getNode(firstLink.fromId) : graph.getNode(firstLink.toId);
                if (otherNode.position) {
                    baseX = otherNode.position.x;
                    baseY = otherNode.position.y;
                }
            }

            return {
                x: baseX + random.next(springLength) - springLength / 2,
                y: baseY + random.next(springLength) - springLength / 2
            };
        },

        updateNodeMass = function(node) {
            var body = node.force_directed_body;
            body.mass = 1 + graph.getLinks(node.id).length / 3.0;
        },

        initNode = function(node) {
            var body = node.force_directed_body;
            if (!body) {
                // TODO: rename position to location or location to position to be consistent with
                // other places.
                node.position = node.position || getBestNodePosition(node);

                body = new Viva.Graph.Physics.Body();
                node.force_directed_body = body;
                updateNodeMass(node);

                body.loc(node.position);
                forceSimulator.addBody(body);
            }
        },

        releaseNode = function(node) {
            var body = node.force_directed_body;
            if (body) {
                node.force_directed_body = null;
                delete node.force_directed_body;

                forceSimulator.removeBody(body);
            }
        },

        initLink = function(link) {
            // TODO: what if bodies are not initialized?
            var from = graph.getNode(link.fromId),
                to = graph.getNode(link.toId);

            updateNodeMass(from);
            updateNodeMass(to);
            link.force_directed_spring = forceSimulator.addSpring(from.force_directed_body, to.force_directed_body, -1.0, link.weight);
        },

        releaseLink = function(link) {
            var spring = link.force_directed_spring;
            if (spring) {
                var from = graph.getNode(link.fromId),
                    to = graph.getNode(link.toId);
                if (from) {
                    updateNodeMass(from);
                }
                if (to) {
                    updateNodeMass(to);
                }

                link.force_directed_spring = null;
                delete link.force_directed_spring;

                forceSimulator.removeSpring(spring);
            }
        },

        onGraphChanged = function(changes) {
            for (var i = 0; i < changes.length; ++i) {
                var change = changes[i];
                if (change.changeType === 'add') {
                    if (change.node) {
                        initNode(change.node);
                    }
                    if (change.link) {
                        initLink(change.link);
                    }
                } else if (change.changeType === 'remove') {
                    if (change.node) {
                        releaseNode(change.node);
                    }
                    if (change.link) {
                        releaseLink(change.link);
                    }
                }
                // Probably we don't need to care about 'update' event here;
            }
        },

        initSimulator = function() {
            graph.forEachNode(initNode);
            graph.forEachLink(initLink);
            graph.addEventListener('changed', onGraphChanged);
        },

        isNodePinned = function(node) {
            if (!node) {
                return true;
            }

            return node.isPinned || (node.data && node.data.isPinned);
        },

        updateNodePositions = function() {
            var x1 = Number.MAX_VALUE,
                y1 = Number.MAX_VALUE,
                x2 = Number.MIN_VALUE,
                y2 = Number.MIN_VALUE;
            if (graph.getNodesCount() === 0) {
                return;
            }

            graph.forEachNode(function(node) {
                var body = node.force_directed_body;
                if (!body) {
                    // This could be a sign someone removed the propery.
                    // I should really decouple force related stuff from node
                    return;
                }

                if (isNodePinned(node)) {
                    body.loc(node.position);
                }

                // TODO: once again: use one name to be consistent (position vs location)
                node.position.x = body.location.x;
                node.position.y = body.location.y;

                if (node.position.x < x1) {
                    x1 = node.position.x;
                }
                if (node.position.x > x2) {
                    x2 = node.position.x;
                }
                if (node.position.y < y1) {
                    y1 = node.position.y;
                }
                if (node.position.y > y2) {
                    y2 = node.position.y;
                }
            });

            graphRect.x1 = x1;
            graphRect.x2 = x2;
            graphRect.y1 = y1;
            graphRect.y2 = y2;
        };

    forceSimulator.addSpringForce(springForce);
    forceSimulator.addBodyForce(nbodyForce);
    forceSimulator.addBodyForce(dragForce);

    initSimulator();

    return {
        /**
         * Attempts to layout graph within given number of iterations.
         *
         * @param {integer} [iterationsCount] number of algorithm's iterations.
         */
        run: function(iterationsCount) {
            var i;
            iterationsCount = iterationsCount || 50;

            for (i = 0; i < iterationsCount; ++i) {
                this.step();
            }
        },

        step: function() {
            var energy = forceSimulator.run(20);
            updateNodePositions();

            return energy < STABLE_THRESHOLD;
        },

        /**
         * Returns rectangle structure {x1, y1, x2, y2}, which represents
         * current space occupied by graph.
         */
        getGraphRect: function() {
            return graphRect;
        },

        /**
         * Request to release all resources
         */
        dispose: function() {
            graph.removeEventListener('change', onGraphChanged);
        },

        // Layout specific methods
        /**
         * Gets or sets current desired length of the edge.
         *
         * @param length new desired length of the springs (aka edge, aka link).
         * if this parameter is empty then old spring length is returned.
         */
        springLength: function(length) {
            if (arguments.length === 1) {
                springForce.options({
                    length: length
                });
                return this;
            }

            return springForce.options().length;
        },

        /**
         * Gets or sets current spring coeffiсient.
         *
         * @param coeff new spring coeffiсient.
         * if this parameter is empty then its old value returned.
         */
        springCoeff: function(coeff) {
            if (arguments.length === 1) {
                springForce.options({
                    coeff: coeff
                });
                return this;
            }

            return springForce.options().coeff;
        },

        /**
         * Gets or sets current gravity in the nbody simulation.
         *
         * @param g new gravity constant.
         * if this parameter is empty then its old value returned.
         */
        gravity: function(g) {
            if (arguments.length === 1) {
                nbodyForce.options({
                    gravity: g
                });
                return this;
            }

            return nbodyForce.options().gravity;
        },

        /**
         * Gets or sets current theta value in the nbody simulation.
         *
         * @param t new theta coeffiсient.
         * if this parameter is empty then its old value returned.
         */
        theta: function(t) {
            if (arguments.length === 1) {
                nbodyForce.options({
                    theta: t
                });
                return this;
            }

            return nbodyForce.options().theta;
        },

        /**
         * Gets or sets current theta value in the nbody simulation.
         *
         * @param dragCoeff new drag coeffiсient.
         * if this parameter is empty then its old value returned.
         */
        drag: function(dragCoeff) {
            if (arguments.length === 1) {
                dragForce.options({
                    coeff: dragCoeff
                });
                return this;
            }

            return dragForce.options().coeff;
        }
    };
};
Viva.Graph.Layout = Viva.Graph.Layout || {};

/**
 * Does not really perform any layouting algorithm but is compliant
 * with renderer interface. Allowing clients to provide specific positioning
 * callback and get static layout of the graph
 *
 * @param {Viva.Graph.graph} graph to layout
 * @param {Object} userSettings
 */
Viva.Graph.Layout.constant = function (graph, userSettings) {
    userSettings = Viva.lazyExtend(userSettings, {
        maxX : 1024,
        maxY : 1024,
        seed : 'Deterministic randomness made me do this'
    });
    // This class simply follows API, it does not use some of the arguments:
    /*jshint unused: false */
    var rand = Viva.random(userSettings.seed),
        graphRect = new Viva.Graph.Rect(Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE),

        placeNodeCallback = function (node) {
            return new Viva.Graph.Point2d(rand.next(userSettings.maxX), rand.next(userSettings.maxY));
        },

        updateGraphRect = function (node, graphRect) {
            if (node.position.x < graphRect.x1) { graphRect.x1 = node.position.x; }
            if (node.position.x > graphRect.x2) { graphRect.x2 = node.position.x; }
            if (node.position.y < graphRect.y1) { graphRect.y1 = node.position.y; }
            if (node.position.y > graphRect.y2) { graphRect.y2 = node.position.y; }
        },

        ensureNodeInitialized = function (node) {
            if (!node.hasOwnProperty('position')) {
                node.position = placeNodeCallback(node);
            }
            updateGraphRect(node, graphRect);
        },

        updateNodePositions = function () {
            if (graph.getNodesCount() === 0) { return; }

            graphRect.x1 = Number.MAX_VALUE;
            graphRect.y1 = Number.MAX_VALUE;
            graphRect.x2 = Number.MIN_VALUE;
            graphRect.y2 = Number.MIN_VALUE;

            graph.forEachNode(ensureNodeInitialized);
        },

        onGraphChanged = function(changes) {
            for (var i = 0; i < changes.length; ++i) {
                var change = changes[i];
                if (change.changeType === 'add' && change.node) {
                    ensureNodeInitialized(change.node);
                }
            }
        },

        initLayout = function () {
            updateNodePositions();
            graph.addEventListener('changed', onGraphChanged);
        };

    return {
        /**
         * Attempts to layout graph within given number of iterations.
         *
         * @param {integer} [iterationsCount] number of algorithm's iterations.
         *  The constant layout ignores this parameter.
         */
        run : function (iterationsCount) {
            this.step();
        },

        /**
         * One step of layout algorithm.
         */
        step : function () {
            updateNodePositions();

            return false; // no need to continue.
        },

        /**
         * Returns rectangle structure {x1, y1, x2, y2}, which represents
         * current space occupied by graph.
         */
        getGraphRect : function () {
            return graphRect;
        },

        /**
         * Request to release all resources
         */
        dispose : function () {
            graph.removeEventListener('change', onGraphChanged);
        },

        // Layout specific methods:

        /**
         * Based on argument either update default node placement callback or
         * attempts to place given node using current placement callback.
         * Setting new node callback triggers position update for all nodes.
         *
         * @param {Object} newPlaceNodeCallbackOrNode - if it is a function then
         * default node placement callback is replaced with new one. Node placement
         * callback has a form of function (node) {}, and is expected to return an
         * object with x and y properties set to numbers.
         *
         * Otherwise if it's not a function the argument is treated as graph node
         * and current node placement callback will be used to place it.
         */
        placeNode : function (newPlaceNodeCallbackOrNode) {
            if (typeof newPlaceNodeCallbackOrNode === 'function') {
                placeNodeCallback = newPlaceNodeCallbackOrNode;
                updateNodePositions();
                return this;
            }

            // it is not a request to update placeNodeCallback, trying to place
            // a node using current callback:
            return placeNodeCallback(newPlaceNodeCallbackOrNode);
        }

    };
};
/**
 * @fileOverview Defines a graph renderer that uses CSS based drawings.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.View = Viva.Graph.View || {};

/**
 * This is heart of the rendering. Class accepts graph to be rendered and rendering settings.
 * It monitors graph changes and depicts them accordingly.
 *
 * @param graph - Viva.Graph.graph() object to be rendered.
 * @param settings - rendering settings, composed from the following parts (with their defaults shown):
 *   settings = {
 *     // Represents a module that is capable of displaying graph nodes and links.
 *     // all graphics has to correspond to defined interface and can be later easily
 *     // replaced for specific needs (e.g. adding WebGL should be piece of cake as long
 *     // as WebGL has implemented required interface). See svgGraphics for example.
 *     // NOTE: current version supports Viva.Graph.View.cssGraphics() as well.
 *     graphics : Viva.Graph.View.svgGraphics(),
 *
 *     // Where the renderer should draw graph. Container size matters, because
 *     // renderer will attempt center graph to that size. Also graphics modules
 *     // might depend on it.
 *     container : document.body,
 *
 *     // Layout algorithm to be used. The algorithm is expected to comply with defined
 *     // interface and is expected to be iterative. Renderer will use it then to calculate
 *     // grpaph's layout. For examples of the interface refer to Viva.Graph.Layout.forceDirected()
 *     layout : Viva.Graph.Layout.forceDirected(),
 *
 *     // Directs renderer to display links. Usually rendering links is the slowest part of this
 *     // library. So if you don't need to display links, consider settings this property to false.
 *     renderLinks : true,
 *
 *     // Number of layout iterations to run before displaying the graph. The bigger you set this number
 *     // the closer to ideal position graph will apper first time. But be careful: for large graphs
 *     // it can freeze the browser.
 *     prerender : 0
 *   }
 */
Viva.Graph.View.renderer = function (graph, settings) {
    // TODO: This class is getting hard to understand. Consider refactoring.
    // TODO: I have a technical debt here: fix scaling/recentring! Currently it's total mess.
    var FRAME_INTERVAL = 30;

    settings = settings || {};

    var layout = settings.layout,
        graphics = settings.graphics,
        container = settings.container,
        nodeSelected = settings.nodeSelected,
        nodeUnselected = settings.nodeUnselected,
        inputManager,
        animationTimer,
        rendererInitialized = false,
        updateCenterRequired = true,

        currentStep = 0,
        totalIterationsCount = 0,
        isStable = false,
        userInteraction = false,

        viewPortOffset = {
            x : 0,
            y : 0
        },

        transform = {
            offsetX : 0,
            offsetY : 0,
            scale : 1
        };

    var prepareSettings = function () {
            container = container || window.document.body;
            layout = layout || Viva.Graph.Layout.forceDirected(graph);
            graphics = graphics || Viva.Graph.View.svgGraphics(graph, {container : container});

            if (!settings.hasOwnProperty('renderLinks')) {
                settings.renderLinks = true;
            }

            settings.prerender = settings.prerender || 0;
            inputManager = (graphics.inputManager || Viva.Input.domInputManager)(graph, graphics);
        },
    // Cache positions object to prevent GC pressure
        cachedFromPos = {x : 0, y : 0, node: null},
        cachedToPos = {x : 0, y : 0, node: null},
        cachedNodePos = { x: 0, y: 0},
        windowEvents = Viva.Graph.Utils.events(window),
        publicEvents = Viva.Graph.Utils.events({}).extend(),
        graphEvents,
        containerDrag,


        renderLink = function (link) {
            var fromNode = graph.getNode(link.fromId),
                toNode = graph.getNode(link.toId);

            if (!fromNode || !toNode) {
                return;
            }

            cachedFromPos.x = fromNode.position.x;
            cachedFromPos.y = fromNode.position.y;
            cachedFromPos.node = fromNode;

            cachedToPos.x = toNode.position.x;
            cachedToPos.y = toNode.position.y;
            cachedToPos.node = toNode;

            graphics.updateLinkPosition(link.ui, cachedFromPos, cachedToPos);
        },

        renderNode = function (node) {
            cachedNodePos.x = node.position.x;
            cachedNodePos.y = node.position.y;

            graphics.updateNodePosition(node.ui, cachedNodePos);
        },

        renderGraph = function () {
            graphics.beginRender();
            if (settings.renderLinks && !graphics.omitLinksRendering) {
                graph.forEachLink(renderLink);
            }

            graph.forEachNode(renderNode);
            graphics.endRender();
        },

        onRenderFrame = function () {
            isStable = layout.step() && !userInteraction;
            renderGraph();

            return !isStable;
        },

        renderIterations = function (iterationsCount) {
            if (animationTimer) {
                totalIterationsCount += iterationsCount;
                return;
            }

            if (iterationsCount) {
                totalIterationsCount += iterationsCount;

                animationTimer = Viva.Graph.Utils.timer(function () {
                    return onRenderFrame();
                }, FRAME_INTERVAL);
            } else {
                currentStep = 0;
                totalIterationsCount = 0;
                animationTimer = Viva.Graph.Utils.timer(onRenderFrame, FRAME_INTERVAL);
            }
        },

        resetStable = function () {
            isStable = false;
            animationTimer.restart();
        },

        prerender = function () {
            // To get good initial positions for the graph
            // perform several prerender steps in background.
            var i;
            if (typeof settings.prerender === 'number' && settings.prerender > 0) {
                for (i = 0; i < settings.prerender; i += 1) {
                    layout.step();
                }
            }
        },

        updateCenter = function () {
            var graphRect = layout.getGraphRect(),
                containerSize = Viva.Graph.Utils.getDimension(container);

            viewPortOffset.x = viewPortOffset.y = 0;
            transform.offsetX = containerSize.width / 2 - (graphRect.x2 + graphRect.x1) / 2;
            transform.offsetY = containerSize.height / 2 - (graphRect.y2 + graphRect.y1) / 2;
            graphics.graphCenterChanged(transform.offsetX + viewPortOffset.x, transform.offsetY + viewPortOffset.y);

            updateCenterRequired = false;
        },

        createNodeUi = function (node) {
            var nodeUI = graphics.node(node);
            node.ui = nodeUI;
            graphics.initNode(nodeUI);

            renderNode(node);
        },

        removeNodeUi = function (node) {
            if (node.hasOwnProperty('ui')) {
                graphics.releaseNode(node.ui);

                node.ui = null;
                delete node.ui;
            }
        },

        createLinkUi = function (link) {
            var linkUI = graphics.link(link);
            link.ui = linkUI;
            graphics.initLink(linkUI);

            if (!graphics.omitLinksRendering) {
                renderLink(link);
            }
        },

        removeLinkUi = function (link) {
            if (link.hasOwnProperty('ui')) {
                graphics.releaseLink(link.ui);
                link.ui = null;
                delete link.ui;
            }
        },

        listenNodeEvents = function (node) {
            var wasPinned = false;

            // TODO: This may not be memory efficient. Consider reusing handlers object.
            inputManager.bindDragNDrop(node, {
                onStart : function () {
                    wasPinned = node.isPinned;
                    node.isPinned = true;
                    userInteraction = true;
                    resetStable();
                },
                onDrag : function (e, offset) {
                    node.position.x += offset.x / transform.scale;
                    node.position.y += offset.y / transform.scale;
                    userInteraction = true;

                    renderGraph();
                },
                onStop : function () {
                    node.isPinned = wasPinned;
                    userInteraction = false;
                },
                onClick : function (id) {
                    if (graph.toggleSelectedNode(id)) {
                        if (nodeSelected && typeof nodeSelected === 'function') {
                            nodeSelected(graph.getNode(id));
                        }
                    } else {
                        if (nodeUnselected && typeof nodeUnselected === 'function') {
                            nodeUnselected(graph.getNode(id));
                        }
                    }
                }
            });
        },

        releaseNodeEvents = function (node) {
            inputManager.bindDragNDrop(node, null);
        },

        initDom = function () {
            graphics.init(container);

            graph.forEachNode(createNodeUi);

            if (settings.renderLinks) {
                graph.forEachLink(createLinkUi);
            }
        },

        releaseDom = function () {
            graphics.release(container);
        },

        processNodeChange = function (change) {
            var node = change.node;

            if (change.changeType === 'add') {
                createNodeUi(node);
                listenNodeEvents(node);
                if (updateCenterRequired) {
                    updateCenter();
                }
            } else if (change.changeType === 'remove') {
                releaseNodeEvents(node);
                removeNodeUi(node);
                if (graph.getNodesCount() === 0) {
                    updateCenterRequired = true; // Next time when node is added - center the graph.
                }
            } else if (change.changeType === 'update') {
                releaseNodeEvents(node);
                removeNodeUi(node);

                createNodeUi(node);
                listenNodeEvents(node);
            }
        },

        processLinkChange = function (change) {
            var link = change.link;
            if (change.changeType === 'add') {
                if (settings.renderLinks) { createLinkUi(link); }
            } else if (change.changeType === 'remove') {
                if (settings.renderLinks) { removeLinkUi(link); }
            } else if (change.changeType === 'update') {
                throw 'Update type is not implemented. TODO: Implement me!';
            }
        },

        onGraphChanged = function (changes) {
            var i, change;
            for (i = 0; i < changes.length; i += 1) {
                change = changes[i];
                if (change.node) {
                    processNodeChange(change);
                } else if (change.link) {
                    processLinkChange(change);
                }
            }

            resetStable();
        },

        onWindowResized = function () {
            updateCenter();
            onRenderFrame();
        },

        releaseContainerDragManager = function () {
            if (containerDrag) {
                containerDrag.release();
                containerDrag = null;
            }
        },

        releaseGraphEvents = function () {
            if (graphEvents) {
                // Interesting.. why is it not null? Anyway:
                graphEvents.stop('changed', onGraphChanged);
                graphEvents = null;
            }
        },

        listenToEvents = function () {
            windowEvents.on('resize', onWindowResized);

            releaseContainerDragManager();
            containerDrag = Viva.Graph.Utils.dragndrop(container);
            containerDrag.onDrag(function (e, offset) {
                viewPortOffset.x += offset.x;
                viewPortOffset.y += offset.y;
                graphics.translateRel(offset.x, offset.y);

                renderGraph();
            });

            containerDrag.onScroll(function (e, scaleOffset, scrollPoint) {
                var scaleFactor = Math.pow(1 + 0.4, scaleOffset < 0 ? -0.2 : 0.2);
                transform.scale = graphics.scale(scaleFactor, scrollPoint);

                renderGraph();
                publicEvents.fire('scale', transform.scale);
            });

            graph.forEachNode(listenNodeEvents);

            releaseGraphEvents();
            graphEvents = Viva.Graph.Utils.events(graph);
            graphEvents.on('changed', onGraphChanged);
        },

        stopListenToEvents = function () {
            rendererInitialized = false;
            releaseGraphEvents();
            releaseContainerDragManager();
            windowEvents.stop('resize', onWindowResized);
            publicEvents.removeAllListeners();
            animationTimer.stop();

            graph.forEachLink(function (link) {
                if (settings.renderLinks) { removeLinkUi(link); }
            });

            graph.forEachNode(function (node) {
                releaseNodeEvents(node);
                removeNodeUi(node);
            });

            layout.dispose();
            releaseDom();
        };

    return {
        /**
         * Performs rendering of the graph.
         *
         * @param iterationsCount if specified renderer will run only given number of iterations
         * and then stop. Otherwise graph rendering is performed infinitely.
         *
         * Note: if rendering stopped by used started dragging nodes or new nodes were added to the
         * graph renderer will give run more iterations to reflect changes.
         */
        run : function (iterationsCount) {

            if (!rendererInitialized) {
                prepareSettings();
                prerender();

                updateCenter();
                initDom();
                listenToEvents();

                rendererInitialized = true;
            }

            renderIterations(iterationsCount);

            return this;
        },

        reset : function () {
            graphics.resetScale();
            updateCenter();
            transform.scale = 1;
        },

        pause : function () {
            animationTimer.stop();
        },

        resume : function () {
            animationTimer.restart();
        },

        rerender : function () {
            renderGraph();
            return this;
        },

        /**
         * Removes this renderer and deallocates all resources/timers
         */
        dispose : function () {
            stopListenToEvents(); // I quit!
        },

        on : function (eventName, callback) {
            publicEvents.addEventListener(eventName, callback);
            return this;
        },

        off : function (eventName, callback) {
            publicEvents.removeEventListener(eventName, callback);
            return this;
        }
    };
};
Viva.Graph.serializer = function () {
    var checkJSON = function () {
            if (typeof JSON === 'undefined' || !JSON.stringify || !JSON.parse) {
                throw 'JSON serializer is not defined.';
            }
        },

        nodeTransformStore = function (node) {
            return { id : node.id, data: node.data };
        },

        linkTransformStore = function (link) {
            return {
                fromId : link.fromId,
                toId: link.toId,
                data : link.data
            };
        },

        nodeTransformLoad = function (node) {
            return node;
        },

        linkTransformLoad = function (link) {
            return link;
        };

    return {
        /**
         * Saves graph to JSON format.
         *
         * NOTE: ECMAScript 5 (or alike) JSON object is required to be defined
         * to get proper output.
         *
         * @param graph to be saved in JSON format.
         * @param nodeTransform optional callback function(node) which returns what should be passed into nodes collection
         * @param linkTransform optional callback functions(link) which returns what should be passed into the links collection
         */
        storeToJSON : function (graph, nodeTransform, linkTransform) {
            if (!graph) { throw 'Graph is not defined'; }
            checkJSON();

            nodeTransform = nodeTransform || nodeTransformStore;
            linkTransform = linkTransform || linkTransformStore;

            var store = {
                nodes : [],
                links : []
            };

            graph.forEachNode(function (node) { store.nodes.push(nodeTransform(node)); });
            graph.forEachLink(function (link) { store.links.push(linkTransform(link)); });

            return JSON.stringify(store);
        },

        /**
         * Restores graph from JSON string created by storeToJSON() method.
         *
         * NOTE: ECMAScript 5 (or alike) JSON object is required to be defined
         * to get proper output.
         *
         * @param jsonString is a string produced by storeToJSON() method.
         * @param nodeTransform optional callback function(node) which accepts deserialized node and returns object with
         *        'id' and 'data' properties.
         * @param linkTransform optional callback functions(link) which accepts deserialized link and returns link object with
         *        'fromId', 'toId' and 'data' properties.
         */
        loadFromJSON : function (jsonString, nodeTransform, linkTransform) {
            if (typeof jsonString !== 'string') { throw 'String expected in loadFromJSON() method'; }
            checkJSON();

            nodeTransform = nodeTransform || nodeTransformLoad;
            linkTransform = linkTransform || linkTransformLoad;

            var store = JSON.parse(jsonString),
                graph = Viva.Graph.graph(),
                i;

            if (!store || !store.nodes || !store.links) { throw 'Passed json string does not represent valid graph'; }

            for (i = 0; i < store.nodes.length; ++i) {
                var parsedNode = nodeTransform(store.nodes[i]);
                if (!parsedNode.hasOwnProperty('id')) { throw 'Graph node format is invalid. Node.id is missing'; }

                graph.addNode(parsedNode.id, parsedNode.data);
            }

            for (i = 0; i < store.links.length; ++i) {
                var link = linkTransform(store.links[i]);
                if (!link.hasOwnProperty('fromId') || !link.hasOwnProperty('toId')) { throw 'Graph link format is invalid. Both fromId and toId are required'; }

                graph.addLink(link.fromId, link.toId, link.data);
            }

            return graph;
        }
    };
};
/**
 * @fileOverview Centrality calcuation algorithms.
 *
 * @see http://en.wikipedia.org/wiki/Centrality
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.centrality = function () {
    var singleSourceShortestPath = function (graph, node, oriented) {
            // I'm using the same naming convention used in http://www.inf.uni-konstanz.de/algo/publications/b-fabc-01.pdf
            // sorry about cryptic names.
            var P = {}, // predcessors lists. 
                S = [],
                sigma = {},
                d = {},
                Q = [node.id],
                v,
                dV,
                sigmaV,
                processNode = function (w) {
                    // w found for the first time?
                    if (!d.hasOwnProperty(w.id)) {
                        Q.push(w.id);
                        d[w.id] = dV + 1;
                    }
                    // Shortest path to w via v?
                    if (d[w.id] === dV + 1) {
                        sigma[w.id] += sigmaV;
                        P[w.id].push(v);
                    }
                };

            graph.forEachNode(function (t) {
                P[t.id] = [];
                sigma[t.id] = 0;
            });

            d[node.id] = 0;
            sigma[node.id] = 1;

            while (Q.length) { // Using BFS to find shortest paths
                v = Q.shift();
                dV = d[v];
                sigmaV = sigma[v];

                S.push(v);
                graph.forEachLinkedNode(v, processNode, oriented);
            }

            return {
                S : S,
                P : P,
                sigma : sigma
            };
        },

        accumulate = function (betweenness, shortestPath, s) {
            var delta = {},
                S = shortestPath.S,
                i,
                w,
                coeff,
                pW,
                v;

            for (i = 0; i < S.length; i += 1) {
                delta[S[i]] = 0;
            }

            // S returns vertices in order of non-increasing distance from s
            while (S.length) {
                w = S.pop();
                coeff = (1 + delta[w]) / shortestPath.sigma[w];
                pW = shortestPath.P[w];

                for (i = 0; i < pW.length; i += 1) {
                    v = pW[i];
                    delta[v] += shortestPath.sigma[v] * coeff;
                }

                if (w !== s) {
                    betweenness[w] += delta[w];
                }
            }
        },

        sortBetweennes = function (b) {
            var sorted = [],
                key;
            for (key in b) {
                if (b.hasOwnProperty(key)) {
                    sorted.push({ key : key, value : b[key]});
                }
            }

            return sorted.sort(function (x, y) { return y.value - x.value; });
        };

    return {

        /**
         * Compute the shortest-path betweenness centrality for all nodes in a graph.
         *
         * Betweenness centrality of a node `n` is the sum of the fraction of all-pairs
         * shortest paths that pass through `n`. Runtime O(n * v) for non-weighted graphs.
         *
         * @see http://en.wikipedia.org/wiki/Centrality#Betweenness_centrality
         *
         * @see A Faster Algorithm for Betweenness Centrality.
         *      Ulrik Brandes, Journal of Mathematical Sociology 25(2):163-177, 2001.
         *      http://www.inf.uni-konstanz.de/algo/publications/b-fabc-01.pdf
         *
         * @see Ulrik Brandes: On Variants of Shortest-Path Betweenness
         *      Centrality and their Generic Computation.
         *      Social Networks 30(2):136-145, 2008.
         *      http://www.inf.uni-konstanz.de/algo/publications/b-vspbc-08.pdf
         *
         * @see Ulrik Brandes and Christian Pich: Centrality Estimation in Large Networks.
         *      International Journal of Bifurcation and Chaos 17(7):2303-2318, 2007.
         *      http://www.inf.uni-konstanz.de/algo/publications/bp-celn-06.pdf
         *
         * @param graph for which we are calculating betweenness centrality. Non-weighted graphs are only supported
         */
        betweennessCentrality : function (graph) {
            var betweennes = {},
                shortestPath;
            graph.forEachNode(function (node) {
                betweennes[node.id] = 0;
            });

            graph.forEachNode(function (node) {
                shortestPath = singleSourceShortestPath(graph, node);
                accumulate(betweennes, shortestPath, node);
            });

            return sortBetweennes(betweennes);
        },

        /**
         * Calculates graph nodes degree centrality (in/out or both).
         *
         * @see http://en.wikipedia.org/wiki/Centrality#Degree_centrality
         *
         * @param graph for which we are calculating centrality.
         * @param kind optional parameter. Valid values are
         *   'in'  - calculate in-degree centrality
         *   'out' - calculate out-degree centrality
         *         - if it's not set generic degree centrality is calculated
         */
        degreeCentrality : function (graph, kind) {
            var calcDegFunction,
                sortedDegrees = [],
                result = [],
                degree;

            kind = (kind || 'both').toLowerCase();
            if (kind === 'in') {
                calcDegFunction = function (links, nodeId) {
                    var total = 0,
                        i;
                    for (i = 0; i < links.length; i += 1) {
                        total += (links[i].toId === nodeId) ? 1 : 0;
                    }
                    return total;
                };
            } else if (kind === 'out') {
                calcDegFunction = function (links, nodeId) {
                    var total = 0,
                        i;
                    for (i = 0; i < links.length; i += 1) {
                        total += (links[i].fromId === nodeId) ? 1 : 0;
                    }
                    return total;
                };
            } else if (kind === 'both') {
                calcDegFunction = function (links) {
                    return links.length;
                };
            } else {
                throw 'Expected centrality degree kind is: in, out or both';
            }

            graph.forEachNode(function (node) {
                var links = graph.getLinks(node.id),
                    nodeDeg = calcDegFunction(links, node.id);

                if (!sortedDegrees.hasOwnProperty(nodeDeg)) {
                    sortedDegrees[nodeDeg] = [node.id];
                } else {
                    sortedDegrees[nodeDeg].push(node.id);
                }
            });

            for (degree in sortedDegrees) {
                if (sortedDegrees.hasOwnProperty(degree)) {
                    var nodes = sortedDegrees[degree],
                        j;
                    if (nodes) {
                        for (j = 0; j < nodes.length; ++j) {
                            result.unshift({key : nodes[j], value : parseInt(degree, 10)});
                        }
                    }
                }
            }

            return result;
        }
    };
};/**
 * @fileOverview Community structure detection algorithms
 *
 * @see http://en.wikipedia.org/wiki/Community_structure
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.community = function () {
    return {
        /**
         * Implementation of Speaker-listener Label Propagation Algorithm (SLPA) of
         * Jierui Xie and Boleslaw K. Szymanski.
         *
         * @see http://arxiv.org/pdf/1109.5720v3.pdf
         * @see https://sites.google.com/site/communitydetectionslpa/
         */
        slpa : function (graph, T, r) {
            var algorithm = Viva.Graph._community.slpaAlgorithm(graph, T, r);
            return algorithm.run();
        }
    };
};Viva.Graph._community = {};

/**
 * Implementation of Speaker-listener Label Propagation Algorithm (SLPA) of
 * Jierui Xie and Boleslaw K. Szymanski.
 *
 * @see http://arxiv.org/pdf/1109.5720v3.pdf
 * @see https://sites.google.com/site/communitydetectionslpa/
 */
Viva.Graph._community.slpaAlgorithm = function (graph, T, r) {
    T = T || 100; // number of evaluation iterations. Should be at least 20. Influence memory consumption by O(n * T);
    r = r || 0.3; // community threshold on scale from 0 to 1. Value greater than 0.5 result in disjoint communities.

    var random = Viva.random(1331782216905),
        shuffleRandom = Viva.random('Greeting goes to you, ', 'dear reader'),

        calculateCommunities = function (nodeMemory, threshold) {
            var communities = [];
            nodeMemory.forEachUniqueWord(function (word, count) {
                if (count > threshold) {
                    communities.push({name : word, probability : count / T });
                } else {
                    return true; // stop enumeration, nothing more popular after this word.
                }
            });

            return communities;
        },

        init = function (graph) {
            var algoNodes = [];
            graph.forEachNode(function (node) {
                var memory = Viva.Graph._community.occuranceMap(random);
                memory.add(node.id);

                node.slpa = { memory : memory  };
                algoNodes.push(node.id);
            });

            return algoNodes;
        },

        evaluate = function (graph, nodes) {
            var shuffle = Viva.randomIterator(nodes, shuffleRandom),
                t,

                /**
                 * One iteration of SLPA.
                 */
                    processNode = function (nodeId) {
                    var listner = graph.getNode(nodeId),
                        saidWords = Viva.Graph._community.occuranceMap(random);

                    graph.forEachLinkedNode(nodeId, function (speakerNode) {
                        var word = speakerNode.slpa.memory.getRandomWord();
                        saidWords.add(word);
                    });

                    // selecting the most popular label from what it observed in the current step
                    var heard = saidWords.getMostPopularFair();
                    listner.slpa.memory.add(heard);
                };

            for (t = 0; t < T - 1; ++t) { // -1 is because one 'step' was during init phase
                shuffle.forEach(processNode);
            }
        },

        postProcess = function (graph) {
            var communities = {};

            graph.forEachNode(function (node) {
                var nodeCommunities = calculateCommunities(node.slpa.memory, r * T),
                    i;

                for (i = 0; i < nodeCommunities.length; ++i) {
                    var communityName = nodeCommunities[i].name;
                    if (communities.hasOwnProperty(communityName)) {
                        communities[communityName].push(node.id);
                    } else {
                        communities[communityName] = [node.id];
                    }
                }

                node.communities = nodeCommunities; // TODO: I doesn't look right to augment node's properties. No?

                // Speaking of memory. Node memory created by slpa is really expensive. Release it:
                node.slpa = null;
                delete node.slpa;
            });

            return communities;
        };

    return {

        /**
         * Executes SLPA algorithm. The function returns dictionary of discovered communities:
         * {
         *     'communityName1' : [nodeId1, nodeId2, .., nodeIdN],
         *     'communityName2' : [nodeIdK1, nodeIdK2, .., nodeIdKN],
         *     ...
         * };
         *
         * After algorithm is done each node is also augmented with new property 'communities':
         *
         * node.communities = [
         *      {name: 'communityName1', probability: 0.78},
         *      {name: 'communityName2', probability: 0.63},
         *     ...
         * ];
         *
         * 'probability' is always higher than 'r' parameter and denotes level of confidence
         * with which we think node belongs to community.
         *
         * Runtime is O(T * m), where m is total number of edges, and T - number of algorithm iterations.
         *
         */
        run : function () {
            var nodes = init(graph);

            evaluate(graph, nodes);

            return postProcess(graph);
        }
    };
};

/**
 * A data structure which serves as node memory during SLPA execution. The main idea is to
 * simplify operations on memory such as
 *  - add word to memory,
 *  - get random word from memory, with probablity proportional to word occurrence in the memory
 *  - get the most popular word in memory
 *
 * TODO: currently this structure is extremely inefficient in terms of memory. I think it could be
 * optimized.
 */
Viva.Graph._community.occuranceMap = function (random) {
    random = random || Viva.random();

    var wordsCount = {},
        allWords = [],
        dirtyPopularity = false,
        uniqueWords = [],

        rebuildPopularityArray = function () {
            var key;

            uniqueWords.length = 0;
            for (key in wordsCount) {
                if (wordsCount.hasOwnProperty(key)) {
                    uniqueWords.push(key);
                }
            }

            uniqueWords.sort(function (x, y) {
                var result = wordsCount[y] - wordsCount[x];
                if (result) {
                    return result;
                }

                // Not only number of occurances matters but order of keys also does.
                // for ... in implementation in different browsers results in different
                // order, and if we want to have same categories accross all browsers
                // we should order words by key names too:
                if (x < y) { return -1; }
                if (x > y) { return 1; }

                return 0;
            });
        },

        ensureUniqueWordsUpdated = function () {
            if (dirtyPopularity) {
                rebuildPopularityArray();
                dirtyPopularity = false;
            }
        };

    return {

        /**
         * Adds a new word to the collection of words.
         */
        add : function (word) {
            word = String(word);
            if (wordsCount.hasOwnProperty(word)) {
                wordsCount[word] += 1;
            } else {
                wordsCount[word] = 1;
            }

            allWords.push(word);
            dirtyPopularity = true;
        },

        /**
         * Gets number of occurances for a given word. If word is not present in the dictionary
         * zero is returned.
         */
        getWordCount : function (word) {
            return wordsCount[word] || 0;
        },

        /**
         * Gets the most popular word in the map. If multiple words are at the same position
         * random word among them is choosen.
         *
         */
        getMostPopularFair : function () {
            if (allWords.length === 1) {
                return allWords[0]; // optimizes speed for simple case.
            }

            ensureUniqueWordsUpdated();

            var maxCount = 0,
                i;

            for (i = 1; i < uniqueWords.length; ++i) {
                if (wordsCount[uniqueWords[i - 1]] !== wordsCount[uniqueWords[i]]) {
                    break; // other words are less popular... not interested.
                } else {
                    maxCount += 1;
                }
            }

            maxCount += 1;  // to include upper bound. i.e. random words between [0, maxCount] (not [0, maxCount) ).
            return uniqueWords[random.next(maxCount)];
        },

        /**
         * Selects a random word from map with probability proportional
         * to the occurrence frequency of words.
         */
        getRandomWord : function () {
            if (allWords.length === 0) {
                throw 'The occurance map is empty. Cannot get empty word';
            }

            return allWords[random.next(allWords.length)];
        },

        /**
         * Enumerates all unique words in the map, and calls
         *  callback(word, occuranceCount) function on each word. Callback
         * can return true value to stop enumeration.
         *
         * Note: enumeration is guaranteed in to run in decreasing order.
         */
        forEachUniqueWord : function (callback) {
            if (typeof callback !== 'function') {
                throw 'Function callback is expected to enumerate all words';
            }
            var i;

            ensureUniqueWordsUpdated();

            for (i = 0; i < uniqueWords.length; ++i) {
                var word = uniqueWords[i],
                    count = wordsCount[word];

                var stop = callback(word, count);
                if (stop) {
                    break;
                }
            }
        }
    };
};/**
 * @fileOverview Contains collection of graph generators.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.generator = function () {

    return {
        /**
         * Generates complete graph Kn.
         *
         * @param n represents number of nodes in the complete graph.
         */
        complete : function (n) {
            if (!n || n < 1) {
                throw { message: "At least two nodes expected for complete graph" };
            }

            var g = Viva.Graph.graph(),
                i,
                j;

            g.Name = "Complete K" + n;

            for (i = 0; i < n; ++i) {
                for (j = i + 1; j < n; ++j) {
                    if (i !== j) {
                        g.addLink(i, j);
                    }
                }
            }

            return g;
        },

        /**
         * Generates complete bipartite graph K n,m. Each node in the
         * first partition is connected to all nodes in the second partition.
         *
         * @param n represents number of nodes in the first graph partition
         * @param m represents number of nodes in the second graph partition
         */
        completeBipartite : function (n, m) {
            if (!n || !m || n < 0 || m < 0) {
                throw { message: "Graph dimensions are invalid. Number of nodes in each partition should be greate than 0" };
            }

            var g = Viva.Graph.graph(),
                i,
                j;

            g.Name = "Complete K " + n + "," + m;
            for (i = 0; i < n; ++i) {
                for (j = n; j < n + m; ++j) {
                    g.addLink(i, j);
                }
            }

            return g;
        },
        /**
         * Generates a graph in a form of a ladder with n steps.
         *
         * @param n number of steps in the ladder.
         */
        ladder : function (n) {
            if (!n || n < 0) {
                throw { message: "Invalid number of nodes" };
            }

            var g = Viva.Graph.graph(),
                i;
            g.Name = "Ladder graph " + n;

            for (i = 0; i < n - 1; ++i) {
                g.addLink(i, i + 1);
                // first row
                g.addLink(n + i, n + i + 1);
                // second row
                g.addLink(i, n + i);
                // ladder"s step
            }

            g.addLink(n - 1, 2 * n - 1);
            // last step in the ladder;

            return g;
        },

        /**
         * Generates a graph in a form of a circular ladder with n steps.
         *
         * @param n number of steps in the ladder.
         */
        circularLadder : function (n) {
            if (!n || n < 0) {
                throw { message: "Invalid number of nodes" };
            }

            var g = this.ladder(n);
            g.Name = "Circular ladder graph " + n;

            g.addLink(0, n - 1);
            g.addLink(n, 2 * n - 1);
            return g;
        },
        /**
         * Generates a graph in a form of a grid with n rows and m columns.
         *
         * @param n number of rows in the graph.
         * @param m number of columns in the graph.
         */
        grid: function (n, m) {
            var g = Viva.Graph.graph(),
                i,
                j;
            g.Name = "Grid graph " + n + "x" + m;
            for (i = 0; i < n; ++i) {
                for (j = 0; j < m; ++j) {
                    var node = i + j * n;
                    if (i > 0) { g.addLink(node, i - 1 + j * n); }
                    if (j > 0) { g.addLink(node, i + (j - 1) * n); }
                }
            }

            return g;
        },

        path: function (n) {
            if (!n || n < 0) {
                throw { message: "Invalid number of nodes" };
            }

            var g = Viva.Graph.graph(),
                i;
            g.Name = "Path graph " + n;
            g.addNode(0);

            for (i = 1; i < n; ++i) {
                g.addLink(i - 1, i);
            }

            return g;
        },

        lollipop: function (m, n) {
            if (!n || n < 0 || !m || m < 0) {
                throw { message: "Invalid number of nodes" };
            }

            var g = this.complete(m),
                i;
            g.Name = "Lollipop graph. Head x Path " + m + "x" + n;

            for (i = 0; i < n; ++i) {
                g.addLink(m + i - 1, m + i);
            }

            return g;
        },

        /**
         * Creates balanced binary tree with n levels.
         */
        balancedBinTree: function (n) {
            var g = Viva.Graph.graph(),
                count = Math.pow(2, n),
                level;
            g.Name = "Balanced bin tree graph " + n;

            for (level = 1; level < count; ++level) {
                var root = level,
                    left = root * 2,
                    right = root * 2 + 1;

                g.addLink(root, left);
                g.addLink(root, right);
            }

            return g;
        },
        /**
         * Generates a graph with n nodes and 0 links.
         *
         * @param n number of nodes in the graph.
         */
        randomNoLinks : function (n) {
            if (!n || n < 0) {
                throw { message: "Invalid number of nodes" };
            }

            var g = Viva.Graph.graph(),
                i;
            g.Name = "Random graph, no Links: " + n;
            for (i = 0; i < n; ++i) {
                g.addNode(i);
            }

            return g;
        }
    };
};

/**
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

/**
 * Simple wrapper over svg object model API, to shorten the usage syntax.
 */
Viva.Graph.svg = function (element) {
    var svgns = "http://www.w3.org/2000/svg",
        xlinkns = "http://www.w3.org/1999/xlink",
        svgElement = element;

    if (typeof element === "string") {
        svgElement = window.document.createElementNS(svgns, element);
    }

    if (svgElement.vivagraphAugmented) {
        return svgElement;
    }

    svgElement.vivagraphAugmented = true;

    // Augment svg element (TODO: it's not safe - what if some function already exists on the prototype?):

    /**
     * Gets an svg attribute from an element if value is not specified.
     * OR sets a new value to the given attribute.
     *
     * @param name - svg attribute name;
     * @param value - value to be set;
     *
     * @returns svg element if both name and value are specified; or value of the given attribute
     * if value parameter is missing.
     */
    svgElement.attr = function (name, value) {
        if (arguments.length === 2) {
            if (value !== null) {
                svgElement.setAttributeNS(null, name, value);
            } else {
                svgElement.removeAttributeNS(null, name);
            }

            return svgElement;
        }

        return svgElement.getAttributeNS(null, name);
    };

    svgElement.append = function (element) {
        var child = Viva.Graph.svg(element);
        svgElement.appendChild(child);
        return child;
    };

    svgElement.text = function (textContent) {
        if (typeof textContent === "string") {
            this.attr('dx', textContent.length * -3.5 + 'px');
        }
        if (typeof textContent !== "undefined") {
            svgElement.textContent = textContent;
            return svgElement;
        }
        return svgElement.textContent;
    };

    svgElement.link = function (target) {
        if (arguments.length) {
            svgElement.setAttributeNS(xlinkns, "xlink:href", target);
            return svgElement;
        }

        return svgElement.getAttributeNS(xlinkns, "xlink:href");
    };

    svgElement.children = function (selector) {
        var wrappedChildren = [],
            childrenCount = svgElement.childNodes.length,
            i,
            j;

        if (selector === undefined && svgElement.hasChildNodes()) {
            for (i = 0; i < childrenCount; i++) {
                wrappedChildren.push(Viva.Graph.svg(svgElement.childNodes[i]));
            }
        } else if (typeof selector === "string") {
            var classSelector = (selector[0] === "."),
                idSelector    = (selector[0] === "#"),
                tagSelector   = !classSelector && !idSelector;

            for (i = 0; i < childrenCount; i++) {
                var el = svgElement.childNodes[i];

                // pass comments, text nodes etc.
                if (el.nodeType === 1) {
                    var classes = el.attr("class"),
                        id = el.attr("id"),
                        tagName = el.nodeName;

                    if (classSelector && classes) {
                        classes = classes.replace(/\s+/g, " ").split(" ");
                        for (j = 0; j < classes.length; j++) {
                            if (classSelector && classes[j] === selector.substr(1)) {
                                wrappedChildren.push(Viva.Graph.svg(el));
                                break;
                            }
                        }
                    } else if (idSelector && id === selector.substr(1)) {
                        wrappedChildren.push(Viva.Graph.svg(el));
                        break;
                    } else if (tagSelector && tagName === selector) {
                        wrappedChildren.push(Viva.Graph.svg(el));
                    }

                    wrappedChildren = wrappedChildren.concat(Viva.Graph.svg(el).children(selector));
                }
            }

            if (idSelector && wrappedChildren.length === 1) {
                return wrappedChildren[0];
            }
        }

        return wrappedChildren;
    };

    return svgElement;
};
/**
 * @fileOverview Defines a graph renderer that uses SVG based drawings.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.View = Viva.Graph.View || {};

/**
 * Performs svg-based graph rendering. This module does not perform
 * layout, but only visualizes nodes and edeges of the graph.
 */
Viva.Graph.View.svgGraphics = function () {
    var svgContainer,
        svgRoot,
        offsetX,
        offsetY,
        actualScale = 1,
    /*jshint unused: false */
        nodeBuilder = function (node) {
            return Viva.Graph.svg("rectangle")
                .attr("rx", 50)
                .attr("ry", 25)
                .attr("stroke", "black")
                .attr("stroke-width", 3)
                .attr("style", "fill:white");
        },

        nodePositionCallback = function (nodeUI, pos) {
            nodeUI.attr("cx", pos.x)
                .attr("cy", pos.y);
        },

        linkBuilder = function (link) {
            return Viva.Graph.svg("line")
                .attr("style", "stroke:rgb(27,3,161)")
                .attr("stroke-width", 3);
        },

        linkPositionCallback = function (linkUI, fromPos, toPos) {
            linkUI.attr("x1", fromPos.x)
                .attr("y1", fromPos.y)
                .attr("x2", toPos.x)
                .attr("y2", toPos.y);
        },

        fireRescaled = function (graphics) {
            // TODO: maybe we shall copy changes?
            graphics.fire("rescaled");
        },

        updateTransform = function () {
            if (svgContainer) {
                var transform = "matrix(" + actualScale + ", 0, 0," + actualScale + "," + offsetX + "," + offsetY + ")";
                svgContainer.attr("transform", transform);
            }
        };

    var graphics = {
        /**
         * Sets the collback that creates node representation or creates a new node
         * presentation if builderCallbackOrNode is not a function.
         *
         * @param builderCallbackOrNode a callback function that accepts graph node
         * as a parameter and must return an element representing this node. OR
         * if it's not a function it's treated as a node to which DOM element should be created.
         *
         * @returns If builderCallbackOrNode is a valid callback function, instance of this is returned;
         * Otherwise a node representation is returned for the passed parameter.
         */
        node : function (builderCallbackOrNode) {

            if (builderCallbackOrNode && typeof builderCallbackOrNode !== "function") {
                return nodeBuilder(builderCallbackOrNode);
            }

            nodeBuilder = builderCallbackOrNode;

            return this;
        },

        /**
         * Sets the collback that creates link representation or creates a new link
         * presentation if builderCallbackOrLink is not a function.
         *
         * @param builderCallbackOrLink a callback function that accepts graph link
         * as a parameter and must return an element representing this link. OR
         * if it's not a function it's treated as a link to which DOM element should be created.
         *
         * @returns If builderCallbackOrLink is a valid callback function, instance of this is returned;
         * Otherwise a link representation is returned for the passed parameter.
         */
        link : function (builderCallbackOrLink) {
            if (builderCallbackOrLink && typeof builderCallbackOrLink !== "function") {
                return linkBuilder(builderCallbackOrLink);
            }

            linkBuilder = builderCallbackOrLink;
            return this;
        },

        /**
         * Allows to override default position setter for the node with a new
         * function. newPlaceCallback(nodeUI, position) is function which
         * is used by updateNodePosition().
         */
        placeNode : function (newPlaceCallback) {
            nodePositionCallback = newPlaceCallback;
            return this;
        },

        placeLink : function (newPlaceLinkCallback) {
            linkPositionCallback = newPlaceLinkCallback;
            return this;
        },

        /**
         * Called every before renderer starts rendering.
         */
        beginRender : function () {},

        /**
         * Called every time when renderer finishes one step of rendering.
         */
        endRender : function () {},

        /**
         * Sets translate operation that should be applied to all nodes and links.
         */
        graphCenterChanged : function (x, y) {
            offsetX = x;
            offsetY = y;
            updateTransform();
        },

        /**
         * Default input manager listens to DOM events to process nodes drag-n-drop
         */
        inputManager : Viva.Input.domInputManager,

        translateRel : function (dx, dy) {
            var p = svgRoot.createSVGPoint(),
                t = svgContainer.getCTM(),
                origin = svgRoot.createSVGPoint().matrixTransform(t.inverse());

            p.x = dx;
            p.y = dy;

            p = p.matrixTransform(t.inverse());
            p.x = (p.x - origin.x) * t.a;
            p.y = (p.y - origin.y) * t.d;

            t.e += p.x;
            t.f += p.y;

            var transform = "matrix(" + t.a + ", 0, 0," + t.d + "," + t.e + "," + t.f + ")";
            svgContainer.attr("transform", transform);
        },

        scale : function (scaleFactor, scrollPoint) {
            var p = svgRoot.createSVGPoint();
            p.x = scrollPoint.x;
            p.y = scrollPoint.y;

            p = p.matrixTransform(svgContainer.getCTM().inverse()); // translate to svg coordinates

            // Compute new scale matrix in current mouse position
            var k = svgRoot.createSVGMatrix().translate(p.x, p.y).scale(scaleFactor).translate(-p.x, -p.y),
                t = svgContainer.getCTM().multiply(k);

            actualScale = t.a;
            offsetX = t.e;
            offsetY = t.f;
            var transform = "matrix(" + t.a + ", 0, 0," + t.d + "," + t.e + "," + t.f + ")";
            svgContainer.attr("transform", transform);

            fireRescaled(this);
            return actualScale;
        },

        resetScale : function () {
            actualScale = 1;
            var transform = "matrix(1, 0, 0, 1, 0, 0)";
            svgContainer.attr("transform", transform);
            fireRescaled(this);
            return this;
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider prepare to render.
         */
        init : function (container) {
            svgRoot = Viva.Graph.svg("svg");

            svgContainer = Viva.Graph.svg("g")
                .attr("buffered-rendering", "dynamic");

            svgRoot.appendChild(svgContainer);
            container.appendChild(svgRoot);
            updateTransform();
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider release occupied resources.
         */
        release : function (container) {
            if (svgRoot && container) {
                container.removeChild(svgRoot);
            }
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider prepare to render given link of the graph
         *
         * @param linkUI visual representation of the link created by link() execution.
         */
        initLink : function (linkUI) {
            if (!linkUI) { return; }
            if (svgContainer.childElementCount > 0) {
                svgContainer.insertBefore(linkUI, svgContainer.firstChild);
            } else {
                svgContainer.appendChild(linkUI);
            }
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider remove link from rendering surface.
         *
         * @param linkUI visual representation of the link created by link() execution.
         **/
        releaseLink : function (linkUI) {
            svgContainer.removeChild(linkUI);
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider prepare to render given node of the graph.
         *
         * @param nodeUI visual representation of the node created by node() execution.
         **/
        initNode : function (nodeUI) {
            svgContainer.appendChild(nodeUI);
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider remove node from rendering surface.
         *
         * @param nodeUI visual representation of the node created by node() execution.
         **/
        releaseNode : function (nodeUI) {
            svgContainer.removeChild(nodeUI);
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider place given node UI to recommended position pos {x, y};
         */
        updateNodePosition : function (nodeUI, pos) {
            nodePositionCallback(nodeUI, pos);
        },

        /**
         * Called by Viva.Graph.View.renderer to let concrete graphic output
         * provider place given link of the graph. Pos objects are {x, y};
         */
        updateLinkPosition : function (link, fromPos, toPos) {
            linkPositionCallback(link, fromPos, toPos);
        },

        /**
         * Returns root svg element.
         *
         * Note: This is internal method specific to this renderer
         * TODO: Rename this to getGraphicsRoot() to be uniform accross graphics classes
         */
        getSvgRoot : function () {
            return svgRoot;
        }
    };

    // Let graphics fire events before we return it to the caller.
    Viva.Graph.Utils.events(graphics).extend();

    return graphics;
};
/**
 * @fileOverview I used this class to render links UI within
 * node. Lesser SVG elements is proven to improve performance
 * but I'm not happy with the code result here. Probably this class
 * will be removed from future versions.
 *
 * @author Andrei Kashcha (aka anvaka) / http://anvaka.blogspot.com
 */

Viva.Graph.View.svgNodeFactory = function (graph) {
    var defaultColor = "#999",
        geom = Viva.Graph.geom(),

        attachCustomContent = function (nodeUI) {
            nodeUI.size = {w: 10, h: 10};
            nodeUI.append("rect")
                .attr("width", nodeUI.size.w)
                .attr("height", nodeUI.size.h)
                .attr("stroke", "orange")
                .attr("fill", "orange");
        },

        nodeSize = function (nodeUI) {
            return nodeUI.size;
        };


    return {
        node : function (node) {
            var nodeUI = Viva.Graph.svg("g");

            attachCustomContent(nodeUI, node);
            nodeUI.nodeId = node.id;
            return nodeUI;
        },

        link : function (link) {
            var fromNode = graph.getNode(link.fromId),
                nodeUI = fromNode && fromNode.ui;

            if (nodeUI && !nodeUI.linksContainer) {
                var nodeLinks = Viva.Graph.svg("path")
                    .attr("stroke", defaultColor);
                nodeUI.linksContainer = nodeLinks;
                return nodeLinks;
            }

            return null;
        },

        /**
         * Sets a callback function for custom nodes contnet.
         * @param conentCreator(nodeUI, node) - callback function which returns a node content UI.
         *  Image, for example.
         * @param sizeProvider(nodeUI) - a callback function which accepts nodeUI returned by
         *  contentCreator and returns it"s custom rectangular size.
         *
         */
        customContent : function (contentCreator, sizeProvider) {
            if (typeof contentCreator !== "function" ||
                typeof sizeProvider !== "function") {
                throw "Two functions expected: contentCreator(nodeUI, node) and size(nodeUI)";
            }

            attachCustomContent = contentCreator;
            nodeSize = sizeProvider;
        },

        placeNode : function (nodeUI, fromNodePos) {
            var linksPath = "",
                fromNodeSize = nodeSize(nodeUI);

            graph.forEachLinkedNode(nodeUI.nodeId, function (linkedNode, link) {
                if (!linkedNode.position || !linkedNode.ui) {
                    return; // not yet defined - ignore.
                }

                if (linkedNode.ui === nodeUI) {
                    return; // incoming link - ignore;
                }
                if (link.fromId !== nodeUI.nodeId) {
                    return; // we process only outgoing links.
                }

                var toNodeSize = nodeSize(linkedNode.ui),
                    toNodePos = linkedNode.position;

                var from = geom.intersectRect(
                    fromNodePos.x - fromNodeSize.w / 2, // left
                    fromNodePos.y - fromNodeSize.h / 2, // top
                    fromNodePos.x + fromNodeSize.w / 2, // right
                    fromNodePos.y + fromNodeSize.h / 2, // bottom
                    fromNodePos.x,
                    fromNodePos.y,
                    toNodePos.x,
                    toNodePos.y
                ) || fromNodePos;

                var to = geom.intersectRect(
                    toNodePos.x - toNodeSize.w / 2, // left
                    toNodePos.y - toNodeSize.h / 2, // top
                    toNodePos.x + toNodeSize.w / 2, // right
                    toNodePos.y + toNodeSize.h / 2, // bottom
                    toNodePos.x,
                    toNodePos.y,
                    fromNodePos.x,
                    fromNodePos.y
                ) || toNodePos;

                linksPath += "M" + Math.round(from.x) + " " + Math.round(from.y) +
                    "L" + Math.round(to.x) + " " + Math.round(to.y);
            });

            nodeUI.attr("transform",
                "translate(" + (fromNodePos.x - fromNodeSize.w / 2) + ", " +
                    (fromNodePos.y - fromNodeSize.h / 2) + ")");
            if (linksPath !== "" && nodeUI.linksContainer) {
                nodeUI.linksContainer.attr("d", linksPath);
            }
        }

    };
};
