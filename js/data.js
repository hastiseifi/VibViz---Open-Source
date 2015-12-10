/*
 Copyright (c) <2015>, <Hasti Seifi, Karon E. MacLean , Kailun Zhang from SPIN lab, University of British Columbia>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the SPIN lab or UBC nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL COPYRIGHT HOLDERS (Hasti Seifi, Karon E. MacLean, Kailun Zhang)
BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,OR CONSEQUENTIAL
DAMAGES(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
//dataset
var vtlib;
// object for filtering 
var f = {
          "duration": null,
          "rms_scaled": null,
          "tempo": [],
          "structure": [],
          "roughness": [0,0],
          "valence": null,
          "arousal": null,
          "emotionTags": [],
          "metaphorTags": [],
          "usageExampleTags": []};
var list_filteredIds =[];
var bookMarkIds =[];
var search_matches =[];
var color_selected = "#01DFD7";
var color_unselected = "#EFFBF8";
var color_inactive = "";
var color_search = "#FFFF00";


//initialize is being called in test.html
function initialize(){
    drawTooltip();

  d3.json("VibLib-VibViz.json",function(error, data){

    vtlib = data;
    /* define filtering options (f:filter) */
    f.roughness = d3.extent(vtlib, function(d) {return d.roughness; });
    f.tempo = ["slow","slow/medium","medium","medium/fast","fast","none (no rhythm)"];
    f.structure = ["short note rhythm","medium note rhythm","long note rhythm","constant","varied rhythm"];

    //preparing & drawing physical view 
    //functions are called from physical.js
    physical_brushing();//allows zooming on Physical view - This function has a bug and sometimes malfunctions
    physical_drawAxis();
    physical_drawDots();
    physical_drawTempo();
    physical_drawNoteLength();

    //preparing & drawing emotional view 
    //functions are called from emotion.js
    emotionTags = createTags(vtlib,"emotionTags");
    emotion_drawCanvas();
    emotion_drawAxis();
    emotionTags.sort(customComparator);
    emotion_drawDots();
    emotion_drawSlider();
    emotion_drawSearchBox();
    emotion_drawCustomFilter();

	 // preparing & drawing mixed metaphor & usage example
    //functions are called from mixedview.js
    metaphorTags = createTags(data,"metaphorTags");
    metaphorTags.sort(customComparator);
    metaphor_drawCustomFilter();  
	usageExampleTags = createTags(data,"usageExampleTags");
	usageExampleTags.sort(customComparator);
    usage_drawCustomFilter();
    draw_listView(vtlib);

    //prepare search database
    initializeSearch();
    
  });
}


//create data structure for tag filters, example -> {"word":"calm","cnt":"3"}
function createTags(data,attribute){
    var tagCounts = [];
    for (var k in data){
        var tagarray = [];
        if (attribute == "emotionTags"){
            tagarray = data[k].emotionTags;
        } else if(attribute == "metaphorTags"){
            tagarray = data[k].metaphorTags;
        } else if(attribute == "usageExampleTags"){
            tagarray = data[k].usageExampleTags;
        }
        for (var t in tagarray){
            var tag = tagarray[t];
            if (typeof tagCounts[tag] == 'undefined'){
                // if tag is not in tagCounts yet, initialize the counter to 1
                tagCounts[tag] = 1;
            } else {
                tagCounts[tag] += 1;
            }
        }
    }
    var arr = [];//temp array with data structure {"word":"calm","cnt":"3"}
    var k = 0;
    for (var t in tagCounts){
      arr.push({key  :k,
                word :t,
                count:tagCounts[t]
               });
      k++;
    }
    return arr;
}


function filter_f(){
    var vt_f =[];
    vt_f = vtlib.filter(function(d){

    //tempo
    if (f.tempo.indexOf(d.tempo) == -1) return false;
    //roughness
    if (d.roughness<f.roughness[0] || d.roughness>f.roughness[1]) return false;
    //structure
    if (f.structure.indexOf(d.structure) == -1) return false;
    // emotiontags
    var filter_emo=d.emotionTags;
    for (i = 0; i<f.emotionTags.length;i++) {
      if (filter_emo.indexOf(f.emotionTags[i])==-1) return false;
    }
    // metaphor
    var filter_meta=d.metaphorTags;
    for (i = 0; i<f.metaphorTags.length;i++) {
      if (filter_meta.indexOf(f.metaphorTags[i])==-1) return false;
    }
    // usage example
    var filter_usage=d.usageExampleTags;
    for (i = 0; i<f.usageExampleTags.length;i++) {
      if (filter_usage.indexOf(f.usageExampleTags[i])==-1) return false;
    }
    return true;
  });
  
  // redraw emotion view
  d3.selectAll(".emotion_dot")
      .attr("display",function(d){
        return (vt_f.indexOf(d)==-1)?"none":null;
      });
  // redraw physical view
  d3.selectAll(".physical_dot")
      .classed("filter2",function(d){
        return (this.classList.contains("filtered"))||(vt_f.indexOf(d)==-1);
      });
  // redraw list view
  d3.selectAll(".list_item")
      .classed("filter2",function(d){
        return (this.classList.contains("filtered"))||(vt_f.indexOf(d)==-1);
      });
}

