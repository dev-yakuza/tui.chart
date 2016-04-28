tui.util.defineNamespace("fedoc.content", {});
fedoc.content["series_series.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Series base component.\n * @author NHN Ent.\n *         FE Development Team &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar seriesTemplate = require('./seriesTemplate'),\n    chartConst = require('../const'),\n    dom = require('../helpers/domHandler'),\n    renderUtil = require('../helpers/renderUtil'),\n    pluginFactory = require('../factories/pluginFactory');\n\nvar Series = tui.util.defineClass(/** @lends Series.prototype */ {\n    /**\n     * Series base component.\n     * @constructs Series\n     * @param {object} params parameters\n     *      @param {object} params.options series options\n     *      @param {object} params.theme series theme\n     */\n    init: function(params) {\n        var libType = params.libType || chartConst.DEFAULT_PLUGIN;\n\n        /**\n         * Chart type\n         * @type {string}\n         */\n        this.chartType = params.chartType;\n\n        /**\n         * Component type\n         * @type {string}\n         */\n        this.componentType = params.componentType;\n\n        /**\n         * Data processor\n         * @type {DataProcessor}\n         */\n        this.dataProcessor = params.dataProcessor;\n\n        /**\n         * Bounds maker\n         * @type {BoundsMaker}\n         */\n        this.boundsMaker = params.boundsMaker;\n\n        /**\n         * User event listener\n         * @type {UserEventListener}\n         */\n        this.userEvent = params.userEvent;\n\n        /**\n         * Options\n         * @type {object}\n         */\n        this.options = params.options || {};\n\n        /**\n         * Theme\n         * @type {object}\n         */\n        this.orgTheme = this.theme = params.theme;\n\n        /**\n         * whether chart has axes or not\n         * @type {boolean}\n         */\n        this.hasAxes = !!params.hasAxes;\n\n        /**\n         * Graph renderer\n         * @type {object}\n         */\n        this.graphRenderer = pluginFactory.get(libType, params.chartType);\n\n        /**\n         * Series view className\n         * @type {string}\n         */\n        this.className = 'tui-chart-series-area';\n\n        /**\n         * series container\n         * @type {HTMLElement}\n         */\n        this.seriesContainer = null;\n\n        /**\n         * series label container\n         * @type {HTMLElement}\n         */\n        this.seriesLabelContainer = null;\n\n        /**\n         * series data\n         * @type {Array.&lt;object>}\n         */\n        this.seriesData = [];\n\n        /**\n         * Selected legend index\n         * @type {?number}\n         */\n        this.selectedLegendIndex = null;\n    },\n\n    /**\n     * Make series data.\n     * @private\n     * @abstract\n     */\n    _makeSeriesData: function() {},\n\n    /**\n     * Get seriesData\n     * @returns {object} series data\n     */\n    getSeriesData: function() {\n        return this.seriesData;\n    },\n\n    /**\n     * Render series label.\n     * @private\n     * @abstract\n     */\n    _renderSeriesLabel: function() {},\n\n    /**\n     * Render series label area\n     * @param {?HTMLElement} seriesLabelContainer series label area element\n     * @returns {HTMLElement} series label area element\n     * @private\n     */\n    _renderSeriesLabelArea: function(seriesLabelContainer) {\n        if (!seriesLabelContainer) {\n            seriesLabelContainer = dom.create('div', 'tui-chart-series-label-area');\n        }\n\n        this._renderSeriesLabel(seriesLabelContainer);\n        return seriesLabelContainer;\n    },\n\n    /**\n     * Render series area.\n     * @param {HTMLElement} seriesContainer series area element\n     * @param {object} data data for rendering\n     * @param {function} funcRenderGraph function for graph rendering\n     * @private\n     */\n    _renderSeriesArea: function(seriesContainer, data, funcRenderGraph) {\n        var expansionBound = this.boundsMaker.getBound('extendedSeries'),\n            seriesData, seriesLabelContainer;\n\n        this.data = data;\n\n        this.seriesData = seriesData = this._makeSeriesData();\n\n        renderUtil.renderDimension(seriesContainer, expansionBound.dimension);\n        this._renderPosition(seriesContainer, expansionBound.position);\n\n        if (funcRenderGraph) {\n            funcRenderGraph(expansionBound.dimension, seriesData);\n        }\n\n        seriesLabelContainer = this._renderSeriesLabelArea(this.seriesLabelContainer);\n\n        if (!this.seriesLabelContainer) {\n            this.seriesLabelContainer = seriesLabelContainer;\n            dom.append(seriesContainer, seriesLabelContainer);\n        }\n    },\n\n    /**\n     * Make parameters for graph rendering.\n     * @param {{width: number, height: number}} dimension dimension\n     * @param {object} seriesData series data\n     * @returns {object} parameters for graph rendering\n     * @private\n     */\n    _makeParamsForGraphRendering: function(dimension, seriesData) {\n        return tui.util.extend({\n            dimension: dimension,\n            chartType: this.chartType,\n            theme: this.theme,\n            options: this.options\n        }, seriesData);\n    },\n\n    /**\n     * Render raphael graph.\n     * @param {{width: number, height: number}} dimension dimension\n     * @param {object} seriesData series data\n     * @private\n     */\n    _renderGraph: function(dimension, seriesData) {\n        var params = this._makeParamsForGraphRendering(dimension, seriesData);\n        this.graphRenderer.render(this.seriesContainer, params);\n    },\n\n    /**\n     * Render series component.\n     * @param {object} data data for rendering\n     * @returns {HTMLElement} series element\n     */\n    render: function(data) {\n        var el = dom.create('DIV', this.className);\n\n        this.seriesContainer = el;\n        this._renderSeriesArea(el, data, tui.util.bind(this._renderGraph, this));\n\n        return el;\n    },\n\n    /**\n     * Update theme.\n     * @param {object} theme legend theme\n     * @param {?Array.&lt;?boolean>} checkedLegends checked legends\n     * @returns {object} updated theme\n     * @private\n     */\n    _updateTheme: function(theme, checkedLegends) {\n        var cloneTheme;\n\n        if (!checkedLegends.length) {\n            return theme;\n        }\n\n        cloneTheme = JSON.parse(JSON.stringify(theme));\n        cloneTheme.colors = tui.util.filter(cloneTheme.colors, function(color, index) {\n            return checkedLegends[index];\n        });\n\n        return cloneTheme;\n    },\n\n    /**\n     * Rerender\n     * @param {object} data data for rendering\n     */\n    rerender: function(data) {\n        if (this.graphRenderer.clear) {\n            this.graphRenderer.clear();\n        }\n\n        this.seriesContainer.innerHTML = '';\n        this.seriesLabelContainer = null;\n        this.selectedLegendIndex = null;\n        this.seriesData = [];\n\n        if (this.dataProcessor.getGroupCount(this.chartType)) {\n            this.theme = this._updateTheme(this.orgTheme, data.checkedLegends);\n            this._renderSeriesArea(this.seriesContainer, data, tui.util.bind(this._renderGraph, this));\n            if (this.labelShower) {\n                clearInterval(this.labelShower.timerId);\n            }\n            this.animateComponent();\n        }\n    },\n\n    /**\n     * Resize raphael graph.\n     * @param {{width: number, height: number}} dimension dimension\n     * @param {object} seriesData series data\n     * @private\n     */\n    _resizeGraph: function(dimension, seriesData) {\n        this.graphRenderer.resize(tui.util.extend({\n            dimension: dimension\n        }, seriesData));\n    },\n\n    /**\n     * Resize series component.\n     * }} bound series bound\n     * @param {object} data data for rendering\n     */\n    resize: function(data) {\n        this._renderSeriesArea(this.seriesContainer, data, tui.util.bind(this._resizeGraph, this));\n    },\n\n    /**\n     * Render bounds\n     * @param {HTMLElement} el series element\n     * @param {{top: number, left: number}} position series position\n     * @private\n     */\n    _renderPosition: function(el, position) {\n        var hiddenWidth = renderUtil.isOldBrowser() ? 0 : 0;\n\n        renderUtil.renderPosition(el, {\n            top: position.top - (hiddenWidth * 2),\n            left: position.left - hiddenWidth\n        });\n    },\n\n    /**\n     * Get limit distance from zero point.\n     * @param {number} size chart size (width or height)\n     * @param {{min: number, max: number}} limit limit\n     * @returns {{toMax: number, toMin: number}} pixel distance\n     * @private\n     */\n    _getLimitDistanceFromZeroPoint: function(size, limit) {\n        var min = limit.min,\n            max = limit.max,\n            distance = max - min,\n            toMax = 0,\n            toMin = 0;\n\n        if (min &lt;= 0 &amp;&amp; max >= 0) {\n            toMax = (distance + min) / distance * size;\n            toMin = (distance - max) / distance * size;\n        }\n\n        return {\n            toMax: toMax,\n            toMin: toMin\n        };\n    },\n\n    /**\n     * Find label element.\n     * @param {HTMLElement} elTarget target element\n     * @returns {HTMLElement} label element\n     * @private\n     */\n    _findLabelElement: function(elTarget) {\n        var elLabel = null;\n\n        if (dom.hasClass(elTarget, chartConst.CLASS_NAME_SERIES_LABEL)) {\n            elLabel = elTarget;\n        } else {\n            elLabel = dom.findParentByClass(elTarget, chartConst.CLASS_NAME_SERIES_LABEL);\n        }\n\n        return elLabel;\n    },\n\n    /**\n     * To call showAnimation function of graphRenderer.\n     * @param {{groupIndex: number, index: number}} data data\n     */\n    onShowAnimation: function(data) {\n        if (!this.graphRenderer.showAnimation) {\n            return;\n        }\n        this.graphRenderer.showAnimation(data);\n    },\n\n    /**\n     * To call hideAnimation function of graphRenderer.\n     * @param {{groupIndex: number, index: number}} data data\n     */\n    onHideAnimation: function(data) {\n        if (!this.graphRenderer.hideAnimation) {\n            return;\n        }\n        this.graphRenderer.hideAnimation(data);\n    },\n\n    /**\n     * To call showGroupAnimation function of graphRenderer.\n     * @param {number} index index\n     */\n    onShowGroupAnimation: function(index) {\n        if (!this.graphRenderer.showGroupAnimation) {\n            return;\n        }\n        this.graphRenderer.showGroupAnimation(index);\n    },\n\n    /**\n     * To call hideGroupAnimation function of graphRenderer.\n     * @param {number} index index\n     */\n    onHideGroupAnimation: function(index) {\n        if (!this.graphRenderer.hideGroupAnimation) {\n            return;\n        }\n        this.graphRenderer.hideGroupAnimation(index);\n    },\n\n    /**\n     * Animate component.\n     */\n    animateComponent: function() {\n        if (this.graphRenderer.animate) {\n            this.graphRenderer.animate(tui.util.bind(this.animateShowingAboutSeriesLabelArea, this));\n        }\n    },\n\n    /**\n     * Make opacity cssText.\n     * @param {number} opacity opacity\n     * @returns {string} cssText\n     * @private\n     */\n    _makeOpacityCssText: (function() {\n        var funcMakeOpacityCssText;\n        if (renderUtil.isOldBrowser()) {\n            funcMakeOpacityCssText = function(opacity) {\n                return ';filter: alpha(opacity=' + (opacity * chartConst.OLD_BROWSER_OPACITY_100) + ')';\n            };\n        } else {\n            funcMakeOpacityCssText = function(_opacity) {\n                return ';opacity: ' + _opacity;\n            };\n        }\n        return funcMakeOpacityCssText;\n    })(),\n\n    /**\n     * Make html about series label.\n     * @param {{left: number, top: number}} position - position for rendering\n     * @param {string} label - label of SeriesItem\n     * @param {number} index - index of legend\n     * @returns {string}\n     * @private\n     */\n    _makeSeriesLabelHtml: function(position, label, index) {\n        var cssObj = tui.util.extend(position, this.theme.label);\n\n        if (!tui.util.isNull(this.selectedLegendIndex) &amp;&amp; (this.selectedLegendIndex !== index)) {\n            cssObj.opacity = this._makeOpacityCssText(chartConst.SERIES_LABEL_OPACITY);\n        } else {\n            cssObj.opacity = '';\n        }\n        return seriesTemplate.tplSeriesLabel({\n            cssText: seriesTemplate.tplCssText(cssObj),\n            label: label\n        });\n    },\n\n    /**\n     * Animate showing about series label area.\n     */\n    animateShowingAboutSeriesLabelArea: function() {\n        var self = this;\n\n        if ((!this.options.showLabel &amp;&amp; !this.legendAlign) || !this.seriesLabelContainer) {\n            return;\n        }\n\n        dom.addClass(this.seriesLabelContainer, 'show');\n\n        if (renderUtil.isIE7()) {\n            this.seriesLabelContainer.style.filter = '';\n        } else {\n            this.labelShower = new tui.component.Effects.Fade({\n                element: this.seriesLabelContainer,\n                duration: 300\n            });\n            this.labelShower.action({\n                start: 0,\n                end: 1,\n                complete: function() {\n                    clearInterval(self.labelShower.timerId);\n                    delete self.labelShower;\n                }\n            });\n        }\n    },\n\n    /**\n     * Make exportation data for series type userEvent.\n     * @param {object} seriesData series data\n     * @returns {{chartType: string, legend: string, legendIndex: number, index: number}} export data\n     * @private\n     */\n    _makeExportationSeriesData: function(seriesData) {\n        var legendIndex = seriesData.indexes.index,\n            legendData = this.dataProcessor.getLegendItem(legendIndex);\n\n        return {\n            chartType: legendData.chartType,\n            legend: legendData.label,\n            legendIndex: legendIndex,\n            index: seriesData.indexes.groupIndex\n        };\n    },\n\n    /**\n     * Execute graph renderer.\n     * @param {{left: number, top: number}} position mouse position\n     * @param {string} funcName function name\n     * @returns {*} result.\n     * @private\n     */\n    _executeGraphRenderer: function(position, funcName) {\n        var result;\n\n        this.fire('hideTooltipContainer');\n\n        if (this.options.showLabel) {\n            dom.removeClass(this.seriesLabelContainer, 'show');\n        }\n\n        result = this.graphRenderer[funcName](position);\n\n        if (this.options.showLabel) {\n            dom.addClass(this.seriesLabelContainer, 'show');\n        }\n\n        this.fire('showTooltipContainer');\n\n        return result;\n    },\n\n    /**\n     * To call selectSeries callback of userEvent.\n     * @param {object} seriesData series data\n     */\n    onSelectSeries: function(seriesData) {\n        this.userEvent.fire('selectSeries', this._makeExportationSeriesData(seriesData));\n        if (this.options.hasSelection) {\n            this.graphRenderer.selectSeries(seriesData.indexes);\n        }\n    },\n\n    /**\n     * To call unselectSeries callback of userEvent.\n     * @param {object} seriesData series data.\n     */\n    onUnselectSeries: function(seriesData) {\n        this.userEvent.fire('unselectSeries', this._makeExportationSeriesData(seriesData));\n        if (this.options.hasSelection) {\n            this.graphRenderer.unselectSeries(seriesData.indexes);\n        }\n    },\n\n    /**\n     *On select legend.\n     * @param {string} chartType chart type\n     * @param {?number} legendIndex legend index\n     */\n    onSelectLegend: function(chartType, legendIndex) {\n        if (this.chartType !== chartType &amp;&amp; !tui.util.isNull(legendIndex)) {\n            legendIndex = -1;\n        }\n\n        this.selectedLegendIndex = legendIndex;\n\n        if (this.dataProcessor.getSeriesDataModel(this.chartType).getGroupCount()) {\n            this._renderSeriesArea(this.seriesContainer, this.data);\n            this.graphRenderer.selectLegend(legendIndex);\n        }\n    },\n\n    /**\n     * Show label.\n     */\n    showLabel: function() {\n        this.options.showLabel = true;\n        dom.addClass(this.seriesLabelContainer, 'show opacity');\n    },\n\n    /**\n     * Hide label.\n     */\n    hideLabel: function() {\n        this.options.showLabel = false;\n        dom.removeClass(this.seriesLabelContainer, 'show');\n    }\n});\n\nmodule.exports = Series;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"