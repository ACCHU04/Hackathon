# Evaluation Plan

## Datasets

- **FEVER** (Fact Extraction and VERification): 185K claims with Wikipedia evidence. Used to evaluate verifier accuracy.
- **LIAR**: 12.8K short statements from PolitiFact with 6-class labels. Used to evaluate end-to-end pipeline.

## Metrics

| Metric | Description |
|--------|-------------|
| Claim Recall | % of gold claims extracted by the extractor |
| Claim Precision | % of extracted claims that are genuine verifiable facts |
| Verdict Accuracy | % of claims correctly classified (True/False/Partial/Unverifiable) |
| Evidence NDCG | Ranking quality of retrieved evidence passages |
| Label Agreement (F1) | Macro-F1 on the 4-class verdict task |

## Evaluation Scripts

See `evaluation/evaluation_scripts/` for:
- `eval_extractor.py` — compares extracted claims to gold annotations
- `eval_verifier.py` — runs FEVER/LIAR through the verifier and computes F1

## Baselines

- Majority class (always "True") as a lower bound.
- GPT-4o zero-shot without retrieval as an ablation.
