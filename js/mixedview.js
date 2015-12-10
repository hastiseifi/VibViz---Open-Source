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

//usage related
var usageTagWidth = $("#usage-filters").width(),
    usageTagHeight = $("#usage-filters").height()-100;

var usageExampleTags;
var usageTagCloud;

//fontsize for usage tag filters
function usageScale(count){
	var size = 12+(count)/4;
	return size;
}
var metaphorTagWidth = $("#metaphor-filters").width(),
	metaphorTagHeight = $("#metaphor-filters").height()-25;

var metaphorTags;
var metaphorTagCloud;

//fontsize for metaphor tag filters
function metaphorScale(count){
	var size = 14+(count)/3;
	return size;
}

function draw_listView(data){

    d3.selectAll("#glyph_table").remove();
    var table = d3.select("#glyph-list").append("table")
                    .attr("class","table-striped table-hover")
                    .attr("id","glyph_table");

    var thead = table.append("thead"), // head of table
        tbody = table.append("tbody");
    var columns = ["metaphorTags","resource","usageExampleTags"];
    var names = ["Metaphor Tags","Vibration Pattern","Usage Example"];
    var mySound;
    //append the header row
    thead.append("tr")
         .selectAll("th")
         .data(columns)
         .enter()
         .append("th")
         .attr("class",function(column,i){
            switch(i){
              case 0:
                return "col-md-3";
                break;
              case 1:
                return "col-md-4";
                break;
              case 2:
                return "col-md-5";
                break;
            }
          })
          .style("display",null)
          .text(function(column,i){return names[i];});
    
    //create a row for each object in the data
    var rows = tbody.selectAll("tr")
		            .data(vtlib)
		            .enter()
		            .append("tr")
		            .attr("class","list_item")
		            .attr("id",function(d){
                                  return "list"+d.resource;})
                    .classed("filtered",function(d){
								if(list_filteredIds.indexOf(d.resource)!=-1)//change this later
									return true;
								else
									return false;})
				 	.classed("marked", function (d){
				 		console.log("is marked:"+d.resource);
				 		if(bookMarkIds.indexOf(d.resource)!=-1)
				 			return true;
				 		else 
				 			return false;
				 	})
		           .on("mouseover",function(d){
		        	   //highlight corresponding vibration dots on physical and emotional views
		              d3.select("#emo"+d.resource).attr("r",8).classed("mouseover",true);
		              d3.select("#phy"+d.resource).attr("r",8).classed("mouseover",true);
		
		              //play the vibration
		              mySound = new buzz.sound("./vteffects/"+d.resource, {
		                formats: [ "wav", "mp3" ]
		              });
		              mySound.play();})
		           .on("mouseout",function(d){
		              d3.select("#emo"+d.resource).attr("r",6).classed("mouseover",false);
		              d3.select("#phy"+d.resource).attr("r",6).classed("mouseover",false);
		
		              mySound.stop();
		           })
		           .on("click", function(d){
		        	   draw_cardView(d);
		           })
		           //bookmark functionality
		           .on("contextmenu",function(d){
	        	   			d3.event.preventDefault();
							 if(!d3.select(this).classed("marked"))
							 {
								 bookMarkIds.push(this.id.substr(4));
								 d3.select(this).classed("marked",true);
								 //apply bookmark to physical and emotional views
								 d3.select("#emo"+this.id.substr(4)).classed("marked",true);
								 d3.select("#phy"+this.id.substr(4)).classed("marked",true);
							 }
							 else
							 {
								 var index = bookMarkIds.indexOf(this.id.substr(4));
								 if (index > -1)
									 bookMarkIds.splice(index, 1);
								 d3.select(this).classed("marked",false);
								 d3.select("#emo"+this.id.substr(4)).classed("marked",false);
								 d3.select("#phy"+this.id.substr(4)).classed("marked",false);
							 }
					         });
    //create a cell in each row for each column
    var cells = rows.selectAll("td")
			        .data(function(row){
			          return columns.map(function(column){
			            return {column:column,value:row[column]};
			          });
			        })
			        .enter()
			        .append("td")
			          .attr("class",function(d){
			            if (d.column =="metaphorTags"){return "metaphor_text"}
			            else if (d.column =="resource"){return "glyph_img";}
			            else{return "usage_text";}
			          })
			          .text(function(d){

				            if (d.value!=null && d.column !="resource"){
				              if (d.value.length==0){return "n/a"; }
				              else{
				                 var str = d.value[0];
				                 for (i=1; i<d.value.length; i++){
				                   str += ", "+d.value[i];
				                 }
				                 return str;
				              }
				            }
			          		});//append text

    //append image of vibrations to the list
      d3.selectAll(".glyph_img")
       .data(data)
       .append('img')
       .attr('src',function(d){ return './PNGglyph/'+d.resource+'.png';})
       .attr('width', '60%')
       .attr("class", "col-sm-offset-2");
};


