
/*
 *
 */

dw.chart = function(attributes) {

    // private methods and properties
    var dataset,
        theme,
        visualization,
        metric_prefix,
        load_callbacks = $.Callbacks(),
        change_callbacks = $.Callbacks(),
        locale;

    // public interface
    var chart = {
        // returns an attribute
        get: function(key, _default) {
            var keys = key.split('.'),
                pt = attributes;

            _.some(keys, function(key) {
                if (_.isUndefined(pt)) return true; // break out of the loop
                pt = pt[key];
                return false;
            });
            return _.isUndefined(pt) || _.isNull(pt) ? _default : pt;
        },

        set: function(key, value) {
            var keys = key.split('.'),
                lastKey = keys.pop(),
                pt = attributes;

            // resolve property until the parent dict
            _.each(keys, function(key) {
                if (_.isUndefined(pt[key])) {
                    pt[key] = {};
                }
                pt = pt[key];
            });

            // check if new value is set
            if (!_.isEqual(pt[lastKey], value)) {
                pt[lastKey] = value;
                change_callbacks.fire(chart, key, value);
            }
            return this;
        },

        // loads the dataset and returns a deferred
        load: function() {
            var datasource;

            datasource = dw.datasource.delimited({
                url: 'data',
                firstRowIsHeader: chart.get('metadata.data.horizontal-header', true),
                transpose: chart.get('metadata.data.transpose', false)
            });

            return datasource.dataset().done(function(ds) {
                dataset = ds;
                load_callbacks.fire(chart);
            });
        },

        loaded: function(callback) {
            if (dataset) {
                // run now
                callback(chart);
            } else {
                load_callbacks.add(callback);
            }
        },

        // applies the data changes and returns the dataset
        dataset: function(ds) {
            if (arguments.length) {
                dataset = ds;
                return chart;
            }
            chart.applyChanges(dataset);
            return dataset;
        },

        applyChanges: function(ds) {
            var changes = chart.get('metadata.data.changes', []);
            var transpose = chart.get('metadata.data.transpose', false);
            _.each(changes, function(change) {
                var row = "row", column = "column";
                if (transpose) {
                    row = "column";
                    column = "row";
                }

                if (dataset.hasColumn(change[column])) {
                    if (change[row] === 0) {
                        dataset.column(change[column]).title(change.value);
                    }
                    else {
                        dataset.column(change[column]).raw(change[row] - 1, change.value);
                    }
                }
            });

            var columnFormats = chart.get('metadata.data.column-format', {});
            _.each(columnFormats, function(columnFormat, key) {
                if (columnFormat.type) {
                    if (dataset.hasColumn(key)) {
                        dataset.column(key).type(columnFormat.type);
                    }
                }
            });
            return dataset;
        },

        // sets or gets the theme
        theme: function(_theme) {
            if (arguments.length) {
                theme = _theme;
                return chart;
            }
            return theme || {};
        },

        // sets or gets the visualization
        vis: function(_vis) {
            if (arguments.length) {
                vis = _vis;
                vis.chart(chart);
                return chart;
            }
            return vis;
        },

        // returns true if the user has set any highlights
        hasHighlight: function() {
            var hl = chart.get('metadata.visualize.highlighted-series');
            return _.isArray(hl) && hl.length > 0;
        },

        isHighlighted: function(obj) {
            if (_.isUndefined(obj) === undefined) return false;
            var hl = this.get('metadata.visualize.highlighted-series'),
                obj_name = dw.utils.name(obj);
            return !_.isArray(hl) || hl.length === 0 || _.indexOf(hl, obj_name) >= 0;
        },

        locale: function(_locale) {
            if (arguments.length) {
                locale = _locale;
                Globalize.culture(locale);
                return chart;
            }
            return locale;
        },

        metricPrefix: function(_metric_prefix) {
            if (arguments.length) {
                metric_prefix = _metric_prefix;
                return chart;
            }
            return metric_prefix;
        },

        formatValue: function(val, full, round) {
            var format = chart.get('metadata.describe.number-format'),
                div = Number(chart.get('metadata.describe.number-divisor')),
                append = chart.get('metadata.describe.number-append', '').replace(' ', '&nbsp;'),
                prepend = chart.get('metadata.describe.number-prepend', '').replace(' ', '&nbsp;');

            if (div !== 0) val = Number(val) / Math.pow(10, div);
            if (format != '-') {
                if (round || val == Math.round(val)) format = format.substr(0,1)+'0';
                val = Globalize.format(val, format);
            } else if (div !== 0) {
                val = val.toFixed(1);
            }
            return full ? prepend + val + append : val;
        },

        render: function(container) {
            if (!vis || !theme || !dataset) {
                throw 'cannot render the chart!';
            }
            vis.chart(chart);
            vis.__init();
            vis.render($(container));
        },

        attributes: function(attrs) {
            if (arguments.length) {
                attributes = attrs;
                return chart;
            }
            return attributes;
        },

        onChange: change_callbacks.add,

        columnFormatter: function(column) {
            // take config from `metadata.data.column-format[<column-name>]` otherwhise `metadata.describe`
            var colFormat = $.extend({},
                chart.get('metadata.describe'),
                chart.get('metadata.data.column-format', {})[column.name()] || {}
            );
            return column.type(true).formatter(colFormat || {});
        }

    };

    return chart;
};