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

const useData = (ref: MutableRefObject<DottingRef | null>) => {
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
  }, [addDataChangeListener, removeDataChangeListener]);

  return { data, dataArray };
};

export default useData;
