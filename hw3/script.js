const b_width = 1000;
const d_width = 500;
const b_height = 1000;
const d_height = 1000;
const colors = [
    '#DB202C', '#a6cee3', '#1f78b4',
    '#33a02c', '#fb9a99', '#b2df8a',
    '#fdbf6f', '#ff7f00', '#cab2d6',
    '#6a3d9a', '#ffff99', '#b15928'
];

const radius = d3.scaleLinear().range([0.5, 20]);
const color = d3.scaleOrdinal().range(colors);
const x = d3.scaleLinear().range([0, b_width]);

const bubble = d3.select('.bubble-chart')
    .attr('width', b_width).attr('height', b_height);
const donut = d3.select('.donut-chart')
    .attr('width', d_width).attr('height', d_height)
    .append("g")
    .attr("transform", "translate(" + d_width / 2 + "," + d_height / 2 + ")");

const donut_lable = d3.select('.donut-chart').append('text')
    .attr('class', 'donut-lable')
    .attr("text-anchor", "middle")
    .attr('transform', `translate(${(d_width / 2)} ${d_height / 2})`);
const tooltip = d3.select('.tooltip');
//  Part 1 - Create simulation with forceCenter(), forceX() and forceCollide()
const simulation = d3.forceSimulation()
    .force('x', d3.forceX(d => x(d["release year"])))
    .force('center', d3.forceCenter(b_width / 2, b_height / 2))
    .force('collide', d3.forceCollide(d => radius(+d["user rating score"])));


d3.csv('data/netflix.csv').then(data => {
    data = d3.nest()
        .key(d => d.title)
        .rollup(d => d[0])
        .entries(data)
        .map(d => d.value)
        .filter(d => d['user rating score'] !== 'NA')
    // .filter((d, i) => i < 40)
    ;
    console.log(data);


    // Part 1 - add domain to color, radius and x scales
    const rating = data.map(d => +d['user rating score']);
    const years = data.map(d => +d['release year']);
    let ratings = d3.nest().key(d => d.rating).rollup(d => d.length).entries(data);


    color.domain(ratings);
    radius.domain([Math.min(...rating), Math.max(...rating)]);
    x.domain([Math.min(...years) - 20, Math.max(...years)]);

    // Part 1 - create circles
    var nodes = bubble
        .selectAll("circle")
        .data(data, d => d ? this.id : d['title'])
        .join(
            enter => enter.append('circle')
                .attr("id", d => d['title'])
                .attr("style", (d) => `fill:${color(d['rating'])}`)
                .attr("r", d => radius(+d["user rating score"])),
            update => update,
            exit => exit.remove()
        )
        .on('mouseover', overBubble)
        .on('mouseout', outOfBubble)
    ;

    // Part 1 - add data to simulation and add tick event listener
    simulation.on('tick', () => {
        nodes
            .attr("cx", d => {
                return d.x;
            })
            .attr("cy", d => {
                return d.y;
            })
    });
    simulation.nodes(data);


    // Part 1 - create layout with d3.pie() based on rating
    const arcs = d3.pie()
        .value(d => d.value)
        (ratings);

    console.log(arcs);


    // Part 1 - create an d3.arc() generator
    const arc = d3.arc()
        .innerRadius(d_width / 4)
        .outerRadius(d_width / 2)
        .padAngle(0.01)
    ;

    // Part 1 - draw a donut chart inside donut
    donut.selectAll('path')
        .data(arcs)
        .join(
            enter => enter.append('path')
                .attr("id", d => d.data.key)
                .attr("d", arc)
                .attr("style", d => `fill:${color(d.data.key)}`),
            update => update,
            exit => exit.remove()
        )
        .on('mouseover', overArc)
        .on('mouseout', outOfArc)
    ;

    // mouseover and mouseout event listeners

    function overBubble(d) {
        console.log(d3.event.target);

        // Part 2 - add stroke and stroke-width
        d3.event.target.setAttribute('stroke', 'black');
        d3.event.target.setAttribute('stroke-width', '2');

        // Part 3 - updata tooltip content with title and year
        tooltip.html(`${d.title}<br>${d['release year']}`)
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 75) + "px");

        // Part 3 - change visibility and position of tooltip
        tooltip.style("opacity", .9);
        tooltip.style("display", 'block');
    }

    function outOfBubble() {
        // Part 2 - remove stroke and stroke-width
        d3.event.target.setAttribute('stroke', '');
        d3.event.target.setAttribute('stroke-width', '');

        // Part 3 - change visibility of tooltip
        tooltip.style("opacity", 0);
        tooltip.style("display", 'none');
    }

    function overArc(d) {
        // Part 2 - change donut_lable content
        donut_lable.text(d.data.key);
        // Part 2 - change opacity of an arc
        d3.select(this).style("opacity", .5);


        // Part 3 - change opacity, stroke и stroke-width of circles based on rating
        nodes.style('opacity', s => {
            return s.rating === d.data.key ? 1 : 0.2;
        }).attr('stroke', s => {
            return s.rating === d.data.key ? 'black' : '';
        }).attr('stroke-width', s => {
            return s.rating === d.data.key ? 2 : 0;
        });
    }

    function outOfArc() {

        // Part 2 - change content of donut_lable
        donut_lable.text('');
        // Part 2 - change opacity of an arc
        d3.select(this).style("opacity", 1);

        // Part 3 - revert opacity, stroke and stroke-width of circles
        nodes.style('opacity', 1)
            .attr('stroke', '').attr('stroke-width', '');
    }
});
