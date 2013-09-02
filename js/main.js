//--------------------------------------------------------------------------
//
//  Constants
//
//--------------------------------------------------------------------------



//--------------------------------------------------------------------------
//
//  Variables
//
//--------------------------------------------------------------------------

var selectedRootNote = "C";
var selectedScaleInterval = [2,2,1,2,2,2]; //Major Scale

//--------------------------------------------------------------------------
//
//  Initialize
//
//--------------------------------------------------------------------------

//----------------------------------
//  Adjust unexpected behaviors
//----------------------------------

/**
 * Prevent browser scrolling.
 */
window.addEventListener("touchmove", function(event){
    event.preventDefault();
});

//----------------------------------
//  Main initialize processes
//----------------------------------

/**
 * Document ready.
 */
$(document).ready(function() {
    //console.log("document.ready");
    
    // hide address bar (for iPhone & Android only)
    if($.hm.isMobile) {
       setTimeout(scrollTo,100,0,1);
    }
    
    // fretboard
    var fretboard = $(".fretboard:first");
    fretboard.fretboard({
        tuning: localStorage.getItem("tuning") || "E,B,G,D,A,E",
        root: localStorage.getItem("root") || "C",
        scale: localStorage.getItem("scale") || "Major"
    });
    fretboard.flickable();
    
    // root controls
    var selectedRoot = $(".control .selected-root");
    var rootListPanel = $(".root-list");
    selectedRoot.bind("click touchstart", function(event){
        event.preventDefault();        
        
        if(rootListPanel.hasClass("visible")) {
            rootListPanel.removeClass("visible");
        } else {
            rootListPanel.addClass("visible");
            scaleListPanel.removeClass("visible");
        }
        
    });
    rootListPanel.find(".close-button").bind("click touchstart", function(event){
        rootListPanel.removeClass("visible");
    });
    
    var rootList = $(".root-list ul");
    rootList.bind("listpickerchanged", function(event, data){
        selectedRoot.html("<div>{0}</div>".format(data.selectedLabel));
        fretboard.fretboard({root: data.selectedLabel});
        localStorage.setItem("root", data.selectedLabel);
    });
    rootList.listpicker({selectedLabel: localStorage.getItem("root") || "C"});
 
    // scale controls
    var selectedScale = $(".selected-scale");
    var scaleListPanel = $(".scale-list");
    selectedScale.bind("click touchstart", function(event){
        event.preventDefault();
        
        if(scaleListPanel.hasClass("visible")) {
            scaleListPanel.removeClass("visible");
        } else {
            rootListPanel.removeClass("visible");
            scaleListPanel.addClass("visible");
        }
    });  
    scaleListPanel.find(".close-button").bind("click touchstart", function(event){
        scaleListPanel.removeClass("visible");
    });
    
    var scaleList = $(".scale-list ul");
    scaleList.bind("listpickerchanged", function(event, data){
        selectedScale.html("{0}".format(data.selectedLabel));
        fretboard.fretboard({scale: data.selectedLabel});
        localStorage.setItem("scale", data.selectedLabel);
    });
    scaleList.listpicker({valueProperty: "interval", selectedLabel: localStorage.getItem("scale") || "Major"});
   
    // tuning controls
    var tuningControl = $(".tuning-control:first");
    var tuningPanel = tuningControl.find(".tuning-panel");
    var isTuningKnobInitialized = false;
    tuningControl.find("button.tuning").bind("click touchstart", function(){
        event.preventDefault();
        //console.log(tuningPanel);
        
        if(tuningPanel.hasClass("visible")) {
            tuningPanel.removeClass("visible");
        } else {
            tuningPanel.addClass("visible");
            
            if(!isTuningKnobInitialized) {
                var currentTuning = localStorage.getItem("tuning") || "E,B,G,D,A,E";
                currentTuning = currentTuning.split(",");
                //console.log(currentTuning);
                
                var tuningKnobs = $(".tuning-knob");
                tuningKnobs.each(function(){
                    var codeList = $(this).find(".code-list");
                    if(codeList) {
                       
                        var tuningKnobsIndex = tuningKnobs.index($(this));
                        //console.log(currentTuning[tuningKnobsIndex]);
                        codeList.drumpicker({selectedLabel: currentTuning[tuningKnobsIndex]});
                    
                        $(this).find(".tune-up-button").bind("touchstart click", function(){
                            event.preventDefault();
                            codeList.drumpicker("next");
                        });
                        $(this).find(".tune-down-button").bind("touchstart click", function(){
                            event.preventDefault();
                            codeList.drumpicker("previous");
                        });
                        }
                });
                
                var tuningTimer;
                var codeLists = $(".code-list");
                codeLists.bind("drumpickerchanged",function(event, data){
                    //console.log(data);
                    var currentTuning = [];
                    codeLists.each(function(){
                        //console.log(codeLists.index($(this)));
                        //console.log($(this).drumpicker("option","selectedLabel"));
                        currentTuning.push($(this).drumpicker("option","selectedLabel"));
                    });
                    //console.log(currentTuning);
                    localStorage.setItem("tuning", currentTuning);
                    
                    clearTimeout(tuningTimer);
                    tuningTimer = setTimeout(function(){
                        fretboard.fretboard({tuning: currentTuning});
                    }, 400); 
                    
                });
                //console.log(currentTuning);
                //$(".tuning-knob .code-list").drumpicker();
                
                isTuningKnobInitialized = true;
            }
        }
    });
    
    // show fretboard
    setTimeout(function(){
        fretboard.addClass("visible");
    }, 400);

    // load sns share counts
    tweetCount($("#header div.twitter .sns-count-bubble"), 'http://guitar-scale.heavymery.net/');
    likeCount($("#header div.facebook .sns-count-bubble"), 'http://guitar-scale.heavymery.net/');
});

