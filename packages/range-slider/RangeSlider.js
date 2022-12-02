import { Movable } from '@webdiscus/movable';

const orientConst = {
  horizontal: {
    dimension: 'width',
    axis: 'x',
    client: 'clientX',
    clientOffset: 'clientOffsetX',
  },
  vertical: {
    dimension: 'height',
    axis: 'y',
    client: 'clientY',
    clientOffset: 'clientOffsetY',
  },
};

/**
 * Clamp the value between min and max.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
const clamp = (value, min, max) => (min > value ? min : value > max ? max : value);

/**
 * Compares two values.
 *
 * @param {*} value1
 * @param {*} value2
 * @return {boolean}
 */
const isEqual = function(value1, value2) {
  if (typeof value1 === 'number') return value1 === value2;
  return !!value1 && !!value2 && value1.x === value2.x && value1.y === value2.y;
};

class RangeSlider {
  /** @private {HTMLElement} The root element of this component. */
  root = null;
  /** @private {HTMLElement} The hidden input field to provide value of slider in form. */
  inputElm = null;
  /** @public {HTMLElement} The track element. It can be used outside this component. */
  trackElm = null;
  /** @public {HTMLElement} The progress element. It can be used outside this component. */
  progressElm = null;
  /** @public {HTMLElement} The thumb handle element. It can be used outside this component. */
  thumbElm = null;

  /** @private {number|null} The previous value. Initial is null. */
  prevValue = null;

  /** @private {number|null} The discrete thumb position corresponding to the value. Initial is null. */
  valuePos = null;

  /**
   * @typedef {Object} RangeSliderOptions
   * @property {string} name
   * @property {string} orient
   * @property {number} min
   * @property {number} max
   * @property {number} step
   * @property {number} value
   * @property {boolean} isDiscrete Whether the thumb moves continuously smoothly or jump to the value position.
   * @property {number} threshold
   */

  /**
   * @param {HTMLElement} elm
   * @param {RangeSliderOptions}
   * @returns {number}
   */
  constructor(
    elm,
    { name = 'range', orient = 'horizontal', min = 0, max = 0, step = 1, value = 0, isDiscrete = true, threshold },
  ) {
    this.root = elm;
    this.render();

    // get props from template
    orient = this.inputElm.getAttribute('orient') || orient;
    value = this.inputElm.getAttribute('value') << 0 || value;

    this.orient = orient;
    this.isDiscrete = this.inputElm.getAttribute('isDiscrete') || isDiscrete;
    this.min = this.inputElm.getAttribute('min') << 0 || min;
    this.max = this.inputElm.getAttribute('max') << 0 || max;
    this.step = this.inputElm.getAttribute('step') << 0 || step;

    this.isRevert = orient === 'vertical';
    this.dimension = orientConst[orient].dimension;
    this.axis = orientConst[orient].axis;
    this.client = orientConst[orient].client;
    this.clientOffset = orientConst[orient].clientOffset;
    this.thumbSize = this.thumbElm.getBoundingClientRect()[this.dimension];
    this.trackSize = this.containerElm.getBoundingClientRect()[this.dimension];
    this.maxPos = this.trackSize - this.thumbSize;

    // optional properties
    this.name = name;
    this.max = this.max || this.maxPos;
    value = Math.max(this.min, Math.min(value, this.max));
    this.stepSize = (this.maxPos * this.step) / (this.max - this.min);
    this.threshold = threshold >= 0 ? Math.min(threshold, Math.floor(this.stepSize / 2)) : void 0;

    this.eventData = {
      value: value,
      //get percentValue() {
      //  return (this.getPositionByValue(this.eventData.value) / this.maxPos) * 100;
      //},
    };

    this.onClick = this.onClick.bind(this);
    this.onMoveStart = this.onMoveStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onKeypress = this.onKeypress.bind(this);

    this.init();
    this.setValue(value);

    // remove initial css styles after a set value to show hidden elements
    this.root.classList.remove('lazy');
  }

  /**
   * Render elements of the component.
   * @private
   */
  render() {
    this.inputElm = this.root.querySelector('input');
    if (!this.inputElm) {
      this.inputElm = document.createElement('input');
      this.inputElm.setAttribute('type', 'hidden');
      this.root.insertBefore(this.inputElm, this.root.firstChild);
    }
    if (this.name) this.inputElm.setAttribute('name', this.name);

    this.thumbElm = this.root.querySelector('.thumb');
    if (!this.thumbElm) {
      this.thumbElm = document.createElement('div');
      this.thumbElm.className = 'thumb';
      this.root.appendChild(this.thumbElm);
    }

    // the container is bounds of the thumb positions,
    // .e.g. usefully when root element of slider has padding to inner container
    this.containerElm = this.thumbElm.parentElement || this.root;
    this.trackElm = this.root.querySelector('.track');
    this.progressElm = this.root.querySelector('.progress');
  }

