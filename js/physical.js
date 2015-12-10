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
var phy_coord_width = $("#physical-coord").width(),
    phy_coord_height = $("#physical-coord").height()-39;
var phy_coord_margin={top:10,bottom:30,left:35,right:20};
var color = d3.scale.category10();

var phy_x = d3.scale.linear().range([0, phy_coord_width-phy_coord_margin.left-phy_coord_margin.right]);
var phy_y = d3.scale.linear().range([phy_coord_height-phy_coord_margin.top-phy_coord_margin.bottom, 10]);
var phy_xAxis = d3.svg.axis().scale(phy_x).orient("bottom").tickFormat(function(d){if (d == 0){return "";} else {return d;}});;
var phy_yAxis = d3.svg.axis().scale(phy_y).orient("left").tickFormat(d3.format("d"));

//svg
var svg;
var tooltip;
var glyph_tooltips;
var brush;

$(window).load(function() {
  physical_drawCanvas();
});//window onload
	
function physical_drawCanvas(){
    //coordinate svg
    svg = d3.select("#physical-coord").append("svg")
      .attr("width", phy_coord_width)
      .attr("height",phy_coord_height)
      .append("g")
      .attr("transform", "translate(" + phy_coord_margin.left + "," + phy_coord_margin.top + ")");

    svg.append("text")
        .attr("class", "coord-label")
        .attr("x", phy_coord_width-phy_coord_margin.left-phy_coord_margin.right)
        .attr("y", phy_coord_height-phy_coord_margin.top-phy_coord_margin.bottom-6)
        .style("text-anchor", "end")
        .text("Duration (sec)")//append label for x axis
        .style("font-size", "16px")
        .attr("font-weight", "bold");
}
function drawTooltip(){
    //shows an image of the vibration glyph when user hovers over a vibration in physical or emotional view
    tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
    glyph_tooltips = d3.select(".tooltip").append("img");
}

function physical_drawAxis(){
	//set axis extents according to the data range
   phy_x.domain(d3.extent(vtlib, function(d) { return d.duration; })).nice();
   phy_y.domain(d3.extent(vtlib, function(d) { return d.rms_scaled; })).nice();
   svg.append("g")
	  .attr("class", "x axis")
	  .attr("clip-path", "url(#clip)")
	  .attr("transform", "translate(0," + (phy_coord_height-phy_coord_margin.top-phy_coord_margin.bottom) + ")")
	  .call(phy_xAxis);

   //add axis label
	svg.append("g")
	    .attr("class", "y axis")
	    .call(phy_yAxis)
	    .append("text")
	    .attr("class", "coord-label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text("Energy")
	    .style("font-size", "16px")
	    .attr("font-weight", "bold");

    svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", phy_coord_width)
          .attr("height", phy_coord_height);
}
/* disabled */
function drawLegend(){
    var legend = svg.selectAll(".legend")
        			.data(color.domain())
        			.enter().append("g")
        			.attr("class", "legend")
        			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", phy_coord_width - phy_coord_margin.left-phy_coord_margin.right-18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", phy_coord_width - phy_coord_margin.left-phy_coord_margin.right-36)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
}

