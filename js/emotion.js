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
var emo_coord_width = $("#emotion-coord").width(),
    emo_coord_height = $("#emotion-coord").height()-39;
var emo_coord_margin ={top:5,bottom:15,left:10,right:20};

var sliderWidth = $("#emotion-filter").width();
var tagWidth = $("#emotion-filters").width(),
    tagHeight = $("#emotion-filters").height()-$("#rough").height()-30;

//extents of valence & arousal dimension
var minValenceDomain = -2.5,
    maxValenceDomain = 2.5;
var minArousalDomain = -3,
	maxArousalDomain = 3;

//scale valence & arousal rating values according to the above scales
var x = d3.scale.linear()           //valence
    .domain([minValenceDomain,maxValenceDomain])
    .range([0, emo_coord_width-(emo_coord_margin.left+emo_coord_margin.right)])
    .nice();
var y = d3.scale.linear()           //arousal
    .domain([minArousalDomain,maxArousalDomain])
    .range([emo_coord_height-(emo_coord_margin.top+emo_coord_margin.bottom), 10])
    .nice();

var roughscale;
var emotionTags;
var mc;
var fill = d3.scale.category10();


//calculating font size for emotion tag filters based on tag frequency
//Unfortunately, in the current version, the size needs to be adjusted for different screen sizes
function emotionScale (count){
	var size = 10+(count)/5;
	return size+"px"; 
} 

function emotion_drawSearchBox(){
	var keys = emotionTags;
	mc = autocomplete(document.getElementById('sensoryemotion_srchbox'))
				  .keys(keys)
				  .dataField("word")
				  .placeHolder("Search tags here")
				  .onSelected(onSearchSelect)
				  .render(); 
}

function onSearchSelect(d){
	if (window.find) {        // Firefox, Google Chrome, Safari
        if (window.find(d.State, true)) {
        	document.execCommand("hiliteColor", false, "FirstColor");
        	while (window.find(d.State, true)) {
        		document.execCommand("hiliteColor", false, "SecondColor");
        	}
        }
        else {
            alert ("The following text was not found:\n" + d.State);
        }
    }
}
//draw canvas
function emotion_drawCanvas(){
  coordSvg = d3.select("#emotion-coord").append("svg")
                 .attr("width", emo_coord_width)
                 .attr("height", emo_coord_height)
                 .attr("x",emo_coord_margin.left)
                 .attr("y",emo_coord_margin.top)
                 .append("g")
                 .attr("transform", "translate(" + emo_coord_margin.left + "," + emo_coord_margin.top + ")");

  // draw slider
  $("#rough-slider").css("width",sliderWidth);
  roughSlider = d3.select("#rough-slider").append("div");
}

// draw x & y axis
function emotion_drawAxis(){
    // define x & y axes
    var xAxis = d3.svg.axis()
				      .scale(x)
				      .orient("bottom")
				      .tickFormat(function(d){
				    	  if (d == 0){return "";} else {return d;}}); //remove 0
    var yAxis = d3.svg.axis()
				      .scale(y)
				      .orient("left")
				      .tickFormat(function(d){
				    	  if (d == 0){return "";} else {return d;}}); //remove 0

    coordSvg.append("text")
    		.attr({"x":(emo_coord_width-emo_coord_margin.left)/2,
    		 "y":(emo_coord_height-emo_coord_margin.top)/2,
    		 "text-anchor": "end",
    		 "dy": ".71em"})
    		 .text("0");

    coordSvg.append("g")
	        .attr("class", "x axis")
	        .call(xAxis)
	        .attr('transform','translate(0,'+(emo_coord_height-emo_coord_margin.top-emo_coord_margin.bottom)/2+')')
	        .append("text")
	        .attr("class", "coord-label")
	        .attr("x", emo_coord_width-(emo_coord_margin.left+emo_coord_margin.right))
	        .attr("y", -6)
	        .style("text-anchor", "end")
	        .text("Pleasantness")
	        .style("font-size", "16px")
	        .attr("font-weight", "bold");

    coordSvg.append("g")
	        .attr("class", "y axis")
	        .call(yAxis)
	        .attr('transform','translate('+(emo_coord_width-emo_coord_margin.left-emo_coord_margin.right)/2+',0)')
	        .append("text")
	        .attr("class", "coord-label")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end")
	        .text("Urgency")
	        .style("font-size", "16px")
	        .attr("font-weight", "bold");
}

