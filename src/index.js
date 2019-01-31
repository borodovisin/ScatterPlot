import echarts from 'echarts';
import { 
    getSerieData, 
    getAxisLabel,
    symbolSize,
    getMetricTooltip,
    dynamicAxis,
    intervalAxisLimit,
    getFont,
    xMetricAccesor,
    yMetricAccesor 
} from './utils';

import './index.css';

/**
 * Global controller object is described on Zoomdata knowledge base
 * @see https://www.zoomdata.com/developers/docs/custom-chart-api/controller/
 */

/* global controller */

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/creating-chart-container/
 */
const chartContainer = document.createElement('div');
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

// Dynamic the splitNumber to avoid overlap
echarts.registerProcessor(ecModel => {
    dynamicAxis(ecModel, 'yAxis');
    dynamicAxis(ecModel, 'xAxis', _.max(controller.dataAccessors[xMetricAccesor].getDomain()), 'width');
});

echarts.registerPostUpdate(ecModel => {
    intervalAxisLimit(scatterChart, ecModel, 'xAxis', 'x');
    intervalAxisLimit(scatterChart, ecModel, 'yAxis', 'y');
});

const scatterChart = echarts.init(chartContainer);

const option = {
    grid: {
        left: 40,
        top: 30,
        right: 35,
        bottom: 20,
    },
    xAxis: {
        axisLabel: getAxisLabel(),
        max: null,
    },
    yAxis: {
        axisLabel: getAxisLabel(),
        max: null,
    },
    axisPointer: {
        show: true,
        type: 'line',
        lineStyle: {
          type: 'dashed',
        },
        label: getFont()
    },
    toolbox: {
        right: 30,
        feature: {
            dataZoom: {
                title: {
                    zoom: 'Zoom',
                    back: 'Back',
                },
            },
            restore: {
                title: 'Restore',
            },
        }
    },
    series: {
        type: 'scatter',
        symbolSize: value => {
            return symbolSize([value[3], value[4]],[10, 50], value[2]);
        }, 
    }
}

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/updating-queries-axis-labels/
 */
controller.createAxisLabel({
    picks: 'Group By',
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Group'
});

controller.createAxisLabel({
    picks: xMetricAccesor,
    orientation: 'horizontal',
    position: 'bottom'
});

controller.createAxisLabel({
    picks: 'Size',
    orientation: 'horizontal',
    position: 'bottom'
});

controller.createAxisLabel({
    picks: yMetricAccesor,
    orientation: 'vertical',
    position: 'left'
});

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/receiving-chart-data/
 */
controller.update = data => {
    option.series.data = getSerieData(data);
    scatterChart.setOption(option);
};

controller.resize = () => scatterChart.resize();

// Tooltip
scatterChart.on('mousemove', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            content: () => {
                return getMetricTooltip(params);
            }
        });
    }
});

scatterChart.on('mouseout', params => {
    controller.tooltip.hide();
});

// Menu bar
scatterChart.on('click', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.hide();
        controller.menu.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            data: () => params.data.datum,
        });
    }
});

console.log(controller);