//draw vibration dots on physical view
function physical_drawDots(){
    var mySound;
    var vibrationCircles = svg.selectAll(".physical_dot")
        .data(vtlib)
        .enter().append("circle")
        .attr("id",function(d){return "phy"+d.resource;})
        .attr("class", "physical_dot")
        .attr("clip-path", "url(#clip)")
        .attr("r", 6)
        .attr("cx", function(d) { return phy_x(d.duration); })
        .attr("cy", function(d) { return phy_y(d.rms_scaled); })
        .style("fill", function(d) {
        				return color(d.structure); })
        .on("mouseover", function(d) {
            // highlight this dot & make it larger
            d3.select(this)
               .attr("r", 8)
               .classed("mouseover",true);
            
            // hightlight its corresponding dot in emotion view
            d3.select("#emo"+this.id.substr(3))
              .attr("r", 8)
              .classed("mouseover",true);
            //hightlight the corresponding row in list view & scroll to it
            d3.select("#list"+this.id.substr(3))
            	.classed("highlight",true);  
            $("#list-view").scrollTo("#list"+this.id.substr(3));

            //show a small visual icon of vibration on mouse over
            d3.select(".tooltip")
              .style("opacity",1)
              .style("left", (d3.event.pageX - 64) + "px")
              .style("top", (d3.event.pageY - 44) + "px");
            glyph_tooltips
               .attr("src", "./PNGglyph/"+this.id.substr(3)+".png")
               .attr("width","60px")
               .attr("height","40px");
            
            //and play the vibration
            mySound = new buzz.sound("./vteffects/"+d.resource, {
                formats: [ "wav", "mp3" ]
            });
            mySound.play();

            })
        .on("mouseout", function(d) {
        	
        	//reset everything and stop vibration playback
            d3.select(this)
               .attr("r", 6)
               .classed("mouseover",false);
            d3.select("#emo"+this.id.substr(3))
               .attr("r", 6)
               .classed("mouseover",false);
            d3.select("#list"+this.id.substr(3))
              .classed("highlight",false);
            
            tooltip.transition()
                .duration(500)
                .style("opacity",0);
            mySound.stop();
        })
        .on("contextmenu",function(d){
        	//bookmarking functionality
        	 d3.event.preventDefault();

        	 if(!d3.select(this).classed("marked"))
        	 {
        		 d3.select(this).classed("marked",true);
        		 d3.select("#emo"+this.id.substr(3)).classed("marked",true);
        		 d3.select("#list"+this.id.substr(3)).classed("marked",true);
        	 }
        	 else
        	 {
        		 d3.select(this).classed("marked",false);
        		 d3.select("#emo"+this.id.substr(3)).classed("marked",false);
        		 d3.select("#list"+this.id.substr(3)).classed("marked",false);
        	 }

         })
	    .on("click", function(d){
	    	//show the popup
		     draw_cardView(d);
        });
}

jQuery.fn.scrollTo = function(elem) { 
    $(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top-($(this).offset().top)/20); 
    return this; 
};

function physical_drawTempo(){
 // slider
  var tempoScale = d3.scale.ordinal()
                           .domain([ "slow", "slow/medium", "medium", "medium/fast", "fast"])
                           .range([0,1,2,3,4]);

  d3.select("#tempo-slider").append("div")
	.call(d3.slider()
	.step(1)
	.axis(d3.svg.axis().scale(tempoScale)
	.ticks(5)
	.tickFormat(function(d, i) { return d%2 == 1 ? null : tempoScale.domain()[i]; }))
	.min(0).max(4)
	.value([0,4])
    .on("slide",function(evt, value){
			          if (f.tempo.indexOf("none (no rhythm)")!=-1)
			            f.tempo =["none (no rhythm)"];
			          else
			            f.tempo = [];
			    
                  var low=value[0];
                  var high=Math.floor(value[1]);

                  //filter vibrations based on tempo
                  while(low<=high){
                    var element = d3.round(low);
                    switch(element){
                      case 0:
                        element = "slow";
                        break;
                      case 1:
                        element = "slow/medium";
                        break;
                      case 2:
                        element = "medium";
                        break;
                      case 3:
                        element = "medium/fast";
                        break;
                      case 4:
                        element = "fast";
                        break;
                    }
                    f.tempo.push(element);
                    low++;
                    filter_f();
                  }
                })//on slide
      );

  // all checkboxes
  d3.selectAll(".filter_button")
     .style("height","14px")//size of checkbox
     .style("width","14px")
     .style("margin-left","5%");

  //
  d3.selectAll(".tempo").on("click",function(){
      var attribute = this.value;
      // rhythmic (slider)
      if (attribute == "1"){
        if (this.checked){
	      d3.select("#tempo-slider")
	        .classed("disabled-slider",false);
	      f.tempo = ["slow","slow/medium","medium","medium/fast","fast"];
        }else{
          d3.select("#tempo-slider")
            .classed("disabled-slider",true);
          f.tempo = [];
             //remove all elements in f.tempo that are not "none (no rhythm)"
        }
        //check if no rhythm was in the f.tempo
        if (d3.select("#no-rhythm").node().checked){f.tempo.push("none (no rhythm)");}

      } else { // "none (no rhythm)"
        if (this.checked){
          if(f.tempo.indexOf(attribute)==-1){f.tempo.push(attribute);}
        }else{
          var index = f.tempo.indexOf(attribute);
          if(index!=-1){f.tempo.splice(index,1)}//remove from f.tempo
        }
      }
      filter_f();
  });
}

