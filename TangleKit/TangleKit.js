//
//  TangleKit.js
//  Tangle 0.1.0
//
//  Created by Bret Victor on 6/10/11.
//  (c) 2011 Bret Victor.  MIT open-source license.
//


(function () {


//----------------------------------------------------------
//
//  TKIf
//
//  Shows the element if value is true (non-zero), hides if false.
//
//  Attributes:  data-invert (optional):  show if false instead.

Tangle.classes.TKIf = {
    
    initialize: function (element, options, tangle, variable) {
        this.isInverted = !!options.invert;
    },
    
    update: function (element, value) {
        if (this.isInverted) { value = !value; }
        if (value) { element.style.removeProperty("display"); } 
        else { element.style.display = "none" };
    }
};


//----------------------------------------------------------
//
//  TKSwitch
//
//  Shows the element's nth child if value is n.
//
//  False or true values will show the first or second child respectively.

Tangle.classes.TKSwitch = {

    update: function (element, value) {
        element.getChildren().each( function (child, index) {
            if (index != value) { child.style.display = "none"; } 
            else { child.style.removeProperty("display"); }
        });
    }
};


//----------------------------------------------------------
//
//  TKSwitchPositiveNegative
//
//  Shows the element's first child if value is positive or zero.
//  Shows the element's second child if value is negative.

Tangle.classes.TKSwitchPositiveNegative = {

    update: function (element, value) {
        Tangle.classes.TKSwitch.update(element, value < 0);
    }
};


//----------------------------------------------------------
//
//  TKToggle
//
//  Click to toggle value between 0 and 1.

Tangle.classes.TKToggle = {

    initialize: function (element, options, tangle, variable) {
        element.addEvent("click", function (event) {
            var isActive = tangle.getValue(variable);
            tangle.setValue(variable, isActive ? 0 : 1);
        });
    }
};


//----------------------------------------------------------
//
//  TKNumberField
//
//  An input box where a number can be typed in.
//
//  Attributes:  data-size (optional): width of the box in characters

Tangle.classes.TKNumberField = {

    initialize: function (element, options, tangle, variable) {
        this.input = new Element("input", {
    		type: "text",
    		"class":"TKNumberFieldInput",
    		size: options.size || 6
        }).inject(element, "top");
        
        var inputChanged = (function () {
            var value = this.getValue();
            tangle.setValue(variable, value);
        }).bind(this);
        
        this.input.addEvent("keyup",  inputChanged);
        this.input.addEvent("blur",   inputChanged);
        this.input.addEvent("change", inputChanged);
	},
	
	getValue: function () {
        var value = parseFloat(this.input.get("value"));
        return isNaN(value) ? 0 : value;
	},
	
	update: function (element, value) {
	    var currentValue = this.getValue();
	    if (value !== currentValue) { this.input.set("value", "" + value); }
	}
};


//----------------------------------------------------------
//
//  TKAdjustableNumberArr
//
//  Drag a number to adjust.
//
//  Attributes:  data-values (optional): list of comma separated floats values

var isAnyAdjustableNumberDragging = false;  // hack for dragging one value over another one

Tangle.classes.TKAdjustableNumberArr = {

    initialize: function (element, options, tangle, variable) {
        this.element = element;
        this.tangle = tangle;
        this.variable = variable;


        this.values = (options.values !== undefined) ? this.getFloatFromArr(options.values): [1];
        this.currentIndex = (options.defaultIndex !== undefined) ? parseFloat(options.defaultIndex): 0;
        this.indexKeeper = this.currentIndex;

        this.initializeHover();
        this.initializeHelp();
        this.initializeDrag();
        this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent));
    },

    getFloatFromArr: function(str) {
        var separate_f = str.split(',');
        for (var i in separate_f) {
            separate_f[i] = parseFloat(separate_f[i]);
        }
        return separate_f;
    },


    // hover
    
    initializeHover: function () {
        this.isHovering = false;
        this.element.addEvent("mouseenter", (function () { this.isHovering = true;  this.updateRolloverEffects(); }).bind(this));
        this.element.addEvent("mouseleave", (function () { this.isHovering = false; this.updateRolloverEffects(); }).bind(this));
    },
    
    updateRolloverEffects: function () {
        this.updateStyle();
        this.updateCursor();
        this.updateHelp();
    },
    
    isActive: function () {
        return this.isDragging || (this.isHovering && !isAnyAdjustableNumberDragging);
    },

    updateStyle: function () {
        if (this.isDragging) { this.element.addClass("TKAdjustableNumberDownArr"); }
        else { this.element.removeClass("TKAdjustableNumberDownArr"); }
        
        if (!this.isDragging && this.isActive()) { this.element.addClass("TKAdjustableNumberHoverArr"); }
        else { this.element.removeClass("TKAdjustableNumberHoverArr"); }
    },

    updateCursor: function () {
        var body = document.getElement("body");
        if (this.isActive()) { body.addClass("TKCursorDragHorizontal"); }
        else { body.removeClass("TKCursorDragHorizontal"); }
    },


    // help

    initializeHelp: function () {
        this.helpElement = (new Element("div", { "class": "TKAdjustableNumberHelpArr" })).inject(this.element, "top");
        this.helpElement.setStyle("display", "none");
        this.helpElement.set("text", "drag");
    },
    
    updateHelp: function () {
        this.helpElement.set("text", (this.isDragging? this.tangle.getValue(this.variable):'drag'));
        var size = this.element.getSize();
        var top = -size.y * 2;
        var left = -Math.round(0.3 * (size.x));
        var fontsize = '35px';
        if (this.isMobile) {
            fontsize =  '63px';
            top = -size.y*4;
            left = 0;
        }
        var display = (this.isHovering || this.isDragging) ? "block" : "none";
        this.helpElement.setStyles({'font-size': fontsize, left:left, top:top, display:display, 'background':'#303030', 'padding': '5px', 'color':'#5F9093' });
    },


    // drag
    
    initializeDrag: function () {
        this.isDragging = false;
        new BVTouchable(this.element, this);
    },
    
    touchDidGoDown: function (touches) {
        this.isDragging = true;
        this.currentIndex = this.indexKeeper;
        isAnyAdjustableNumberDragging = true;
        this.updateRolloverEffects();
        this.updateStyle();
    },
    
    touchDidMove: function (touches) {
        var value = this.currentIndex + touches.translation.x / 20;
        this.indexKeeper = value;
        value = (value.round()).limit(0, this.values.length-1);
        this.tangle.setValue(this.variable, this.values[value]);
        this.updateHelp();
    },
    
    touchDidGoUp: function (touches) {
        this.isDragging = false;
        isAnyAdjustableNumberDragging = false;
        this.currentIndex = this.indexKeeper;
        this.updateRolloverEffects();
        this.updateStyle();
        this.helpElement.setStyle("display", touches.wasTap ? "block" : "none");
    }
};



