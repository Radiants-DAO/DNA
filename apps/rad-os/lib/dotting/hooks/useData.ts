import { MutableRefObject, useEffect, useState } from "react";

import useHandlers from "./useHandlers";
import {
  CanvasDataChangeHandler,
  DottingData,
  PixelData,
  PixelModifyItem,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";
import { getGridIndicesFromData } from "../utils/data";

/**
 * Subscribe to pixel-data changes on a Dotting canvas.
 *
 * @param ref       Dotting ref.
 * @param resetKey  Optional signal that the underlying Dotting instance has
 *                  been remounted (e.g., caller bumps this when passing a new
 *                  `key` to <Dotting>). Changing it re-registers the listener
 *                  on the new instance so data events keep flowing.
 */
const useData = (
  ref: MutableRefObject<DottingRef | null>,
  resetKey?: unknown,
) => {
  const { addDataChangeListener, removeDataChangeListener } = useHandlers(ref);
  const [data, setData] = useState<DottingData>(
    new Map<number, Map<number, PixelData>>(),
  );

  const [dataArray, setDataArray] = useState<Array<Array<PixelModifyItem>>>([]);

  useEffect(() => {
    const listener: CanvasDataChangeHandler = ({ data: canvasData }) => {
      setData(canvasData);
      if (canvasData.size === 0) {
        setDataArray([]);
        return;
      }

      const {
        topRowIndex,
        bottomRowIndex,
        leftColumnIndex,
        rightColumnIndex,
      } = getGridIndicesFromData(canvasData);
      const tempArray: Array<Array<PixelModifyItem>> = [];
      for (let i = topRowIndex; i <= bottomRowIndex; i++) {
        const row: Array<PixelModifyItem> = [];
        for (let j = leftColumnIndex; j <= rightColumnIndex; j++) {
          const pixel = canvasData.get(i)?.get(j);
          if (pixel) {
            row.push({
              rowIndex: i,
              columnIndex: j,
              color: pixel.color,
            });
          }
        }
        tempArray.push(row);
      }

      setDataArray(tempArray);
    };

    addDataChangeListener(listener);

    return () => {
      removeDataChangeListener(listener);
    };
    // resetKey is intentional: when the Dotting instance remounts (e.g. caller
    // uses `key={...}` to force a fresh canvas), the listener is attached to
    // the OLD, now-dead instance. Bumping resetKey re-runs this effect so we
    // register against the new instance.
  }, [addDataChangeListener, removeDataChangeListener, resetKey]);

  return { data, dataArray };
};

export default useData;