//draw notelength filters
function physical_drawNoteLength(){

  d3.selectAll(".structure")
    .on("change",function(){
        var struc = this.value;
        var index =f.structure.indexOf(struc);

        if (this.checked){
          if (index ==-1){
            f.structure.push(struc);
          } else{
            console.log("Error: "+struc+" is already in f.structure");
          }
        } else{ //if checkbox get unchecked
          if (index == -1){
            console.log("Error: "+struc+" is not in f.structure");
          } else {
            f.structure.splice(index,1);
          }
        }
        filter_f();
    });
}

//zooming on physical view
function physical_brushing(){
  brush = d3.svg.brush()
    .x(phy_x)
    .on("brush", brushmove)
    .on("brushend",brushend);

  svg.append("g")
    .attr("class", "brush")
    .call(brush)
    .selectAll('rect')
    .attr('height', phy_coord_height-phy_coord_margin.top-phy_coord_margin.bottom);
}

function brushmove() {
  var extent = brush.extent();
  svg.selectAll(".physical_dot")
    .classed("highlight", function(d) {
            is_brushed = (extent[0] <= d.duration && d.duration <= extent[1]);
            //highlight emotion dots
            d3.select("#emo"+this.id.substr(3))
              .classed("highlight",is_brushed);
            //highlight list-view
            d3.select("#list"+this.id.substr(3))
              .classed("highlight",is_brushed);
            return is_brushed;
          });
}
function brushend() {
  get_button = d3.select(".clear-button");
  if(get_button.empty() === true) {
    clear_button = svg.append('text')
      .attr("y", 0)
      .attr("x", phy_coord_width-2*(phy_coord_margin.left+phy_coord_margin.right))
      .attr("class", "clear-button")
      .text("reset axis")
      .style("cursor","pointer");
  }

  phy_x.domain(brush.extent());
  transition_data();

  reset_axis();
  svg.selectAll(".physical_dot").classed("highlight", false);
  d3.selectAll(".emotion_dot")//if a dot is not highlighted, it will be filtered
              .classed("filtered",function(d){
	            	var filtered = !this.classList.contains("highlight");
	                d3.select("#list"+this.id.substr(3))
	                  .classed("filtered",filtered);
					if(filtered)
						list_filteredIds.push(this.id.substr(3));
	                return filtered;
              });

   d3.selectAll(".filtered").attr("display","none");
   d3.selectAll(".emotion_dot").classed("highlight",false);
   d3.selectAll(".list_item").classed("highlight",false);


  d3.select(".brush").call(brush.clear());


  clear_button.on('click', function(){
    phy_x.domain(d3.extent(vtlib, function(d) { return d.duration; })).nice();
    transition_data();
    reset_axis();
    clear_button.remove();
  });
}
//transition vibration dots after zooming to the new locations
function transition_data() {
	svg.selectAll(".physical_dot")
	    .data(vtlib)
	    .transition()
	    .duration(500)
	    .attr("cx", function(d) { return phy_x(d.duration); });
}

//reset axis after zooming to the initial range
function reset_axis() {

    svg.transition().duration(500)
        .select(".x.axis")
        .call(phy_xAxis);

    d3.selectAll(".emotion_dot").classed("filtered",false);
    d3.selectAll(".list_item").classed("filtered",false);
    list_filteredIds =[];

    filter_f();

}