Tangle.classes.TKAdjustableNumber = {

    initialize: function (element, options, tangle, variable) {
        this.element = element;
        this.tangle = tangle;
        this.variable = variable;

        this.min = (options.min !== undefined) ? parseFloat(options.min) : 0;
        this.max = (options.max !== undefined) ? parseFloat(options.max) : 1e100;
        this.step = (options.step !== undefined) ? parseFloat(options.step) : 1;
        
        this.initializeHover();
        this.initializeHelp();
        this.initializeDrag();
        this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent));
    },


    // hover
    
    initializeHover: function () {
        this.isHovering = false;
        this.element.addEvent("mouseenter", (function () { this.isHovering = true;  this.updateRolloverEffects(); }).bind(this));
        this.element.addEvent("mouseleave", (function () { this.isHovering = false; this.updateRolloverEffects(); }).bind(this));
    },
    
    updateRolloverEffects: function () {
        this.updateStyle();
        this.updateCursor();
        this.updateHelp();
    },
    
    isActive: function () {
        return this.isDragging || (this.isHovering && !isAnyAdjustableNumberDragging);
    },

    updateStyle: function () {
        if (this.isDragging) { this.element.addClass("TKAdjustableNumberDown"); }
        else { this.element.removeClass("TKAdjustableNumberDown"); }
        
        if (!this.isDragging && this.isActive()) { this.element.addClass("TKAdjustableNumberHover"); }
        else { this.element.removeClass("TKAdjustableNumberHover"); }
    },

    updateCursor: function () {
        var body = document.getElement("body");
        if (this.isActive()) { body.addClass("TKCursorDragHorizontal"); }
        else { body.removeClass("TKCursorDragHorizontal"); }
    },


    // help

    initializeHelp: function () {
        this.helpElement = (new Element("div", { "class": "TKAdjustableNumberHelp" })).inject(this.element, "top");
        this.helpElement.setStyle("display", "none");
        this.helpElement.set("text", "drag");
    },
    
    updateHelp: function () {
        this.helpElement.set("text", (this.isDragging? this.tangle.getValue(this.variable):'drag'));
        var size = this.element.getSize();
        var top = -size.y * 2;
        var left = -Math.round(0.3 * (size.x));
        var fontsize = '35px';
        if (this.isMobile) {
            fontsize =  '63px';
            top = -size.y*4;
            left = 0;
        }
        var display = (this.isHovering || this.isDragging) ? "block" : "none";
        this.helpElement.setStyles({ 'font-size': fontsize, left:left, top:top, display:display, 'background':'#303030', 'padding': '5px', 'color':'#5F9093' });
    },


    // drag
    
    initializeDrag: function () {
        this.isDragging = false;
        new BVTouchable(this.element, this);
    },
    
    touchDidGoDown: function (touches) {
        this.valueAtMouseDown = this.tangle.getValue(this.variable);
        this.isDragging = true;
        isAnyAdjustableNumberDragging = true;
        this.updateRolloverEffects();
        this.updateStyle();
    },
    
    touchDidMove: function (touches) {
        var value = this.valueAtMouseDown + touches.translation.x / 5 * this.step;
        value = ((value / this.step).round() * this.step).limit(this.min, this.max);
        this.tangle.setValue(this.variable, value);
        this.updateHelp();
    },
    
    touchDidGoUp: function (touches) {
        this.isDragging = false;
        isAnyAdjustableNumberDragging = false;
        this.updateRolloverEffects();
        this.updateStyle();
        this.helpElement.setStyle("display", touches.wasTap ? "block" : "none");
    }
};



