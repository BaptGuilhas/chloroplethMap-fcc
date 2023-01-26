function main() {
  var width = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    ),
    height = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );

  //zoom
  var zoom = d3.zoom().on("zoom", function () {
    var transform = d3.zoomTransform(this);
    map.attr("transform", transform);
  });

  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width - 20)
    .attr("height", height - 88)
    .attr("id", "svg1")
    .call(zoom);

  // creation of map (g)
  var map = svg
    .append("g")
    .attr("class", "map")
    .attr("transform", "scale(0.8) translate(350,40)");
  // data avec queue, defer, await, function avec callback (drawMap)

  d3.queue()
    // .defer(d3.json, " us.json")
    .defer(d3.json, "counties.json")
    .defer(d3.json, "for_user_education.json")
    .await(function (error, counties, data) {
      if (error) {
        console.error("Oh dear, something went wrong: " + error);
      } else {
        drawMap(counties, data);
      }
    });

  //defining function avec callback (drawMap)
  function drawMap(counties, data) {
    // var translattte = counties.transform.translate;
    var projection = d3;
    // .geoAlbersUsa() // .geoMercator() //d3.geoOrthographic()  geoAlbersUsa
    // .geoMercator().scale(800)
    // .translate([width / 2, height / 2])
    // var path = d3.geoPath().projection(projection);
    // var path = d3.geoPath().projection(projection);
    // var projection = d3.geoAlbers()

    // .translate([50, 40])
    // .scale((600 - 1) / 2 / Math.PI);

    var path = d3.geoPath();

    // parameters for drawing (colors depending on population threshold --> domain + range; named color)
    const keysDomain = [10, 15, 20, 25, 30, 35, 40, 45];
    const keysRange = [
      "#f7fcfd",
      "#e0ecf4",
      "#bfd3e6",
      "#9ebcda",
      "#8c96c6",
      "#8c6bb1",
      "#88419d",
      "#810f7c",
      "#4d004b",
    ];

    var color = d3.scaleThreshold().domain(keysDomain).range(keysRange);
    // conversion topojson to geojson --> d3.feature (we could named it simply "features")
    var features = topojson.feature(
      counties,
      counties.objects.counties
    ).features;

    // new variables for linking geometries and related information (counties map with countries   and    population)
    var bachelorsById = {};
    data.forEach(function (d) {
      bachelorsById[d.fips] = {
        bachelorsOrHigher: d.bachelorsOrHigher,
      };
    });
    features.forEach(function (d, i) {
      if (bachelorsById[d.id]) {
        d.details = bachelorsById[d.id];
      }
    });

    // d3.data().enter().attr("d",path) + other parameters (in particular, parameter link to the related information that we want to focus on : .style("fill", x=> if features.(...).details exists, then color(features.(...).details), otherwise undefined))
    map
      .append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("id", function (d) {
        return d.id;
      })

      .attr("data-fips", function (d) {
        return d.id;
      })
      .attr("data-education", function (d) {
        return d.details && d.details.bachelorsOrHigher
          ? d.details.bachelorsOrHigher
          : NaN;
      })
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "black")
      .style("fill", function (d) {
        return d.details && d.details.bachelorsOrHigher
          ? color(d.details.bachelorsOrHigher)
          : "gray";
      });
    // .attr("transform", "translate(100, 0)")
    // .attr("transform", counties.transform)

    // tooltip
    svg.selectAll(".county").on("mouseover", function (d) {
      d3.select("#tooltip") // adding text to appear in the tooltip.++ add data as props.  ++  positioning tooltip
        .html(
          "fips : " +
            d.id +
            "<br>bachelorsOrHigher : " +
            d.details.bachelorsOrHigher
        )
        // .html("fips : "+ d.id + "<br>bachelorsOrHigher : ")
        .attr("data-education", d.details.bachelorsOrHigher);
      d3.select("#tooltip").transition().duration(200).style("opacity", 0.9);
    });

    svg // tooltip desappearance on mouse bar leaving hovering
      .selectAll(".county")
      .on("mouseout", function () {
        d3.select("#tooltip").transition().duration(200).style("opacity", 0);
      });

    // legend

    // var legend = svg.selectAll("legend").append("g").attr("id", "legend");

    const legWidth = 40;
    const legHeight = 40;
    const legX = width - 300;
    const legY0 = 100;
    const legDx = 10;
    const legDy = 3;

    var legend = d3
    .select("body")
    .append("svg")
      .attr("id", "legend")
      .attr("class", "legend")
      .attr("width", legWidth + legDx*5)
      .attr("height", legHeight * keysRange.length * 1.7);

      legend.selectAll("rect")
      .data(keysRange)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => legY0 + i * legHeight)
      .attr("width", legWidth)
      .attr("height", legHeight)
      .attr("fill", (d) => d)
      .attr("stroke", "black");

      legend.selectAll("text")
      .data(keysDomain)
      .enter()
      .append("text")
      .attr("x", legWidth+ legDx *1.3)
      .attr("y", (d, i) => legY0 + (i + 1) * legHeight + legDy)
      .text((d) => d + "%");

      legend.selectAll("data")
      .data(keysDomain)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0 + legWidth + legDx)
      .attr("y1", (d, i) => legY0 + (i + 1) * legHeight)
      .attr("y2", (d, i) => legY0 + (i + 1) * legHeight)
      .attr("stroke", "black");
  }
}
