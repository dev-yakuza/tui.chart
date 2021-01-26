import Store from "../store/store";
import root from "../store/root";
import layout from "../store/layout";
import seriesData from "../store/seriesData";
import category from "../store/category";
import legend from "../store/legend";
import optionsStore from "../store/options";
import theme from "../store/theme";
import EventEmitter from "../eventEmitter";
import ComponentManager from "../component/componentManager";
import Painter from "../painter";
import Animator from "../animator";
import { debounce, isBoolean, isNumber, isUndefined, pick, isAutoValue } from "../helpers/utils";
import { responderDetectors } from "../responderDetectors";
import { message } from "../message";
import { sendHostname } from "../helpers/googleAnalytics";
import { makeObservableObjectToNormal } from "../store/reactive";
export const DEFAULT_ANIM_DURATION = 500;
function getUsingContainerSize(eventName, usingContainerSize, width, height) {
    const { width: usingContainerWidth, height: usingContainerHeight } = usingContainerSize;
    const isAutoWidth = isAutoValue(width);
    const isAutoHeight = isAutoValue(height);
    return eventName === 'updateOptions'
        ? {
            width: !isUndefined(width) && usingContainerWidth !== isAutoWidth
                ? isAutoWidth
                : usingContainerWidth,
            height: !isUndefined(height) && usingContainerHeight !== isAutoHeight
                ? isAutoHeight
                : usingContainerHeight,
        }
        : {
            width: isAutoWidth,
            height: isAutoHeight,
        };
}
/**
 * @class
 * @abstract
 * Abstract class used to implement each chart.
 */
