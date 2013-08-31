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
    fretboard.fretboard({tuning: localStorage.getItem("tuning") || "E,B,G,D,A,E"});
    
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
        rootList.removeClass("visible");
    });
    
    var rootList = $(".root-list ul");
    rootList.bind("listpickerchanged", function(event, data){
        selectedRoot.html("<div>{0}</div>".format(data.selectedLabel));
        //fretboard.fretboard({root: root, scale: data.selectedValue})
        //invalidateScale(selectedRootNote, selectedScaleInterval, null);
        localStorage.setItem("selectedRoot", data.selectedLabel);
    });
    rootList.listpicker({selectedLabel: localStorage.getItem("selectedRoot") || "C"});
 
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
        //fretboard.fretboard({root: root, scale: data.selectedValue})
        //invalidateScale(selectedRootNote, selectedScaleInterval, event.target.textContent);
        localStorage.setItem("selectedScale", data.selectedLabel);
    });
    scaleList.listpicker({valueProperty: "interval", selectedLabel: localStorage.getItem("selectedScale") || "Major"});
   
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
                    
                        $(this).find(".tune-up-button").bind("click touchstart", function(event){
                            codeList.drumpicker("next")
                        });
                        $(this).find(".tune-down-button").bind("click touchstart", function(event){
                            codeList.drumpicker("previous")
                        });
                        }
                });
                
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
                });
                //console.log(currentTuning);
                //$(".tuning-knob .code-list").drumpicker();
            }
        }
    });
    
    // show fretboard
    setTimeout(function(){
        fretboard.addClass("visible");
    }, 200);

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
            scale: "Major", // [2,2,1,2,2,2]
            //code: "C",
        },
        
        _container: null,
        
        _chords: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
        
        _noteElements: {},
        
        _create: function() {
            this._container = this.element;
            this._container.empty();
            
            if(!(this.options.tuning instanceof Array)) {
                this.options.tuning = this.options.tuning.split(",");
            }
            
            var maxStrings = 6;
            var maxFrets = 24;
            
            // initialize fretboard
            var frets = $('<div class="frets"></div>');
            for(var i=0; i<=maxFrets; i++) {
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
            for(var i=1; i<=maxStrings; i++){
                var string = $('<div class="string string-{0}"></div>'.format(i));
                //console.logtring);
                
                var openStringChord = this.options.tuning[i-1];
                var chordIndexOffset = this._chords.indexOf(openStringChord);
                
                for(var j=0; j<=maxFrets; j++) {
                    var fret;
                    //if(j==0) {
                        fret = $('<div class="fret fret-{0}"></div>'.format(j));
                    //} else {
                    //    fret = $('<div class="fret fret-{0}" style="width:{1}px"></div>'.format(j, 100 - j*2));
                    //}
                    
                    var chord = this._chords[(chordIndexOffset + j) % this._chords.length];
                    var note = $('<div class="note note-{1}">{0}</div>'.format(chord,chord.replace("#","S")));
                    fret.append(note);
                    
                    //if(scale.contains(chord)) {
                    //    if(chord == root) {
                    //        note.addClass("root");
                    //    }    
                    //} else {
                    //    note.addClass("not-scale");   
                    //}
                    
                    string.append(fret);
                }
                
                strings.append(string);
            }
            this._container.append(strings);
            
            this._setScale(this.options.root, scaleInterval["Major"]);
            
            console.log(scale);
        },
        
        _setScale: function(root, scale) {
            // select notes of scale
            var interval = [2,2,1,2,2,2];
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
                this._noteElements[chord] = $(".fretboard .note-{0}".format(chord.replace("#","S")));
                
                if(scale.contains(chord)) {
                    this._noteElements[chord].removeClass("not-scale");   
                } else {
                    this._noteElements[chord].addClass("not-scale");   
                }
            }
            this._noteElements[this.options.root].addClass("root");
            //window.noteElements = this._noteElements;
        },
        
      
        
        _setOption: function( key, value ) {
            //console.log("{0}-{1} _setOption".format(this.widgetFullName, this.uuid));
            switch(key) {
                case "tuning":
                    if(value && this._children.index(value) > -1) {
                        this._onSelectedItemChanged(value);
                    }
                    break;
                case "root":
                    if(value > -1 && this._children[value]) {
                        this._onSelectedItemChanged(this._children[value]);
                    }
                    break;
                case "scale":
                    if(value != "") {
                        var self = this; 
                        self._children.each(function(){
                            if($(this)[0].textContent == value) {
                                self._onSelectedItemChanged($(this));
                            }
                        });
                    }
                    break;
            }
        },
        
        /*
        // Fretboard ~ 
        var invalidateScale = function(root, interval, scaleName) {
            // update selected state
            selectedRoot.html("<div>{0}</div>".format(root));
            rootList.find(".note").removeClass("selected");
            rootList.find(".note-{0}".format(root.replace("#","S"))).addClass("selected");
            
            if(scaleName) {
                selectedScale.html("{0}".format(scaleName));
                scaleList.find("li").removeClass("selected");
                //scaleList.find("li:contains({0})".format(scaleName)).addClass("selected");
                scaleList.find("li").filter(function (){
                    return $(this).text() == scaleName;
                }).addClass("selected");
            }
            
            //rootList.find(".note-{0}".format(root.replace("#","S"))).addClass("selected");
            
            var notes = $(".fretboard .note");
            notes.removeClass("root");
            notes.removeClass("not-scale");
    
            var rootNote = $(".fretboard .note-{0}".format(root.replace("#","S")));
            rootNote.addClass("root");
            //console.log(".note-{0}".format(root));
            
            //var scale = [];
            var scale = new Array();
            scale[0] = root;
            var chordIndexOffset = chords.indexOf(root);
            var intervalFromRoot = 0;
            for(var i=0; i<interval.length; i++) {
                intervalFromRoot += interval[i];
                scale[i + 1] = chords[(chordIndexOffset + intervalFromRoot) % chords.length];
            }
            
            for(var i=0; i<chords.length; i++) {
                var chord = chords[i];
                if(!scale.contains(chord)) {
                    $(".fretboard .note-{0}".format(chord.replace("#","S"))).addClass("not-scale");   
                }
            }
        };
    
        // build first scale
        invalidateScale(selectedRootNote, selectedScaleInterval, "Major"); // C Major
        // ~ Fretboard
        */
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