//----------------------------------
//  Fretboard Control
//----------------------------------

(function($){
    
    $.widget( "hm.fretboard", {
        options: {
            tuning: ["E","B","G","D","A","E"],
            root: "C",
            scale: "Major", 
            maxStrings: 6,
            maxFrets: 24
        },
        
        _container: null,
        
        _chords: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
        
        _noteElements: {},
        
        _create: function() {
            this._container = this.element;
            
            if(!(this.options.tuning instanceof Array)) {
                this.options.tuning = this.options.tuning.split(",");
            }
            
            this._buildFretboard(this.options.tuning);
            
            this._setScale(this.options.root, this.options.scale);
        },
        
        _buildFretboard: function() {
            this._container.empty();
            
            // initialize fretboard
            var frets = $('<div class="frets"></div>');
            for(var i=0; i<=this.options.maxFrets; i++) {
                var fret;
                //if(i==0) {
                    fret = $('<div class="fret fret-{0}"></div>'.format(i));
                //} else {
                //  fret = $('<div class="fret fret-{0}" style="width:{1}px"></div>'.format(i, 100 - i*2));
                //}
                
                // append dot
                if(i==3 || i==5 || i==7 || i==9 || i==15 || i==17 || i==19 || i==21) {
                    fret.append('<div class="dot"></div>');    
                } else if(i==12 || i==24) {
                    fret.append('<div class="double-dot"></div><div class="double-dot"></div>');
                }
                
                frets.append(fret);
            }
            this._container.append(frets);
            
            // append strings
            var strings = $('<div class="strings"></div>');
            for(var i=1; i<=this.options.maxStrings; i++){
                var string = $('<div class="string string-{0}"></div>'.format(i));
                this._buildString(string, i);
                strings.append(string);
                this._strings.push(string);
            }
            this._container.append(strings);
            
            for(var i=0; i<this._chords.length; i++) {
                var chord = this._chords[i];
                this._noteElements[chord] = $(".fretboard .note-{0}".format(chord.replace("#","S")));
            }
        },
        
        _strings: [],
        
        _updateTuning: function(tuning){
            for(var i=0; i<this.options.tuning.length; i++) {
                if(this.options.tuning[i] != tuning[i]) {
                    this._buildString(this._strings[i], i + 1);
                }
            }
            
            // TODO: tuning with no element rebuild. 
            for(var i=0; i<this._chords.length; i++) {
                var chord = this._chords[i];
                this._noteElements[chord] = $(".fretboard .note-{0}".format(chord.replace("#","S")));
            }
        },
        
        _buildString: function(element, stringNumber){
            element.empty();
            
            var openStringChord = this.options.tuning[stringNumber - 1];
            var chordIndexOffset = this._chords.indexOf(openStringChord);
            
            for(var j=0; j<=this.options.maxFrets; j++) {
                var fret = $('<div class="fret fret-{0}"></div>'.format(j));
                var chord = this._chords[(chordIndexOffset + j) % this._chords.length];
                var note = $('<div class="note note-{1}">{0}</div>'.format(chord,chord.replace("#","S")));
                fret.append(note);
                element.append(fret);
            }
        },
        
        _scaleInterval: {
            "Major": [2,2,1,2,2,2],
            "Natural Minor":  [2,1,2,2,1,2],
            "Harmonic Minor": [2,1,2,2,1,3],
            "Melodic Minor":  [2,1,2,2,2,2],
            "Whole Tone": [2,2,2,2,2],
            "Diminished": [2,1,2,1,2,1,2],
            "Chromatic":  [1,1,1,1,1,1,1,1,1,1,1],
            "Major Pentatonic": [2,2,3,2],
            "Minor Pentatonic": [3,2,2,3],
            "Spanish":   [1,2,1,1,2,1,2],
            "Hungarian": [2,1,3,1,2,2],
            "Spanish Gypsy":   [1,3,1,2,1,3,1],
            "Hungarian Gypsy": [2,1,3,1,1,2,2]
        },
        
        _setScale: function(root, scale) {
            // select notes of scale
            var interval = this._scaleInterval[this.options.scale];
            var scale = new Array();
            scale[0] = this.options.root;
            var chordIndexOffset = this._chords.indexOf(this.options.root);
            var intervalFromRoot = 0;
            for(var i=0; i<interval.length; i++) {
                intervalFromRoot += interval[i];
                scale[i + 1] = this._chords[(chordIndexOffset + intervalFromRoot) % this._chords.length];
            }
            
            // set class for notes
            for(var i=0; i<this._chords.length; i++) {
                var chord = this._chords[i];
                
                this._noteElements[chord].removeClass("root");
                
                if(scale.contains(chord)) {
                    this._noteElements[chord].removeClass("not-scale");   
                } else {
                    this._noteElements[chord].addClass("not-scale");   
                }
            }
            this._noteElements[this.options.root].addClass("root");
        },
        
        _setOption: function( key, value ) {
            //console.log("{0}-{1} _setOption".format(this.widgetFullName, this.uuid));
            switch(key) {
                case "tuning":
                    var oldTuning = this.options.tuning;
                    this.options.tuning = (value instanceof Array) ? value : value.split(",");
                    this._updateTuning(oldTuning);
                    this._setScale(this.options.root, this.options.scale);
                    break;
                case "root":
                    this.options.root = value;
                    this._setScale(this.options.root, this.options.scale);
                    break;
                case "scale":
                    this.options.scale = value;
                    this._setScale(this.options.root, this.options.scale);
                    break;
            }
        }
    });
    
    $.widget.bridge("hm_fretboard", $.hm.fretboard);
    
})(jQuery);

//--------------------------------------------------------------------------
//
//  Event handlers
//
//--------------------------------------------------------------------------

//----------------------------------
//  Screen size & orientation
//----------------------------------

/**
 * Window resize event handler.
 */
var resizeEventTimer;
$(window).resize(function() {
    //console.log("window.resize");
  
    clearTimeout(resizeEventTimer);
    resizeEventTimer = setTimeout(function() {

    }, 100);
});
    
//--------------------------------------------------------------------------
//
//  Functions
//
//--------------------------------------------------------------------------


