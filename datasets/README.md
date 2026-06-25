# Calibration dataset — the auto-fine-tune "smart layer"

The cap-match **rule engine** (`src/lib/autofinetune/derive.ts`) predicts an optical tune from font
metrics. In Cotejo's **Tune** mode, every time you calibrate a pairing and hit *apply*, the divergence
from the rule's default is logged as a labeled example (`smart.ts` → `localStorage`). These are the
training labels for the **correction model** — the learned residual `human − rule`.

## Flow

1. **Collect** — calibrate pairings in Tune mode and *apply*. The quiet "N calibrations feeding the
   model · export" readout (bottom-left) shows the count. Click **export** (or run
   `window.cotejoTuneData.download()` in the console) to pull `tune-examples.jsonl`.
2. **Append** the exported rows into `datasets/tune-examples.jsonl` (the set grows through real use).
3. **Train** — `node scripts/train-finetune.mjs`. It fits a ridge regression of the residual per output
   (size / lh / track), holds out 20 % to report honest RMSE, and — only at ≥ 24 examples — bakes the
   weights into `src/lib/autofinetune/correctionModel.ts`. Below that it stays an identity passthrough.
4. **Ship** — rebuild. `correction.ts` applies the learned residual on top of the rule at inference.

No model is ever claimed without real data: `trained:false` = the rule runs alone.
