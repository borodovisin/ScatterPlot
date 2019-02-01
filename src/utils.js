
import visualization from '../visualization.json';

export const xMetricAccesor = visualization.variables[1].name;
export const yMetricAccesor = visualization.variables[2].name;
const sizeMetricAccesor = visualization.variables[3].name;

/**
 * Format number to k, M, G (thousand, Million)
 * @param {Number} number 
 * @param {Number} digits 
 */
const SIFormat = (number, digits=0) => {
    const codeTable = ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T'];
    const [exponentialNumber, exponential] = number.toExponential(digits).split('e');
    const index = Math.floor(_.parseInt(exponential) / 3);
    return exponentialNumber * Math.pow(10, _.parseInt(exponential) - index * 3) + codeTable[index + 4];
}

const getTableRow = (label, value, color='') => `<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value">${color} ${value}</div></div>`;

const getVolumeMetricTooltip = params => {
    if (_.get(params, 'data.datum.current.count')) {
        return `<div class="zd_tooltip_info_table_row">${getTableRow('Volume', params.data.datum.current.count)}</div>`;
    }
    return '';
}

// Auxiliar functions
const getMetricAccessors = () => _.first(controller.dataAccessors.getMetricAccessors());
const mapKeys = array => _.mapKeys(array, (_, k) => controller.dataAccessors[k].getLabel());
const mapValues = (params, array) => array.map(accessor => `<div class="zd_tooltip_info_table_row">${getTableRow(`${accessor.getLabel()} (${accessor.getMetric().func})`, accessor.formatted(params.data.datum))}</div>`);

const getAccesorsMetricTooltip = params => _.flow(getMetricAccessors, mapKeys, 
                                                  _.partialRight(_.omit, 'Volume'), 
                                                  _.values, _.partial(mapValues, params), 
                                                  _.partialRight(_.join, ''))(params);

export const symbolSize = (domain, range, value) => {
    const [a, b] = domain;
    const [c, d] = range;

    if (a === b) {
        return c;
    }

    return c * (1 - (value - a) / (b - a)) + d * ((value - a) / (b - a));
}

export const getFont = () => ({
    fontFamily: 'Source Pro, source-sans-pro, Helvetica, Arial, sans-serif',
    fontSize: '14',
})

export const getAxisLabel= () => ({
    ...getFont(),
    formatter: value => SIFormat(value, 2),
  });

  /**
   * Process the data from zoomdata and create the series.data for echarts
   * In all data register always put minimum and maximum values for x Axis domain
   * @param {Array} data 
   */
export const getSerieData = data => {
    // Get min and max value from Size axis data
    const [min, max] = controller.dataAccessors[sizeMetricAccesor].getDomain();
    return data.map(datum => {
        const x = controller.dataAccessors[xMetricAccesor].raw(datum);
        const y = controller.dataAccessors[yMetricAccesor].raw(datum);
        const value = controller.dataAccessors[sizeMetricAccesor].raw(datum);
        return { 
            value: [x, y, value, min, max], 
            itemStyle: { color: controller.getColorAccessor().color(datum) },
            name: _.first(datum.group),
            datum,
        };
    });
}

export const getMetricTooltip = params => {
    if (_.get(params, 'color') && _.get(params, 'data.datum') && _.get(params, 'value')) {
        // Access value directly from datum, because params.name can be empty when mouse move
        const color = `<div class="color_icon active" style="background-color: ${params.color};"></div>`;
        const volumeTooltip = getVolumeMetricTooltip(params);
        const metricTooltip = getAccesorsMetricTooltip(params);
        return `<div class="zd_tooltip_info_group customized"><div class="zd_tooltip_info_table"><div class="zd_tooltip_info_table_row">${getTableRow(controller.dataAccessors['Group By'].getLabel(), params.name, color)}</div>${volumeTooltip}${metricTooltip}</div></div>`;
    }
    return '';
};

export const dynamicAxis = (ecModel, finder, text='0', sizeCriteria='height') => {
    ecModel.findComponents({ mainType: finder }).map(component => {
        const defaultSplitNumber = 5;
        const calculatedRatio = Math.floor(_.get(component.axis.grid.getRect(), sizeCriteria) / (defaultSplitNumber * _.get(component.getTextRect(text), sizeCriteria)));
        const ratio = calculatedRatio > defaultSplitNumber ? defaultSplitNumber : calculatedRatio;
        if (ratio < 1) component.option.axisLabel.show = false;
        else {
            component.option.splitNumber = ratio;
            component.option.axisLabel.show = true;
        }
    });
}
