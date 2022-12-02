/**
 * Movable module.
 *
 * ISC License
 *
 * Copyright (c) 2022, webdiscus
 */

/**
 * @typedef {Object} MovableType
 */

/**
 * @typedef {Object} MovableType.PositionXY
 * @property {number} x The x position.
 * @property {number} y The y position.
 */

/**
 * @typedef {Object} MovableType.Options The options to create a movable element.
 * @property {?HTMLElement} [eventTarget=null] The element that receive events. Defaults is the move element.
 * @property {?HTMLElement} [container=body] The parent element that bounds the movement of the move element.
 * @property {?HTMLElement} syncWith Synchronize position with the element.
 * @property {?string} orient Possible values: "horizontal", "vertical".
 *  If the option orient is defined then values axisX and axisY will be overridden.
 * @property {?number} x The initial x position of the move element.
 * @property {?number} y The initial y position of the move element.
 */

/**
 * @typedef {Object} MovableType.MoveEvent The event object passed when an event is emitted.
 * @property {number} x (writable) The x position of the move element relative to the container.
 * @property {number} y (writable) The x position of the move element relative to the container.
 * @property {MovableType.PositionXY} pointer (readonly) The position of the pointer relative to the container.
 * @property {MovableType.PositionXY} direction (readonly) The direction of movement:
 *  <p>-1 to left or down,</p>
 *  <p>0 - no movement,</p>
 *  <p>+1 to right or top.</p>
 */

/**
 * Determines whether the passed value type is {number}.
 *
 * @param {number|any} num
 * @returns {boolean}
 * @private
 */
const isNumber = (num) => !Number.isNaN(num) && typeof num === 'number';

class Movable {
  /** @private {boolean} */
  isEnabled = true;

  /** @private {boolean} Whether the element can be movable horizontally. */
  axisX = true;

  /** @private {boolean} Whether the element can be movable vertically. */
  axisY = true;

  /** @private {number} */
  clientOffsetX = 0;

  /** @private {number} */
  clientOffsetY = 0;

  /** @private {{x: number, y:number}} The delta of the pointer and the move element positions. */
  delta = { x: 0, y: 0 };

