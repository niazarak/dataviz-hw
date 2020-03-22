const width = 1000;
const height = 500;
const margin = 30;
const svg = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let radius = 'gdp';
let year = '2000';

const params = ['child-mortality', 'fertility-rate', 'gdp', 'life-expectancy', 'population'];
const colors = ['aqua', 'lime', 'gold', 'hotpink'];

const x = d3.scaleLinear().range([margin * 2, width - margin]);
const y = d3.scaleLinear().range([height - margin, margin]);


const xLable = svg.append('text').attr('transform', `translate(${width / 2}, ${height})`);
const yLable = svg.append('text').attr('transform', `translate(${margin / 2}, ${height / 2}) rotate(-90)`);

const xAxis = svg.append('g').attr('transform', `translate(0, ${height - margin})`);
const yAxis = svg.append('g').attr('transform', `translate(${margin * 2}, 0)`);


const color = d3.scaleOrdinal().range(colors.reverse());
const r = d3.scaleSqrt().range([2, 20]);


params.forEach((val) => {
    let optionVal = val;
    ['xParam', 'yParam', 'radius'].forEach((paramName) => {
        d3.select(`#${paramName}`).append("option").attr("value", optionVal).text(() => optionVal);
    })
});

d3.select("#xParam").property('value', xParam);
d3.select("#yParam").property('value', yParam);


const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

loadData().then(data => {
    console.log(data);

    d3.select('.slider').on('change', newYear);

    d3.select('#radius').on('change', newRadius);
    d3.select('#xParam').on('change', newX);
    d3.select('#yParam').on('change', newY);

    function newYear() {
        year = this.value;
        updateChart()
    }

    function newRadius() {
        radius = this.value;
        updateChart()
    }

    function newX() {
        xParam = this.value;
        updateChart()
    }

    function newY() {
        yParam = this.value;
        updateChart()
    }

    function updateChart() {
        xLable.text(xParam);
        yLable.text(yParam);
        d3.select('.year').text(year);

        let xRange = data.map(d => +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);

        let yRange = data.map(d => +d[yParam][year]);
        y.domain([d3.min(yRange), d3.max(yRange)]);

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y));

        let radiusRange = data.map(d => +d[radius][year]);
        r.domain([d3.min(radiusRange), d3.max(radiusRange)]);

        let regions = Array.from(new Set(data.map(d => d['region'])));
        color.domain(regions);

        let circles = svg.selectAll('circle').data(data, d => d ? this.id : d['geo']);
        circles.enter().append('circle')
            .attr('id', d => d['geo'])
            .attr('cx', d => x(+d[xParam][year]))
            .attr('cy', (d) => y(+d[yParam][year]))
            .attr('r', (d) => r(+d[radius][year]))
            .attr('style', (d) => `fill:${color(d['region'])}`)
            .on("mouseover", d => {
                tooltip.style("opacity", .9);
                tooltip.html(d.country)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", _ => {
                tooltip.style("opacity", 0);
            });

        circles.exit().remove();


        let legend = d3.select('#legend').selectAll('li').data(regions);
        legend.enter()
            .append("li").attr('id', d => d).html(d => `<span class="dot" style="background-color: ${color(d)}"></span> ${d}`);
        legend.exit().remove()
    }

    updateChart();
});

async function loadData() {
    const population = await d3.csv('data/pop.csv');
    const rest = {
        'gdp': await d3.csv('data/gdppc.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expect.csv'),
        'fertility-rate': await d3.csv('data/tfr.csv'),
    };
    const data = population.map(d => {
        return {
            geo: d.geo,
            country: d.country,
            region: d.region,
            population: {...d},
            ...Object.values(rest).map(v => v.find(r => r.geo === d.geo)).reduce((o, d, i) => ({
                ...o,
                [Object.keys(rest)[i]]: d
            }), {})

        }
    });
    return data
}