function emotion_drawDots(){
    var mySound;
    var vibrationCircles = coordSvg.selectAll(".dot")
                            .data(vtlib)
                            .enter().append("circle")
                            .attr("class", "emotion_dot")//color set
                            .attr("id",function(d){return "emo"+d.resource;})
                            .attr("r", 6)
                            .attr("cx", function(d) { return x(d.valence); })
                            .attr("cy", function(d) { return y(d.arousal); })
                            .on("mouseover", function(d) {
                                d3.select(this)
                                  .attr("r", 8)
                                  .classed("mouseover",true);
                                d3.select("#phy"+this.id.substr(3))
                                  .attr("r", 8)
                                  .classed("mouseover",true);
                                d3.select("#list"+this.id.substr(3))
	                                .classed("highlight",true);
                                
                                $("#list-view").scrollTo("#list"+this.id.substr(3));

                                d3.select(".tooltip")
                                  .style("opacity",1)
                                  .style("left", (d3.event.pageX - 64) + "px")
                                  .style("top", (d3.event.pageY - 44) + "px");

                                glyph_tooltips
                                    .attr("src", "./PNGglyph/"+this.id.substr(3)+".png")
                                    .attr("width","60px")
                                    .attr("height","40px");

                                mySound = new buzz.sound("./vteffects/"+d.resource, {
                                    formats: [ "wav", "mp3" ]
                                });

                                mySound.play();                    
                            })
                            .on("mouseout", function(d) {
                                d3.select(this)
                                    .attr("r", 6)
                                    .classed("mouseover",false);
                                d3.select("#phy"+this.id.substr(3))
                                    .attr("r", 6)
                                    .classed("mouseover",false);
                                d3.select("#list"+this.id.substr(3))
                                	.classed("highlight",false);

                                d3.select(".tooltip").transition()
                                    .duration(500)
                                    .style("opacity",0);
                                mySound.stop();
                            })
                            .on("contextmenu",function(d){
                            	 d3.event.preventDefault();
                            	  var dt= d;
                            	 if(!d3.select(this).classed("marked"))
                            	 {
                            		 d3.select(this).classed("marked",true);
                            		 d3.select("#phy"+this.id.substr(3)).classed("marked",true);
                                     d3.select("#list"+this.id.substr(3)).classed("marked",true);
                            	 }
                            	 else
                            	 {
                            		 d3.select(this).classed("marked",false);
                            		 d3.select("#phy"+this.id.substr(3)).classed("marked",false);
                                  	 d3.select("#list"+this.id.substr(3)).classed("marked",false);
                            	 }
      				         })
      				        .on("click", function(d){
							     draw_cardView(d);
       				         });
}
//This function scrolls to the correct vibration in list view when a user hovers over a vibration in the physical or emotional views
jQuery.fn.scrollTo = function(elem) { 
    $(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top-($(this).offset().top)/20); 
    return this; 
};

function emotion_drawSlider(){
  var tickVal = ["smooth","","neutral","","rough"];
  roughSlider.call(d3.slider()
               .step(5)
               .axis(d3.svg.axis().ticks(5)
                                  .tickFormat(function(d,i){return tickVal[i];}))
               .min(-10).max(10)
               .value([-10,10])
               //slider filter event
               .on("slide",function(evt, value){
                  f.roughness[0]=value[0];
                  f.roughness[1]=value[1];
                  filter_f();
               }));
}