  /** @private {{x1: number, y1:number, x2: number, y2: number, width: number, height: number}} The bounding coordinates of the translate(x,y) positions of the move element in the container. */
  area = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };

  /** @private {{x: number, y:number}} The last translate(x,y) position of the movable element.
   * Initial is -1 to allow set pos to 0, because last and next pos must be different. */
  pos = { x: -1, y: -1 };

  /** @private {MovableType.MoveEvent} */
  eventData = {
    direction: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    x: 0,
    y: 0,
  };

  /** @private {HTMLElement} The element to be moved. */
  target = null;

  /** @private {HTMLElement|null} The acceptor element of pointer event. Defaults is the move element. */
  eventTarget = null;

  /** @private {HTMLElement|null} The parent element that bounds the movement of the move element. */
  container = null;

  /** @private {number} */
  requestAnimationId = 0;

  /** @private {CSSStyleDeclaration|{transform: string}} */
  computedStyle = { transform: '' };

  /** @private {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}} */
  styleTransform = { scaleX: 1, scaleY: 1, translateY: 0, translateX: 0, skewX: 0, skewY: 0 };

  /** @private {string} */
  styleTransition = '';

  /** @private {DOMHighResTimeStamp} previous timestamp of called requestAnimationFrame() */
  timeStamp = 0;

  /**
   * @param {HTMLElement} elm
   * @param {MovableType.Options}
   */
  constructor(elm, { container = document.body, eventTarget = null, syncWith = null, orient, x, y } = {}) {
    if (syncWith) this.syncPos(syncWith);

    if (orient) {
      this.axisX = orient === 'horizontal';
      this.axisY = orient === 'vertical';
    }

    this.onMoveStart = this.onMoveStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onMoveEnd = this.onMoveEnd.bind(this);
    this.onDraw = this.onDraw.bind(this);

    this.target = elm;
    this.container = container;
    this.eventTarget = eventTarget || elm;
    this.eventTarget.addEventListener('mousedown', this.onMoveStart, false);

    if (this.target) this.computedStyle = window.getComputedStyle(this.target);

    this.init();
    if (isNumber(x) || isNumber(y)) this.setPos({ x, y });
  }

  /**
   * Initialize the event properties of the element.
   *
   * @private
   */
  init() {
    const { target, eventTarget, container, area } = this,
      { translateX, translateY } = this.getTransform();
    let targetRect, eventTargetRect, containerRect;

    if (container) {
      containerRect = container.getBoundingClientRect();
      eventTargetRect = eventTarget.getBoundingClientRect();
      // whe a target no exists (only move event) then
      // set target rect as inner client coordinates of eventTarget;
      // in this case eventData (x, y) are the coordinates of the pointer relative to the container
      targetRect = target
        ? target.getBoundingClientRect()
        : {
          left: eventTargetRect.left + eventTarget.clientLeft,
          top: eventTargetRect.top + eventTarget.clientTop,
          width: 0,
          height: 0,
        };
      this.clientOffsetX = containerRect.left + container.clientLeft;
      this.clientOffsetY = containerRect.top + container.clientTop;

      // bounds coordinates of the moved element in the container
      area.x1 = this.clientOffsetX + translateX - targetRect.left;
      area.y1 = this.clientOffsetY + translateY - targetRect.top;
      area.x2 = area.x1 + container.clientWidth - targetRect.width;
      area.y2 = area.y1 + container.clientHeight - targetRect.height;
      area.width = area.x2 - area.x1;
      area.height = area.y2 - area.y1;

      // when no exists a target (only move event) then
      // set areaPos relative to event acceptor element to calc correct pointer position
      if (!target) {
        containerRect = eventTarget.getBoundingClientRect();
        this.clientOffsetX = containerRect.left + eventTarget.clientLeft;
        this.clientOffsetY = containerRect.top + eventTarget.clientTop;
      }
    }
  }

  /**
   * Enable movement.
   * @public
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable movement.
   * @public
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Whether the position is changed.
   *
   * @param {{x: number, y: number}} {} The coordinates of new position.
   * @return {boolean} When the position hasn't changed return false.
   * @private
   */
  isMoved({ x, y }) {
    const { axisX, axisY, pos } = this;

    return !(
      (axisX && x === pos.x && axisY && y === pos.y) ||
      (axisX && !axisY && x === pos.x) ||
      (!axisX && axisY && y === pos.y)
    );
  }

  /**
   * Get actual position of the move element.
   * @return {{x: number, y: number}}
   */
  getPos() {
    const { x, y } = this.eventData;
    return { x, y };
  }

  /**
   * Set the position of the move element in container.
   * @param {{x: number, y: number}} {} The coordinates.
   * @returns {boolean} When the position hasn't changed return false.
   */
  setPos({ x, y }) {
    const { eventData, axisX, axisY, delta, clientOffsetX, clientOffsetY } = this,
      { pointer } = eventData;

    this.clampPos({ x, y });

    if (!this.isMoved(eventData)) return false;

    if (axisX && x != null) delta.x = pointer.x - eventData.x + clientOffsetX;
    if (axisY && y != null) delta.y = pointer.y - eventData.y + clientOffsetY;
    this.draw();

    return true;
  }

  /**
   * Clamp the coordinates x/y in bounds of an existing container.
   *
   * @param {{x: number, y: number}} {} The coordinates of new position.
   * @private
   */
  clampPos({ x, y }) {
    const {
      target,
      container,
      eventData,
      axisX,
      axisY,
      area: { width, height },
    } = this;

    if (target && container) {
      if (axisX) eventData.x = x < 0 ? 0 : x > width ? width : x;
      if (axisY) eventData.y = y < 0 ? 0 : y > height ? height : y;
    }
  }

  /**
   * Linking this object with others to synchronize the states of all {Movable} instances in one component.
   * E.g. a Slider component has two instances: for self slider container and thumb of slider.
   * Wenn one object change state (is moved by event on container)
   * then other instance (e.g. of thumb) must know new position in original instance (e.g. of thumb).
   *
   * @param {Movable} movable
   */
  syncPos(movable) {
    if (!movable instanceof Movable) throw Error('The linked object must be an instance of type {Movable}.');

    // Note: set the object reference {x: number, y: number} of previous postion to synchronize two instances.
    this.pos = movable.pos;
  }

  /**
   * Get computed 2D transform values.
   *
   * @returns {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}}
   * @private
   */
  getTransform = function() {
    const { transform } = this.computedStyle;
    let values = ['1', '0', '0', '1', '0', '0'];

    if (transform.indexOf('matrix(') >= 0) {
      values = transform.match(/^matrix\((.+)\)$/)[1].split(', ');
    }

    return {
      scaleX: parseFloat(values[0]),
      skewX: parseFloat(values[1]),
      skewY: parseFloat(values[2]),
      scaleY: parseFloat(values[3]),
      translateX: parseInt(values[4], 10),
      translateY: parseInt(values[5], 10),
    };
  };

  /**
   * Set 2D transform values.
   *
   * @param {HTMLElement} elm
   * @param {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}} values
   */
  setTransform(elm, values) {
    elm.style.transform = `matrix(${values.scaleX}, ${values.skewX}, ${values.skewY}, ${values.scaleY}, ${values.translateX}, ${values.translateY})`;
  }

  /**
   * Listener for move start event.
   *
   * @param {MouseEvent|{}} event
   * @private
   */
  onMoveStart(event) {
    if (!this.isEnabled) return;

    // initialize by each move start to calc actual bounds, important if page is scrolled
    this.init();

    const { eventData, axisX, axisY, area, delta, target, clientOffsetX, clientOffsetY } = this,
      { clientX, clientY } = event,
      { pointer } = eventData,
      { translateX, translateY } = this.getTransform();

    delta.x = target ? clientX - translateX + area.x1 : clientOffsetX + area.x1;
    delta.y = target ? clientY - translateY + area.y1 : clientOffsetY + area.y1;

    if (axisX) eventData.x = clientX - delta.x;
    if (axisY) eventData.y = clientY - delta.y;

    pointer.x = clientX - clientOffsetX;
    pointer.y = clientY - clientOffsetY;

    // do nothing if subscriber cancel the event
    if (!this.dispatch('movestart')) return;

    document.addEventListener('mousemove', this.onMove, false);
    document.addEventListener('mouseup', this.onMoveEnd, false);

    // disable selection by begin dragging
    document.body.style.setProperty('user-select', 'none', 'important');

    // save original transform
    this.styleTransform = this.getTransform();

    // save original translation and disable animation
    if (target) {
      this.styleTransition = target.style.getPropertyValue('transition');
      target.style.setProperty('transition', 'none', 'important');
    }

    event.stopPropagation();
  }

  /**
   * Listener for move end event.
   *
   * @param {MouseEvent|{}} event
   * @private
   */
  onMoveEnd(event) {
    document.removeEventListener('mousemove', this.onMove, false);
    document.removeEventListener('mouseup', this.onMoveEnd, false);
    document.body.style.removeProperty('user-select');

    // recovery original transition
    if (this.target) {
      this.styleTransition
        ? this.target.style.setProperty('transition', this.styleTransition)
        : this.target.style.removeProperty('transition');
    }

    this.dispatch('moveend');
  }

  /**
   * Listener for move event.
   * The function is called by movement of pointer, apx. each 10 ms.
   * This is more often as max frame rate of monitor.
   * This function drop needless redraw requests.
   *
   * @param {MouseEvent|{}} event
   * @private
   */
  onMove(event) {
    const { eventData, axisX, axisY, delta, clientOffsetX, clientOffsetY } = this,
      { direction, pointer } = eventData,
      { clientX, clientY, movementX, movementY } = event;

    // cancel already requested an animation frame if it hasn't been completed yet
    if (this.requestAnimationId) window.cancelAnimationFrame(this.requestAnimationId);

    // skip redraw by 0 mouse movement
    direction.x = Math.sign(movementX);
    direction.y = Math.sign(movementY);

    if (
      (axisX && !axisY && direction.x === 0) ||
      (!axisX && axisY && direction.y === 0) ||
      (axisX && axisY && direction.x === 0 && direction.y === 0)
    ) {
      return;
    }

    if (axisX) eventData.x = clientX - delta.x;
    if (axisY) eventData.y = clientY - delta.y;
    pointer.x = clientX - clientOffsetX;
    pointer.y = clientY - clientOffsetY;

    this.clampPos(eventData);

    if (this.isMoved(eventData)) {
      this.requestAnimationId = window.requestAnimationFrame(this.onDraw);
    }
  }

  /**
   * Draw the move element at new position before the next repaint.
   * This is called before the browser renders a frame, max. 60 fps.
   * @param {DOMHighResTimeStamp} timeStamp
   * @private
   */
  onDraw(timeStamp) {
    this.requestAnimationId = 0;

    // use it only for debugging
    //let time = timeStamp - this.timeStamp;
    //this.timeStamp = timeStamp;
    //if (timeStamp > 0 && time < 15) {
    //  console.log('# drop heavy frame: ', time);
    //  return;
    //}

    // do nothing if the subscriber canceled the event
    if (!this.dispatch('move')) return;
    this.draw();
  }

  /**
   * Draw the move element at а new position.
   * @private
   */
  draw() {
    // the eventData.x and eventData.y can be overridden in dispatched event, e.g. by discrete slider
    const { target, eventData, axisX, axisY, area, pos, styleTransform } = this;

    // save the actual position of the element
    pos.x = eventData.x;
    pos.y = eventData.y;

    if (target) {
      styleTransform.translateX = axisX ? eventData.x + area.x1 : 0;
      styleTransform.translateY = axisY ? eventData.y + area.y1 : 0;
      this.setTransform(target, styleTransform);
    }
  }

  /**
   * Dispatch the subscribed events.
   *
   * @param {string} type The type of event: movestart, move, moveend.
   * @returns {boolean} Returns false if the event was canceled, otherwise returns true.
   */
  dispatch(type) {
    const event = new CustomEvent(type, {
      bubbles: false,
      cancelable: true,
      detail: this.eventData,
    });

    return this.eventTarget.dispatchEvent(event);
  }

  /**
   * Disable and remove the MoveEvent listener from element.
   * @public
   */
  destroy() {
    this.eventTarget.removeEventListener('mousedown', this.onMoveStart, false);
    document.removeEventListener('mousemove', this.onMove, false);
    document.removeEventListener('mouseup', this.onMoveEnd, false);
  }
}

export { Movable };