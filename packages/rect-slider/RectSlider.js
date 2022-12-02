import { Movable } from '@webdiscus/movable';

/**
 * @typedef {{}} PositionXY
 * @property {number} x
 * @property {number} y
 */

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

class RectSlider {
  /** @private {HTMLElement} The root element of this component. */
  root = null;

  /** @public {HTMLElement} The thumb handle element. It can be used outside this component. */
  thumbElm = null;

  /** @public {HTMLElement} The area element. It can be used outside this component. */
  areaElm = null;

  /** @private {{x: number, y: number}|null} The previous value. Initial is null. */
  prevValue = null;

  eventData = {
    value: { x: 0, y: 0 },
  };

  constructor(elm, { x = 0, y = 0, xMin = 0, xMax = 0, yMin = 0, yMax = 0, step = 1, isDiscrete = true }) {
    this.root = elm;
    this.isDiscrete = isDiscrete;
    this.step = step;
    this.xMin = xMin;
    this.xMax = xMax;
    this.yMin = yMin;
    this.yMax = yMax;

    this.threshold = null;

    this.onClick = this.onClick.bind(this);
    this.onMoveStart = this.onMoveStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onKeypress = this.onKeypress.bind(this);

    this.render();
    this.init();
    this.setValue({ x, y });
  }

  /**
   * Render elements of the component.
   * @private
   */
  render() {
    this.thumbElm = this.root.querySelector('.thumb');
    if (!this.thumbElm) {
      this.thumbElm = document.createElement('div');
      this.thumbElm.className = 'thumb';
      this.root.appendChild(this.thumbElm);
    }

    this.areaElm = this.root.querySelector('.area');

    const areaRect = this.root.getBoundingClientRect(),
      thumbRect = this.thumbElm.getBoundingClientRect();

    this.thumbWidth = thumbRect.width;
    this.thumbHeight = thumbRect.height;
    this.stepSizeX = ((areaRect.width - this.thumbWidth) * this.step) / (this.xMax - this.xMin);
    this.stepSizeY = ((areaRect.height - this.thumbHeight) * this.step) / (this.yMax - this.yMin);
  }

  /**
   * Initialize the component.
   * @private
   */
  init() {
    // initialize the movable thumb of the slider
    this.movableThumb = new Movable(this.thumbElm, {
      container: this.root,
    });

    // initialize the slider container as an event receiver for moving the thumb item
    this.movableArea = new Movable(this.thumbElm, {
      container: this.root,
      eventTarget: this.root,
    });

    const { width, height } = this.movableArea.area;
    this.startX = 0;
    this.startY = 0;
    this.endX = width;
    this.endY = height;

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
    const moveEvent = event.detail,
      pos = {
        x: Math.round(moveEvent.pointer.x - this.thumbWidth / 2),
        y: Math.round(moveEvent.pointer.y - this.thumbHeight / 2),
      },
      value = this.getValueByPosition(pos),
      wasChanged = this.isDiscrete ? this.setValue(value) : this.setPos(pos);

    if (wasChanged) this.dispatch('change');
    setTimeout(() => this.root.focus(), 0);
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

    let { x, y } = pos;

    // on change
    if (!isEqual(this.prevValue, value)) {
      this.eventData.value = value;
      this.update();
      this.dispatch('change');

      moveEvent.x = x;
      moveEvent.y = y;
    } else {
      event.preventDefault();
    }

    this.prevValue = value;
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
        this.stepUp();
        break;
      case 'arrowleft':
        this.stepLeft();
        break;
      case 'arrowright':
        this.stepRight();
        break;
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

  stepLeft() {
    let { x, y } = this.eventData.value;
    if (this.setValue({ x: x - this.step, y })) this.dispatch('change');
  }

  stepRight() {
    let { x, y } = this.eventData.value;
    if (this.setValue({ x: x + this.step, y })) this.dispatch('change');
  }

  stepUp() {
    let { x, y } = this.eventData.value;
    if (this.setValue({ x, y: y - this.step })) this.dispatch('change');
  }

  stepDown() {
    let { x, y } = this.eventData.value;
    if (this.setValue({ x, y: y + this.step })) this.dispatch('change');
  }

  /**
   * Get current value.
   * @return {{x: number, y: number}}
   */
  getValue() {
    return this.eventData.value;
  }

  /**
   * Set the values of position and move the thumb handle to new position.
   *
   * @param {PositionXY} value
   * @returns {boolean} When the value was changed then return true.
   */
  setValue(value) {
    const eventData = this.eventData;

    eventData.value.x = clamp(value.x, this.xMin, this.xMax);
    eventData.value.y = clamp(value.y, this.yMin, this.yMax);

    if (isEqual(this.prevValue, eventData.value)) return false;

    this.prevValue = { x: eventData.value.x, y: eventData.value.y };
    this.movableArea.setPos(this.getPositionByValue(eventData.value));
    this.update();

    return true;
  }

  /**
   * Set the position of the thumb handle.
   *
   * @param {PositionXY} pos
   * @returns {boolean} When the position was changed then return true.
   */
  setPos(pos) {
    const eventData = this.eventData;

    eventData.value = this.getValueByPosition(pos);
    this.prevValue = { x: eventData.value.x, y: eventData.value.y };

    return this.movableArea.setPos(pos);
  }

  /**
   * @param {{}} moveEvent
   * @return {PositionXY}
   * @private
   */
  getPosition(moveEvent) {
    if (this.stepSizeX === 1 && this.stepSizeY === 1) return { x: moveEvent.x, y: moveEvent.y };

    const pointer = moveEvent.pointer,
      direction = moveEvent.direction,
      valuePos = this.getPositionByValue(this.eventData.value);

    let setPosX = pointer.x - this.thumbWidth / 2,
      setPosY = pointer.y - this.thumbHeight / 2,
      newPosX,
      newPosY;

    if (this.threshold >= 0) {
      setPosX -= (this.stepSizeX / 2 - this.threshold) * direction.x;
      setPosY -= (this.stepSizeY / 2 - this.threshold) * direction.y;
    }
    newPosX = Math.round(setPosX / this.stepSizeX) * this.stepSizeX;
    newPosY = Math.round(setPosY / this.stepSizeY) * this.stepSizeY;

    if ((valuePos.x - newPosX) * direction.x > 0) newPosX = valuePos.x;
    if ((valuePos.y - newPosY) * direction.y > 0) newPosY = valuePos.y;

    return {
      x: clamp(newPosX, this.startX, this.endX),
      y: clamp(newPosY, this.startY, this.endY),
    };
  }

  /**
   * @param {PositionXY} value The value at position.
   * @returns {PositionXY} The position of the thumb corresponding to the input value.
   * @private
   */
  getPositionByValue({ x, y }) {
    return {
      x: Math.round((x - this.xMin) / this.step) * this.stepSizeX,
      y: Math.round((y - this.yMin) / this.step) * this.stepSizeY,
    };
  }

  /**
   * @param {PositionXY} pos The position of the thumb.
   * @returns {PositionXY} Output value corresponding to the position of the thumb.
   * @private
   */
  getValueByPosition({ x, y }) {
    const valueX = Math.round(x / this.stepSizeX) * this.step + this.xMin,
      valueY = Math.round(y / this.stepSizeY) * this.step + this.yMin;

    return {
      x: clamp(valueX, this.xMin, this.xMax),
      y: clamp(valueY, this.yMin, this.yMax),
    };
  }

  /**
   * Updates on change of value or position of thumb.
   */
  update() {
    // todo It is reserved for additional functional.
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

export { RectSlider };