function emotion_drawCustomFilter(){

	var div = d3.select("#emotion-tagcloud")
				.append("div")
			    .style("position", "relative")
			    .style("width", (tagWidth)+ "px")
			    .style("height", (tagHeight) + "px");	
	div.selectAll("#emotion-tag")
		.data(emotionTags)
		.enter().append("div")
		.attr("class", "customTag")
		.style("width", function(d) {
			var w = d.count; //size of box for an emotion tag filter
			if(w>20)
				w=w*(0.6);
			return w+"%"; })
		.style("font-size",function(d) {
			return emotionScale(d.count);//font size for an emotion tag filter
			})
		.attr("id",function(d) {
			var id = d.word.replace(/\s+/g, '');
			return "emo-"+id; })//set id for the tag to facilitate searching and filtering by other views/functions
		.text(function(d) {return d.word; })
	    .on("mouseover", function (d){
	        var tag = this.textContent;
	 	    vtlib.sort(function(a,b){
		 		if(a.emotionTags.indexOf(tag) != -1)
		 			return -1;
		 		else if (b.emotionTags.indexOf(tag) != -1)
		 			return 1;
		 		else
		 			return 0;
		            });

             draw_listView(vtlib);
             filter_f();

             var fil =vtlib.filter(function(d){return (d.emotionTags.indexOf(tag) != -1);});
             // highlight & preview emotiondots with corresponding tags
             d3.selectAll(".emotion_dot")
                   .classed("highlight",function(d){return (fil.indexOf(d)!=-1);});
             d3.selectAll(".emotion_dot")
                   .attr("r",function(d){if(fil.indexOf(d)!=-1) return 8; else return 6;});
             
             // highlight & preview physical dots with corresponding tags
             d3.selectAll(".physical_dot")
                   .classed("highlight",function(d){return (fil.indexOf(d)!=-1);})
             d3.selectAll(".physical_dot")
                   .attr("r",function(d){if(fil.indexOf(d)!=-1) return 8; else return 6;});

             // highlight & preview list items with corresponding tags
             d3.selectAll(".list_item")
	 			.classed("highlight",function(d){return (fil.indexOf(d)!=-1);});

             d3.select(this).style("font-size",emotionScale(d.count+10))
                            .style("cursor","pointer");  
	     })
	    .on("mouseout", function(d) {
	    	//reset highlights from mouseover
	          d3.selectAll(".emotion_dot").classed("highlight",false).attr("r",6);
	          d3.selectAll(".physical_dot").classed("highlight",false).attr("r",6);
	          d3.selectAll(".list_item").classed("highlight",false);

	          if (!d3.select(this).classed("selected")){
	            d3.select(this).style("font-size",emotionScale(d.count))
	                           .style("background-color",color_unselected);
	          } else{
	            d3.select(this).style("font-size",emotionScale(d.count))
	                           .style("background-color",color_selected);
	          }
	        })
	    .on("click", function(d) {
	            var tag = this.textContent;
	            var index = f.emotionTags.indexOf(tag);

	            if (!d3.select(this).classed("selected")){//if not selected
	                if(index==-1){
	                  f.emotionTags.push(tag);
	                }else{console.log("Error" + tag+ "should not be in f.emotionTags");}

	                filter_f();
	                d3.select(this)
	                  .style("background-color",color_selected)
	                  .classed("selected",true);
	                return d3.select(this).classed("selected",true);
	            } else {
	                if(index!=-1){
	                  f.emotionTags.splice(index,1);
	                }else{console.log("Error" + tag+ "should be in f.emotionTags");}

	                filter_f();
	                d3.select(this)
	                	.style("background-color",color_unselected)
	                	.attr("stroke",false)
	                	.classed("selected",false);
	                return d3.select(this).classed("selected",false);
	            }
	      });
}


function searchTag(arr,item){
	for(i=0; i<arr.length; i++)
		if (arr[i].word == item)
			return 1;
	return -1;
}