function draw_cardView(d){
    var mySound;
    var imgname = "./PNGglyph/"+d.resource+".png";
        $('#cardViewModal').modal();
        $('#cardViewModal').find('.modal-header h4').text(d.resource);//d.resource is the name of a vibration's wavefile.
    var modalBody = $('#cardViewModal').find('.modal-body');
        modalBody.find('#glyph').attr('src',imgname);
        modalBody.find('#duration').text(Math.round(d.duration*10)/10);
        modalBody.find('#energy').text(d.rms_scaled);
        modalBody.find('#tempo').text(d.tempo);
        modalBody.find('#roughness').text(d.roughness);
        modalBody.find('#valence').text(Math.round(d.valence*10)/10);
        modalBody.find('#arousal').text(Math.round(d.arousal*10)/10);
        modalBody.find('#emotionTags').text(d.emotionTags);
        modalBody.find('#metaphorTags').text(d.metaphorTags);
        modalBody.find('#usageExampleTags').text(d.usageExampleTags);
}

function customComparator(a,b){
	  if (a.word > b.word) {
	    return 1;
	  }
	  if (a.word < b.word) {
	    return -1;
	  }
	  return 0;
}

function initializeSearch(){
	//set up search actions on emotion view
	d3.select("#emotion_searchbox")
	  .on("keyup", function(){ 
		  d3.selectAll(".customTag")
		  	.style("background-color",function(){
		  		if(d3.select(this).classed("selected"))
		  			return color_selected;
		  		else
		  			return color_unselected;
		  	});
		  
		  var searchTerm=document.getElementById('emotion_searchbox').value;
		  if(searchTerm.lenght<=0 || searchTerm=="")
		  {
			  console.log("no search");
			  return;
		  }
		  //highlight all emotion tag filters starting with the search term
		  for(i=0; i<emotionTags.length; i++)
		  {
			  var t = emotionTags[i];
			  if(t.word.indexOf(searchTerm)==0)
			  {
				  var id = t.word.replace(/\s+/g, '');
				  d3.select("#emo-"+id)
				  	.style("background-color",color_search);
			  }
		  }
	  });
	//prepare metaphor search box
	d3.select("#metaphor_searchbox")
	  .on("keyup", function(){ 
		  d3.selectAll(".customTag")
		  	.style("background-color",function(){
		  		if(d3.select(this).classed("selected"))
		  			return color_selected;
		  		else
		  			return color_unselected;
		  	});
		  
		  var searchTerm=document.getElementById('metaphor_searchbox').value;
		  if(searchTerm.lenght<=0 || searchTerm=="")
		  {
			  console.log("no search");
			  return;
		  }
		  //highlight all metaphor tag filters starting with the search term
		  for(i=0; i<metaphorTags.length; i++)
		  {
			  var t = metaphorTags[i];
			 
			  if(t.word.indexOf(searchTerm)==0)
			  {
				  var id = t.word.replace(/\s+/g, '');
				  id = id.replace(/\//g, '');
				  d3.select("#meta-"+id)
				  	.style("background-color",color_search);
			  }
		  }
	  });
	
	//prepare usage search box
	d3.select("#usage_searchbox")
	  .on("keyup", function(){ 
		  d3.selectAll(".customTag")
		  	.style("background-color",function(){
		  		if(d3.select(this).classed("selected"))
		  			return color_selected;
		  		else
		  			return color_unselected;
		  	});
		  	
		  //highlight all usage tag filters starting with the search term
		  var searchTerm=document.getElementById('usage_searchbox').value;
		  if(searchTerm.lenght<=0 || searchTerm=="")
		  {
			  console.log("no search");
			  return;
		  }
		  for(i=0; i<usageExampleTags.length; i++)
		  {
			  var t = usageExampleTags[i];
			 
			  if(t.word.indexOf(searchTerm)==0)
			  {
				  var id = t.word.replace(/\s+/g,'').replace(/\//g,'');
				  d3.select("#usage-"+id)
				  	.style("background-color",color_search);
			  }
		  }
	  });
}