  /**
   * Initialize the component.
   * @private
   */
  init() {
    // initialize the slider container as an event receiver for moving the thumb item
    this.movableSlider = new Movable(this.thumbElm, {
      container: this.containerElm,
      eventTarget: this.root,
      orient: this.orient,
    });

    // initialize the movable thumb of the slider
    this.movableThumb = new Movable(this.thumbElm, {
      container: this.containerElm,
      orient: this.orient,
      syncWith: this.movableSlider,
    });

    //this.movableSlider.prevPos = this.movableThumb.prevPos;

    this.root.setAttribute('tabindex', '0');
    this.root.addEventListener('keydown', this.onKeypress, false);
    this.root.addEventListener('movestart', this.onClick, false);
    this.root.addEventListener('move', this.onMove, false);
    this.root.addEventListener('moveend', this.onMoveEnd, false);
    this.thumbElm.addEventListener('movestart', this.onMoveStart, false);
    this.thumbElm.addEventListener('move', this.onMove, false);
    this.thumbElm.addEventListener('moveend', this.onMoveEnd, false);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  onClick(event) {
    const self = this,
      moveEvent = event.detail,
      pos = moveEvent.pointer[this.axis] - this.thumbSize / 2,
      value = this.getValueByPosition(pos),
      wasChanged = this.isDiscrete ? this.setValue(value) : this.setPos(pos);

    if (wasChanged) this.dispatch('change');
    setTimeout(() => self.root.focus(), 0);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  onMoveStart(event) {
    this.dispatch('changestart');
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  onMove(event) {
    const moveEvent = event.detail,
      pos = this.getPosition(moveEvent),
      value = this.getValueByPosition(pos);

    // on change
    if (!isEqual(this.prevValue, value)) {
      this.eventData.value = value;
      this.valuePos = pos;
      this.update();
      this.dispatch('change');
    }

    this.prevValue = value;
    if (this.isDiscrete) moveEvent[this.axis] = pos;
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  onMoveEnd(event) {
    this.dispatch('changeend');
  }

  /**
   * @param {KeyboardEvent} event
   * @private
   */
  onKeypress(event) {
    let isKey = true;

    switch (event.key.toLowerCase()) {
      case 'arrowup':
      case 'arrowright':
        this.stepUp();
        break;
      case 'arrowleft':
      case 'arrowdown':
        this.stepDown();
        break;
      default:
        isKey = false;
    }

    if (isKey) {
      // disable scrolling by keypress
      event.preventDefault();
    }
  }

  stepUp() {
    if (this.setValue(this.eventData.value + this.step)) this.dispatch('change');
  }

  stepDown() {
    if (this.setValue(this.eventData.value - this.step)) this.dispatch('change');
  }

  /**
   * Get current value.
   * @return {number}
   */
  getValue() {
    return this.eventData.value;
  }

  /**
   * Set a new value.
   *
   * @param {number} value
   * @returns {boolean} When the value was changed then return true.
   */
  setValue(value) {
    const { eventData } = this;
    eventData.value = clamp(value, this.min, this.max);

    if (isEqual(this.prevValue, eventData.value)) return false;

    const pos = this.getPositionByValue(eventData.value);
    this.movableSlider.setPos({ [this.axis]: pos });
    this.prevValue = eventData.value;
    this.valuePos = pos;
    this.update();

    return true;
  }

  /**
   * Set the position of the thumb handle.
   *
   * @param {number} pos The position by an axis.
   * @returns {boolean} When the position was changed then return true.
   */
  setPos(pos) {
    this.eventData.value = this.getValueByPosition(pos);
    this.prevValue = this.eventData.value;

    return this.movableSlider.setPos({ [this.axis]: pos });
  }

  /**
   * @param {{}} moveEvent
   * @return {number}
   * @private
   */
  getPosition(moveEvent) {
    // wenn step is 1px then return same position, w/o scale
    if (this.stepSize === 1) return moveEvent[this.axis];

    const pointer = moveEvent.pointer[this.axis],
      direction = moveEvent.direction[this.axis];
    let setPos = pointer - this.thumbSize / 2,
      newPos;

    if (this.threshold >= 0) setPos -= (this.stepSize / 2 - this.threshold) * direction;
    newPos = Math.round(setPos / this.stepSize) * this.stepSize;

    // todo continuos + stepsize > 1 => pos by thumb/2
    const valuePos = this.getPositionByValue(this.eventData.value);

    return (valuePos - newPos) * direction > 0 ? valuePos : clamp(newPos, 0, this.maxPos);
  }

  /**
   * @param {number} value The value at position.
   * @return {number} The position of the thumb corresponding to the input value.
   * @private
   */
  getPositionByValue(value) {
    const pos = Math.round(((value - this.min) / this.step) * this.stepSize);

    return this.isRevert ? this.maxPos - pos : pos;
  }

  /**
   * @param {number} pos The position of the thumb.
   * @return {number} Output value corresponding to the position of the thumb.
   * @private
   */
  getValueByPosition(pos) {
    if (this.isRevert) pos = this.maxPos - pos;

    return Math.round(pos / this.stepSize) * this.step + this.min;
  }

  /**
   * Draw the progress.
   * @private
   */
  draw() {
    if (!this.progressElm) return;

    const size = (this.isRevert ? this.maxPos - this.valuePos : this.valuePos) + this.thumbSize / 2;

    this.progressElm.style[this.dimension] = `${size}px`;
  }

  /**
   * Updates on change of value or position of thumb.
   * @private
   */
  update() {
    this.inputElm.setAttribute('value', this.eventData.value.toString());
    this.draw();
  }

  /**
   * Dispatch the subscribed events.
   *
   * @param {string} type The type of event: movestart, change, moveend.
   * @returns {boolean} Returns false if the event was canceled, otherwise returns true.
   */
  dispatch(type) {
    const event = new CustomEvent(type, {
      bubbles: false,
      cancelable: true,
      detail: this.eventData,
    });

    return this.root.dispatchEvent(event);
  }
}

export { RangeSlider };