export default class Chart {
    constructor(props) {
        this.___animId___ = null;
        this.painter = new Painter(this);
        this.eventBus = new EventEmitter();
        this.enteredComponents = [];
        this.animationControlFlag = {
            resizing: false,
            updating: false,
        };
        this.resizeObserver = null;
        this.debounceResizeEvent = debounce((containerWidth, containerHeight) => {
            this.resizeChartSize(containerWidth, containerHeight);
        }, 100);
        this.debounceWindowResizeEvent = debounce(() => {
            const { offsetWidth, offsetHeight } = this.el;
            this.resizeChartSize(offsetWidth, offsetHeight);
        }, 100);
        /**
         * Get checked legend chart type and label, checked state.
         * @returns {Array<{checked: boolean, chartType: string, label: string}>} Array data that whether series has checked
         * @api
         * @example
         * const checkedLegend = chart.getCheckedLegend()
         */
        this.getCheckedLegend = () => {
            const { data } = this.store.state.legend;
            return data
                .filter((datum) => datum.checked)
                .map((datum) => pick(datum, 'chartType', 'label', 'checked'));
        };
        /**
         * Returns the currently applied chart options.
         * @returns {Object} options
         * @api
         * @example
         * const options = chart.getOptions();
         */
        this.getOptions = () => {
            return makeObservableObjectToNormal(this.store.initStoreState.options);
        };
        /**
         * Register of user custom event.
         * @param {string} eventName - Event name. 'clickLegendLabel', 'clickLegendCheckbox', 'selectSeries', 'unselectSeries', 'hoverSeries', 'unhoverSeries', 'zoom', 'resetZoom' is available.
         * @param {Function} handler - Event handler
         * @api
         */
        this.on = (eventName, handler) => {
            /**
             * Register Events that occur when click legend label
             * @event ChartBase#clickLegendLabel
             * @param {object} info selected legend information
             * @api
             * @example
             * chart.on('clickLegendLabel', (info) => {
             *   console.log(info);
             * });
             */
            /**
             * Register Events that occur when click legend checkbox
             * @event ChartBase#clickLegendCheckbox
             * @param {object} info selected legend info
             * @api
             * @example
             * chart.on('clickLegendCheckbox', (info) => {
             *   console.log(info);
             * });
             */
            /**
             * Register Events that occur when select series
             * @event ChartBase#selectSeries
             * @param {object} info selected series info
             * @api
             * @example
             * chart.on('selectSeries', (info) => {
             *   console.log(info);
             * });
             */
            /**
             * Register Events that occur when unselect series
             * @event ChartBase#unselectSeries
             * @param {object} info unselected series info
             * @api
             * @example
             * chart.on('unselectSeries', (info) => {
             *   console.log(info);
             * });
             */
            /**
             * Register Events that occur when hover to series
             * @event ChartBase#hoverSeries
             * @param {object} info hovered series info
             * @api
             * @example
             * chart.on('hoverSeries', (info) => {
             *   console.log(info);
             * });
             */
            /**
             * Register Events that occur when unhover from series
             * @event ChartBase#unhoverSeries
             * @param {object} info unhovered series info
             * @api
             * @example
             * chart.on('unhoverSeries', (info) => {
             *  console.log(info);
             * });
             */
            /**
             * Register Events that occur when zooming
             * @event ChartBase#zoom
             * @param {string[]} dataRange - []
             * @api
             * @example
             * chart.on('zoom', (dataRange) => {
             *    console.log(dataRange);
             * });
             */
            /**
             * Register Events that occur when zoom is reset
             * @event ChartBase#resetZoom
             * @api
             * @example
             * chart.on('resetZoom', () => {});
             */
            this.eventBus.on(eventName, handler);
        };
        /**
         * Destroys the instance.
         * @api
         * @example
         * chart.destroy();
         */
        this.destroy = () => {
            this.componentManager.clear();
            this.clearResizeEvent();
            this.el.innerHTML = '';
        };
        /**
         * Select series. It works only when the selectable option is true.
         * @param {Object} seriesInfo - Information of the series to be selected
         *      @param {number} [seriesInfo.seriesIndex] - Index of series
         *      @param {number} [seriesInfo.index] - Index of data within series
         *      @param {string} [seriesInfo.name] - Specify name for NestedPie Chart
         *      @param {string} [seriesInfo.chartType] - Specify which chart to select when using LineArea, LineScatter, and ColumnLine charts.specifies which chart to select when using LineArea, LineScatter, and ColumnLine charts.
         * @api
         * @example
         * chart.selectSeries({index: 1, seriesIndex: 2});
         */
        this.selectSeries = (seriesInfo) => {
            if (!this.isSelectableSeries()) {
                throw new Error(message.SELECT_SERIES_API_SELECTABLE_ERROR);
            }
            this.eventBus.emit('selectSeries', Object.assign(Object.assign({}, seriesInfo), { state: this.store.state }));
        };
        /**
         * Unselect selected series. It works only when the selectable option is true.
         * @api
         * @example
         * chart.unselectSeries();
         */
        this.unselectSeries = () => {
            if (!this.isSelectableSeries()) {
                throw new Error(message.SELECT_SERIES_API_SELECTABLE_ERROR);
            }
            this.store.dispatch('setAllLegendActiveState', true);
            this.eventBus.emit('resetSelectedSeries');
        };
        /**
         * Resize chart size.
         * @param {Object} size Chart size
         *   @param {number} [size.width] Width
         *   @param {number} [size.height] Height
         * @api
         * @example
         * chart.resize({height: 100, width: 200});
         */
        this.resize = (size) => {
            this.store.dispatch('updateOptions', { options: { chart: Object.assign({}, size) } });
        };
        this.setResizeEventListeners = (eventName, options) => {
            var _a, _b, _c, _d;
            const { usingContainerSize } = this.store.state;
            const { width: usingContainerWidth, height: usingContainerHeight } = usingContainerSize;
            const width = (_b = (_a = options) === null || _a === void 0 ? void 0 : _a.chart) === null || _b === void 0 ? void 0 : _b.width;
            const height = (_d = (_c = options) === null || _c === void 0 ? void 0 : _c.chart) === null || _d === void 0 ? void 0 : _d.height;
            const isAutoWidth = isAutoValue(width);
            const isAutoHeight = isAutoValue(height);
            if ((usingContainerWidth || usingContainerHeight) && isNumber(width) && isNumber(height)) {
                this.clearResizeEvent();
            }
            else if (!(usingContainerWidth || usingContainerHeight) && (isAutoWidth || isAutoHeight)) {
                this.setResizeEvent();
            }
            this.store.dispatch('setUsingContainerSize', getUsingContainerSize(eventName, usingContainerSize, width, height));
        };
        const { el, options, series, categories } = props;
        if (isUndefined(options.usageStatistics) || options.usageStatistics) {
            sendHostname();
        }
        this.el = el;
        this.animator = new Animator();
        this.store = new Store({
            series,
            categories,
            options,
        });
        this.componentManager = new ComponentManager({
            store: this.store,
            eventBus: this.eventBus,
        });
        this.eventBus.on('needLoop', debounce(() => {
            var _a, _b;
            let duration = this.getAnimationDuration((_a = options.chart) === null || _a === void 0 ? void 0 : _a.animation);
            if (this.animationControlFlag.resizing) {
                duration = isUndefined(options.responsive)
                    ? this.getAnimationDuration()
                    : this.getAnimationDuration((_b = options.responsive) === null || _b === void 0 ? void 0 : _b.animation);
                this.animationControlFlag.resizing = false;
            }
            this.eventBus.emit('loopStart');
            this.animator.add({
                onCompleted: () => {
                    this.eventBus.emit('loopComplete');
                },
                chart: this,
                duration,
                requester: this,
            });
        }, 10));
        this.eventBus.on('needSubLoop', (opts) => {
            this.animator.add(Object.assign(Object.assign({}, opts), { chart: this }));
        });
        this.eventBus.on('needDraw', debounce(() => {
            this.draw();
        }, 10));
        // for using class field "modules"
        setTimeout(() => {
            var _a, _b, _c, _d;
            this.initialize();
            this.store.observe(() => {
                this.painter.setup();
            });
            if (isAutoValue((_b = (_a = options) === null || _a === void 0 ? void 0 : _a.chart) === null || _b === void 0 ? void 0 : _b.width) || isAutoValue((_d = (_c = options) === null || _c === void 0 ? void 0 : _c.chart) === null || _d === void 0 ? void 0 : _d.height)) {
                this.setResizeEvent();
            }
        }, 0);
    }
    getAnimationDuration(animationOption) {
        const { firstRendering } = this.animator;
        const { resizing, updating } = this.animationControlFlag;
        let duration;
        if ((!firstRendering && !resizing) || isUndefined(animationOption)) {
            duration = DEFAULT_ANIM_DURATION;
        }
        else if (isBoolean(animationOption)) {
            duration = animationOption ? DEFAULT_ANIM_DURATION : 0;
        }
        else if (isNumber(animationOption.duration)) {
            duration = animationOption.duration;
        }
        if (updating) {
            duration = 0;
        }
        this.animationControlFlag.updating = false;
        return duration;
    }
    resizeChartSize(containerWidth, containerHeight) {
        this.animationControlFlag.resizing = true;
        const { usingContainerSize: { width: usingContainerWidth, height: usingContainerHeight }, chart: { width, height }, } = this.store.state;
        if (!(usingContainerWidth || usingContainerHeight) ||
            !(containerWidth || containerHeight) ||
            (containerWidth === width && containerHeight === height)) {
            this.animationControlFlag.resizing = false;
            return;
        }
        this.eventBus.emit('resetHoveredSeries');
        this.store.dispatch('setChartSize', {
            width: usingContainerWidth ? containerWidth : width,
            height: usingContainerHeight ? containerHeight : height,
        });
        this.draw();
    }
    setResizeEvent() {
        if (isUndefined(ResizeObserver)) {
            window.addEventListener('resize', this.debounceWindowResizeEvent);
        }
        else {
            this.resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    const { width, height } = entry.contentRect;
                    this.debounceResizeEvent(width, height);
                });
            });
            this.resizeObserver.observe(this.el);
        }
    }
    clearResizeEvent() {
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.el);
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        else {
            window.removeEventListener('resize', this.debounceWindowResizeEvent);
        }
    }
    handleEvent(event) {
        const { clientX, clientY, type: eventType } = event;
        const delegationMethod = `on${eventType[0].toUpperCase() + eventType.substring(1)}`;
        const canvasRect = this.painter.ctx.canvas.getBoundingClientRect();
        const mousePosition = {
            x: clientX - canvasRect.left,
            y: clientY - canvasRect.top,
        };
        const newEnteredComponents = [];
        if (eventType === 'mousemove') {
            this.componentManager.forEach((component) => {
                const { x, y, height, width } = component.rect;
                const exist = this.enteredComponents.some((enteredComponent) => enteredComponent === component);
                const entered = mousePosition.x >= x &&
                    mousePosition.x <= x + width &&
                    mousePosition.y >= y &&
                    mousePosition.y <= y + height;
                if (entered) {
                    newEnteredComponents.push(component);
                    if (!exist && component.onMouseenterComponent) {
                        component.onMouseenterComponent();
                    }
                }
                else if (exist && component.onMouseoutComponent) {
                    component.onMouseoutComponent();
                }
            });
            this.enteredComponents = newEnteredComponents;
        }
        const allResponders = [];
        this.componentManager.forEach((component) => {
            if (!component[delegationMethod]) {
                return;
            }
            if (!responderDetectors.rect(mousePosition, component.rect)) {
                return;
            }
            const detected = (component.responders || []).filter((m) => {
                return responderDetectors[m.type](mousePosition, m, component.rect);
            });
            if (detected.length) {
                allResponders.push({ component, detected });
            }
            component[delegationMethod]({ mousePosition, responders: detected }, event);
        });
        if (this.handleEventForAllResponders) {
            this.handleEventForAllResponders(event, allResponders, delegationMethod, mousePosition);
        }
    }
    initStore(defaultModules) {
        var _a;
        [...defaultModules, ...(_a = this.modules, (_a !== null && _a !== void 0 ? _a : []))].forEach((module) => this.store.setModule(module));
    }
    initialize() {
        this.initStore([root, optionsStore, theme, seriesData, legend, layout, category]);
        this.store.dispatch('initChartSize', this.el);
    }
    draw() {
        this.painter.beforeFrame();
        this.componentManager.forEach((component) => {
            if (!component.isShow) {
                return;
            }
            this.painter.beforeDraw(component.rect.x, component.rect.y);
            if (component.beforeDraw) {
                component.beforeDraw(this.painter);
            }
            component.draw(this.painter);
            this.painter.afterDraw();
        });
    }
    update(delta) {
        this.componentManager.invoke('update', delta);
    }
    initUpdate(delta) {
        this.componentManager.invoke('initUpdate', delta);
    }
    isSelectableSeries() {
        var _a;
        return (_a = this.store.initStoreState.options.series) === null || _a === void 0 ? void 0 : _a.selectable;
    }
    /**
     * Set tooltip offset.
     * @param {Object} offset - Offset size
     *   @param {number} [offset.x] Offset value to move title horizontally
     *   @param {number} [offset.y] Offset value to move title vertically
     * @api
     * @example
     * chart.setTooltipOffset({x: 10, y: -20});
     */
    setTooltipOffset(offset) {
        const { x: offsetX, y: offsetY } = offset;
        this.store.dispatch('updateOptions', { options: { tooltip: { offsetX, offsetY } } });
    }
    dispatchOptionsEvent(eventName, options) {
        this.setResizeEventListeners(eventName, options);
        const { offsetWidth, offsetHeight } = this.el;
        this.store.dispatch(eventName, {
            options,
            containerSize: { width: offsetWidth, height: offsetHeight },
        });
    }
}