//----------------------------------------------------------
//
//  formats
//
//  Most of these are left over from older versions of Tangle,
//  before parameters and printf were available.  They should
//  be redesigned.
//

function formatValueWithPrecision (value,precision) {
    if (Math.abs(value) >= 100) { precision--; }
    if (Math.abs(value) >= 10) { precision--; }
    return "" + value.round(Math.max(precision,0));
}

Tangle.formats.p3 = function (value) {
    return formatValueWithPrecision(value,3);
};

Tangle.formats.neg_p3 = function (value) {
    return formatValueWithPrecision(-value,3);
};

Tangle.formats.p2 = function (value) {
    return formatValueWithPrecision(value,2);
};

Tangle.formats.e6 = function (value) {
    return "" + (value * 1e-6).round();
};

Tangle.formats.abs_e6 = function (value) {
    return "" + (Math.abs(value) * 1e-6).round();
};

Tangle.formats.freq = function (value) {
    if (value < 100) { return "" + value.round(1) + " Hz"; }
    if (value < 1000) { return "" + value.round(0) + " Hz"; }
    return "" + (value / 1000).round(2) + " KHz"; 
};

Tangle.formats.dollars = function (value) {
    return "$" + value.round(0);
};

Tangle.formats.free = function (value) {
    return value ? ("$" + value.round(0)) : "free";
};

Tangle.formats.percent = function (value) {
    return "" + (100 * value).round(0) + "%";
};


    
//----------------------------------------------------------

})();