/*draw custom tag filters */
function metaphor_drawCustomFilter(){
	
	var div = d3.select("#metaphor-tagcloud")
				.append("div")
			    .style("position", "relative")
			    .style("width", metaphorTagWidth + "px")
			    .style("height", (metaphorTagHeight) + "px");
	
	div.selectAll("#metaphor-tag")
		.data(metaphorTags)
		.enter().append("div")
		.attr("class", "customTag")
		.style("width", function(d) {//size of metaphor tag filters
			var w = 10+d.count; 
			if(w<20)
				w=20;
			return w+"%"; })
		.style("font-size",function(d) {	
			return metaphorScale(d.count)+"px"; })
		.attr("id",function(d) {
			var id = d.word.replace(/\s+/g, '');
			return "meta-"+id; })
		.text(function(d) {return d.word; })
        .on("mouseover", function(d){

         	var tag = this.textContent;
            //linked highlighting for the list view : sorting the list
            //sort the selected group to be at the top of the list view
           vtlib.sort(function(a,b){
            	if(a.metaphorTags.indexOf(tag) != -1)
            	{
            		a.metaphorTags.sort(function(t1,t2){//sort the tagList for each vibration based on the hovered over tag
            			if(t1 === tag)
            				return -1;
            			if(t2 === tag)
            				return 1;
            			return 0;
            		});
            		return -1;
            	}
            	else if (b.metaphorTags.indexOf(tag) != -1)
            	{
            		b.metaphorTags.sort(function(t1,t2){
            			if(t1 === tag)
            				return -1;
            			if(t2 === tag)
            				return 1;
            			return 0;
            		});
            		return 1;
            	}
            	else
            		return 0;
            });

            draw_listView(vtlib);
            filter_f();
            //highlight them on all views
            var fil = vtlib.filter(function(d){return (d.metaphorTags.indexOf(tag) != -1);});

            // highlight & preview emotion & physical dots with corresponding tags
            d3.selectAll(".emotion_dot")
              .classed("highlight",function(d){return (fil.indexOf(d)!=-1);});

            d3.selectAll(".physical_dot")
              .classed("highlight",function(d){return (fil.indexOf(d)!=-1);});

            //these next lines do not work properly
            //scroll to the corresponding item on list view & highlight it
             d3.selectAll(".list_item")
            	.classed("highlight",function(d){return (fil.indexOf(d)!=-1);});
            $("div").scrollTop(0);
            //end of linked highlighting for list view

            return d3.select(this).style("font-size",metaphorScale(d.count)+2+"px")
                                  .style("cursor","pointer");
      })
      .on("mouseout", function(d) {//reset everything

            d3.selectAll(".emotion_dot").classed("highlight",false);
            d3.selectAll(".physical_dot").classed("highlight",false);
            d3.selectAll(".list_item").classed("highlight",false);

            if (!d3.select(this).classed("selected")){
              d3.select(this).style("font-size",metaphorScale(d.count)+"px")
                             .style("background-color",color_unselected);
            } else{
              d3.select(this).style("font-size",metaphorScale(d.count)+"px")
                             .style("background-color",color_selected);
            }
      })
     .on("click", function(d) {
          var tag = this.textContent;
          var index = f.metaphorTags.indexOf(tag);

          if (!d3.select(this).classed("selected")){//if the tags was not selected, add it to filters
              if(index==-1){
                  f.metaphorTags.push(tag);
              }else {console.log("Error" + tag+ "should not be in f.metaphorTags");}

              filter_f();

              return d3.select(this)
                          .style("background-color",color_selected)
                          .classed("selected",true);
          } else {//if the tag was previously selected, remove it from filters
              if (index!=-1){
                  f.metaphorTags.splice(index,1);
              }else {console.log("Error" + tag+ "should be in f.metaphorTags");}

              filter_f();
              return d3.select(this)
                          .style("background-color",color_unselected)
                          .attr("stroke",false)
                          .classed("selected",false);
          }
      });
};

