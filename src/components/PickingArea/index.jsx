import styles from './styles.scss';

import { useRef, useEffect } from 'react';

import RectSlider from '@webdiscus/rect-slider';
import Thumb from '/@/components/Thumb';

export default function PickingArea({
  className,
  name,
  x = 0,
  y = 0,
  xMin = 0,
  xMax = 0,
  yMin = 0,
  yMax = 0,
  step = 1,
  onPicking = () => {}, // function dispatched by mouse events
  refModule = null, // reference to module instance to allow use it in parent component
}) {
  const refRoot = useRef();

  useEffect(() => {
    /** @type {HTMLElement} elm */
    const elm = refRoot.current;

    refModule.current = new RectSlider(elm, {
      x, y,
      xMin,
      xMax,
      yMin,
      yMax,
      step,
    });

    // subscribe root element to custom events dispatched in RectSlider module
    // note: React don't know about this custom events
    elm.addEventListener('changestart', onPicking);
    elm.addEventListener('change', onPicking);
  }, []);

  useEffect(() => {
    refModule.current.setValue({ x, y: 1 - y }); // y = 0 is at bottom therefore use 1 - y
  }, [x, y]);

  return (
    <div ref={refRoot} className={className}>
      <input name={name} type='hidden' />
      <div className='area'></div>
      <Thumb />
    </div>
  );
}