function usage_drawCustomFilter(){

	var div = d3.select("#usage-tagcloud")
				.append("div")
			    .style("position", "relative")
			    .style("width", usageTagWidth + "px")
			    .style("height", (usageTagHeight) + "px");
			
	div.selectAll("#usage-tag")
		.data(usageExampleTags)
		.enter().append("div")
		.attr("class", "customTag")
		.style("width", function(d) {//font size for usage tag filters
			var w = 32+d.word.length*7+d.count;
			return w+"px"; })
		.style("font-size",function(d) {	
			return usageScale(d.count)+"px"; })
		.attr("id",function(d) {
			var id = d.word.replace(/\s+/g, '');
			return "usage-"+id; })
		.text(function(d) {return d.word; })
	    .on("mouseover", function(d){

	           var tag = this.textContent;
	           var fil = vtlib.filter(function(d){return (d.usageExampleTags.indexOf(tag) != -1);});

	           //linked highlighting for the list view : sorting the list
	           //sort the selected group to be at the top of the list view
	           vtlib.sort(function(a,b){
	           	if(a.usageExampleTags.indexOf(tag) != -1)
	           	{
	           		a.usageExampleTags.sort(function(t1,t2){//sort the tagList for each vibration based on the mouseover tag
	           			if(t1 === tag)
	           				return -1;
	           			if(t2 === tag)
	           				return 1;
	           			return 0;
	           		});
	           		return -1;
	           	}
	           	else if (b.usageExampleTags.indexOf(tag) != -1)
	           	{
	           		b.usageExampleTags.sort(function(t1,t2){
	           			if(t1 === tag)
	           				return -1;
	           			if(t2 === tag)
	           				return 1;
	           			return 0;
	           		});
	           		return 1;
	           	}
	           	else
	           		return 0;
	           });
	
	           draw_listView(vtlib);
	           filter_f();
	
	           // highlight & preview emotion & physical dots with corresponding tags
	           d3.selectAll(".emotion_dot")
	               .classed("highlight",function(d){return (fil.indexOf(d)!=-1);});
	
	           d3.selectAll(".physical_dot")
	               .classed("highlight",function(d){return (fil.indexOf(d)!=-1);});
	
	           d3.selectAll(".list_item")
	       		.classed("highlight",function(d){return (fil.indexOf(d)!=-1);});
	
	           $("div").scrollTop(0);
	           
	           return d3.select(this).style("font-size",usageScale(d.count)+2+"px")
	                                 .style("cursor","pointer");
         })
         .on("mouseout", function(d) {

               d3.selectAll(".emotion_dot").classed("highlight",false);
               d3.selectAll(".physical_dot").classed("highlight",false);
               d3.selectAll(".list_item").classed("highlight",false);

               if (!d3.select(this).classed("selected")){
                 return d3.select(this).style("font-size",usageScale(d.count)+"px")
                                       .style("background-color",color_unselected);
               } else{
                 return d3.select(this).style("font-size",usageScale(d.count)+"px")
                                       .style("background-color",color_selected);
               }

         })
         .on("click",function(d) {
             var tag = this.textContent;
             var index = f.usageExampleTags.indexOf(tag);

             if (!d3.select(this).classed("selected")){//if the tags was not selected
                 if(index==-1){
                     f.usageExampleTags.push(tag);
                 }else {console.log("Error" + tag+ "should not be in f.uageExampleTags");}

                 filter_f();

                 return d3.select(this)
                             .style("background-color",color_selected)
                             .classed("selected",true);
             } else {
                 if (index!=-1){
                     f.usageExampleTags.splice(index,1);
                 }else {console.log("Error" + tag+ "should be in f.usageExampleTags");}

                 filter_f();
                 return d3.select(this)
                             .style("background-color",color_unselected)
                             .attr("stroke",false)
                             .classed("selected",false);
             }
         });

}




